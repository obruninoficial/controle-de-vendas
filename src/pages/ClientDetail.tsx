import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { CurrencyInput } from '../components/CurrencyInput'
import { formatCurrency } from '../utils/currency'
import { formatDate, formatTime } from '../utils/date'
import { getClient } from '../services/clientService'
import { getClientDebt, getClientSales } from '../services/saleService'
import { getClientPayments, registerPayment } from '../services/paymentService'
import type { Client, SaleWithItems, Payment } from '../types'

type TimelineEntry =
  | { type: 'sale'; date: string; sale: SaleWithItems }
  | { type: 'payment'; date: string; payment: Payment }

export function ClientDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const clientId = Number(id)

  const [client, setClient] = useState<Client | null>(null)
  const [debt, setDebt] = useState(0)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [showPaymentSheet, setShowPaymentSheet] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentError, setPaymentError] = useState('')
  const [confirmation, setConfirmation] = useState<{ before: number; paid: number; after: number } | null>(null)

  async function load() {
    const [clientData, currentDebt, sales, payments] = await Promise.all([
      getClient(clientId),
      getClientDebt(clientId),
      getClientSales(clientId),
      getClientPayments(clientId)
    ])

    setClient(clientData ?? null)
    setDebt(currentDebt)

    const entries: TimelineEntry[] = [
      ...sales
        .filter((s) => s.status === 'active')
        .map((sale): TimelineEntry => ({ type: 'sale', date: sale.date, sale })),
      ...payments.map((payment): TimelineEntry => ({ type: 'payment', date: payment.date, payment }))
    ].sort((a, b) => b.date.localeCompare(a.date))

    setTimeline(entries)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  async function handleConfirmPayment() {
    setPaymentError('')
    try {
      const before = debt
      await registerPayment(clientId, paymentAmount)
      setConfirmation({ before, paid: paymentAmount, after: Math.max(0, before - paymentAmount) })
      setShowPaymentSheet(false)
      setPaymentAmount(0)
      await load()
    } catch (e) {
      setPaymentError((e as Error).message)
    }
  }

  if (!client) return null

  return (
    <div>
      <PageHeader
        title={client.name}
        onBack={() => navigate('/clientes')}
        action={
          <button
            onClick={() => navigate(`/clientes/${clientId}/editar`)}
            aria-label="Editar cliente"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 active:bg-slate-100"
          >
            <Pencil size={18} />
          </button>
        }
      />

      <div className="px-4 pt-4">
        {client.phone && <p className="text-sm text-slate-500">Telefone: {client.phone}</p>}

        <div className="mt-3 rounded-2xl bg-white p-5 text-center shadow-sm">
          <p className="text-sm text-slate-500">Total a receber</p>
          <p className={`mt-1 text-3xl font-bold ${debt > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {formatCurrency(debt)}
          </p>

          {debt > 0 && (
            <button
              onClick={() => setShowPaymentSheet(true)}
              className="mt-4 w-full rounded-2xl bg-brand-600 py-3.5 text-sm font-semibold text-white active:scale-[0.98]"
            >
              Registrar pagamento
            </button>
          )}
        </div>

        {confirmation && (
          <div className="mt-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
            <p>Dívida anterior: {formatCurrency(confirmation.before)}</p>
            <p>Pagamento: {formatCurrency(confirmation.paid)}</p>
            <p className="font-semibold">Nova dívida: {formatCurrency(confirmation.after)}</p>
          </div>
        )}

        <h2 className="mt-6 mb-2 text-sm font-semibold text-slate-700">Histórico</h2>

        <div className="space-y-2">
          {timeline.map((entry) =>
            entry.type === 'sale' ? (
              <button
                key={`sale-${entry.sale.id}`}
                onClick={() => navigate(`/vendas/${entry.sale.id}`)}
                className="block w-full rounded-2xl bg-white p-4 text-left shadow-sm active:scale-[0.99]"
              >
                <p className="text-xs text-slate-400">
                  {formatDate(entry.sale.date)} — {formatTime(entry.sale.date)}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {entry.sale.items.map((item) => `${item.quantity} × ${item.productName}`).join(', ')}
                </p>
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-slate-900">Total: {formatCurrency(entry.sale.total)}</span>
                  <span className="text-emerald-600">Pago: {formatCurrency(entry.sale.paid)}</span>
                  {entry.sale.debt > 0 && (
                    <span className="text-amber-600">Fiado: {formatCurrency(entry.sale.debt)}</span>
                  )}
                </div>
              </button>
            ) : (
              <div key={`payment-${entry.payment.id}`} className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs text-slate-400">{formatDate(entry.payment.date)}</p>
                <p className="mt-1 text-sm font-medium text-slate-700">Pagamento recebido</p>
                <p className="mt-1 font-semibold text-emerald-600">− {formatCurrency(entry.payment.amount)}</p>
              </div>
            )
          )}

          {timeline.length === 0 && (
            <p className="rounded-2xl bg-white p-4 text-center text-sm text-slate-400 shadow-sm">
              Nenhuma movimentação registrada ainda.
            </p>
          )}
        </div>
      </div>

      {showPaymentSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowPaymentSheet(false)}>
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-safe-bottom shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900">Registrar pagamento</h2>
            <p className="mt-1 text-sm text-slate-500">Dívida atual: {formatCurrency(debt)}</p>

            <div className="mt-4">
              <CurrencyInput valueCents={paymentAmount} onChange={setPaymentAmount} autoFocus />
            </div>

            {paymentError && <p className="mt-2 text-sm font-medium text-red-600">{paymentError}</p>}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowPaymentSheet(false)}
                className="flex-1 rounded-2xl bg-slate-100 py-3.5 text-sm font-semibold text-slate-700 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 rounded-2xl bg-brand-600 py-3.5 text-sm font-semibold text-white active:scale-95"
              >
                Confirmar pagamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
