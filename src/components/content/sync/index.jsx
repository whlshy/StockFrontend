import React, { useEffect, useState } from 'react'
import { Box, Button, Checkbox, FormControlLabel, CircularProgress, Alert } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'

import { useSyncGroupTpex, useSyncGroupYahoo } from '@/apis'

// 族群同步：觸發 TPEX、Yahoo 爬蟲（目前只能從網址 /sync 進入，不放側邊欄）
const YAHOO_SECTIONS = [
  ['LISTED_STOCK', '上市類股'],
  ['OVER_THE_COUNTER_STOCK', '上櫃類股'],
  ['OES_STOCK', '興櫃類股'],
  ['ELECTRONICS_INDUSTRY', '電子產業'],
  ['CONCEPT_STOCK', '概念股'],
  ['CONSORTIUM_STOCK', '集團股'],
]

// 執行中的經過秒數
const useElapsed = (running) => {
  const [sec, setSec] = useState(0)
  useEffect(() => {
    if (!running) return
    setSec(0)
    const started = Date.now()
    const t = setInterval(() => setSec(Math.floor((Date.now() - started) / 1000)), 1000)
    return () => clearInterval(t)
  }, [running])
  return sec
}

const ListBlock = ({ title, items, color }) => {
  if (!items?.length) return null
  return (
    <details className="rounded border border-gray-200 px-3 py-2" open={items.length <= 10}>
      <summary className="cursor-pointer text-sm font-bold" style={{ color }}>{title}（{items.length}）</summary>
      <ul className="mt-1 max-h-72 overflow-auto text-sm leading-6">
        {items.map((s, i) => <li key={i} className="break-all">{s}</li>)}
      </ul>
    </details>
  )
}

const Report = ({ res }) => {
  if (!res) return null
  const r = res.body
  if (!res.ok) return <Alert severity="error">{r?.message || `執行失敗（HTTP ${res.status}）`}</Alert>

  const changes = r.addedClasses.length + r.renamedClasses.length + r.desUpdated.length + r.deletedClasses.length
    + r.rankUpdated + r.addedLinks + r.removedLinks
  const stats = [
    ['區塊／產業', r.sections],
    ['分類', r.categories],
    ['網站股票連結', r.siteLinks],
    ['略過連結', r.skippedLinks],
    ['新增分類', r.addedClasses.length],
    ['改名', r.renamedClasses.length],
    ['更新說明', r.desUpdated.length],
    ['刪除分類', r.deletedClasses.length],
    ['更新排序', r.rankUpdated],
    ['加入股票', r.addedLinks],
    ['移除股票', r.removedLinks],
    ['錯誤', r.errors.length],
  ]
  return (
    <div className="flex flex-col gap-2">
      <Alert severity={r.errors.length ? 'warning' : changes ? 'info' : 'success'}>
        {r.dryRun ? '比對完成（沒有寫入）' : '同步完成，已寫入'}・耗時 {r.elapsedSec} 秒・
        {changes ? `共 ${changes} 項變動` : '和網站一致，沒有變動'}
        {r.errors.length > 0 && `・${r.errors.length} 個錯誤`}
      </Alert>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {stats.map(([label, n]) => (
          <div key={label} className="rounded border border-gray-200 px-3 py-1.5">
            <div className="text-xs text-gray-400">{label}</div>
            <div className="text-lg font-bold tabular-nums">{n}</div>
          </div>
        ))}
      </div>
      <ListBlock title="錯誤" items={r.errors} color="#dc2626" />
      <ListBlock title="新增分類" items={r.addedClasses} />
      <ListBlock title="刪除分類" items={r.deletedClasses} />
      <ListBlock title="改名" items={r.renamedClasses} />
      <ListBlock title="更新說明" items={r.desUpdated} />
      <ListBlock title="股票變動" items={r.linkChanges} />
      <ListBlock title="略過的分類（沒有上市櫃普通股）" items={r.skippedCategories} />
      <ListBlock title="略過的代號（不在股票表）" items={r.skippedCodes} />
    </div>
  )
}

const SyncCard = ({ title, note, mutation, run, busy, children }) => {
  const running = mutation.isPending
  const elapsed = useElapsed(running)
  const [lastDryRun, setLastDryRun] = useState(null)
  const start = (dryRun) => {
    if (!dryRun && !window.confirm(`確定要同步寫入「${title}」？網站上沒有的分類會被刪除。`)) return
    setLastDryRun(dryRun)
    run(dryRun)
  }
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
        <span className="text-lg font-bold">{title}</span>
        <span className="text-xs text-gray-400">{note}</span>
      </div>
      {children}
      <div className="my-3 flex flex-wrap items-center gap-2">
        <Button variant="outlined" disabled={busy} onClick={() => start(true)}>比對（不寫入）</Button>
        <Button variant="contained" disabled={busy} onClick={() => start(false)}>同步寫入</Button>
        {running && (
          <span className="flex items-center gap-2 text-sm text-gray-500">
            <CircularProgress size={16} />
            {lastDryRun ? '比對中' : '同步中'}… {elapsed} 秒
          </span>
        )}
      </div>
      {mutation.isError && <Alert severity="error">連線失敗：{String(mutation.error?.message || '')}</Alert>}
      {!running && <Report res={mutation.data} />}
    </div>
  )
}

function index() {
  const queryClient = useQueryClient()
  // 寫入後讓族群頁重新抓資料
  const onSuccess = (res) => {
    if (res.ok && !res.body?.dryRun)
      queryClient.invalidateQueries({ predicate: q => String(q.queryKey[0]).startsWith('getGroup') })
  }
  const tpex = useSyncGroupTpex({ onSuccess })
  const yahoo = useSyncGroupYahoo({ onSuccess })
  const [sections, setSections] = useState([])
  // 兩個同步共用一把鎖，同時只能跑一個
  const busy = tpex.isPending || yahoo.isPending

  const toggle = (id) => setSections(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  return (
    <Box sx={{ p: 2 }}>
      <div className="mb-3 text-xl font-bold">族群同步</div>
      <div className="flex flex-col gap-3">
        <SyncCard title="TPEX產業價值鏈" note="來源 ic.tpex.org.tw・約 30 秒" mutation={tpex} busy={busy}
          run={(dryRun) => tpex.mutate({ dryRun })} />
        <SyncCard title="Yahoo類股" note="來源 tw.stock.yahoo.com/class・全部約 4 分鐘" mutation={yahoo} busy={busy}
          run={(dryRun) => yahoo.mutate({ sections, dryRun })}>
          <div className="flex flex-wrap items-center gap-x-1">
            <span className="mr-2 text-sm text-gray-500">區塊（不勾為全部）</span>
            {YAHOO_SECTIONS.map(([id, label]) => (
              <FormControlLabel key={id} label={label} disabled={busy}
                control={<Checkbox size="small" checked={sections.includes(id)} onChange={() => toggle(id)} />} />
            ))}
          </div>
        </SyncCard>
      </div>
    </Box>
  )
}

export default index
