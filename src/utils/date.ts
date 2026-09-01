import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  isToday
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { PeriodFilter } from '../types'

/** Formata uma data ISO como DD/MM/YYYY. */
export function formatDate(iso: string): string {
  return format(new Date(iso), 'dd/MM/yyyy')
}

/** Formata uma data ISO como HH:mm. */
export function formatTime(iso: string): string {
  return format(new Date(iso), 'HH:mm')
}

/** Formata data e horário juntos, usando "Hoje" quando aplicável. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (isToday(date)) {
    return `Hoje às ${format(date, 'HH:mm')}`
  }
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

/** Formata um Date para o formato aceito pelo input datetime-local (horário local). */
export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

/** Converte o valor de um input datetime-local (horário local) para ISO string. */
export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString()
}
export function getPeriodRange(
  filter: PeriodFilter,
  customStart?: string,
  customEnd?: string
): { start: string; end: string } {
  const now = new Date()

  switch (filter) {
    case 'today':
      return { start: startOfDay(now).toISOString(), end: endOfDay(now).toISOString() }
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 0 }).toISOString(),
        end: endOfWeek(now, { weekStartsOn: 0 }).toISOString()
      }
    case 'month':
      return { start: startOfMonth(now).toISOString(), end: endOfMonth(now).toISOString() }
    case 'custom':
      return {
        start: customStart ? startOfDay(new Date(customStart)).toISOString() : startOfDay(now).toISOString(),
        end: customEnd ? endOfDay(new Date(customEnd)).toISOString() : endOfDay(now).toISOString()
      }
  }
}
