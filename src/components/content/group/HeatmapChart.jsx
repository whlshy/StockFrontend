import React, { useMemo } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { TreemapChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

import { fmtAmt, fmtPct, isConcentrated } from './groupUtils'

echarts.use([TreemapChart, TooltipComponent, CanvasRenderer])

// 顏色依據；cap：到這個數值就是最深色，超過也一樣深，避免單一極端值讓其他格子都變淡
// 淨買超沒有固定尺度，cap 取各格絕對值的第 90 百分位；深淺用平方根曲線，小漲小跌也看得出顏色
export const HEAT_METRICS = [
  { key: 'pct1', label: '1日', cap: 3, fmt: v => fmtPct(v) },
  { key: 'pct5', label: '5日', cap: 8, fmt: v => fmtPct(v) },
  { key: 'pct20', label: '20日', cap: 15, fmt: v => fmtPct(v) },
  { key: 'flow1', label: '當日淨買超', fmt: v => `${fmtAmt(v)}億` },
  { key: 'flow5', label: '5日淨買超', fmt: v => `${fmtAmt(v)}億` },
]

const NEUTRAL = [229, 231, 235]
const UP = [220, 38, 38]
const DOWN = [21, 128, 61]

// 格子空間有限，名稱拿掉來源前綴（上市-、TPEX- 等）
const shortName = (name) => String(name ?? '').replace(/^(上市|上櫃|興櫃|TPEX)-/, '')

const mix = (to, t) => `rgb(${NEUTRAL.map((c, i) => Math.round(c + (to[i] - c) * t)).join(',')})`

const percentileCap = (values) => {
  const abs = values.filter(v => v != null).map(Math.abs).sort((a, b) => a - b)
  if (!abs.length) return 1
  return abs[Math.min(abs.length - 1, Math.floor(abs.length * 0.9))] || abs[abs.length - 1] || 1
}

// 格子大小：近 20 日成交值；顏色：紅漲綠跌（淨買超為紅買綠賣）
const HeatmapChart = ({ items, metric = 'pct1', onSelect, height = 480 }) => {
  const m = HEAT_METRICS.find(x => x.key === metric) || HEAT_METRICS[0]

  const { option, order } = useMemo(() => {
    const list = (items || []).filter(it => it.value20 > 0)
    const cap = m.cap ?? percentileCap(list.map(it => it[m.key]))
    // 由大到小，和 treemap 的排列一致，方向鍵切換股票時依這個順序
    const sorted = [...list].sort((a, b) => b.value20 - a.value20)

    const data = sorted.map(it => {
      const v = it[m.key]
      const t = v == null ? 0 : Math.sqrt(Math.min(Math.abs(v) / cap, 1))
      return {
        name: it.code ? `${it.code} ${it.name}` : shortName(it.name),
        value: it.value20,
        item: it,
        itemStyle: { color: v == null ? mix(UP, 0) : mix(v >= 0 ? UP : DOWN, t) },
        label: { color: t > 0.6 ? '#fff' : '#1f2937' },
      }
    })

    return {
      order: sorted,
      option: {
        tooltip: {
          confine: true,
          formatter: (p) => {
            const it = p.data?.item
            if (!it) return ''
            const lines = [
              `<b>${it.code ? it.code + ' ' : ''}${it.name}</b>`,
              `漲跌：1日 ${fmtPct(it.pct1)}　5日 ${fmtPct(it.pct5)}　20日 ${fmtPct(it.pct20)}`,
              `淨買超：當日 ${fmtAmt(it.flow1)} 億　5日 ${fmtAmt(it.flow5)} 億`,
              `近20日成交值：${(it.value20 ?? 0).toFixed(0)} 億`,
            ]
            if (it.itemType === 'group') {
              const pctOf = (n) => (it.nStocks ? `${Math.round((n ?? 0) * 100 / it.nStocks)}%` : '-')
              lines.push(`齊漲度：當日 ${pctOf(it.nUp)}（${it.nUp ?? 0}/${it.nStocks}）　5日 ${pctOf(it.nUp5)}`)
              lines.push(`漲幅中位數：${fmtPct(it.pct1Median)}${isConcentrated(it) ? '　<b style="color:#c2410c">漲勢集中</b>' : ''}`)
              if (it.topUpName) lines.push(`領漲：${it.topUpCode} ${it.topUpName} ${fmtPct(it.topUpPct)}`)
            }
            return lines.join('<br/>')
          },
        },
        series: [{
          type: 'treemap',
          data,
          width: '100%', height: '100%', top: 0, left: 0,
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          squareRatio: 0.5 * (1 + Math.sqrt(5)),
          itemStyle: { borderColor: '#fff', borderWidth: 2, gapWidth: 2 },
          label: {
            show: true,
            position: 'inside',
            align: 'center',
            verticalAlign: 'middle',
            overflow: 'truncate',
            // 用純文字：rich text 在 treemap 會固定貼齊格子頂端，純文字才會垂直置中
            formatter: (p) => `${p.name}\n${m.fmt(p.data.item[m.key])}`,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 17,
          },
          emphasis: { itemStyle: { borderColor: '#334155' } },
          animationDurationUpdate: 300,
        }],
      },
    }
  }, [items, m])

  const onEvents = useMemo(() => ({
    click: (p) => p.data?.item && onSelect?.(p.data.item, order),
  }), [onSelect, order])

  if (!order.length) return <div className="py-8 text-center text-gray-400">沒有成交值資料</div>

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      notMerge
      style={{ height, width: '100%' }}
      onEvents={onEvents}
    />
  )
}

export default HeatmapChart
