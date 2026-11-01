import React, { useEffect, useMemo, useRef } from 'react'
import { createChart, HistogramSeries, LineSeries } from 'lightweight-charts'

import { UP_COLOR, DOWN_COLOR, changeColor } from './chartUtils'

const fmtPct = (v) => (v === null || v === undefined ? '-' : `${v > 0 ? '+' : ''}${Number(v).toFixed(2)}%`)
// 月營收單位為千元
const fmtRevenue = (v) => (v === null || v === undefined ? '-' : (v / 1e5).toFixed(2))

const timeParts = (t) =>
  typeof t === 'string' ? { year: +t.slice(0, 4), month: +t.slice(5, 7) } : { year: t.year, month: t.month }

// 長條＋折線（右軸長條、左軸折線）
const BarLineChart = ({ bars, line, barFormatter, lineFormatter, timeFormatter, height = 240 }) => {
  const ref = useRef()

  useEffect(() => {
    const chart = createChart(ref.current, {
      autoSize: true,
      layout: { background: { color: 'transparent' }, textColor: '#4b5563', fontSize: 12 },
      grid: { vertLines: { visible: false }, horzLines: { color: '#f3f4f6' } },
      rightPriceScale: { borderColor: '#e5e7eb' },
      leftPriceScale: { visible: !!line, borderColor: '#e5e7eb' },
      timeScale: { borderColor: '#e5e7eb', tickMarkFormatter: timeFormatter, fixLeftEdge: true, fixRightEdge: true },
      localization: { locale: 'zh-TW', timeFormatter },
      handleScroll: false,
      handleScale: false,
    })
    chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'custom', formatter: barFormatter, minMove: 0.01 }, priceLineVisible: false,
    }).setData(bars)
    if (line) {
      chart.addSeries(LineSeries, {
        color: '#f59e0b', lineWidth: 2, priceScaleId: 'left', priceLineVisible: false,
        priceFormat: { type: 'custom', formatter: lineFormatter, minMove: 0.01 },
      }).setData(line)
    }
    chart.timeScale().fitContent()
    return () => chart.remove()
  }, [bars, line])

  return <div ref={ref} style={{ height }} className="w-full" />
}

export const RevenuePanel = ({ data }) => {
  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data])
  const recent = rows.slice(-36)

  const bars = useMemo(() => recent.map(r => ({
    time: r.month, value: r.revenue / 1e5, color: (r.yoy ?? 0) >= 0 ? UP_COLOR + 'aa' : DOWN_COLOR + 'aa',
  })), [rows])
  const line = useMemo(() => recent.filter(r => r.yoy != null).map(r => ({ time: r.month, value: +r.yoy })), [rows])

  if (rows.length === 0) return <Empty text="沒有月營收資料" />

  const timeFormatter = (t) => {
    const { year, month } = timeParts(t)
    return `${year}/${String(month).padStart(2, '0')}`
  }

  return (
    <div>
      <div className="mb-1 flex gap-4 text-xs text-gray-500">
        <span><span className="mr-1 inline-block h-2 w-3" style={{ background: UP_COLOR }} />營收（億，右軸；紅=年增、綠=年減）</span>
        <span><span className="mr-1 inline-block h-0.5 w-3 align-middle" style={{ background: '#f59e0b' }} />年增率（%，左軸）</span>
      </div>
      <BarLineChart bars={bars} line={line} barFormatter={v => v.toFixed(0)} lineFormatter={v => v.toFixed(0) + '%'} timeFormatter={timeFormatter} />
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-right text-sm tabular-nums">
          <thead className="border-b border-gray-200 text-gray-500">
            <tr>
              <th className="py-1.5 text-left font-medium">月份</th>
              <th className="font-medium">營收(億)</th>
              <th className="font-medium">月增率</th>
              <th className="font-medium">年增率</th>
              <th className="font-medium">累計營收(億)</th>
              <th className="font-medium">累計年增率</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(-12).reverse().map(r => (
              <tr key={r.month} className="border-b border-gray-100">
                <td className="py-1.5 text-left">{r.month.slice(0, 7)}</td>
                <td>{fmtRevenue(r.revenue)}</td>
                <td style={{ color: changeColor(r.mom) }}>{fmtPct(r.mom)}</td>
                <td style={{ color: changeColor(r.yoy) }} className="font-semibold">{fmtPct(r.yoy)}</td>
                <td>{fmtRevenue(r.ytdRevenue)}</td>
                <td style={{ color: changeColor(r.ytdYoy) }}>{fmtPct(r.ytdYoy)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const EpsPanel = ({ data }) => {
  const rows = useMemo(() => (Array.isArray(data) ? data.filter(r => r.eps != null) : []), [data])

  const bars = useMemo(() => rows.slice(-20).map(r => ({
    time: `${r.year}-${String(r.quarter * 3).padStart(2, '0')}-01`,
    value: +r.eps,
    color: changeColor(r.eps) + 'aa',
  })), [rows])

  // 年度 × 季 表格
  const years = useMemo(() => {
    const map = new Map()
    for (const r of rows) {
      map.has(r.year) || map.set(r.year, {})
      map.get(r.year)[r.quarter] = +r.eps
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]).slice(0, 8)
  }, [rows])

  if (rows.length === 0) return <Empty text="沒有EPS資料" />

  const timeFormatter = (t) => {
    const { year, month } = timeParts(t)
    return `${year}Q${Math.ceil(month / 3)}`
  }

  return (
    <div>
      <div className="mb-1 text-xs text-gray-500">單季EPS（元）</div>
      <BarLineChart bars={bars} barFormatter={v => v.toFixed(2)} timeFormatter={timeFormatter} height={220} />
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[480px] text-right text-sm tabular-nums">
          <thead className="border-b border-gray-200 text-gray-500">
            <tr>
              <th className="py-1.5 text-left font-medium">年度</th>
              {[1, 2, 3, 4].map(q => <th key={q} className="font-medium">Q{q}</th>)}
              <th className="font-medium">全年</th>
            </tr>
          </thead>
          <tbody>
            {years.map(([year, qs]) => {
              const vals = [1, 2, 3, 4].map(q => qs[q])
              const full = vals.every(v => v != null) ? vals.reduce((a, b) => a + b, 0) : null
              return (
                <tr key={year} className="border-b border-gray-100">
                  <td className="py-1.5 text-left">{year}</td>
                  {vals.map((v, i) => (
                    <td key={i} style={{ color: v < 0 ? DOWN_COLOR : undefined }}>{v != null ? v.toFixed(2) : '-'}</td>
                  ))}
                  <td className="font-semibold">{full != null ? full.toFixed(2) : '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const Empty = ({ text }) => <div className="py-8 text-center text-sm text-gray-400">{text}</div>
