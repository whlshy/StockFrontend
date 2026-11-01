import React, { useMemo, useState } from 'react'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Chip } from '@mui/material'

import { quadrantOf, quadrantInfo, changeColor, fmtAmt, fmtPct } from './groupUtils'

const pctCell = (v) => <span style={{ color: changeColor(v) }}>{fmtPct(v)}</span>
const amtCell = (v) => <span style={{ color: changeColor(v) }}>{fmtAmt(v)}</span>
const ratio = (n, total) => (total ? (n ?? 0) / total : null)
const ratioCell = (n, total) => (total ? `${n ?? 0}/${total}` : '-')

// groupOnly：只在子分類（非個股）列表顯示
const COLUMNS = [
  { key: 'quadrant', label: '象限', sort: it => ['rise', 'rotate', 'watch', 'ebb'].indexOf(quadrantOf(it)),
    render: it => { const q = quadrantInfo(quadrantOf(it)); return q ? <Chip label={q.label} size="small" sx={{ bgcolor: q.bg, color: q.color, fontWeight: 600 }} /> : '-' } },
  { key: 'pct1', label: '1日', sort: it => it.pct1, render: it => pctCell(it.pct1) },
  { key: 'pct5', label: '5日', sort: it => it.pct5, render: it => pctCell(it.pct5) },
  { key: 'pct20', label: '20日', sort: it => it.pct20, render: it => pctCell(it.pct20) },
  { key: 'flow1', label: '當日淨買超', unit: '億', sort: it => it.flow1, render: it => amtCell(it.flow1) },
  { key: 'flow5', label: '5日淨買超', unit: '億', sort: it => it.flow5, render: it => amtCell(it.flow5) },
  { key: 'momentum', label: '資金動能', unit: '億/日', sort: it => it.momentum, render: it => amtCell(it.momentum),
    title: '近5日日均淨買超 − 近20日日均淨買超，正值代表資金加速流入' },
  { key: 'buyLessRise', label: '買多漲少', sort: it => it.buyLessRise, render: it => it.buyLessRise?.toFixed(1) ?? '-',
    title: '近5日淨買超佔成交值比例(%) − 近5日漲幅(%)，越高代表法人買得多但股價還沒反應' },
  { key: 'nInstBuy', label: '法人買超家數', groupOnly: true, sort: it => ratio(it.nInstBuy, it.nStocks), render: it => ratioCell(it.nInstBuy, it.nStocks) },
  { key: 'nUp', label: '上漲家數', groupOnly: true, sort: it => ratio(it.nUp, it.nStocks), render: it => ratioCell(it.nUp, it.nStocks) },
  { key: 'nAboveMA20', label: '站上月線', groupOnly: true, sort: it => ratio(it.nAboveMA20, it.nStocks), render: it => ratioCell(it.nAboveMA20, it.nStocks) },
  { key: 'top', label: '買最多', groupOnly: true, sort: it => it.topFlow5,
    render: it => it.topName ? <span className="whitespace-nowrap">{it.topName} <span style={{ color: changeColor(it.topFlow5) }}>{fmtAmt(it.topFlow5)}</span></span> : '-' },
  { key: 'value20', label: '20日成交值', unit: '億', sort: it => it.value20, render: it => it.value20 != null ? it.value20.toFixed(0) : '-' },
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
    <TableContainer sx={{ maxHeight: 640 }}>
      <Table size="small" stickyHeader sx={{ '& td, & th': { whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>{isGroup ? '族群' : '個股'}</TableCell>
            {columns.map(c => (
              <TableCell key={c.key} align="right" sx={{ fontWeight: 'bold' }} title={c.title}>
                <TableSortLabel
                  active={sort.key === c.key}
                  direction={sort.key === c.key ? sort.dir : 'desc'}
                  onClick={() => toggleSort(c.key)}
                >
                  {c.label}{c.unit ? <span className="ml-0.5 text-xs font-normal text-gray-400">({c.unit})</span> : null}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(it => (
            <TableRow key={`${it.itemType}-${it.id}`} hover onClick={() => onSelect?.(it)} sx={{ cursor: 'pointer' }}>
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
  )
}

export default RankingTable
