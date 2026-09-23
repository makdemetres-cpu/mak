import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  createChart,
  TickMarkType,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts'
import { useEffect, useRef } from 'react'
import type { Candle, Currency } from '../api'
import { money } from '../format'
import { usePrefs } from '../prefs'

export type ChartStyle = 'line' | 'candles'

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

function tickLabel(time: Time, type: TickMarkType): string {
  const d = new Date((time as number) * 1000)
  switch (type) {
    case TickMarkType.Year:
      return d.toLocaleDateString(undefined, { year: 'numeric' })
    case TickMarkType.Month:
      return d.toLocaleDateString(undefined, { month: 'short' })
    case TickMarkType.DayOfMonth:
      return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    default:
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }
}

export function PriceChart({
  candles,
  currency,
  style,
  intervalSeconds,
}: {
  candles: Candle[]
  currency: Currency
  style: ChartStyle
  intervalSeconds: number | null
}) {
  const box = useRef<HTMLDivElement>(null)
  const { theme } = usePrefs()

  useEffect(() => {
    if (!box.current) return
    const text2 = cssVar('--text-2')
    const border = cssVar('--border')
    const accent = cssVar('--accent')
    const gain = cssVar('--gain')
    const loss = cssVar('--loss')
    const daily = (intervalSeconds ?? 0) >= 86400

    const chart = createChart(box.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: text2,
        fontFamily: cssVar('--font'),
        fontSize: 12,
      },
      grid: { vertLines: { visible: false }, horzLines: { color: border } },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: false,
        timeVisible: !daily,
        secondsVisible: false,
        tickMarkFormatter: tickLabel,
      },
      localization: {
        priceFormatter: (p: number) => money(p, currency),
        timeFormatter: (t: Time) => {
          const d = new Date((t as number) * 1000)
          return daily
            ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
            : d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        },
      },
      handleScroll: false,
      handleScale: false,
    })

    if (style === 'candles') {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: gain,
        downColor: loss,
        borderUpColor: gain,
        borderDownColor: loss,
        wickUpColor: gain,
        wickDownColor: loss,
        priceLineVisible: false,
      })
      series.setData(
        candles.map((c) => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close })),
      )
    } else {
      const series = chart.addSeries(AreaSeries, {
        lineColor: accent,
        lineWidth: 2,
        topColor: withAlpha(accent, 0.12),
        bottomColor: withAlpha(accent, 0.12),
        priceLineVisible: false,
      })
      series.setData(candles.map((c) => ({ time: c.time as UTCTimestamp, value: c.close })))
    }
    chart.timeScale().fitContent()

    return () => {
      chart.remove()
    }
  }, [candles, currency, style, intervalSeconds, theme])

  return <div ref={box} className="chart-box" />
}
