import { db } from '../db/database'
import type { CartItem, Sale, SaleItem, SaleWithItems, PeriodSummary } from '../types'

function nowIso() {
  return new Date().toISOString()
}

/** Soma o "fiado original" de todas as vendas ativas de um cliente (imutável, não desconta pagamentos). */
export async function getClientTotalFiado(clientId: number): Promise<number> {
  const sales = await db.sales.where('clientId').equals(clientId).toArray()
  return sales.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.originalDebt, 0)
}

/**
 * Recalcula a quitação das vendas fiadas de um cliente: pega todos os
 * pagamentos avulsos já registrados e vai abatendo o "fiado original" das
 * vendas mais antigas primeiro. Atualiza "paid" e "debt" de cada venda
 * para refletir o que realmente já foi quitado.
 *
 * É chamada sempre que um pagamento é criado, editado ou excluído, ou
 * quando uma venda é cancelada/editada — garante que o estado fique
 * sempre consistente, sem depender de atualizações incrementais frágeis.
 */
export async function settleClientSales(clientId: number): Promise<void> {
  const [sales, payments] = await Promise.all([
    db.sales.where('clientId').equals(clientId).toArray(),
    db.payments.where('clientId').equals(clientId).toArray()
  ])

  const activeSales = sales
    .filter((s) => s.status === 'active')
    .sort((a, b) => a.date.localeCompare(b.date)) // mais antigas primeiro

  let pool = payments.reduce((sum, p) => sum + p.amount, 0)

  await db.transaction('rw', db.sales, async () => {
    for (const sale of activeSales) {
      const paidAtSale = sale.total - sale.originalDebt
      const settled = Math.min(sale.originalDebt, pool)
      pool -= settled

      const newPaid = paidAtSale + settled
      const newDebt = sale.originalDebt - settled

      if (sale.paid !== newPaid || sale.debt !== newDebt) {
        await db.sales.update(sale.id as number, { paid: newPaid, debt: newDebt })
      }
    }
  })
}

/**
 * Dívida atual do cliente = soma do "fiado" (debt) das vendas ativas, já
 * considerando a quitação aplicada pelos pagamentos avulsos.
 */
export async function getClientDebt(clientId: number): Promise<number> {
  const sales = await db.sales.where('clientId').equals(clientId).toArray()
  return sales.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.debt, 0)
}

/** Soma a dívida atual de todos os clientes ("A receber" do Dashboard). */
export async function getTotalReceivable(): Promise<number> {
  const clients = await db.clients.toArray()
  const debts = await Promise.all(clients.map((c) => getClientDebt(c.id as number)))
  return debts.reduce((sum, d) => sum + d, 0)
}

interface CreateSaleInput {
  clientId: number | null
  items: CartItem[]
  paidAmount: number
  /** Data/hora da venda em ISO. Se omitida, usa o momento atual. Permite
   *  registrar vendas de dias anteriores que foram esquecidas. */
  date?: string
}

/**
 * Cria uma nova venda com seus itens dentro de uma transação do Dexie,
 * garantindo que a venda e os itens sejam gravados de forma atômica.
 */
export async function createSale(input: CreateSaleInput): Promise<number> {
  const { clientId, items, paidAmount, date } = input

  if (items.length === 0) {
    throw new Error('Adicione pelo menos um produto.')
  }

  for (const item of items) {
    if (item.quantity < 1) {
      throw new Error('A quantidade deve ser pelo menos 1.')
    }
  }

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  if (total <= 0) {
    throw new Error('O total da venda deve ser maior que zero.')
  }
  if (paidAmount < 0) {
    throw new Error('O valor pago não pode ser negativo.')
  }
  if (paidAmount > total) {
    throw new Error('O valor pago não pode ser maior que o total da venda.')
  }

  const debt = total - paidAmount

  if (debt > 0 && !clientId) {
    throw new Error('Selecione um cliente para registrar uma venda fiada.')
  }

  const saleId = await db.transaction('rw', db.sales, db.saleItems, async () => {
    const id = await db.sales.add({
      clientId: clientId ?? null,
      date: date ?? nowIso(),
      total,
      paid: paidAmount,
      debt,
      originalDebt: debt,
      status: 'active'
    })

    const itemRecords: SaleItem[] = items.map((item) => ({
      saleId: id,
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.unitPrice * item.quantity
    }))

    await db.saleItems.bulkAdd(itemRecords)

    return id
  })

  return saleId
}

/**
 * Cancela uma venda (soft delete). A venda não é excluída fisicamente,
 * apenas marcada como "cancelled". Vendas canceladas deixam de contar
 * em relatórios, no Dashboard e na dívida do cliente. Se a venda tinha
 * fiado sendo quitado por pagamentos avulsos, esses pagamentos são
 * realocados automaticamente para as próximas vendas mais antigas.
 */
export async function cancelSale(saleId: number): Promise<void> {
  const sale = await db.sales.get(saleId)
  await db.sales.update(saleId, { status: 'cancelled' })
  if (sale?.clientId) {
    await settleClientSales(sale.clientId)
  }
}

/**
 * Corrige quanto foi pago NO MOMENTO da venda (ex: valor lançado errado
 * na hora). Isso altera o "fiado original" dessa venda, e a quitação de
 * todo o cliente é recalculada em seguida — pagamentos avulsos já
 * registrados continuam quitando as vendas mais antigas primeiro.
 */
export async function updateSaleOriginalPayment(saleId: number, newPaidAtSale: number): Promise<void> {
  const sale = await db.sales.get(saleId)
  if (!sale) throw new Error('Venda não encontrada.')

  if (!Number.isFinite(newPaidAtSale) || newPaidAtSale < 0) {
    throw new Error('O valor pago não pode ser negativo.')
  }
  if (newPaidAtSale > sale.total) {
    throw new Error('O valor pago não pode ser maior que o total da venda.')
  }

  const newOriginalDebt = sale.total - newPaidAtSale

  if (newOriginalDebt > 0 && !sale.clientId) {
    throw new Error('Esta venda não tem cliente vinculado, então não pode ficar fiada.')
  }

  await db.sales.update(saleId, { originalDebt: newOriginalDebt })

  if (sale.clientId) {
    await settleClientSales(sale.clientId)
  } else {
    // Sem cliente, não há pagamentos avulsos a realocar — aplica direto.
    await db.sales.update(saleId, { paid: newPaidAtSale, debt: newOriginalDebt })
  }
}

async function attachClientNames(sales: Sale[]): Promise<Map<number, string>> {
  const clientIds = Array.from(
    new Set(sales.map((s) => s.clientId).filter((id): id is number => !!id))
  )
  const clients = await db.clients.bulkGet(clientIds)
  const map = new Map<number, string>()
  clients.forEach((client, index) => {
    // Cliente pode ter sido excluído — a venda continua no histórico,
    // mas exibimos "Cliente removido" em vez de esconder a informação.
    map.set(clientIds[index], client?.name ?? 'Cliente removido')
  })
  return map
}

/** Busca uma venda com seus itens e o nome do cliente (se houver). */
export async function getSaleWithItems(saleId: number): Promise<SaleWithItems | undefined> {
  const sale = await db.sales.get(saleId)
  if (!sale) return undefined

  const items = await db.saleItems.where('saleId').equals(saleId).toArray()
  let clientName: string | undefined
  if (sale.clientId) {
    const client = await db.clients.get(sale.clientId)
    clientName = client?.name ?? 'Cliente removido'
  }

  return { ...sale, items, clientName }
}

/** Retorna as vendas mais recentes (ativas), já com nome do cliente. */
export async function getRecentSales(limit = 5): Promise<SaleWithItems[]> {
  const all = await db.sales.where('status').equals('active').toArray()
  const sales = all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit)

  const nameMap = await attachClientNames(sales)
  const withItems = await Promise.all(
    sales.map(async (sale) => ({
      ...sale,
      items: await db.saleItems.where('saleId').equals(sale.id as number).toArray(),
      clientName: sale.clientId ? nameMap.get(sale.clientId) : undefined
    }))
  )

  return withItems
}

/** Busca vendas (ativas) dentro de um intervalo de datas, mais recentes primeiro. */
export async function getSalesInRange(start: string, end: string): Promise<SaleWithItems[]> {
  const inRange = await db.sales.where('date').between(start, end, true, true).toArray()
  const sales = inRange
    .filter((s) => s.status === 'active')
    .sort((a, b) => b.date.localeCompare(a.date))

  const nameMap = await attachClientNames(sales)
  const withItems = await Promise.all(
    sales.map(async (sale) => ({
      ...sale,
      items: await db.saleItems.where('saleId').equals(sale.id as number).toArray(),
      clientName: sale.clientId ? nameMap.get(sale.clientId) : undefined
    }))
  )

  return withItems
}

/** Calcula o resumo (vendido / recebido / fiado) de um intervalo de datas. */
export async function getPeriodSummary(start: string, end: string): Promise<PeriodSummary> {
  const sales = await db.sales
    .where('date')
    .between(start, end, true, true)
    .filter((s) => s.status === 'active')
    .toArray()

  return sales.reduce(
    (acc, s) => ({
      totalSold: acc.totalSold + s.total,
      totalReceived: acc.totalReceived + s.paid,
      totalPending: acc.totalPending + s.debt
    }),
    { totalSold: 0, totalReceived: 0, totalPending: 0 }
  )
}

/** Busca todas as vendas (ativas) de um cliente, mais recentes primeiro. */
export async function getClientSales(clientId: number): Promise<SaleWithItems[]> {
  const raw = await db.sales.where('clientId').equals(clientId).toArray()
  const sales = raw.sort((a, b) => b.date.localeCompare(a.date))

  const withItems = await Promise.all(
    sales.map(async (sale) => ({
      ...sale,
      items: await db.saleItems.where('saleId').equals(sale.id as number).toArray()
    }))
  )

  return withItems
}
