import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, Search, X, Check, Calendar } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { CurrencyInput } from '../components/CurrencyInput'
import { formatCurrency } from '../utils/currency'
import { toDatetimeLocalValue, fromDatetimeLocalValue } from '../utils/date'
import { listActiveProducts } from '../services/productService'
import { listClients } from '../services/clientService'
import { createSale } from '../services/saleService'
import type { CartItem, Client, Product } from '../types'

export function NewSale() {
  const navigate = useNavigate()

  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientSheetOpen, setClientSheetOpen] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [paidAmount, setPaidAmount] = useState<number | null>(null)
  const [saleDateValue, setSaleDateValue] = useState(() => toDatetimeLocalValue(new Date()))
  const [showDateField, setShowDateField] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    listActiveProducts().then(setProducts)
    listClients().then(setClients)
  }, [])

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  )

  // Por padrão, o valor pago é sugerido como o total (venda totalmente paga),
  // até que o usuário altere manualmente o campo.
  const effectivePaid = paidAmount === null ? total : Math.min(paidAmount, total)
  const debt = Math.max(0, total - effectivePaid)

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  )

  function addProduct(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [
        ...prev,
        {
          productId: product.id as number,
          productName: product.name,
          unitPrice: product.price,
          quantity: 1
        }
      ]
    })
  }

  function changeQuantity(productId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function removeItem(productId: number) {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }

  async function handleFinalize() {
    setError('')

    if (cart.length === 0) {
      setError('Adicione pelo menos um produto.')
      return
    }
    if (debt > 0 && !selectedClient) {
      setError('Selecione um cliente para registrar uma venda fiada.')
      return
    }

    setSaving(true)
    try {
      await createSale({
        clientId: selectedClient?.id ?? null,
        items: cart,
        paidAmount: effectivePaid,
        date: fromDatetimeLocalValue(saleDateValue)
      })
      setSuccess(true)
      setTimeout(() => navigate('/'), 900)
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <Check size={32} className="text-emerald-600" />
        </div>
        <p className="text-lg font-semibold text-slate-900">Venda registrada!</p>
      </div>
    )
  }

  return (
    <div className="pb-40">
      <PageHeader title="Nova venda" onBack={() => navigate(-1)} />

      <div className="px-4 pt-4">
        {/* Data da venda */}
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
          {!showDateField ? (
            <>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar size={16} className="text-slate-400" />
                <span>
                  {new Date(fromDatetimeLocalValue(saleDateValue)).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <button onClick={() => setShowDateField(true)} className="text-sm font-medium text-brand-600">
                Alterar
              </button>
            </>
          ) : (
            <input
              type="datetime-local"
              value={saleDateValue}
              onChange={(e) => setSaleDateValue(e.target.value)}
              onBlur={() => setShowDateField(false)}
              autoFocus
              className="w-full bg-transparent text-sm text-slate-900 outline-none"
            />
          )}
        </div>

        {/* Cliente */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">Cliente</label>
          <button
            onClick={() => setClientSheetOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left shadow-sm"
          >
            <span className={selectedClient ? 'font-medium text-slate-900' : 'text-slate-400'}>
              {selectedClient ? selectedClient.name : 'Venda sem cliente'}
            </span>
            <span className="text-sm font-medium text-brand-600">Selecionar</span>
          </button>
        </div>

        {/* Produtos */}
        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-600">Produtos</label>
          <div className="grid grid-cols-2 gap-2">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => addProduct(product)}
                className="rounded-2xl bg-white p-3.5 text-left shadow-sm active:scale-[0.97]"
              >
                <p className="truncate text-sm font-medium text-slate-900">{product.name}</p>
                <p className="mt-0.5 text-sm font-semibold text-brand-600">
                  {formatCurrency(product.price)}
                </p>
              </button>
            ))}
          </div>
          {products.length === 0 && (
            <p className="rounded-2xl bg-white p-4 text-center text-sm text-slate-400 shadow-sm">
              Nenhum produto cadastrado. Adicione um produto primeiro.
            </p>
          )}
        </div>

        {/* Carrinho */}
        {cart.length > 0 && (
          <div className="mt-5">
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Carrinho</label>
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.productId} className="rounded-2xl bg-white p-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{item.productName}</p>
                      <p className="text-xs text-slate-400">{formatCurrency(item.unitPrice)} cada</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      aria-label="Remover produto"
                      className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 active:bg-slate-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-3 rounded-full bg-slate-100 px-1 py-1">
                      <button
                        onClick={() => changeQuantity(item.productId, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm active:scale-90"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => changeQuantity(item.productId, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm active:scale-90"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagamento */}
        {cart.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
              <span className="text-sm font-medium text-slate-600">Total</span>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(total)}</span>
            </div>

            <label className="mb-1.5 mt-3 block text-sm font-medium text-slate-600">
              Quanto foi pago?
            </label>

            <div className="mb-2 flex gap-2">
              <button
                onClick={() => setPaidAmount(total)}
                className={`flex-1 rounded-2xl py-3 text-sm font-semibold active:scale-[0.98] ${
                  effectivePaid === total
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                Pago
              </button>
              <button
                onClick={() => setPaidAmount(0)}
                className={`flex-1 rounded-2xl py-3 text-sm font-semibold active:scale-[0.98] ${
                  effectivePaid === 0 ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'
                }`}
              >
                Fiado
              </button>
            </div>

            <CurrencyInput valueCents={effectivePaid} onChange={setPaidAmount} />

            <div className="mt-3 flex gap-3 text-sm">
              <div className="flex-1 rounded-2xl bg-emerald-50 p-3 text-center">
                <p className="text-emerald-700">Pago</p>
                <p className="font-semibold text-emerald-700">{formatCurrency(effectivePaid)}</p>
              </div>
              <div className="flex-1 rounded-2xl bg-amber-50 p-3 text-center">
                <p className="text-amber-700">Fiado</p>
                <p className="font-semibold text-amber-700">{formatCurrency(debt)}</p>
              </div>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
      </div>

      {/* Botão finalizar fixo */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white p-4 pb-safe-bottom">
          <div className="mx-auto max-w-md">
            <button
              onClick={handleFinalize}
              disabled={saving}
              className="w-full rounded-2xl bg-brand-600 py-4 text-base font-bold text-white shadow-lg shadow-brand-600/25 active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'FINALIZAR VENDA'}
            </button>
          </div>
        </div>
      )}

      {/* Seletor de cliente */}
      {clientSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setClientSheetOpen(false)}
        >
          <div
            className="flex max-h-[75vh] w-full max-w-md flex-col rounded-t-3xl bg-white pb-safe-bottom shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-semibold text-slate-900">Selecionar cliente</h2>
              <button
                onClick={() => setClientSheetOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 active:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-4 pb-2">
              <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2.5">
                <Search size={16} className="text-slate-400" />
                <input
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Pesquisar cliente..."
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <button
                onClick={() => {
                  setSelectedClient(null)
                  setClientSheetOpen(false)
                }}
                className="mb-1 flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-500 active:bg-slate-100"
              >
                Venda sem cliente
              </button>
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    setSelectedClient(client)
                    setClientSheetOpen(false)
                  }}
                  className="flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-900 active:bg-slate-100"
                >
                  {client.name}
                </button>
              ))}
              {filteredClients.length === 0 && (
                <p className="px-3 py-3 text-sm text-slate-400">Nenhum cliente encontrado.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
