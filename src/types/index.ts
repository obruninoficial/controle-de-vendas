export interface Product {
  id?: number
  name: string
  price: number // em centavos, para evitar erros de ponto flutuante
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Client {
  id?: number
  name: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export type SaleStatus = 'active' | 'cancelled'

export interface Sale {
  id?: number
  clientId?: number | null
  date: string // ISO string
  total: number // centavos
  paid: number // centavos
  debt: number // centavos
  status: SaleStatus
}

export interface SaleItem {
  id?: number
  saleId: number
  productId: number | null
  productName: string
  unitPrice: number // centavos, valor congelado no momento da venda
  quantity: number
  subtotal: number // centavos
}

export interface Payment {
  id?: number
  clientId: number
  amount: number // centavos
  date: string // ISO string
}

// ----- Tipos auxiliares usados na UI -----

export interface CartItem {
  productId: number
  productName: string
  unitPrice: number
  quantity: number
}

export interface SaleWithItems extends Sale {
  items: SaleItem[]
  clientName?: string
}

export interface ClientWithDebt extends Client {
  debt: number
}

export interface PeriodSummary {
  totalSold: number
  totalReceived: number
  totalPending: number
}

export type PeriodFilter = 'today' | 'week' | 'month' | 'custom'
