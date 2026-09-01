import Dexie, { type Table } from 'dexie'
import type { Product, Client, Sale, SaleItem, Payment } from '../types'

/**
 * ControleDeVendasDB
 *
 * Banco 100% local, armazenado no IndexedDB do dispositivo via Dexie.
 * Nenhum dado sai do dispositivo. Não existe nenhuma chamada de rede
 * neste arquivo nem em nenhum dos serviços que o utilizam.
 */
export class ControleDeVendasDB extends Dexie {
  products!: Table<Product, number>
  clients!: Table<Client, number>
  sales!: Table<Sale, number>
  saleItems!: Table<SaleItem, number>
  payments!: Table<Payment, number>

  constructor() {
    super('ControleDeVendasDB')

    this.version(1).stores({
      products: '++id, name, createdAt',
      clients: '++id, name, createdAt',
      sales: '++id, clientId, date, status',
      saleItems: '++id, saleId, productId',
      payments: '++id, clientId, date'
    })

    // v2: adiciona "originalDebt" em sales, usado para quitar vendas fiadas
    // mais antigas primeiro quando o cliente faz um pagamento avulso.
    // Para vendas já existentes, o valor de "debt" nunca havia sido
    // alterado por pagamentos (isso era calculado à parte), então ele
    // representa corretamente o fiado original — é só copiar.
    this.version(2)
      .stores({
        products: '++id, name, createdAt',
        clients: '++id, name, createdAt',
        sales: '++id, clientId, date, status',
        saleItems: '++id, saleId, productId',
        payments: '++id, clientId, date'
      })
      .upgrade(async (tx) => {
        await tx
          .table('sales')
          .toCollection()
          .modify((sale: Sale) => {
            if (sale.originalDebt === undefined) {
              sale.originalDebt = sale.debt
            }
          })
      })
  }
}

export const db = new ControleDeVendasDB()
