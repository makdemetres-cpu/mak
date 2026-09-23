import type { Currency } from './api'

export function money(value: number | null | undefined, currency: Currency): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  const options: Intl.NumberFormatOptions =
    abs >= 1
      ? { minimumFractionDigits: 2, maximumFractionDigits: abs >= 100 ? 2 : 4 }
      : { minimumSignificantDigits: 2, maximumSignificantDigits: 4 }
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, ...options }).format(value)
}

export function amount(value: number | null | undefined, maxDigits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: maxDigits }).format(value)
}

export function signedPct(value: number): string {
  const text = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Math.abs(value),
  )
  if (value > 0) return `+${text}%`
  if (value < 0) return `−${text}%`
  return `${text}%`
}

export function clockTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ago(iso: string | null | undefined, now: number): string {
  if (!iso) return '—'
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours} h ago`
  return `${Math.floor(hours / 24)} days ago`
}

export function intervalLabel(seconds: number | null): string {
  if (!seconds) return ''
  const labels: Record<number, string> = {
    300: '5-minute points',
    3600: '1-hour points',
    14400: '4-hour points',
    21600: '6-hour points',
    86400: 'daily points',
    604800: 'weekly points',
  }
  return labels[seconds] ?? `${Math.round(seconds / 60)}-minute points`
}
