// 族群分析共用：象限判斷、顏色、格式化

import { UP_COLOR, DOWN_COLOR, FLAT_COLOR, changeColor } from '@/components/content/stock/chartUtils'

export { changeColor }

// 橫軸：近 5 日法人淨買超；縱軸：資金動能（近 5 日日均 − 近 20 日日均）
export const QUADRANTS = [
  { key: 'rise', label: '漲潮', desc: '資金流入且加速', color: UP_COLOR, bg: '#fef2f2' },
  { key: 'rotate', label: '輪動', desc: '資金流入但放緩', color: '#f59e0b', bg: '#fffbeb' },
  { key: 'ebb', label: '退潮', desc: '資金流出且加速', color: DOWN_COLOR, bg: '#f0fdf4' },
  { key: 'watch', label: '觀望', desc: '資金流出但放緩', color: '#64748b', bg: '#f8fafc' },
]

export const quadrantOf = (item) => {
  if (item?.flow5 == null || item?.momentum == null) return null
  if (item.flow5 >= 0) return item.momentum >= 0 ? 'rise' : 'rotate'
  return item.momentum < 0 ? 'ebb' : 'watch'
}

export const quadrantInfo = (key) => QUADRANTS.find(q => q.key === key)

export const INST_TYPES = [
  { key: 'total', label: '三大法人' },
  { key: 'foreign', label: '外資' },
  { key: 'trust', label: '投信' },
  { key: 'dealer', label: '自營商' },
]

// 大跌日：加權跌超過 1%；族群下跌但法人當日淨買超大於近 20 日日均的 1.5 倍
export const CRASH_THRESHOLD = -1
export const isContrarianBuy = (item) =>
  item.pct1 < 0 && item.flow1 > 0 && item.flow1 > 1.5 * Math.max((item.flow20 ?? 0) / 20, 0)

// 金額（億）
export const fmtAmt = (v, digits = 2) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '-'
  const s = Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(digits)
  return v > 0 ? '+' + s : s
}

export const fmtPct = (v, digits = 2) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '-'
  return `${v > 0 ? '+' : ''}${v.toFixed(digits)}%`
}

export const fmtRatio = (n, total) => (total ? `${n ?? 0}/${total}` : '-')

export { UP_COLOR, DOWN_COLOR, FLAT_COLOR }
