import { db } from '../db/database'
import type { Payment } from '../types'
import { getClientDebt, getClientTotalFiado, settleClientSales } from './saleService'

function nowIso() {
  return new Date().toISOString()
}

/**
 * Registra um pagamento posterior de um cliente. Valida que o valor não
 * ultrapassa a dívida atual (excesso de pagamento é tratado como erro).
 * Aceita uma data opcional, para registrar pagamentos de dias anteriores
 * que foram esquecidos.
 *
 * Depois de registrado, o pagamento é usado para quitar automaticamente
 * as vendas fiadas mais antigas do cliente primeiro.
 */
export async function registerPayment(clientId: number, amount: number, date?: string): Promise<void> {
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
    date: date ?? nowIso()
  })

  await settleClientSales(clientId)
}

/**
 * Corrige o valor (e opcionalmente a data) de um pagamento já registrado,
 * caso tenha sido digitado errado. Valida que a soma de todos os
 * pagamentos do cliente (com esse já corrigido) não ultrapasse o total
 * fiado dele. As vendas do cliente são re-quitadas em seguida.
 */
export async function updatePayment(paymentId: number, newAmount: number, newDate?: string): Promise<void> {
  if (!Number.isFinite(newAmount) || newAmount <= 0) {
    throw new Error('Digite um valor de pagamento válido.')
  }

  const payment = await db.payments.get(paymentId)
  if (!payment) throw new Error('Pagamento não encontrado.')

  const [totalFiado, allPayments] = await Promise.all([
    getClientTotalFiado(payment.clientId),
    db.payments.where('clientId').equals(payment.clientId).toArray()
  ])

  const otherPaymentsTotal = allPayments
    .filter((p) => p.id !== paymentId)
    .reduce((sum, p) => sum + p.amount, 0)

  if (otherPaymentsTotal + newAmount > totalFiado) {
    throw new Error('Esse valor deixaria o total pago maior que o total fiado do cliente.')
  }

  await db.payments.update(paymentId, { amount: newAmount, ...(newDate ? { date: newDate } : {}) })
  await settleClientSales(payment.clientId)
}

/**
 * Exclui um pagamento registrado por engano. As vendas do cliente voltam
 * a ficar fiadas na medida correspondente, começando pelas mais recentes
 * (já que a quitação é sempre recalculada do zero, das mais antigas
 * para as mais novas).
 */
export async function deletePayment(paymentId: number): Promise<void> {
  const payment = await db.payments.get(paymentId)
  if (!payment) return

  await db.payments.delete(paymentId)
  await settleClientSales(payment.clientId)
}

/** Histórico de pagamentos de um cliente, mais recentes primeiro. */
export async function getClientPayments(clientId: number): Promise<Payment[]> {
  const payments = await db.payments.where('clientId').equals(clientId).toArray()
  return payments.sort((a, b) => b.date.localeCompare(a.date))
}
