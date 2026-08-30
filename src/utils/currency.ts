/**
 * Todos os valores monetários são armazenados internamente em CENTAVOS
 * (números inteiros) para evitar erros de arredondamento de ponto
 * flutuante. As funções abaixo convertem entre centavos e a
 * representação em Real brasileiro (R$).
 */

const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
})

/** Formata um valor em centavos para o padrão "R$ 5,00". */
export function formatCurrency(cents: number): string {
  return formatter.format(cents / 100)
}

/** Converte um número em reais (ex: 5.5) para centavos (550). */
export function toCents(reais: number): number {
  return Math.round(reais * 100)
}

/** Converte centavos para um número em reais, útil para inputs. */
export function toReais(cents: number): number {
  return cents / 100
}

/**
 * Faz o parse de uma string de input de moeda brasileira (o usuário pode
 * digitar "5", "5,00", "5.00" etc.) e retorna o valor em centavos.
 * Retorna 0 para entradas inválidas ou vazias.
 */
export function parseCurrencyInput(value: string): number {
  if (!value) return 0
  const normalized = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '') // remove separador de milhar
    .replace(',', '.')
  const parsed = parseFloat(normalized)
  if (Number.isNaN(parsed)) return 0
  return Math.round(parsed * 100)
}
