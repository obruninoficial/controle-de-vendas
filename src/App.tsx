import { Routes, Route, useLocation } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { Home } from './pages/Home'
import { Products } from './pages/Products'
import { ProductForm } from './pages/ProductForm'
import { Clients } from './pages/Clients'
import { ClientForm } from './pages/ClientForm'
import { ClientDetail } from './pages/ClientDetail'
import { Sales } from './pages/Sales'
import { SaleDetail } from './pages/SaleDetail'
import { NewSale } from './pages/NewSale'
import { Settings } from './pages/Settings'

export default function App() {
  const location = useLocation()
  // A tela de Nova Venda usa botão de voltar próprio em vez da navegação inferior.
  const showBottomNav = location.pathname !== '/nova-venda'

  return (
    <div className={`mx-auto min-h-full max-w-md bg-slate-100 ${showBottomNav ? 'pb-24' : ''}`}>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/produtos" element={<Products />} />
        <Route path="/produtos/novo" element={<ProductForm />} />
        <Route path="/produtos/:id" element={<ProductForm />} />

        <Route path="/clientes" element={<Clients />} />
        <Route path="/clientes/novo" element={<ClientForm />} />
        <Route path="/clientes/:id" element={<ClientDetail />} />
        <Route path="/clientes/:id/editar" element={<ClientForm />} />

        <Route path="/vendas" element={<Sales />} />
        <Route path="/vendas/:id" element={<SaleDetail />} />

        <Route path="/nova-venda" element={<NewSale />} />

        <Route path="/configuracoes" element={<Settings />} />
      </Routes>

      {showBottomNav && <BottomNav />}
    </div>
  )
}
