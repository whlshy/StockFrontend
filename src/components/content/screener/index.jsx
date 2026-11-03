import React, { useEffect, useMemo, useState } from 'react'
import {
  Box, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete, Alert, CircularProgress,
} from '@mui/material'
import { Save, CreateNewFolder } from '@mui/icons-material'
import { useQueryClient } from '@tanstack/react-query'

import {
  useGetScreenerFields, useGetScreenerScopes, useRunScreener, useGetScreenerStrategies,
  useSaveScreenerStrategy, useDeleteScreenerStrategy, useAddScreenerToFolder,
} from '@/apis'
import Loading from '@/components/elements/Loading'
import Term from '@/components/elements/Term'
import { ConditionPicker, ConditionCard } from './Conditions'
import ResultTable from './ResultTable'
import { PRESETS } from './presets'

const STATE_KEY = 'screener.state'
const EMPTY = { conditions: [], market: 'all', scopeType: 'all', scope: null, sortKey: 'value', sortDesc: true, strategy: null }

// 目前的條件存在 localStorage，下次打開還在
const loadState = () => {
  try {
    const s = JSON.parse(localStorage.getItem(STATE_KEY) || 'null')
    return s && Array.isArray(s.conditions) ? { ...EMPTY, ...s } : EMPTY
  } catch {
    return EMPTY
  }
}

// 打字時不要每按一個鍵就查詢；用內容比對，內容沒變就不重設計時
const useDebounced = (value, ms) => {
  const [v, setV] = useState(value)
  const key = JSON.stringify(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [key, ms])
  return v
}

const MARKETS = [{ key: 'all', label: '全部' }, { key: '上市', label: '上市' }, { key: '上櫃', label: '上櫃' }]
const SCOPE_TYPES = [{ key: 'all', label: '全市場' }, { key: 'group', label: '族群' }, { key: 'folder', label: '選股資料夾' }]

const Segmented = ({ items, value, onChange }) => (
  <div className="inline-flex overflow-hidden rounded border border-gray-300">
    {items.map((it, i) => (
      <button key={it.key} type="button" onClick={() => onChange(it.key)}
        className={`px-2.5 py-0.5 text-xs ${i > 0 ? 'border-l border-gray-300' : ''} ${value === it.key ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
        {it.label}
      </button>
    ))}
  </div>
)

// 條件選股：加條件（交集）→ 即時篩出全市場符合的股票；可套用內建策略、儲存自己的策略、把結果加入選股資料夾
function index() {
  const queryClient = useQueryClient()
  const { data: fields, isLoading: fieldsLoading } = useGetScreenerFields()
  const { data: scopes } = useGetScreenerScopes()
  const { data: strategyData } = useGetScreenerStrategies()
  // 策略存在登入會員目錄下的「條件選股」分類，沒登入時只能用內建策略
  const loggedIn = !!strategyData?.loggedIn
  const strategyCid = strategyData?.cid
  const strategies = strategyData?.items || []
  const [state, setState] = useState(loadState)
  const [saveOpen, setSaveOpen] = useState(false)
  const [folderOpen, setFolderOpen] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)) } catch { /* 存不了就算了 */ }
  }, [state])

  const fieldList = Array.isArray(fields) ? fields : []
  const fieldMap = useMemo(() => Object.fromEntries(fieldList.map(f => [f.key, f])), [fieldList])
  const conditions = useMemo(() => state.conditions.filter(c => fieldMap[c.key]), [state.conditions, fieldMap])
  const update = (patch) => setState(s => ({ ...s, ...patch }))

  const req = useMemo(() => ({
    conditions: conditions.map(c => ({ key: c.key, min: c.min ?? null, max: c.max ?? null })),
    market: state.market,
    groupCid: state.scopeType === 'group' ? state.scope?.cid ?? null : null,
    folderCid: state.scopeType === 'folder' ? state.scope?.cid ?? null : null,
    sortKey: state.sortKey,
    sortDesc: state.sortDesc,
  }), [conditions, state.market, state.scopeType, state.scope, state.sortKey, state.sortDesc])
  const debouncedReq = useDebounced(req, 400)
  const scopeMissing = state.scopeType !== 'all' && !state.scope
  const { data: result, isFetching } = useRunScreener(debouncedReq, debouncedReq.conditions.length > 0 && !scopeMissing)

  const applyDefinition = (def, strategy = null) => setState(s => ({
    ...s,
    conditions: def.conditions || [],
    market: def.market || 'all',
    scopeType: def.scopeType || 'all',
    scope: def.scope || null,
    sortKey: def.sortKey || 'value',
    sortDesc: def.sortDesc ?? true,
    strategy,
  }))
  const definition = { conditions, market: state.market, scopeType: state.scopeType, scope: state.scope, sortKey: state.sortKey, sortDesc: state.sortDesc }

  const deleteStrategy = useDeleteScreenerStrategy({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['getScreenerStrategies'] }),
  })

  const onSort = (k) => update(state.sortKey === k ? { sortDesc: !state.sortDesc } : { sortKey: k, sortDesc: true })

  if (fieldsLoading) return <Box sx={{ p: 2 }}><Loading /></Box>

  return (
    <Box sx={{ p: 2 }}>
      <h3 className="mb-1 text-2xl font-bold">條件選股</h3>
      <p className="mb-3 text-sm text-gray-500">
        加入條件後即時篩選上市櫃普通股，所有條件同時成立才會列出。價格類指標用還原價計算。篩選結果只是整理過的名單，不代表買賣建議。
      </p>

      {/* 策略 */}
      <div className="mb-3 flex flex-col gap-2 rounded-lg border border-gray-200 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 w-16 shrink-0 text-xs text-gray-500">內建策略</span>
          {PRESETS.map(p => (
            <Term key={p.name} tip={p.desc}>
              <Chip size="small" label={p.name} variant="outlined" clickable
                onClick={() => applyDefinition({ conditions: p.conditions, sortKey: p.sortKey })} />
            </Term>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 w-16 shrink-0 text-xs text-gray-500">我的策略</span>
          {strategies.map(s => (
            <Chip key={s.id} size="small" label={s.name} clickable
              color={state.strategy?.id === s.id ? 'primary' : 'default'}
              onClick={() => applyDefinition(s.definition, { id: s.id, name: s.name })}
              onDelete={() => window.confirm(`確定刪除策略「${s.name}」？`) && deleteStrategy.mutate({ cid: strategyCid, id: s.id },
                { onSuccess: res => res?.body?.status && state.strategy?.id === s.id && update({ strategy: null }) })} />
          ))}
          {strategies.length === 0 && (
            <span className="text-xs text-gray-400">{loggedIn ? '還沒有儲存的策略' : '登入後可以儲存自己的策略'}</span>
          )}
        </div>
      </div>

      {/* 條件 */}
      <div className="mb-3 flex flex-col gap-2 rounded-lg border border-gray-200 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">市場</span>
          <Segmented items={MARKETS} value={state.market} onChange={m => update({ market: m })} />
          <span className="ml-2 text-xs text-gray-500">範圍</span>
          <Segmented items={SCOPE_TYPES} value={state.scopeType} onChange={t => update({ scopeType: t, scope: null })} />
          {state.scopeType !== 'all' && (
            <Autocomplete size="small" sx={{ minWidth: 280, flex: '1 1 280px', maxWidth: 520 }}
              options={(state.scopeType === 'group' ? scopes?.groups : scopes?.folders) || []}
              getOptionLabel={o => o.path || ''} isOptionEqualToValue={(a, b) => a.cid === b.cid}
              value={state.scope} onChange={(_, v) => update({ scope: v ? { cid: v.cid, path: v.path } : null })}
              noOptionsText={state.scopeType === 'folder' && !scopes?.loggedIn ? '請先登入才能選擇選股資料夾' : '找不到'}
              renderInput={params => <TextField {...params} placeholder={state.scopeType === 'group' ? '搜尋族群' : '選擇選股資料夾'} />} />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {conditions.map((c, i) => (
            <ConditionCard key={c.key} field={fieldMap[c.key]} cond={c}
              onChange={nc => update({ conditions: conditions.map((x, j) => (j === i ? nc : x)) })}
              onRemove={() => update({ conditions: conditions.filter((_, j) => j !== i) })} />
          ))}
          <ConditionPicker fields={fieldList} used={conditions.map(c => c.key)}
            onAdd={f => update({ conditions: [...conditions, { key: f.key, min: null, max: null }] })} />
          {conditions.length > 0 && (
            <button type="button" className="text-xs text-gray-500 hover:underline" onClick={() => update({ conditions: [], strategy: null })}>
              清除全部
            </button>
          )}
          <span className="ml-auto flex gap-1">
            <Button size="small" startIcon={<Save />} disabled={conditions.length === 0 || !loggedIn || !strategyCid}
              title={loggedIn ? undefined : '登入後才能儲存策略'} onClick={() => setSaveOpen(true)}>儲存策略</Button>
            <Button size="small" startIcon={<CreateNewFolder />} disabled={!(result?.rows?.length > 0)} onClick={() => setFolderOpen(true)}>加入選股資料夾</Button>
          </span>
        </div>
      </div>

      {/* 結果 */}
      <div className="rounded-lg border border-gray-200 p-3">
        <div className="mb-1 flex flex-wrap items-baseline gap-x-3 text-sm">
          <span className="text-lg font-bold">篩選結果</span>
          {conditions.length > 0 && result && (
            <span className="text-gray-600">
              符合 <b>{result.total}</b> 檔（共 {result.universe} 檔）{result.total > result.rows.length && `，只列出前 ${result.rows.length} 檔`}
            </span>
          )}
          {isFetching && <CircularProgress size={14} />}
          {result?.date && (
            <span className="ml-auto text-xs text-gray-400">
              股價 {result.date}・法人 {result.instDate}・融資券 {result.marginDate}
            </span>
          )}
        </div>
        {conditions.length === 0
          ? <div className="py-10 text-center text-gray-400">按「加條件」或點一個內建策略開始篩選</div>
          : scopeMissing
            ? <div className="py-10 text-center text-gray-400">請先選擇{state.scopeType === 'group' ? '族群' : '選股資料夾'}</div>
            : <ResultTable data={result} fieldMap={fieldMap} sortKey={result?.sortKey ?? state.sortKey} sortDesc={state.sortDesc} onSort={onSort} />}
      </div>

      <SaveDialog open={saveOpen} onClose={() => setSaveOpen(false)} cid={strategyCid} strategy={state.strategy} definition={definition}
        onSaved={s => update({ strategy: s })} />
      <FolderDialog open={folderOpen} onClose={() => setFolderOpen(false)} scopes={scopes} codes={(result?.rows || []).map(r => r.code)} />
    </Box>
  )
}

// 儲存策略：目前套用的是自己的策略時，可以直接更新，也可以另存
const SaveDialog = ({ open, onClose, cid, strategy, definition, onSaved }) => {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  useEffect(() => { if (open) { setName(strategy?.name || ''); setError(null) } }, [open])
  const save = useSaveScreenerStrategy({
    onSuccess: (res, vars) => {
      // 預存程序檢查不通過（例如名稱重複、沒有權限）時 status 為 false
      if (!res?.ok || !res?.body?.status) return setError(res?.body?.message || '儲存失敗')
      queryClient.invalidateQueries({ queryKey: ['getScreenerStrategies'] })
      onSaved({ id: vars.id || res.body.id, name: vars.name })
      onClose()
    },
  })
  const submit = (asNew) => {
    if (!name.trim()) return setError('請輸入策略名稱')
    save.mutate({ cid, id: asNew ? null : strategy?.id, name: name.trim(), definition })
  }
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>儲存策略</DialogTitle>
      <DialogContent>
        <TextField autoFocus fullWidth size="small" sx={{ mt: 1 }} label="策略名稱" value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit(!strategy)} />
        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        {strategy && <Button disabled={save.isPending} onClick={() => submit(false)}>更新「{strategy.name}」</Button>}
        <Button variant="contained" disabled={save.isPending} onClick={() => submit(true)}>{strategy ? '另存新策略' : '儲存'}</Button>
      </DialogActions>
    </Dialog>
  )
}

// 加入選股資料夾：需要登入；只會加入目前篩選結果（最多 500 檔）
const FolderDialog = ({ open, onClose, scopes, codes }) => {
  const [folder, setFolder] = useState(null)
  const [msg, setMsg] = useState(null)
  useEffect(() => { if (open) setMsg(null) }, [open])
  const add = useAddScreenerToFolder({
    onSuccess: (res) => setMsg(res?.ok
      ? { severity: res.body.errors?.length ? 'warning' : 'success', text: `已加入 ${res.body.added} 檔到「${folder.path}」${res.body.errors?.length ? `，${res.body.errors.length} 檔失敗` : ''}` }
      : { severity: 'error', text: res?.body?.message || '沒有權限或尚未登入' }),
  })
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>加入選股資料夾</DialogTitle>
      <DialogContent>
        {!scopes?.loggedIn
          ? <Alert severity="info">請先登入，才能把結果加入自己的選股資料夾。</Alert>
          : (
            <>
              <div className="mb-2 mt-1 text-sm text-gray-600">把目前的 {codes.length} 檔篩選結果加入資料夾（已經在資料夾裡的不會重複加入）。</div>
              <Autocomplete size="small" options={scopes?.folders || []} getOptionLabel={o => o.path || ''}
                isOptionEqualToValue={(a, b) => a.cid === b.cid} value={folder} onChange={(_, v) => setFolder(v)}
                renderInput={params => <TextField {...params} placeholder="選擇選股資料夾" />} />
            </>
          )}
        {msg && <Alert severity={msg.severity} sx={{ mt: 1 }}>{msg.text}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>關閉</Button>
        {scopes?.loggedIn && (
          <Button variant="contained" disabled={!folder || add.isPending} onClick={() => add.mutate({ cid: folder.cid, codes })}>加入</Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default index
