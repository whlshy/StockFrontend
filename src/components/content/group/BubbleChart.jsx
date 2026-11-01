import React, { useMemo } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { ScatterChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent, MarkLineComponent, GraphicComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { LabelLayout } from 'echarts/features'

import { quadrantOf, quadrantInfo, QUADRANTS, fmtAmt, fmtPct } from './groupUtils'

echarts.use([ScatterChart, LineChart, GridComponent, TooltipComponent, DataZoomComponent, MarkLineComponent, GraphicComponent, CanvasRenderer, LabelLayout])

const GRID = { left: 64, right: 24, top: 28, bottom: 48 }
const MIN_SIZE = 10
const MAX_SIZE = 64

// 平方根刻度：大族群的金額常是小族群的好幾十倍，線性刻度會讓多數泡泡擠在原點附近
const sq = (v) => Math.sign(v) * Math.sqrt(Math.abs(v))
const unsq = (v) => Math.sign(v) * v * v
const fmtAxis = (v) => {
  const r = unsq(v)
  return Math.abs(r) >= 10 ? r.toFixed(0) : r.toFixed(1)
}

// 讓 0 落在正中間，四個象限一樣大；回放時傳入固定範圍，播放中畫面不會縮放跳動
const symmetric = (pad, fixed) => (fixed
  ? { min: -fixed * pad, max: fixed * pad }
  : {
    min: (v) => -Math.max(Math.abs(v.min), Math.abs(v.max)) * pad,
    max: (v) => Math.max(Math.abs(v.min), Math.abs(v.max)) * pad,
  })

// 回放用：算出整段期間的座標範圍（平方根刻度後）
export const historyExtent = (history) => {
  let x = 0, y = 0
  for (const r of history || []) {
    if (r.flow5 != null) x = Math.max(x, Math.abs(sq(r.flow5)))
    if (r.momentum != null) y = Math.max(y, Math.abs(sq(r.momentum)))
  }
  return { x: x || 1, y: y || 1 }
}

// frame：回放時當天的資料 Map(id → {flow5, momentum, value20, pct1})，會覆蓋 items 的位置
// highlight：被選取比較的 id（Set），其他泡泡變淡；trails：被選取項目的軌跡 Map(id → [{flow5, momentum}])
const BubbleChart = ({ items, onSelect, height = 520, frame, extent, highlight, trails, date }) => {
  const option = useMemo(() => {
    const merged = (items || [])
      .map(it => (frame ? (frame.has(it.id) ? { ...it, ...frame.get(it.id) } : null) : it))
      .filter(it => it && it.flow5 != null && it.momentum != null)
    // 泡泡大小以今天的規模為準，回放時大小不變，只看位置移動
    const maxValue = Math.max(...(items || []).map(r => r.value20 || 0), 1)
    const sizeOf = (id) => (items || []).find(x => x.id === id)?.value20 || 0
    // 規模大的先畫、小的後畫，避免小泡泡被蓋住；順序固定，回放時泡泡才會平滑移動
    const sorted = [...merged].sort((a, b) => sizeOf(b.id) - sizeOf(a.id) || a.id - b.id)
    const dimOthers = highlight && highlight.size > 0

    const data = sorted.map(it => {
      const q = quadrantInfo(quadrantOf(it))
      const dim = dimOthers && !highlight.has(it.id)
      return {
        id: String(it.id),
        value: [sq(it.flow5), sq(it.momentum), it.value20 || 0],
        name: it.name,
        item: it,
        symbolSize: MIN_SIZE + (MAX_SIZE - MIN_SIZE) * Math.sqrt(sizeOf(it.id) / maxValue),
        itemStyle: { color: q?.color, opacity: dim ? 0.12 : 0.65, borderColor: '#fff', borderWidth: 1 },
        label: dim ? { show: false } : undefined,
      }
    })

    const trailSeries = [...(trails || new Map()).entries()].map(([id, pts]) => {
      const it = merged.find(x => x.id === id)
      const q = quadrantInfo(quadrantOf(it))
      return {
        type: 'line', id: `trail-${id}`, silent: true, z: 1,
        data: pts.filter(p => p.flow5 != null && p.momentum != null).map(p => [sq(p.flow5), sq(p.momentum)]),
        symbol: 'circle', symbolSize: 4, showSymbol: true,
        lineStyle: { color: q?.color || '#64748b', width: 1.5, opacity: 0.7 },
        itemStyle: { color: q?.color || '#64748b', opacity: 0.6 },
        animation: false,
      }
    })

    const corner = (text, color, pos) => ({
      type: 'text', ...pos, z: 0, silent: true,
      style: { text, fill: color, opacity: 0.35, font: 'bold 22px sans-serif' },
    })

    return {
      animationDuration: 300,
      animationDurationUpdate: frame ? 450 : 300,
      grid: GRID,
      graphic: [
        corner(QUADRANTS[3].label, QUADRANTS[3].color, { left: GRID.left + 12, top: GRID.top + 8 }),
        corner(QUADRANTS[0].label, QUADRANTS[0].color, { right: GRID.right + 12, top: GRID.top + 8 }),
        corner(QUADRANTS[2].label, QUADRANTS[2].color, { left: GRID.left + 12, bottom: GRID.bottom + 8 }),
        corner(QUADRANTS[1].label, QUADRANTS[1].color, { right: GRID.right + 12, bottom: GRID.bottom + 8 }),
      ],
      xAxis: {
        type: 'value', name: '近5日法人淨買超（億，平方根刻度）', nameLocation: 'middle', nameGap: 30,
        ...symmetric(1.1, extent?.x),
        axisLabel: { formatter: fmtAxis },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      yAxis: {
        type: 'value', name: '資金動能（億/日，平方根刻度）', nameLocation: 'middle', nameGap: 48,
        ...symmetric(1.15, extent?.y),
        axisLabel: { formatter: fmtAxis },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
        { type: 'inside', yAxisIndex: 0, filterMode: 'none' },
      ],
      tooltip: {
        trigger: 'item',
        confine: true,
        formatter: (p) => {
          const it = p.data.item
          const q = quadrantInfo(quadrantOf(it))
          const lines = [
            `<b>${it.code ? it.code + ' ' : ''}${it.name}</b> <span style="color:${q?.color}">${q?.label ?? ''}</span>`,
            ...(date ? [`日期：${date}`] : []),
            `近5日淨買超：${fmtAmt(it.flow5)} 億`,
            `資金動能：${fmtAmt(it.momentum)} 億/日`,
            `近20日成交值：${(it.value20 ?? 0).toFixed(0)} 億`,
            date ? `當日漲跌：${fmtPct(it.pct1)}` : `漲跌：1日 ${fmtPct(it.pct1)}　5日 ${fmtPct(it.pct5)}`,
          ]
          if (it.itemType === 'group' && !date) {
            lines.push(`法人買超家數：${it.nInstBuy ?? 0}/${it.nStocks}`)
            if (it.topName) lines.push(`買最多：${it.topCode} ${it.topName}（${fmtAmt(it.topFlow5)} 億）`)
          }
          return lines.join('<br/>')
        },
      },
      series: [...trailSeries, {
        type: 'scatter',
        id: 'bubbles',
        data,
        label: {
          show: true, position: 'inside', formatter: p => p.data.name,
          fontSize: 11, color: '#1f2937', textBorderColor: '#fff', textBorderWidth: 2,
        },
        labelLayout: { hideOverlap: true },
        emphasis: { focus: 'self', itemStyle: { opacity: 0.95 }, label: { fontWeight: 'bold' } },
        markLine: {
          silent: true, symbol: 'none', label: { show: false },
          lineStyle: { color: '#94a3b8', type: 'solid', width: 1 },
          data: [{ xAxis: 0 }, { yAxis: 0 }],
        },
      }],
    }
  }, [items, frame, extent, highlight, trails, date])

  const onEvents = useMemo(() => ({
    click: (p) => p.data?.item && onSelect?.(p.data.item),
  }), [onSelect])

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      notMerge={!frame}
      replaceMerge={frame ? ['series'] : undefined}
      style={{ height, width: '100%' }}
      onEvents={onEvents}
    />
  )
}

export default BubbleChart
