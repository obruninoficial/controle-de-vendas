import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { createClient, updateClient, getClient } from '../services/clientService'

export function ClientForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const clientId = id ? Number(id) : undefined

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(!isEditing)

  useEffect(() => {
    if (clientId) {
      getClient(clientId).then((client) => {
        if (client) {
          setName(client.name)
          setPhone(client.phone ?? '')
        }
        setLoaded(true)
      })
    }
  }, [clientId])

  async function handleSave() {
    setError('')
    try {
      if (isEditing && clientId) {
        await updateClient(clientId, name, phone)
        navigate(`/clientes/${clientId}`)
      } else {
        const newId = await createClient(name, phone)
        navigate(`/clientes/${newId}`)
      }
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (!loaded) return null

  return (
    <div>
      <PageHeader title={isEditing ? 'Editar cliente' : 'Adicionar cliente'} onBack={() => navigate(-1)} />

      <div className="space-y-5 px-4 pt-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600" htmlFor="client-name">
            Nome
          </label>
          <input
            id="client-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: João da Silva"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600" htmlFor="client-phone">
            Telefone <span className="text-slate-400">(opcional)</span>
          </label>
          <input
            id="client-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(15) 99999-9999"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <button
          onClick={handleSave}
          className="w-full rounded-2xl bg-brand-600 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 active:scale-[0.98]"
        >
          Salvar cliente
        </button>
      </div>
    </div>
  )
}
