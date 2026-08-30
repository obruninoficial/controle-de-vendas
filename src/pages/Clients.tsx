import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { formatCurrency } from '../utils/currency'
import { listClientsWithDebt } from '../services/clientService'
import type { ClientWithDebt } from '../types'

export function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<ClientWithDebt[] | null>(null)

  useEffect(() => {
    listClientsWithDebt().then(setClients)
  }, [])

  return (
    <div>
      <PageHeader
        title="Clientes"
        action={
          <button
            onClick={() => navigate('/clientes/novo')}
            aria-label="Adicionar cliente"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white active:scale-95"
          >
            <Plus size={20} />
          </button>
        }
      />

      <div className="px-4 pt-4">
        <button
          onClick={() => navigate('/clientes/novo')}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-semibold text-brand-600 shadow-sm active:scale-[0.98]"
        >
          <Plus size={18} />
          Adicionar cliente
        </button>

        <div className="space-y-2">
          {clients?.map((client) => (
            <button
              key={client.id}
              onClick={() => navigate(`/clientes/${client.id}`)}
              className="flex w-full items-center justify-between rounded-2xl bg-white p-4 text-left shadow-sm active:scale-[0.99]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{client.name}</p>
                {client.phone && <p className="text-sm text-slate-400">{client.phone}</p>}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-slate-400">Deve</p>
                <p className={`font-semibold ${client.debt > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                  {formatCurrency(client.debt)}
                </p>
              </div>
            </button>
          ))}

          {clients && clients.length === 0 && (
            <p className="rounded-2xl bg-white p-4 text-center text-sm text-slate-400 shadow-sm">
              Nenhum cliente cadastrado ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
