import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { formatCurrency } from '../utils/currency'
import { formatDate, formatTime } from '../utils/date'
import { cancelSale, getSaleWithItems } from '../services/saleService'
import type { SaleWithItems } from '../types'

export function SaleDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const saleId = Number(id)

  const [sale, setSale] = useState<SaleWithItems | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)

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

  if (!sale) return null

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
    </div>
  )
}
