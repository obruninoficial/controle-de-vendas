import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Receipt, Plus, Users, Package } from 'lucide-react'

const linkBase =
  'flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 text-[11px] font-medium transition-colors'

export function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 pb-safe-bottom backdrop-blur">
      <div className="mx-auto flex max-w-md items-end px-2 pt-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'text-brand-600' : 'text-slate-400'}`
          }
        >
          <Home size={22} strokeWidth={2.25} />
          Início
        </NavLink>

        <NavLink
          to="/vendas"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'text-brand-600' : 'text-slate-400'}`
          }
        >
          <Receipt size={22} strokeWidth={2.25} />
          Vendas
        </NavLink>

        <div className="flex flex-1 justify-center">
          <button
            onClick={() => navigate('/nova-venda')}
            aria-label="Nova venda"
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition-transform active:scale-95"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>

        <NavLink
          to="/clientes"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'text-brand-600' : 'text-slate-400'}`
          }
        >
          <Users size={22} strokeWidth={2.25} />
          Clientes
        </NavLink>

        <NavLink
          to="/produtos"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? 'text-brand-600' : 'text-slate-400'}`
          }
        >
          <Package size={22} strokeWidth={2.25} />
          Produtos
        </NavLink>
      </div>
    </nav>
  )
}
