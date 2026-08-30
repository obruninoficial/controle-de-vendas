import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { CurrencyInput } from '../components/CurrencyInput'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  createProduct,
  updateProduct,
  getProduct,
  deactivateProduct,
  reactivateProduct
} from '../services/productService'

export function ProductForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const productId = id ? Number(id) : undefined

  const [name, setName] = useState('')
  const [priceCents, setPriceCents] = useState(0)
  const [active, setActive] = useState(true)
  const [error, setError] = useState('')
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [loaded, setLoaded] = useState(!isEditing)

  useEffect(() => {
    if (productId) {
      getProduct(productId).then((product) => {
        if (product) {
          setName(product.name)
          setPriceCents(product.price)
          setActive(product.active)
        }
        setLoaded(true)
      })
    }
  }, [productId])

  async function handleSave() {
    setError('')
    try {
      if (isEditing && productId) {
        await updateProduct(productId, name, priceCents)
      } else {
        await createProduct(name, priceCents)
      }
      navigate('/produtos')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function handleToggleActive() {
    if (!productId) return
    if (active) {
      setConfirmDeactivate(true)
    } else {
      await reactivateProduct(productId)
      navigate('/produtos')
    }
  }

  async function confirmDeactivation() {
    if (!productId) return
    await deactivateProduct(productId)
    setConfirmDeactivate(false)
    navigate('/produtos')
  }

  if (!loaded) return null

  return (
    <div>
      <PageHeader title={isEditing ? 'Editar produto' : 'Adicionar produto'} onBack={() => navigate(-1)} />

      <div className="space-y-5 px-4 pt-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600" htmlFor="product-name">
            Nome
          </label>
          <input
            id="product-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Bolo de Chocolate"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600" htmlFor="product-price">
            Valor
          </label>
          <CurrencyInput id="product-price" valueCents={priceCents} onChange={setPriceCents} />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          onClick={handleSave}
          className="w-full rounded-2xl bg-brand-600 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 active:scale-[0.98]"
        >
          Salvar produto
        </button>

        {isEditing && (
          <button
            onClick={handleToggleActive}
            className={`w-full rounded-2xl py-3.5 text-sm font-semibold active:scale-[0.98] ${
              active ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {active ? 'Desativar produto' : 'Reativar produto'}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeactivate}
        title="Tem certeza que deseja desativar este produto?"
        description="Ele deixará de aparecer em novas vendas, mas o histórico de vendas antigas continuará normal."
        confirmLabel="Desativar"
        danger
        onConfirm={confirmDeactivation}
        onCancel={() => setConfirmDeactivate(false)}
      />
    </div>
  )
}
