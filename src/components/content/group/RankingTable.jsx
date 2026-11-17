import React, { useMemo, useState } from 'react'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Chip } from '@mui/material'

import Term from '@/components/elements/Term'
import StockTag from '@/components/elements/StockTag'
import { quadrantOf, quadrantInfo, changeColor, fmtAmt, fmtPct, isConcentrated, breadthColor } from './groupUtils'

const pctCell = (v) => <span style={{ color: changeColor(v) }}>{fmtPct(v)}</span>
const amtCell = (v) => <span style={{ color: changeColor(v) }}>{fmtAmt(v)}</span>
const ratio = (n, total) => (total ? (n ?? 0) / total : null)
const ratioCell = (n, total) => (total ? `${n ?? 0}/${total}` : '-')

// 齊漲度：當日、5 日上漲家數比例，各一條小橫條
const BreadthBar = ({ label, n, total }) => {
  const r = ratio(n, total)
  return (
    <div className="flex items-center justify-end gap-1 text-xs leading-4" title={`${label}上漲 ${n ?? 0}/${total} 檔`}>
      <span className="text-gray-400">{label}</span>
      <span className="inline-block h-1.5 w-12 overflow-hidden rounded-full bg-gray-100">
        <span className="block h-full" style={{ width: `${(r ?? 0) * 100}%`, background: breadthColor(r) }} />
      </span>
      <span className="w-8 text-right" style={{ color: breadthColor(r) }}>{r == null ? '-' : `${Math.round(r * 100)}%`}</span>
    </div>
  )
}

// 個股層：由成分股算出這個族群本身的齊漲度、中位數、領漲股（和上一層族群排行的算法一致）
export const summarizeStocks = (items) => {
  const stocks = (items || []).filter(it => it.itemType === 'stock' && it.pct1 != null)
  if (!stocks.length) return null
  const sorted = stocks.map(it => it.pct1).sort((a, b) => a - b)
  const mid = sorted.length / 2
  const top = stocks.reduce((a, b) => (b.pct1 > a.pct1 ? b : a))
  return {
    itemType: 'group',
    nStocks: stocks.length,
    nUp: stocks.filter(it => it.pct1 > 0).length,
    nUp5: stocks.filter(it => it.pct5 > 0).length,
    pct1: sorted.reduce((a, b) => a + b, 0) / sorted.length,
    pct1Median: sorted.length % 2 ? sorted[Math.floor(mid)] : (sorted[mid - 1] + sorted[mid]) / 2,
    topUpCode: top.code, topUpName: top.name, topUpPct: top.pct1,
  }
}

const StockSummary = ({ items }) => {
  const g = useMemo(() => summarizeStocks(items), [items])
  if (!g) return null
  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1 rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm tabular-nums">
      <span className="font-semibold text-gray-700"><Term k="齊漲度" /></span>
      <div className="flex flex-col gap-0.5">
        <BreadthBar label="當日" n={g.nUp} total={g.nStocks} />
        <BreadthBar label="5日" n={g.nUp5} total={g.nStocks} />
      </div>
      <span className="text-xs text-gray-500">上漲 {g.nUp}/{g.nStocks} 檔</span>
      <span>平均 {pctCell(g.pct1)}</span>
      <span className="inline-flex items-center gap-1">
        <Term k="中位數" /> {pctCell(g.pct1Median)}
        {isConcentrated(g) && <StockTag name="集中" />}
      </span>
      <span><Term k="領漲" /> {g.topUpCode} {g.topUpName} {pctCell(g.topUpPct)}</span>
    </div>
  )
}

// groupOnly：只在子分類（非個股）列表顯示
const COLUMNS = [
  { key: 'quadrant', label: '象限', term: '象限', sort: it => ['rise', 'rotate', 'watch', 'ebb'].indexOf(quadrantOf(it)),
    render: it => { const q = quadrantInfo(quadrantOf(it)); return q ? <Chip label={q.label} size="small" sx={{ bgcolor: q.bg, color: q.color, fontWeight: 600 }} /> : '-' } },
  { key: 'pct1', label: '1日', groupTerm: '族群漲幅', sort: it => it.pct1, render: it => pctCell(it.pct1) },
  { key: 'pct1Median', label: '中位數', groupOnly: true, sort: it => it.pct1Median,
    term: '中位數',
    render: it => (
      <span className="inline-flex items-center gap-1">
        {isConcentrated(it) && <StockTag name="集中" />}
        {pctCell(it.pct1Median)}
      </span>
    ) },
  { key: 'breadth', label: '齊漲度', groupOnly: true, sort: it => ratio(it.nUp, it.nStocks),
    term: '齊漲度',
    render: it => (
      <div className="flex flex-col gap-0.5">
        <BreadthBar label="當日" n={it.nUp} total={it.nStocks} />
        <BreadthBar label="5日" n={it.nUp5} total={it.nStocks} />
      </div>
    ) },
  { key: 'topUp', label: '領漲', term: '領漲', groupOnly: true, sort: it => it.topUpPct,
    render: it => it.topUpName ? <span className="whitespace-nowrap">{it.topUpCode} {it.topUpName} {pctCell(it.topUpPct)}</span> : '-' },
  { key: 'pct5', label: '5日', groupTerm: '族群漲幅', sort: it => it.pct5, render: it => pctCell(it.pct5) },
  { key: 'pct20', label: '20日', groupTerm: '族群漲幅', sort: it => it.pct20, render: it => pctCell(it.pct20) },
  { key: 'flow1', label: '當日淨買超', term: '淨買超', unit: '億', sort: it => it.flow1, render: it => amtCell(it.flow1) },
  { key: 'flow5', label: '5日淨買超', term: '淨買超', unit: '億', sort: it => it.flow5, render: it => amtCell(it.flow5) },
  { key: 'momentum', label: '資金動能', unit: '億/日', sort: it => it.momentum, render: it => amtCell(it.momentum),
    term: '資金動能' },
  { key: 'buyLessRise', label: '買多漲少', sort: it => it.buyLessRise, render: it => it.buyLessRise?.toFixed(1) ?? '-',
    term: '買多漲少' },
  { key: 'nInstBuy', label: '法人買超家數', term: '法人買超家數', groupOnly: true, sort: it => ratio(it.nInstBuy, it.nStocks), render: it => ratioCell(it.nInstBuy, it.nStocks) },
  { key: 'nAboveMA20', label: '站上月線', term: '站上月線', groupOnly: true, sort: it => ratio(it.nAboveMA20, it.nStocks), render: it => ratioCell(it.nAboveMA20, it.nStocks) },
  { key: 'top', label: '買最多', term: '買最多', groupOnly: true, sort: it => it.topFlow5,
    render: it => it.topName ? <span className="whitespace-nowrap">{it.topName} <span style={{ color: changeColor(it.topFlow5) }}>{fmtAmt(it.topFlow5)}</span></span> : '-' },
  { key: 'value20', label: '20日成交值', term: '20日成交值', unit: '億', sort: it => it.value20, render: it => it.value20 != null ? it.value20.toFixed(0) : '-' },
]

const RankingTable = ({ items, onSelect, defaultSort = 'flow5' }) => {
  const [sort, setSort] = useState({ key: defaultSort, dir: 'desc' })
  const isGroup = (items || []).some(it => it.itemType === 'group')
  const columns = COLUMNS.filter(c => isGroup || !c.groupOnly)

  const rows = useMemo(() => {
    const col = COLUMNS.find(c => c.key === sort.key)
    const list = [...(items || [])]
    if (!col) return list
    return list.sort((a, b) => {
      const va = col.sort(a), vb = col.sort(b)
      // 沒有資料的永遠排最後
      if (va == null || Number.isNaN(va)) return 1
      if (vb == null || Number.isNaN(vb)) return -1
      return sort.dir === 'desc' ? vb - va : va - vb
    })
  }, [items, sort])

  const toggleSort = (key) =>
    setSort(s => (s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }))

  return (
    <>
      {!isGroup && <StockSummary items={items} />}
      <TableContainer sx={{ maxHeight: 640 }}>
        <Table size="small" stickyHeader sx={{ '& td, & th': { whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>{isGroup ? '族群' : '個股'}</TableCell>
              {columns.map(c => (
                <TableCell key={c.key} align="right" sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={sort.key === c.key}
                    direction={sort.key === c.key ? sort.dir : 'desc'}
                    onClick={() => toggleSort(c.key)}
                  >
                    <Term k={c.term ?? (isGroup ? c.groupTerm : undefined)}>{c.label}</Term>{c.unit ? <span className="ml-0.5 text-xs font-normal text-gray-400">({c.unit})</span> : null}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(it => (
              <TableRow key={`${it.itemType}-${it.id}`} hover onClick={() => onSelect?.(it, rows)} sx={{ cursor: 'pointer' }}>
                <TableCell>
                  <span className="font-medium text-blue-700">
                    {it.code ? `${it.code} ` : ''}{it.name}
                  </span>
                  {it.itemType === 'group' && (
                    <span className="ml-1 text-xs text-gray-400">{it.nStocks}檔{it.hasChildren ? ' ›' : ''}</span>
                  )}
                </TableCell>
                {columns.map(c => (
                  <TableCell key={c.key} align="right">{c.render(it)}</TableCell>
                ))}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={columns.length + 1} align="center">沒有資料</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

export default RankingTable
