import React, { useMemo, useState } from 'react'
import { Paper, Chip, IconButton, Popover, Slider, Button, Tooltip } from '@mui/material'
import { Tune } from '@mui/icons-material'

import { useGetStockInstitution } from '@/apis'
import { instChipStats, DEFAULT_SIGMA, COST_DAYS, changeColor, day, fmtLots, fmtPrice } from './chartUtils'

const TYPES = [
  { key: 'foreign', label: '外資' },
  { key: 'trust', label: '投信' },
  { key: 'dealer', label: '自營商' },
  { key: 'total', label: '三大法人' },
]

// 異常靈敏度：使用者自訂才存 localStorage，重設就刪除回到預設
const SIGMA_KEY = 'stockChip.sigma'
const loadSigma = () => {
  try {
    const v = parseFloat(localStorage.getItem(SIGMA_KEY))
    return v >= 1 && v <= 3 ? v : DEFAULT_SIGMA
  } catch {
    return DEFAULT_SIGMA
  }
}
const saveSigma = (v) => {
  try {
    v === DEFAULT_SIGMA ? localStorage.removeItem(SIGMA_KEY) : localStorage.setItem(SIGMA_KEY, String(v))
  } catch { /* 存不了就算了 */ }
}

// 個股頁：法人籌碼摘要（報價區下方、K 線圖上方）
const ChipCard = ({ code, candles }) => {
  const { data: instRows, isLoading } = useGetStockInstitution({ code })
  const [sigma, setSigma] = useState(loadSigma)
  const [anchor, setAnchor] = useState(null)

  const closeByTime = useMemo(
    () => new Map((candles || []).map(c => [day(c.time), Number(c.close)])),
    [candles]
  )
  const lastClose = useMemo(() => {
    let t = '', c = null
    for (const [k, v] of closeByTime) if (k > t) { t = k; c = v }
    return c
  }, [closeByTime])

  const stats = useMemo(
    () => Object.fromEntries(TYPES.map(t => [t.key, instChipStats(instRows, closeByTime, t.key, sigma)])),
    [instRows, closeByTime, sigma]
  )

  const changeSigma = (v) => { setSigma(v); saveSigma(v) }

  if (isLoading) return null
  if (!stats.total) return null

  return (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h4 className="text-base font-bold">法人籌碼</h4>
          <span className="text-xs text-gray-500">資料日期 {stats.total.date}・單位：張</span>
        </div>
        <Tooltip title="調整異常大買／大賣的靈敏度">
          <button
            type="button"
            className="flex items-center gap-0.5 text-xs text-gray-500 hover:text-gray-800"
            onClick={(e) => setAnchor(e.currentTarget)}
          >
            <Tune sx={{ fontSize: 16 }} />
            異常標準 {sigma.toFixed(1)}σ{sigma !== DEFAULT_SIGMA && '（自訂）'}
          </button>
        </Tooltip>
        <Popover
          open={!!anchor}
          anchorEl={anchor}
          onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <div className="w-72 p-3 text-sm">
            <div className="font-semibold">異常靈敏度：{sigma.toFixed(1)} 個標準差</div>
            <div className="mb-1 text-xs text-gray-500">
              當日買賣超超出近 20 日平均 ± N 個標準差時標示異常。數字越小越敏感，標示會越多。
            </div>
            {/* 左右留空間，刻度文字才不會超出框外 */}
            <div className="px-3">
              <Slider
                size="small"
                min={1}
                max={3}
                step={0.1}
                value={sigma}
                onChange={(_, v) => changeSigma(v)}
                marks={[{ value: 1, label: '1σ' }, { value: 2, label: '2σ' }, { value: 3, label: '3σ' }]}
              />
            </div>
            <div className="-mt-1 flex justify-between text-xs text-gray-400">
              <span>← 較敏感</span>
              <span>較保守 →</span>
            </div>
            <div className="mt-2 text-right">
              <Button size="small" sx={{ textTransform: 'none' }} disabled={sigma === DEFAULT_SIGMA} onClick={() => changeSigma(DEFAULT_SIGMA)}>
                重設為預設（{DEFAULT_SIGMA}σ）
              </Button>
            </div>
          </div>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {TYPES.map(t => <ChipColumn key={t.key} label={t.label} s={stats[t.key]} lastClose={lastClose} />)}
      </div>
    </Paper>
  )
}

const Row = ({ label, children, title }) => (
  <div className="flex justify-between gap-2" title={title}>
    <span className="text-gray-500">{label}</span>
    <span className="font-medium">{children}</span>
  </div>
)

const ChipColumn = ({ label, s, lastClose }) => {
  if (!s) {
    return (
      <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
        <div className="font-semibold">{label}</div>
        <div className="text-gray-400">沒有資料</div>
      </div>
    )
  }
  const accel = s.avg5 > s.avg20

  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm tabular-nums">
      <div className="flex items-center justify-between gap-1">
        <span className="font-semibold">{label}</span>
        {s.abnormal === 'buy' && <Chip label="異常大買" size="small" color="error" sx={{ height: 20, fontSize: 11 }} />}
        {s.abnormal === 'sell' && <Chip label="異常大賣" size="small" color="success" sx={{ height: 20, fontSize: 11 }} />}
      </div>
      <div className="text-xl font-bold" style={{ color: changeColor(s.today) }}>{fmtLots(s.today, true)}</div>
      <Row label="連續">
        {s.streak > 0
          ? <span style={{ color: changeColor(s.sign) }}>{s.sign > 0 ? '連買' : '連賣'} {s.streak} 天</span>
          : '-'}
      </Row>
      <Row label="近5日" ><span style={{ color: changeColor(s.sum5) }}>{fmtLots(s.sum5, true)}</span></Row>
      <Row label="近20日"><span style={{ color: changeColor(s.sum20) }}>{fmtLots(s.sum20, true)}</span></Row>
      <Row label="動能" title="近5日日均買賣超與近20日日均比較">
        <span style={{ color: accel ? '#ef4444' : '#16a34a' }}>{accel ? '▲ 加速買進' : '▼ 轉弱'}</span>
      </Row>
      <div className="mt-1 border-t border-gray-200 pt-1">
        {COST_DAYS.map(d => {
          const cost = s.costs?.[d]
          const diff = cost && lastClose ? ((lastClose - cost) / cost) * 100 : null
          return (
            <Row key={d} label={`${d}日均價`} title={`近${d}日法人買超日的收盤價，依買超張數加權平均，大約代表這段期間的進場成本`}>
              {cost
                ? <>
                  {fmtPrice(cost.toFixed(2))}
                  {diff != null && (
                    <span className="ml-1 text-xs" style={{ color: changeColor(diff) }}>
                      （現價{diff >= 0 ? '高' : '低'} {Math.abs(diff).toFixed(1)}%）
                    </span>
                  )}
                </>
                : <span className="text-gray-400">無買超</span>}
            </Row>
          )
        })}
      </div>
    </div>
  )
}

export default ChipCard
