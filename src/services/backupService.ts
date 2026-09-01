import { db } from '../db/database'
import type { Product, Client, Sale, SaleItem, Payment } from '../types'
import { settleClientSales } from './saleService'

interface BackupFile {
  app: 'controle-de-vendas'
  version: 1
  exportedAt: string
  data: {
    products: Product[]
    clients: Client[]
    sales: Sale[]
    saleItems: SaleItem[]
    payments: Payment[]
  }
}

/** Gera o objeto de backup com todas as tabelas do banco local. */
export async function buildBackup(): Promise<BackupFile> {
  const [products, clients, sales, saleItems, payments] = await Promise.all([
    db.products.toArray(),
    db.clients.toArray(),
    db.sales.toArray(),
    db.saleItems.toArray(),
    db.payments.toArray()
  ])

  return {
    app: 'controle-de-vendas',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { products, clients, sales, saleItems, payments }
  }
}

/**
 * Gera o backup em JSON e dispara o download do arquivo no dispositivo
 * (via <a download>, sem nenhuma requisição de rede).
 */
export async function exportBackup(): Promise<void> {
  const backup = await buildBackup()
  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const dateStamp = new Date().toISOString().slice(0, 10)
  const link = document.createElement('a')
  link.href = url
  link.download = `controle-de-vendas-backup-${dateStamp}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Valida a estrutura básica de um arquivo de backup antes de importar. */
export function validateBackup(raw: unknown): raw is BackupFile {
  if (!raw || typeof raw !== 'object') return false
  const backup = raw as Partial<BackupFile>
  if (backup.app !== 'controle-de-vendas') return false
  if (!backup.data || typeof backup.data !== 'object') return false
  const { products, clients, sales, saleItems, payments } = backup.data as BackupFile['data']
  return (
    Array.isArray(products) &&
    Array.isArray(clients) &&
    Array.isArray(sales) &&
    Array.isArray(saleItems) &&
    Array.isArray(payments)
  )
}

/**
 * Lê um arquivo selecionado pelo usuário e retorna o objeto de backup
 * já validado, ou lança um erro caso o arquivo seja inválido.
 */
export async function readBackupFile(file: File): Promise<BackupFile> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Arquivo inválido. Selecione um backup exportado pelo aplicativo.')
  }

  if (!validateBackup(parsed)) {
    throw new Error('Arquivo inválido. Selecione um backup exportado pelo aplicativo.')
  }

  return parsed
}

/**
 * Substitui todos os dados atuais pelos dados do backup, dentro de uma
 * transação — se algo falhar, nada é alterado (evita corromper os dados
 * existentes).
 */
export async function restoreBackup(backup: BackupFile): Promise<void> {
  await db.transaction(
    'rw',
    db.products,
    db.clients,
    db.sales,
    db.saleItems,
    db.payments,
    async () => {
      await Promise.all([
        db.products.clear(),
        db.clients.clear(),
        db.sales.clear(),
        db.saleItems.clear(),
        db.payments.clear()
      ])

      await Promise.all([
        db.products.bulkAdd(backup.data.products),
        db.clients.bulkAdd(backup.data.clients),
        // Backups gerados antes da funcionalidade de quitação automática
        // não têm o campo "originalDebt" — nesse caso, usamos o "debt"
        // já salvo (equivalente, pois nunca era alterado por pagamentos).
        db.sales.bulkAdd(
          backup.data.sales.map((sale) => ({
            ...sale,
            originalDebt: sale.originalDebt ?? sale.debt
          }))
        ),
        db.saleItems.bulkAdd(backup.data.saleItems),
        db.payments.bulkAdd(backup.data.payments)
      ])
    }
  )

  // Reprocessa a quitação de todos os clientes para que "pago"/"fiado"
  // reflita corretamente os pagamentos já registrados no backup restaurado.
  const clientIds = await db.clients.toCollection().primaryKeys()
  for (const clientId of clientIds) {
    await settleClientSales(clientId as number)
  }
}
