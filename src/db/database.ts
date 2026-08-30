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
  }
}

export const db = new ControleDeVendasDB()
