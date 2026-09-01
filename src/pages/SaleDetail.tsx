import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CurrencyInput } from '../components/CurrencyInput'
import { formatCurrency } from '../utils/currency'
import { formatDate, formatTime } from '../utils/date'
import { cancelSale, getSaleWithItems, updateSalePayment } from '../services/saleService'
import type { SaleWithItems } from '../types'

export function SaleDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const saleId = Number(id)

  const [sale, setSale] = useState<SaleWithItems | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [editingPayment, setEditingPayment] = useState(false)
  const [editedPaid, setEditedPaid] = useState(0)
  const [error, setError] = useState('')

  async function load() {
    const data = await getSaleWithItems(saleId)
    setSale(data ?? null)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleId])

  async function handleCancel() {
    await cancelSale(saleId)
    setConfirmCancel(false)
    await load()
  }

  function openEditPayment() {
    if (!sale) return
    setEditedPaid(sale.paid)
    setError('')
    setEditingPayment(true)
  }

  async function handleSavePayment() {
    setError('')
    try {
      await updateSalePayment(saleId, editedPaid)
      setEditingPayment(false)
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (!sale) return null

  const editedDebt = Math.max(0, sale.total - editedPaid)

  return (
    <div>
      <PageHeader title={`Venda #${String(sale.id).padStart(3, '0')}`} onBack={() => navigate(-1)} />

      <div className="px-4 pt-4">
        {sale.status === 'cancelled' && (
          <div className="mb-3 rounded-2xl bg-red-50 p-3 text-center text-sm font-semibold text-red-600">
            Venda cancelada
          </div>
        )}

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Data</span>
            <span className="font-medium text-slate-900">{formatDate(sale.date)}</span>
          </div>
          <div className="mt-1.5 flex justify-between text-sm">
            <span className="text-slate-500">Horário</span>
            <span className="font-medium text-slate-900">{formatTime(sale.date)}</span>
          </div>
          <div className="mt-1.5 flex justify-between text-sm">
            <span className="text-slate-500">Cliente</span>
            <span className="font-medium text-slate-900">{sale.clientName ?? 'Sem cliente'}</span>
          </div>
        </div>

        <h2 className="mb-2 mt-5 text-sm font-semibold text-slate-700">Produtos</h2>
        <div className="space-y-2">
          {sale.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
              <div>
                <p className="font-medium text-slate-900">
                  {item.quantity} × {item.productName}
                </p>
                <p className="text-sm text-slate-400">{formatCurrency(item.unitPrice)} cada</p>
              </div>
              <p className="font-semibold text-slate-900">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total</span>
            <span className="font-bold text-slate-900">{formatCurrency(sale.total)}</span>
          </div>
          <div className="mt-1.5 flex justify-between text-sm">
            <span className="text-slate-500">Pago</span>
            <span className="font-semibold text-emerald-600">{formatCurrency(sale.paid)}</span>
          </div>
          <div className="mt-1.5 flex justify-between text-sm">
            <span className="text-slate-500">Fiado</span>
            <span className="font-semibold text-amber-600">{formatCurrency(sale.debt)}</span>
          </div>

          {sale.status === 'active' && (
            <button
              onClick={openEditPayment}
              className="mt-3 w-full rounded-2xl bg-brand-50 py-3 text-sm font-semibold text-brand-600 active:scale-[0.98]"
            >
              Editar pagamento
            </button>
          )}
        </div>

        {sale.status === 'active' && (
          <button
            onClick={() => setConfirmCancel(true)}
            className="mt-5 w-full rounded-2xl bg-red-50 py-3.5 text-sm font-semibold text-red-600 active:scale-[0.98]"
          >
            Cancelar venda
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Tem certeza que deseja cancelar esta venda?"
        description="A venda não será excluída, mas deixará de contar nos relatórios, no Dashboard e na dívida do cliente."
        confirmLabel="Cancelar venda"
        danger
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />

      {editingPayment && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setEditingPayment(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-safe-bottom shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900">Editar pagamento</h2>
            <p className="mt-1 text-sm text-slate-500">Total da venda: {formatCurrency(sale.total)}</p>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setEditedPaid(sale.total)}
                className={`flex-1 rounded-2xl py-3 text-sm font-semibold active:scale-[0.98] ${
                  editedPaid === sale.total
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                Pago
              </button>
              <button
                onClick={() => setEditedPaid(0)}
                className={`flex-1 rounded-2xl py-3 text-sm font-semibold active:scale-[0.98] ${
                  editedPaid === 0 ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'
                }`}
              >
                Fiado
              </button>
            </div>

            <label className="mb-1.5 mt-4 block text-sm font-medium text-slate-600">
              Ou digite o valor pago
            </label>
            <CurrencyInput valueCents={editedPaid} onChange={setEditedPaid} />

            <div className="mt-3 flex gap-3 text-sm">
              <div className="flex-1 rounded-2xl bg-emerald-50 p-3 text-center">
                <p className="text-emerald-700">Pago</p>
                <p className="font-semibold text-emerald-700">{formatCurrency(editedPaid)}</p>
              </div>
              <div className="flex-1 rounded-2xl bg-amber-50 p-3 text-center">
                <p className="text-amber-700">Fiado</p>
                <p className="font-semibold text-amber-700">{formatCurrency(editedDebt)}</p>
              </div>
            </div>

            {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setEditingPayment(false)}
                className="flex-1 rounded-2xl bg-slate-100 py-3.5 text-sm font-semibold text-slate-700 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePayment}
                className="flex-1 rounded-2xl bg-brand-600 py-3.5 text-sm font-semibold text-white active:scale-95"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
