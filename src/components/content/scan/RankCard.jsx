import React, { useState } from 'react'
import { Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material'
import { useOpenStock } from '../stock/stockModal'
import Term from '@/components/elements/Term'
import Paging, { usePaging } from '../home/Paging'

const loadTab = (key, tabs) => {
  try {
    const t = localStorage.getItem(key)
    return tabs.some(x => x.key === t) ? t : tabs[0].key
  } catch {
    return tabs[0].key
  }
}

const Tag = ({ label, color }) => (
  <Chip label={label} size="small" sx={{ ml: 0.5, height: 18, fontSize: 11, bgcolor: color, color: '#fff' }} />
)

const head = { fontWeight: 'bold' }

// 盤後掃描共用的排行卡片：分頁籤＋表格＋分頁，點列開個股彈跳視窗
// tabs：[{ key, label, note }]；columns(tab)：[{ label, term, tip, render(r) }]，第一欄固定是名次與個股
const RankCard = ({ title, tabs, storageKey, data, columns, right, extra }) => {
  const [tab, setTab] = useState(() => loadTab(storageKey, tabs))
  const openStock = useOpenStock()
  const def = tabs.find(t => t.key === tab) || tabs[0]
  const rows = data?.[def.key] || []
  const cols = columns(def.key)
  const paging = usePaging(rows)

  const changeTab = (_, t) => {
    setTab(t)
    paging.reset()
    try { localStorage.setItem(storageKey, t) } catch { /* 存不了就算了 */ }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-lg font-bold">{title}</span>
        <span className="text-xs text-gray-400">{def.note}</span>
        <span className="ml-auto text-xs text-gray-400">{right}</span>
      </div>
      {extra}
      <Tabs value={def.key} onChange={changeTab} variant="scrollable" allowScrollButtonsMobile sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {tabs.map(t => <Tab key={t.key} value={t.key} label={t.label} />)}
      </Tabs>
      <TableContainer>
        <Table size="small" sx={{ '& td, & th': { whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={head}>#</TableCell>
              <TableCell sx={head}>個股</TableCell>
              {cols.map(c => (
                <TableCell key={c.label} align="right" sx={head}><Term k={c.term} tip={c.tip}>{c.label}</Term></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={cols.length + 2} align="center" sx={{ color: 'text.secondary' }}>沒有符合條件的股票</TableCell></TableRow>
            )}
            {paging.pageRows.map((r, i) => (
              <TableRow key={r.code} hover sx={{ cursor: 'pointer' }} onClick={() => openStock(r.code, rows)}>
                <TableCell sx={{ color: 'text.secondary' }}>{paging.offset + i + 1}</TableCell>
                <TableCell>
                  <span className="font-medium">{r.code} {r.name}</span>
                  <span className="ml-1 text-xs text-gray-400">{r.market}</span>
                  {r.exRight && <Term k="除權息"><Tag label="除權息" color="#6b7280" /></Term>}
                </TableCell>
                {cols.map(c => <TableCell key={c.label} align="right">{c.render(r)}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Paging paging={paging} />
    </div>
  )
}

export default RankCard
