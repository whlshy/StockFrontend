import React from 'react'

import { UP_COLOR, DOWN_COLOR, FLAT_COLOR } from '../stock/chartUtils'

// 市場寬度：研究結論顯示只能預示波動，不能預測方向，所以只呈現家數，不做多空判斷
const MarketBar = ({ m }) => {
  const total = m.up + m.down + m.flat
  const parts = [
    ['上漲', m.up, UP_COLOR],
    ['平盤', m.flat, FLAT_COLOR],
    ['下跌', m.down, DOWN_COLOR],
  ]
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-bold">{m.market}</span>
        <span className="text-xs text-gray-400">{total} 檔</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
        {parts.map(([label, n, color]) => (
          <div key={label} style={{ width: `${total ? (n / total) * 100 : 0}%`, background: color }} title={`${label} ${n}`} />
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm tabular-nums">
        <span style={{ color: UP_COLOR }}>上漲 {m.up}<span className="ml-1 text-xs">（漲停 {m.limitUp}）</span></span>
        <span style={{ color: FLAT_COLOR }}>平盤 {m.flat}</span>
        <span style={{ color: DOWN_COLOR }}>下跌 {m.down}<span className="ml-1 text-xs">（跌停 {m.limitDown}）</span></span>
      </div>
    </div>
  )
}

const Breadth = ({ data }) => {
  const markets = data?.markets || []
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-2">
        <span className="text-lg font-bold">市場寬度</span>
        <span className="text-xs text-gray-400">波動參考・只反映市場波動程度，不代表多空方向</span>
        <span className="ml-auto text-xs text-gray-400">{data?.date}・上市櫃普通股</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {markets.map(m => <MarketBar key={m.market} m={m} />)}
      </div>
    </div>
  )
}

export default Breadth
