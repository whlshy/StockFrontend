import React, { useState } from 'react'
import { Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material'
import { changeColor, fmtPrice } from '../stock/chartUtils'
import { useOpenStock } from '../stock/stockModal'
import { fmtAmt, fmtPct } from '../group/groupUtils'
import Term from '@/components/elements/Term'
import Paging, { usePaging } from './Paging'

const TAB_KEY = 'homePage.chipsTab'
// streak：顯示哪個法人的連續天數；power：力道用哪個法人的金額
const TABS = [
  { key: 'coBuy', label: '外資投信同買', power: 'power', note: '當日外資、投信都買超 0.5 億以上' },
  { key: 'coSell', label: '外資投信同賣', power: 'power', note: '當日外資、投信都賣超 0.5 億以上' },
  { key: 'foreignBuy', label: '外資連買', streak: 'f', power: 'fPower', note: '外資連續買超 3 天以上，依期間累計金額排序' },
  { key: 'foreignSell', label: '外資連賣', streak: 'f', power: 'fPower', note: '外資連續賣超 3 天以上，依期間累計金額排序' },
  { key: 'trustBuy', label: '投信連買', streak: 't', power: 'tPower', note: '投信連續買超 3 天以上，依期間累計金額排序' },
  { key: 'trustSell', label: '投信連賣', streak: 't', power: 'tPower', note: '投信連續賣超 3 天以上，依期間累計金額排序' },
  { key: 'contrarian', label: '逆勢買超', power: 'power', note: '當日股價下跌，但三大法人買超' },
]
const POWER_NOTE = { power: '三大法人', fPower: '外資', tPower: '投信' }

const TAG_COLOR = { 同買: '#ef4444', 同賣: '#16a34a', 對作: '#f59e0b' }

const loadTab = () => {
  try {
    const t = localStorage.getItem(TAB_KEY)
    return TABS.some(x => x.key === t) ? t : 'coBuy'
  } catch {
    return 'coBuy'
  }
}

const Tag = ({ label, color }) => (
  <Chip label={label} size="small" sx={{ ml: 0.5, height: 18, fontSize: 11, bgcolor: color, color: '#fff' }} />
)

const head = { fontWeight: 'bold' }

// 籌碼排行：外資投信同買／同賣、外資與投信連買／連賣、逆勢買超
const ChipsTable = ({ data }) => {
  const [tab, setTab] = useState(loadTab)
  const openStock = useOpenStock()
  const def = TABS.find(t => t.key === tab)
  const rows = data?.[tab] || []
  const instNote = data?.instDate && data.instDate !== data.date ? `法人資料為 ${data.instDate}` : null
  const fmtDays = (d) => (Math.abs(d) > data.streakMax ? `${data.streakMax}+` : Math.abs(d))

  const paging = usePaging(rows)

  const changeTab = (_, t) => {
    setTab(t)
    paging.reset()
    try { localStorage.setItem(TAB_KEY, t) } catch { /* 存不了就算了 */ }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-lg font-bold">籌碼排行</span>
        <span className="text-xs text-gray-400">{def.note}</span>
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
              <TableCell sx={head}>#</TableCell>
              <TableCell sx={head}>個股</TableCell>
              <TableCell align="right" sx={head}>收盤</TableCell>
              <TableCell align="right" sx={head}>漲跌幅</TableCell>
              <TableCell align="right" sx={head}><Term k="外資">外資(億)</Term></TableCell>
              <TableCell align="right" sx={head}><Term k="投信">投信(億)</Term></TableCell>
              <TableCell align="right" sx={head}><Term k="買賣超">法人合計(億)</Term></TableCell>
              {def.streak && <TableCell align="right" sx={head}><Term k="連續">連續天數</Term></TableCell>}
              {def.streak && <TableCell align="right" sx={head}><Term k="期間累計">期間累計(億)</Term></TableCell>}
              <TableCell align="right" sx={head}><Term tip={`這裡看的是${POWER_NOTE[def.power]}。\n今天的買賣超金額是前 20 個交易日平均（取絕對值）的幾倍，2 倍以上代表今天的動作明顯比平常大。`}>力道</Term></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={10} align="center" sx={{ color: 'text.secondary' }}>沒有資料</TableCell></TableRow>
            )}
            {paging.pageRows.map((r, i) => {
              const days = def.streak === 'f' ? r.fDays : r.tDays
              const amt = def.streak === 'f' ? r.fAmt : r.tAmt
              const power = r[def.power]
              return (
                <TableRow key={r.code} hover sx={{ cursor: 'pointer' }} onClick={() => openStock(r.code, rows)}>
                  <TableCell sx={{ color: 'text.secondary' }}>{paging.offset + i + 1}</TableCell>
                  <TableCell>
                    <span className="font-medium">{r.code} {r.name}</span>
                    <span className="ml-1 text-xs text-gray-400">{r.market}</span>
                    {r.tag && <Term k={`土洋${r.tag}`}><Tag label={`土洋${r.tag}`} color={TAG_COLOR[r.tag]} /></Term>}
                    {r.exRight && <Term k="除權息"><Tag label="除權息" color="#6b7280" /></Term>}
                  </TableCell>
                  <TableCell align="right" style={{ color: changeColor(r.pct) }}>{fmtPrice(r.close)}</TableCell>
                  <TableCell align="right" style={{ color: changeColor(r.pct) }}>{fmtPct(r.pct)}</TableCell>
                  <TableCell align="right" style={{ color: changeColor(r.foreign) }}>{fmtAmt(r.foreign)}</TableCell>
                  <TableCell align="right" style={{ color: changeColor(r.trust) }}>{fmtAmt(r.trust)}</TableCell>
                  <TableCell align="right" style={{ color: changeColor(r.total) }}>{fmtAmt(r.total)}</TableCell>
                  {def.streak && <TableCell align="right" style={{ color: changeColor(days) }}>{fmtDays(days)} 天</TableCell>}
                  {def.streak && <TableCell align="right" style={{ color: changeColor(amt) }}>{fmtAmt(amt)}</TableCell>}
                  <TableCell align="right" sx={{ fontWeight: power >= 2 ? 'bold' : 'normal', color: power >= 2 ? 'text.primary' : 'text.secondary' }}>
                    {power == null ? '-' : `${power.toFixed(1)}x`}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Paging paging={paging} />
    </div>
  )
}

export default ChipsTable
