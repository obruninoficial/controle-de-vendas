import { formatCurrency } from '../utils/currency'

interface CurrencyInputProps {
  /** Valor atual em centavos. */
  valueCents: number
  onChange: (cents: number) => void
  placeholder?: string
  autoFocus?: boolean
  id?: string
}

/**
 * Campo de dinheiro no estilo "caixa registradora": o usuário digita
 * apenas números e eles preenchem o valor da direita para a esquerda,
 * exatamente como em apps bancários. Evita erros de vírgula/ponto e
 * problemas de zoom automático do Safari (inputMode numeric + fonte 16px).
 */
export function CurrencyInput({ valueCents, onChange, placeholder, autoFocus, id }: CurrencyInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digitsOnly = e.target.value.replace(/\D/g, '')
    const cents = digitsOnly ? parseInt(digitsOnly, 10) : 0
    onChange(cents)
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoFocus={autoFocus}
      placeholder={placeholder ?? 'R$ 0,00'}
      value={valueCents ? formatCurrency(valueCents) : ''}
      onChange={handleChange}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-lg font-semibold text-slate-900 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
    />
  )
}
