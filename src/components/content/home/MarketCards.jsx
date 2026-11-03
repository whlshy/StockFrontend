import React, { useMemo } from 'react'
import { Card, CardActionArea, CardContent } from '@mui/material'
import { Link } from 'react-router-dom'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

import { changeColor, fmtPrice } from '../stock/chartUtils'
import { fmtAmt, fmtPct } from '../group/groupUtils'
import Term from '@/components/elements/Term'

echarts.use([LineChart, GridComponent, CanvasRenderer])

const INDEX_INFO = {
  POW00: { name: '加權指數', market: '上市' },
  OTC00: { name: '櫃買指數', market: '上櫃' },
}

const INST = [
  ['foreign', '外資'],
  ['trust', '投信'],
  ['dealer', '自營商'],
  ['total', '合計'],
]

// 近 60 日收盤小走勢，顏色依區間漲跌
const Sparkline = ({ series }) => {
  const option = useMemo(() => {
    const closes = series.map(s => s.close)
    const color = changeColor(closes.at(-1) - closes[0])
    return {
      animation: false,
      grid: { left: 0, right: 0, top: 4, bottom: 4 },
      xAxis: { type: 'category', show: false, data: series.map(s => s.time) },
      yAxis: { type: 'value', show: false, scale: true },
      series: [{
        type: 'line', data: closes, symbol: 'none', lineStyle: { width: 1.5, color },
        areaStyle: { color, opacity: 0.08 },
      }],
    }
  }, [series])
  return <ReactEChartsCore echarts={echarts} option={option} style={{ height: 56, width: '100%' }} />
}

const IndexCard = ({ index, inst }) => {
  const info = INDEX_INFO[index.code] || { name: index.name }
  const series = index.series || []
  const last = series.at(-1)
  const prev = series.at(-2)
  const diff = last && prev ? last.close - prev.close : null
  const pct = diff != null && prev.close ? (diff / prev.close) * 100 : null
  const color = changeColor(diff)

  return (
    <Card variant="outlined">
      <CardActionArea component={Link} to={`/stock/${index.code}`} className="reset-link">
        <CardContent sx={{ pb: 1 }}>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold">{info.name}</span>
            <span className="text-xs text-gray-400">{last?.time} 收盤</span>
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 tabular-nums">
            <span className="text-3xl font-bold" style={{ color }}>{last ? last.close.toLocaleString('zh-TW', { maximumFractionDigits: 2 }) : '-'}</span>
            {diff != null && (
              <span className="font-semibold" style={{ color }}>
                {diff > 0 ? '▲' : diff < 0 ? '▼' : ''}{fmtPrice(Math.abs(diff))}（{fmtPct(pct)}）
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500 tabular-nums">
            成交值 {last?.value != null ? `${last.value.toFixed(0)} 億` : '-'}
            {prev?.value ? <span className="ml-2 text-gray-400">昨 {prev.value.toFixed(0)} 億</span> : null}
          </div>
          {series.length > 1 && <Sparkline series={series} />}
        </CardContent>
      </CardActionArea>
      <div className="border-t border-gray-100 px-4 py-2 text-sm tabular-nums">
        <div className="mb-1 text-xs text-gray-400">
          <Term k="買賣超">三大法人買賣超</Term>（{info.market}，億）{inst?.date && inst.date !== last?.time ? `・${inst.date}` : ''}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {INST.map(([key, label]) => (
            <div key={key} className="flex flex-col">
              <span className="text-xs text-gray-500"><Term k={key === 'total' ? '三大法人' : label}>{label}</Term></span>
              <span className={key === 'total' ? 'font-bold' : 'font-medium'} style={{ color: changeColor(inst?.[key]) }}>
                {fmtAmt(inst?.[key])}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

const MarketCards = ({ data }) => {
  const indexes = data?.indexes || []
  const instByMarket = Object.fromEntries((data?.institution || []).map(r => [r.market, r]))
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {indexes.map(index => (
        <IndexCard key={index.code} index={index} inst={instByMarket[INDEX_INFO[index.code]?.market]} />
      ))}
    </div>
  )
}

export default MarketCards
