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

/** Conta quantas vendas ativas um cliente possui, para avisar antes de excluir. */
export async function countClientSales(clientId: number): Promise<number> {
  return db.sales.where('clientId').equals(clientId).and((s) => s.status === 'active').count()
}

/**
 * Exclui um cliente definitivamente. As vendas antigas desse cliente NÃO são
 * apagadas (o histórico de vendas é preservado), mas deixam de ter um
 * cliente vinculado — passam a aparecer como "Cliente removido". Os
 * pagamentos avulsos do cliente são removidos junto, pois não fazem
 * sentido sem o cliente associado.
 */
export async function deleteClient(id: number): Promise<void> {
  await db.transaction('rw', db.clients, db.payments, async () => {
    await db.payments.where('clientId').equals(id).delete()
    await db.clients.delete(id)
  })
}
