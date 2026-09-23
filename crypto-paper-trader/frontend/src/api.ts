export type Currency = 'USD' | 'EUR'
export type RangeKey = '1D' | '1W' | '1M' | '1Y' | '5Y'
export type FreshnessStatus = 'live' | 'delayed' | 'end_of_day' | 'stale' | 'unavailable'

export interface Freshness {
  status: FreshnessStatus
  label: string
  age_seconds: number | null
  detail: string
}

export interface Notice {
  code: string
  level: 'info' | 'warning' | 'danger'
  message: string
}

export interface SourceError {
  source: string
  source_name: string
  kind: string
  message: string
  at: string
}

export interface Comparison {
  source: string
  source_name: string
  price: number | null
  diff_pct: number | null
  comparable: boolean
  note: string
}

export interface FxInfo {
  rate_usd_per_eur: number
  rate_date: string
  source: string
  source_name: string
  fetched_at: string
  stale: boolean
}

export interface QuoteReport {
  symbol: string
  name: string
  currency: Currency
  converted: boolean
  price: {
    value: number
    bid: number | null
    ask: number | null
    open_24h: number | null
    high_24h: number | null
    low_24h: number | null
    change_24h_pct: number | null
    volume_24h: number | null
  } | null
  source: {
    id: string
    name: string
    pair: string
    observed_at: string | null
    fetched_at: string
    from_cache: boolean
  } | null
  freshness: Freshness
  cross_check: { status: 'agree' | 'disagree' | 'unchecked'; threshold_pct: number | null; comparisons: Comparison[] }
  fx: FxInfo | null
  notices: Notice[]
  errors: SourceError[]
  checked_at: string
}

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number | null
}

export interface CandleReport {
  symbol: string
  currency: Currency
  range: RangeKey
  converted: boolean
  interval_seconds: number | null
  source: { id: string; name: string; pair: string; fetched_at: string; from_cache: boolean } | null
  candles: Candle[]
  freshness: Freshness
  notices: Notice[]
  errors: SourceError[]
  checked_at: string
}

export interface SearchResult {
  symbol: string
  name: string
  markets: Record<Currency, string[]>
}

export interface ExchangeStatus {
  source: string
  source_name: string
  status: 'ok' | 'degraded' | 'down' | 'unknown'
  description: string
  reported_at: string | null
  checked_at: string
  error: string | null
}

export interface Settings {
  currency: Currency
}

export class ApiError extends Error {
  status: number
  errors: SourceError[]

  constructor(status: number, message: string, errors: SourceError[] = []) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, init)
  } catch {
    throw new ApiError(0, 'The app’s local server isn’t responding. Is the Crypto Paper Trader window still open?')
  }
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = typeof body?.detail === 'string' ? body.detail : `Request failed (HTTP ${response.status}).`
    throw new ApiError(response.status, detail, body?.errors ?? [])
  }
  return body as T
}

export const api = {
  settings: () => request<Settings>('/api/settings'),
  saveSettings: (values: Partial<Settings>) =>
    request<Settings>('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    }),
  search: (q: string) =>
    request<{ results: SearchResult[]; errors: SourceError[] }>(`/api/assets/search?q=${encodeURIComponent(q)}`),
  quote: (symbol: string, currency: Currency) =>
    request<QuoteReport>(`/api/assets/${encodeURIComponent(symbol)}/quote?currency=${currency}`),
  candles: (symbol: string, currency: Currency, range: RangeKey) =>
    request<CandleReport>(`/api/assets/${encodeURIComponent(symbol)}/candles?currency=${currency}&range=${range}`),
  exchangeStatus: () => request<{ exchanges: ExchangeStatus[] }>('/api/exchanges/status'),
}
