import { db } from '../db/database'
import type { Client, ClientWithDebt } from '../types'
import { getClientDebt } from './saleService'

function nowIso() {
  return new Date().toISOString()
}

export async function getClient(id: number): Promise<Client | undefined> {
  return db.clients.get(id)
}

/** Lista todos os clientes com a dívida atual calculada, dívida primeiro. */
export async function listClientsWithDebt(): Promise<ClientWithDebt[]> {
  const clients = await db.clients.toArray()
  const withDebt: ClientWithDebt[] = await Promise.all(
    clients.map(async (client) => ({
      ...client,
      debt: await getClientDebt(client.id as number)
    }))
  )

  return withDebt.sort((a, b) => {
    if (a.debt !== b.debt) return b.debt - a.debt
    return a.name.localeCompare(b.name, 'pt-BR')
  })
}

/** Lista clientes de forma simples (para seletor de venda), ordenados por nome. */
export async function listClients(): Promise<Client[]> {
  const clients = await db.clients.toArray()
  return clients.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function createClient(name: string, phone?: string): Promise<number> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Digite o nome do cliente.')

  const timestamp = nowIso()
  return db.clients.add({
    name: trimmed,
    phone: phone?.trim() || undefined,
    createdAt: timestamp,
    updatedAt: timestamp
  })
}

export async function updateClient(id: number, name: string, phone?: string): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Digite o nome do cliente.')

  await db.clients.update(id, {
    name: trimmed,
    phone: phone?.trim() || undefined,
    updatedAt: nowIso()
  })
}
