import React, { useMemo, useState, useEffect } from 'react'
import { Button, Popover, TextField, IconButton, Chip } from '@mui/material'
import { Add, Close } from '@mui/icons-material'

import Term from '@/components/elements/Term'

const CATEGORY_ORDER = ['價量', '均線', '技術指標', '法人', '融資券', '基本面', '營收']

// 加條件：依分類列出欄位，可以用名稱搜尋；已加入的欄位不能重複加
export const ConditionPicker = ({ fields, used, onAdd }) => {
  const [anchor, setAnchor] = useState(null)
  const [q, setQ] = useState('')
  const groups = useMemo(() => {
    const kw = q.trim()
    return CATEGORY_ORDER.map(cat => ({
      cat,
      items: fields.filter(f => f.category === cat && (!kw || f.label.includes(kw) || (f.desc || '').includes(kw))),
    })).filter(g => g.items.length > 0)
  }, [fields, q])

  const close = () => { setAnchor(null); setQ('') }

  return (
    <>
      <Button size="small" variant="outlined" startIcon={<Add />} onClick={e => setAnchor(e.currentTarget)}>加條件</Button>
      <Popover open={!!anchor} anchorEl={anchor} onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
        <div className="w-[min(640px,92vw)] p-3">
          <TextField size="small" fullWidth autoFocus placeholder="搜尋條件，例如：投信、均線、營收" value={q} onChange={e => setQ(e.target.value)} />
          <div className="mt-2 max-h-[60vh] overflow-auto">
            {groups.map(g => (
              <div key={g.cat} className="mb-2">
                <div className="mb-1 text-xs font-semibold text-gray-500">{g.cat}</div>
                <div className="flex flex-wrap gap-1">
                  {g.items.map(f => (
                    <Term key={f.key} tip={f.desc}>
                      <Chip size="small" label={f.label} disabled={used.includes(f.key)} variant="outlined" clickable
                        onClick={() => { onAdd(f); close() }} />
                    </Term>
                  ))}
                </div>
              </div>
            ))}
            {groups.length === 0 && <div className="py-4 text-center text-sm text-gray-400">找不到符合的條件</div>}
          </div>
        </div>
      </Popover>
    </>
  )
}

const toText = (v) => (v === null || v === undefined ? '' : String(v))

// 數字輸入：打字時先保留原字串（例如「-」），能轉成數字才更新條件；清空代表不限
const NumInput = ({ value, onChange, placeholder }) => {
  const [text, setText] = useState(toText(value))
  useEffect(() => { setText(prev => (Number(prev) === value || (prev === '' && value == null) ? prev : toText(value))) }, [value])
  return (
    <input
      className="w-20 rounded border border-gray-300 px-1.5 py-0.5 text-right text-sm tabular-nums focus:border-blue-500 focus:outline-none"
      inputMode="decimal" placeholder={placeholder} value={text}
      onChange={e => {
        const t = e.target.value
        setText(t)
        if (t.trim() === '') onChange(null)
        else if (!Number.isNaN(Number(t))) onChange(Number(t))
      }}
    />
  )
}

// 一個條件：數值條件可設最小、最大值（留空代表不限）；是非條件只要成立
export const ConditionCard = ({ field, cond, onChange, onRemove }) => (
  <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 py-1 pl-2.5 pr-1 text-sm">
    <span className="font-medium text-gray-700"><Term tip={field.desc}>{field.label}</Term></span>
    {field.kind === 'bool'
      ? <span className="text-xs text-blue-700">成立</span>
      : (
        <>
          <NumInput value={cond.min} placeholder="最小" onChange={min => onChange({ ...cond, min })} />
          <span className="text-gray-400">～</span>
          <NumInput value={cond.max} placeholder="最大" onChange={max => onChange({ ...cond, max })} />
          {field.unit && <span className="text-xs text-gray-500">{field.unit}</span>}
        </>
      )}
    <IconButton size="small" onClick={onRemove} title="移除條件"><Close sx={{ fontSize: 16 }} /></IconButton>
  </div>
)
