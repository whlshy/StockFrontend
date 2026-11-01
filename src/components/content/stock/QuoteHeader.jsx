import React, { useMemo } from 'react'
import { Chip } from '@mui/material'

import { changeColor, day, fmtPrice, fmtValue, fmtLots } from './chartUtils'

// 個股頂部報價區
const QuoteHeader = ({ info, candles, eps, events }) => {
  const {
    Name, Code, Industry, Market, Date, ClosingPrice, OpeningPrice, HighestPrice, LowestPrice,
    TradeVolume, TradeValue, PE, 殖利率, 股價淨值比, Change, LastPB, LastPBClose, LastPBDate,
  } = info || {}
  const date = day(Date)

  const stats = useMemo(() => {
    if (!date) return { prevClose: null, high52: null, low52: null }
    const rows = Array.isArray(candles)
      ? candles.map(c => ({ time: day(c.time), close: Number(c.close), high: Number(c.high), low: Number(c.low) }))
        .sort((a, b) => (a.time < b.time ? -1 : 1))
      : []
    // 取 date 之前最近一個交易日的收盤價（DayInfo.Change 約一半是 NULL）
    const prev = rows.filter(r => r.time < date).pop()
    const yearAgo = new globalThis.Date(date + 'T00:00:00Z')
    yearAgo.setUTCFullYear(yearAgo.getUTCFullYear() - 1)
    const from = yearAgo.toISOString().slice(0, 10)
    const year = rows.filter(r => r.time > from && r.time <= date)
    return {
      prevClose: prev?.close ?? (ClosingPrice != null && Change != null ? ClosingPrice - Change : null),
      high52: year.length ? Math.max(...year.map(r => r.high)) : null,
      low52: year.length ? Math.min(...year.map(r => r.low)) : null,
    }
  }, [candles, date, ClosingPrice, Change])

  const eps4q = useMemo(() => {
    const list = Array.isArray(eps) ? eps.filter(r => r.eps != null) : []
    if (list.length < 4) return null
    const last4 = list.slice(-4)
    return { sum: last4.reduce((a, r) => a + Number(r.eps), 0), label: `${last4[3].year}Q${last4[3].quarter}` }
  }, [eps])

  // 近12個月現金股利（除息日在收盤日前一年內）
  const cash12m = useMemo(() => {
    if (!Array.isArray(events) || !date) return null
    const from = new globalThis.Date(date + 'T00:00:00Z')
    from.setUTCFullYear(from.getUTCFullYear() - 1)
    const f = from.toISOString().slice(0, 10)
    const list = events.filter(e => e.type === 'dividend' && e.cash > 0 && day(e.time) > f && day(e.time) <= date)
    return list.length ? list.reduce((a, e) => a + Number(e.cash), 0) : 0
  }, [events, date])

  if (!info) return null

  // DayInfo 的 PE/殖利率/淨值比 可能停更，缺值時自行推算
  const pe = PE || (eps4q?.sum > 0 && ClosingPrice ? ClosingPrice / eps4q.sum : null)
  const yieldPct = 殖利率 ?? (cash12m != null && ClosingPrice ? (cash12m / ClosingPrice) * 100 : null)
  const pb = 股價淨值比 || (LastPB && LastPBClose && ClosingPrice ? LastPB * (ClosingPrice / LastPBClose) : null)
  const pbNote = !股價淨值比 && pb && LastPBDate ? `以 ${day(LastPBDate)} 的淨值推算` : undefined

  const diff = stats.prevClose != null && ClosingPrice != null ? ClosingPrice - stats.prevClose : null
  const pct = diff != null && stats.prevClose ? (diff / stats.prevClose) * 100 : null
  const color = changeColor(diff)

  const items = [
    ['開盤', fmtPrice(OpeningPrice), changeColor(OpeningPrice - stats.prevClose)],
    ['最高', fmtPrice(HighestPrice), changeColor(HighestPrice - stats.prevClose)],
    ['最低', fmtPrice(LowestPrice), changeColor(LowestPrice - stats.prevClose)],
    ['昨收', fmtPrice(stats.prevClose)],
    ['成交量(張)', TradeVolume != null ? fmtLots(TradeVolume / 1000) : '-'],
    ['成交值', TradeValue != null ? fmtValue(TradeValue / 1000) : '-'],
    ['52週最高', fmtPrice(stats.high52)],
    ['52週最低', fmtPrice(stats.low52)],
    ['本益比', pe ? pe.toFixed(2) : '-', undefined, PE ? undefined : '收盤價 ÷ 近四季EPS'],
    ['近四季EPS', eps4q ? eps4q.sum.toFixed(2) : '-', undefined, eps4q ? `統計至 ${eps4q.label}` : undefined],
    ['殖利率', yieldPct != null ? `${yieldPct.toFixed(2)}%` : '-', undefined, 殖利率 != null ? undefined : '近12個月現金股利 ÷ 收盤價'],
    ['股價淨值比', pb ? pb.toFixed(2) : '-', undefined, pbNote],
    ['近12月股利', cash12m != null ? fmtPrice(cash12m) : '-'],
  ]

  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="text-3xl font-bold">
          <span>{Code}</span>&ensp;<span>{Name}</span>
        </h3>
        <div className="flex gap-2">
          {!!Market && <Chip label={Market} color="primary" size="small" />}
          {!!Industry && <Chip label={Industry} color="success" size="small" />}
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-end gap-x-3 tabular-nums">
        <span className="text-4xl font-bold" style={{ color }}>{fmtPrice(ClosingPrice)}</span>
        {diff != null && (
          <span className="pb-1 text-lg font-semibold" style={{ color }}>
            {diff > 0 ? '▲' : diff < 0 ? '▼' : ''}{fmtPrice(Math.abs(diff))}（{diff > 0 ? '+' : ''}{pct.toFixed(2)}%）
          </span>
        )}
        <span className="pb-1.5 text-sm text-gray-400">{date} 收盤</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 rounded-lg bg-gray-50 px-3 py-2 text-sm tabular-nums sm:grid-cols-4 lg:grid-cols-7">
        {items.map(([label, value, c, hint]) => (
          <div key={label} className="flex justify-between gap-2" title={hint}>
            <span className="text-gray-500">{label}</span>
            <span className="font-medium" style={{ color: c }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default QuoteHeader
