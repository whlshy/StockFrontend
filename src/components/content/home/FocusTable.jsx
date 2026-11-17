import React, { useState } from 'react'
import { Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { changeColor, fmtPrice } from '../stock/chartUtils'
import { useOpenStock } from '../stock/stockModal'
import { fmtAmt, fmtPct } from '../group/groupUtils'
import Term from '@/components/elements/Term'
import StockTag from '@/components/elements/StockTag'
import Paging, { usePaging } from './Paging'

const TAB_KEY = 'homePage.focusTab'
const TABS = [
  { key: 'gainers', label: '漲幅' },
  { key: 'losers', label: '跌幅' },
  { key: 'value', label: '成交值' },
  { key: 'instBuy', label: '法人買超' },
  { key: 'instSell', label: '法人賣超' },
]

const loadTab = () => {
  try {
    const t = localStorage.getItem(TAB_KEY)
    return TABS.some(x => x.key === t) ? t : 'gainers'
  } catch {
    return 'gainers'
  }
}

const FocusTable = ({ data }) => {
  const [tab, setTab] = useState(loadTab)
  const openStock = useOpenStock()
  const rows = data?.[tab] || []
  const instNote = data?.instDate && data.instDate !== data.date ? `法人資料為 ${data.instDate}` : null

  const paging = usePaging(rows)

  const changeTab = (_, t) => {
    setTab(t)
    paging.reset()
    try { localStorage.setItem(TAB_KEY, t) } catch { /* 存不了就算了 */ }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-lg font-bold">今日焦點</span>
        <span className="ml-auto text-xs text-gray-400">
          {data?.date}・上市櫃普通股{instNote ? `・${instNote}` : ''}
        </span>
      </div>
      <Tabs value={tab} onChange={changeTab} variant="scrollable" allowScrollButtonsMobile sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {TABS.map(t => <Tab key={t.key} value={t.key} label={t.label} />)}
      </Tabs>
      <TableContainer>
        <Table size="small" sx={{ '& td, & th': { whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>個股</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>收盤</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>漲跌幅</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>成交值(億)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}><Term k="買賣超">法人(億)</Term></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>沒有資料</TableCell></TableRow>
            )}
            {paging.pageRows.map((r, i) => (
              <TableRow key={r.code} hover sx={{ cursor: 'pointer' }} onClick={() => openStock(r.code, rows)}>
                <TableCell sx={{ color: 'text.secondary' }}>{paging.offset + i + 1}</TableCell>
                <TableCell>
                  <span className="font-medium">{r.code} {r.name}</span>
                  <span className="ml-1 text-xs text-gray-400">{r.market}</span>
                  {r.limitUp && <StockTag name="漲停" sx={{ ml: 0.5 }} />}
                  {r.limitDown && <StockTag name="跌停" sx={{ ml: 0.5 }} />}
                  {r.exRight && <StockTag name="除權息" sx={{ ml: 0.5 }} />}
                </TableCell>
                <TableCell align="right" style={{ color: changeColor(r.pct) }}>{fmtPrice(r.close)}</TableCell>
                <TableCell align="right" style={{ color: changeColor(r.pct) }}>{fmtPct(r.pct)}</TableCell>
                <TableCell align="right">{r.value >= 100 ? r.value.toFixed(0) : r.value.toFixed(2)}</TableCell>
                <TableCell align="right" style={{ color: changeColor(r.inst) }}>{fmtAmt(r.inst)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Paging paging={paging} />
    </div>
  )
}

export default FocusTable
