import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Package, Users, Settings as SettingsIcon } from 'lucide-react'
import { formatCurrency } from '../utils/currency'
import { formatDateTime } from '../utils/date'
import { getPeriodRange } from '../utils/date'
import { getPeriodSummary, getRecentSales, getTotalReceivable } from '../services/saleService'
import type { SaleWithItems } from '../types'

interface DashboardData {
  today: number
  week: number
  month: number
  receivable: number
  recentSales: SaleWithItems[]
}

export function Home() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)

  async function load() {
    const todayRange = getPeriodRange('today')
    const weekRange = getPeriodRange('week')
    const monthRange = getPeriodRange('month')

    const [today, week, month, receivable, recentSales] = await Promise.all([
      getPeriodSummary(todayRange.start, todayRange.end),
      getPeriodSummary(weekRange.start, weekRange.end),
      getPeriodSummary(monthRange.start, monthRange.end),
      getTotalReceivable(),
      getRecentSales(5)
    ])

    setData({
      today: today.totalSold,
      week: week.totalSold,
      month: month.totalSold,
      receivable,
      recentSales
    })
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <header className="flex items-center justify-between px-4 pb-2 pt-safe-top pt-6">
        <div>
          <p className="text-sm text-slate-500">Controle de Vendas</p>
          <h1 className="text-xl font-bold text-slate-900">Início</h1>
        </div>
        <button
          onClick={() => navigate('/configuracoes')}
          aria-label="Configurações"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm active:bg-slate-100"
        >
          <SettingsIcon size={20} />
        </button>
      </header>

      <section className="grid grid-cols-2 gap-3 px-4 pt-2">
        <SummaryCard label="Vendas hoje" value={data?.today ?? 0} />
        <SummaryCard label="Vendas esta semana" value={data?.week ?? 0} />
        <SummaryCard label="Vendas este mês" value={data?.month ?? 0} />
        <SummaryCard label="A receber" value={data?.receivable ?? 0} highlight />
      </section>

      <section className="mt-5 px-4">
        <button
          onClick={() => navigate('/nova-venda')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 active:scale-[0.98]"
        >
          <Plus size={22} strokeWidth={2.5} />
          Nova venda
        </button>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/produtos/novo')}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-semibold text-slate-700 shadow-sm active:scale-[0.98]"
          >
            <Package size={18} />
            Produto
          </button>
          <button
            onClick={() => navigate('/clientes/novo')}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-semibold text-slate-700 shadow-sm active:scale-[0.98]"
          >
            <Users size={18} />
            Cliente
          </button>
        </div>
      </section>

      <section className="mt-6 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Últimas vendas</h2>
          <button onClick={() => navigate('/vendas')} className="text-sm font-medium text-brand-600">
            Ver todas
          </button>
        </div>

        <div className="mt-2 space-y-2">
          {data?.recentSales.length === 0 && (
            <p className="rounded-2xl bg-white p-4 text-sm text-slate-400 shadow-sm">
              Nenhuma venda registrada ainda.
            </p>
          )}

          {data?.recentSales.map((sale) => (
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
                    {sale.items
                      .map((item) => `${item.quantity} × ${item.productName}`)
                      .join(', ')}
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
        </div>
      </section>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  highlight
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-2xl p-4 shadow-sm ${
        highlight ? 'bg-brand-600 text-white' : 'bg-white text-slate-900'
      }`}
    >
      <p className={`text-xs font-medium ${highlight ? 'text-brand-100' : 'text-slate-500'}`}>
        {label}
      </p>
      <p className="mt-1 text-lg font-bold">{formatCurrency(value)}</p>
    </div>
  )
}
