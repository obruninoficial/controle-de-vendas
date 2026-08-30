import { db } from '../db/database'
import type { Payment } from '../types'
import { getClientDebt } from './saleService'

function nowIso() {
  return new Date().toISOString()
}

/**
 * Registra um pagamento posterior de um cliente. Valida que o valor não
 * ultrapassa a dívida atual (excesso de pagamento é tratado como erro).
 */
export async function registerPayment(clientId: number, amount: number): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Digite um valor de pagamento válido.')
  }

  const currentDebt = await getClientDebt(clientId)

  if (amount > currentDebt) {
    throw new Error('O valor do pagamento não pode ser maior que a dívida do cliente.')
  }

  await db.payments.add({
    clientId,
    amount,
    date: nowIso()
  })
}

/** Histórico de pagamentos de um cliente, mais recentes primeiro. */
export async function getClientPayments(clientId: number): Promise<Payment[]> {
  const payments = await db.payments.where('clientId').equals(clientId).toArray()
  return payments.sort((a, b) => b.date.localeCompare(a.date))
}
