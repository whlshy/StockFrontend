import React, { useState } from 'react'
import {
  Box,
  Chip,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material'
import { useParams } from 'react-router-dom'

import {
  useGetStockCandles, useGetStockInfo, useGetCodexStockNotes, useGetStockRevenue, useGetStockEps, useGetStockEvents,
} from '@/apis'

import CandleChart from '@/components/content/stock/CandleChart'
import QuoteHeader from './QuoteHeader'
import ChipCard from './ChipCard'
import { RevenuePanel, EpsPanel } from './FinancePanel'
import Search from './Search'
import Loading from '@/components/elements/Loading'
import MarkdownView from '@/components/elements/markdown'
import { Table, TableHeadRow, TableBody, TableRow, TableCell } from '@/components/elements/table'

const TAB_KEY = 'stockPage.tab'
const TABS = [
  { key: 'revenue', label: '月營收' },
  { key: 'eps', label: '季EPS' },
  { key: 'notes', label: '筆記' },
]

const loadTab = () => {
  try {
    const t = localStorage.getItem(TAB_KEY)
    return TABS.some(x => x.key === t) ? t : 'revenue'
  } catch {
    return 'revenue'
  }
}

const index = ({ ...props }) => {
  let { code } = useParams()

  const { data: info } = useGetStockInfo({ code })
  const { data: candles, isLoading: candlesLoading } = useGetStockCandles({ code })
  const { data: codexNotesData, isLoading: codexNotesLoading } = useGetCodexStockNotes({ code })
  const { data: revenue, isLoading: revenueLoading } = useGetStockRevenue({ code })
  const { data: eps, isLoading: epsLoading } = useGetStockEps({ code })
  const { data: events } = useGetStockEvents({ code })

  const [selectedNote, setSelectedNote] = useState(null)
  const [tab, setTab] = useState(loadTab)

  const changeTab = (_, t) => {
    setTab(t)
    try { localStorage.setItem(TAB_KEY, t) } catch { /* 存不了就算了 */ }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Search />
      <QuoteHeader info={info} candles={candles} eps={eps} events={events} />
      <ChipCard code={code} candles={candles} />

      {!Array.isArray(candles) || candlesLoading
        ? <Loading />
        : (
          <CandleChart
            candlestickData={candles}
            code={code}
            notes={codexNotesData}
            onNoteClick={setSelectedNote}
          />
        )}

      <Box sx={{ mt: 3 }}>
        <Tabs value={tab} onChange={changeTab} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          {TABS.map(t => <Tab key={t.key} value={t.key} label={t.label} />)}
        </Tabs>
        {tab === 'revenue' && (revenueLoading ? <Loading /> : <RevenuePanel data={revenue} />)}
        {tab === 'eps' && (epsLoading ? <Loading /> : <EpsPanel data={eps} />)}
        {tab === 'notes' && (
          <CodexStockNotes data={codexNotesData} isLoading={codexNotesLoading} onSelect={setSelectedNote} />
        )}
      </Box>

      <NoteDialog note={selectedNote} onClose={() => setSelectedNote(null)} />
    </Box>
  )
}

export default index

const NOTE_TYPE_LABELS = {
  General: "一般",
  InvestmentThesis: "投資論點",
  DailyReview: "每日覆盤",
  Catalyst: "催化劑",
  Risk: "風險",
  Earnings: "財報",
  News: "新聞",
  TradePlan: "交易計畫",
  Review: "檢討",
}

const getNoteTypeLabel = (noteType) => NOTE_TYPE_LABELS[noteType] || noteType || "-"

const CodexStockNotes = ({ data, isLoading, onSelect }) => {
  if (isLoading) return <Loading />

  const notes = Array.isArray(data) ? data : []

  return (
    <Table>
      <TableHeadRow>
        <TableCell sx={{ fontWeight: "bolder", whiteSpace: "nowrap" }}>日期</TableCell>
        <TableCell sx={{ fontWeight: "bolder", whiteSpace: "nowrap" }}>類型</TableCell>
        <TableCell sx={{ fontWeight: "bolder" }}>標題</TableCell>
        <TableCell sx={{ fontWeight: "bolder", whiteSpace: "nowrap" }}>重要</TableCell>
      </TableHeadRow>
      <TableBody>
        {notes.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} align="center">
              目前沒有 Codex Stock Notes
            </TableCell>
          </TableRow>
        )}
        {notes.map((note) => (
          <TableRow key={note.NID} onClick={() => onSelect(note)}>
            <TableCell sx={{ whiteSpace: "nowrap" }}>
              {note.NoteDate?.split("T")?.[0] || "-"}
            </TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>
              {getNoteTypeLabel(note.NoteType)}
            </TableCell>
            <TableCell>{note.Title || "-"}</TableCell>
            <TableCell>
              {note.IsImportant && <Chip label="重要" color="error" size="small" />}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

const NoteDialog = ({ note, onClose }) => (
  <Dialog open={Boolean(note)} onClose={onClose} fullWidth maxWidth="md">
    <DialogTitle>{note?.Title || "Codex Stock Note"}</DialogTitle>
    <DialogContent dividers>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        <Chip label={note?.NoteDate?.split("T")?.[0] || "-"} size="small" />
        <Chip label={getNoteTypeLabel(note?.NoteType)} size="small" variant="outlined" />
        {note?.IsImportant && <Chip label="重要" color="error" size="small" />}
      </Box>
      <MarkdownView source={note?.Des || ""} />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>關閉</Button>
    </DialogActions>
  </Dialog>
)
