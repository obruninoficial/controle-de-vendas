import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { formatCurrency } from '../utils/currency'
import { formatDateTime } from '../utils/date'
import { getPeriodRange } from '../utils/date'
import { getPeriodSummary, getSalesInRange } from '../services/saleService'
import type { PeriodFilter, PeriodSummary, SaleWithItems } from '../types'

const FILTERS: { value: PeriodFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mês' },
  { value: 'custom', label: 'Personalizado' }
]

export function Sales() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<PeriodFilter>('today')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [sales, setSales] = useState<SaleWithItems[]>([])
  const [summary, setSummary] = useState<PeriodSummary>({ totalSold: 0, totalReceived: 0, totalPending: 0 })

  async function load() {
    if (filter === 'custom' && (!customStart || !customEnd)) return
    const { start, end } = getPeriodRange(filter, customStart, customEnd)
    const [salesData, summaryData] = await Promise.all([
      getSalesInRange(start, end),
      getPeriodSummary(start, end)
    ])
    setSales(salesData)
    setSummary(summaryData)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, customStart, customEnd])

  return (
    <div>
      <PageHeader title="Vendas" />

      <div className="px-4 pt-4">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filter === f.value ? 'bg-brand-600 text-white' : 'bg-white text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filter === 'custom' && (
          <div className="mt-3 flex gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm"
            />
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm"
            />
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SummaryBlock label="Vendido" value={summary.totalSold} />
          <SummaryBlock label="Recebido" value={summary.totalReceived} tone="emerald" />
          <SummaryBlock label="Fiado" value={summary.totalPending} tone="amber" />
        </div>

        <div className="mt-4 space-y-2">
          {sales.map((sale) => (
            <button
              key={sale.id}
              onClick={() => navigate(`/vendas/${sale.id}`)}
              className="block w-full rounded-2xl bg-white p-4 text-left shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {sale.clientName ?? 'Venda sem cliente'}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-slate-500">
                    {sale.items.map((item) => `${item.quantity} × ${item.productName}`).join(', ')}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(sale.date)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-slate-900">{formatCurrency(sale.total)}</p>
                  {sale.debt > 0 && (
                    <p className="mt-0.5 text-xs font-medium text-amber-600">
                      Fiado: {formatCurrency(sale.debt)}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}

          {sales.length === 0 && (
            <p className="rounded-2xl bg-white p-4 text-center text-sm text-slate-400 shadow-sm">
              Nenhuma venda neste período.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryBlock({
  label,
  value,
  tone
}: {
  label: string
  value: number
  tone?: 'emerald' | 'amber'
}) {
  const toneClass =
    tone === 'emerald' ? 'text-emerald-600' : tone === 'amber' ? 'text-amber-600' : 'text-slate-900'

  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${toneClass}`}>{formatCurrency(value)}</p>
    </div>
  )
}
