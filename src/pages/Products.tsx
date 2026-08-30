import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, EyeOff } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { formatCurrency } from '../utils/currency'
import { listAllProducts } from '../services/productService'
import type { Product } from '../types'

export function Products() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    listAllProducts().then(setProducts)
  }, [])

  const visible = products?.filter((p) => showInactive || p.active) ?? []

  return (
    <div>
      <PageHeader
        title="Produtos"
        action={
          <button
            onClick={() => navigate('/produtos/novo')}
            aria-label="Adicionar produto"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white active:scale-95"
          >
            <Plus size={20} />
          </button>
        }
      />

      <div className="px-4 pt-4">
        <button
          onClick={() => navigate('/produtos/novo')}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-semibold text-brand-600 shadow-sm active:scale-[0.98]"
        >
          <Plus size={18} />
          Adicionar produto
        </button>

        <div className="space-y-2">
          {visible.map((product) => (
            <button
              key={product.id}
              onClick={() => navigate(`/produtos/${product.id}`)}
              className="flex w-full items-center justify-between rounded-2xl bg-white p-4 text-left shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-2 min-w-0">
                {!product.active && <EyeOff size={16} className="shrink-0 text-slate-400" />}
                <span className={`truncate font-medium ${product.active ? 'text-slate-900' : 'text-slate-400'}`}>
                  {product.name}
                </span>
              </div>
              <span className={`shrink-0 font-semibold ${product.active ? 'text-slate-900' : 'text-slate-400'}`}>
                {formatCurrency(product.price)}
              </span>
            </button>
          ))}

          {products && visible.length === 0 && (
            <p className="rounded-2xl bg-white p-4 text-center text-sm text-slate-400 shadow-sm">
              Nenhum produto cadastrado ainda.
            </p>
          )}
        </div>

        {products && products.some((p) => !p.active) && (
          <button
            onClick={() => setShowInactive((v) => !v)}
            className="mt-4 w-full text-center text-sm font-medium text-slate-400"
          >
            {showInactive ? 'Ocultar produtos desativados' : 'Mostrar produtos desativados'}
          </button>
        )}
      </div>
    </div>
  )
}
