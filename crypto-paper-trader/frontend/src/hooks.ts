import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from './api'

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

interface Loaded<T> {
  data: T | null
  error: ApiError | null
  loading: boolean
  reload: () => void
}

/** Fetches on mount and whenever `key` changes; refreshes every `refreshMs` while the tab is visible. */
export function useApi<T>(key: string, load: () => Promise<T>, refreshMs?: number): Loaded<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(true)
  const loadRef = useRef(load)
  loadRef.current = load
  const request = useRef(0)

  const run = useCallback(() => {
    const id = ++request.current
    setLoading(true)
    loadRef
      .current()
      .then((result) => {
        if (id !== request.current) return
        setData(result)
        setError(null)
      })
      .catch((err: unknown) => {
        if (id !== request.current) return
        setError(err instanceof ApiError ? err : new ApiError(0, String(err)))
      })
      .finally(() => {
        if (id === request.current) setLoading(false)
      })
  }, [])

  useEffect(() => {
    setData(null)
    setError(null)
    run()
  }, [key, run])

  useEffect(() => {
    if (!refreshMs) return
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') run()
    }, refreshMs)
    return () => window.clearInterval(id)
  }, [key, refreshMs, run])

  return { data, error, loading, reload: run }
}
