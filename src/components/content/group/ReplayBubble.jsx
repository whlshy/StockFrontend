import React, { useEffect, useMemo, useState } from 'react'
import { IconButton, Slider, ToggleButton, ToggleButtonGroup, Button } from '@mui/material'
import { PlayArrow, Pause, SkipPrevious, SkipNext } from '@mui/icons-material'

import { useGetGroupFlowHistory } from '@/apis'
import Loading from '@/components/elements/Loading'
import BubbleChart, { historyExtent } from './BubbleChart'
import { quadrantOf, quadrantInfo } from './groupUtils'

const SPEEDS = [1, 2, 4]
const FRAME_MS = 900

// 資金輪動回放：近 20 個交易日的泡泡移動，可選族群比較並顯示軌跡
const ReplayBubble = ({ cid, inst, items, onSelect }) => {
  const { data: history, isLoading } = useGetGroupFlowHistory({ cid, inst })

  const dates = useMemo(() => [...new Set((history || []).map(r => r.date))].sort(), [history])
  const byDate = useMemo(() => {
    const m = new Map()
    for (const r of history || []) {
      m.has(r.date) || m.set(r.date, new Map())
      m.get(r.date).set(r.id, r)
    }
    return m
  }, [history])
  const extent = useMemo(() => historyExtent(history), [history])

  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [selected, setSelected] = useState(() => new Set())

  // 載入完成後停在第一天，等使用者按播放
  useEffect(() => { setIdx(0); setPlaying(false) }, [dates.length])

  useEffect(() => {
    if (!playing) return
    if (idx >= dates.length - 1) { setPlaying(false); return }
    const t = setTimeout(() => setIdx(i => Math.min(i + 1, dates.length - 1)), FRAME_MS / speed)
    return () => clearTimeout(t)
  }, [playing, idx, speed, dates.length])

  const date = dates[idx]
  const frame = byDate.get(date)

  // 被選取項目從第一天到目前這天的軌跡
  const trails = useMemo(() => {
    const m = new Map()
    for (const id of selected) {
      m.set(id, dates.slice(0, idx + 1).map(d => byDate.get(d)?.get(id)).filter(Boolean))
    }
    return m
  }, [selected, idx, dates, byDate])

  const togglePlay = () => {
    if (idx >= dates.length - 1) setIdx(0)
    setPlaying(p => !p)
  }

  const toggleItem = (id) => setSelected(s => {
    const n = new Set(s)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })

  if (isLoading) return <Loading />
  if (dates.length === 0) return <div className="py-8 text-center text-gray-400">沒有回放資料</div>

  const chips = (items || []).filter(it => it.flow5 != null)

  return (
    <div>
      {/* 選族群比較 */}
      <div className="mb-2 rounded border border-gray-200 p-2">
        <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
          <span>選擇要比較的{items?.[0]?.itemType === 'stock' ? '個股' : '族群'}（會顯示軌跡，其他變淡）</span>
          <Button size="small" onClick={() => setSelected(new Set(chips.map(c => c.id)))}>全選</Button>
          <Button size="small" onClick={() => setSelected(new Set())}>清除</Button>
        </div>
        <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto">
          {chips.map(it => {
            const on = selected.has(it.id)
            const q = quadrantInfo(quadrantOf(frame?.get(it.id) || it))
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => toggleItem(it.id)}
                className="rounded border px-2 py-0.5 text-xs"
                style={on
                  ? { borderColor: q?.color, color: q?.color, background: q?.bg, fontWeight: 600 }
                  : { borderColor: '#e5e7eb', color: '#6b7280' }}
              >
                {it.name}
              </button>
            )
          })}
        </div>
      </div>

      <BubbleChart
        items={items}
        onSelect={onSelect}
        frame={frame}
        extent={extent}
        highlight={selected}
        trails={trails}
        date={date}
      />

      {/* 播放列 */}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <IconButton size="small" onClick={() => { setPlaying(false); setIdx(i => Math.max(i - 1, 0)) }}><SkipPrevious /></IconButton>
        <IconButton size="small" color="primary" onClick={togglePlay}>{playing ? <Pause /> : <PlayArrow />}</IconButton>
        <IconButton size="small" onClick={() => { setPlaying(false); setIdx(i => Math.min(i + 1, dates.length - 1)) }}><SkipNext /></IconButton>
        <span className="w-24 text-sm font-semibold tabular-nums">{date}</span>
        <Slider
          size="small"
          sx={{ flex: '1 1 200px', mx: 1 }}
          min={0}
          max={dates.length - 1}
          step={1}
          value={idx}
          onChange={(_, v) => { setPlaying(false); setIdx(v) }}
          valueLabelDisplay="auto"
          valueLabelFormat={i => dates[i]}
        />
        <ToggleButtonGroup size="small" exclusive value={speed} onChange={(_, v) => v && setSpeed(v)}>
          {SPEEDS.map(s => <ToggleButton key={s} value={s} sx={{ px: 1 }}>{s}x</ToggleButton>)}
        </ToggleButtonGroup>
        <span className="text-xs text-gray-500">第 {idx + 1} / {dates.length} 天</span>
      </div>
    </div>
  )
}

export default ReplayBubble
