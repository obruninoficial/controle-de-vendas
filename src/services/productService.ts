import { db } from '../db/database'
import type { Product } from '../types'

function nowIso() {
  return new Date().toISOString()
}

/** Lista todos os produtos ativos, ordenados por nome. */
export async function listActiveProducts(): Promise<Product[]> {
  // "active" é booleano e o IndexedDB não permite indexar booleanos,
  // por isso o filtro é feito em memória (a tabela tende a ser pequena).
  const products = await db.products.filter((p) => p.active).toArray()
  return products.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

/** Lista todos os produtos (ativos e inativos), ordenados por nome. */
export async function listAllProducts(): Promise<Product[]> {
  const products = await db.products.toArray()
  return products.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function getProduct(id: number): Promise<Product | undefined> {
  return db.products.get(id)
}

/** Cria um novo produto. Preço em centavos. */
export async function createProduct(name: string, price: number): Promise<number> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Digite o nome do produto.')
  if (!Number.isFinite(price) || price <= 0) throw new Error('Digite o valor do produto.')

  const timestamp = nowIso()
  return db.products.add({
    name: trimmed,
    price,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp
  })
}

/** Atualiza nome e/ou preço de um produto existente. */
export async function updateProduct(id: number, name: string, price: number): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Digite o nome do produto.')
  if (!Number.isFinite(price) || price <= 0) throw new Error('Digite o valor do produto.')

  await db.products.update(id, {
    name: trimmed,
    price,
    updatedAt: nowIso()
  })
}

/**
 * Desativa um produto (soft delete). O produto não é excluído fisicamente
 * porque vendas antigas dependem do seu histórico (nome/preço congelados
 * na tabela sale_items). Produtos inativos deixam de aparecer em novas
 * vendas, mas continuam existindo normalmente no banco.
 */
export async function deactivateProduct(id: number): Promise<void> {
  await db.products.update(id, { active: false, updatedAt: nowIso() })
}

/** Reativa um produto previamente desativado. */
export async function reactivateProduct(id: number): Promise<void> {
  await db.products.update(id, { active: true, updatedAt: nowIso() })
}
