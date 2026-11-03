import React, { useState } from 'react'
import { Box } from '@mui/material'

import { useGetScanHighs, useGetScanMargin, useGetScanRevenue } from '@/apis'
import Loading from '@/components/elements/Loading'
import { changeColor, fmtPrice, fmtLots } from '../stock/chartUtils'
import { fmtAmt, fmtPct } from '../group/groupUtils'
import RankCard from './RankCard'

const colored = (v, text) => <span style={{ color: changeColor(v) }}>{text}</span>
const pctCell = (v) => colored(v, fmtPct(v))
const priceCols = [
  { label: '收盤', render: r => colored(r.pct, fmtPrice(r.close)) },
  { label: '漲跌幅', render: r => pctCell(r.pct) },
]
const ratio = (v) => (v == null ? '-' : `${v.toFixed(1)}x`)
const plain = (v, digits = 1) => (v == null ? '-' : `${v.toFixed(digits)}%`)

// ===== 新高與爆量 =====
const HIGH_TABS = [
  { key: 'high52', label: '52週新高', note: '收盤價高於前 250 個交易日的最高收盤（還原價）' },
  { key: 'high20', label: '20日新高', note: '收盤價高於前 20 個交易日的最高收盤（還原價）' },
  { key: 'volUp', label: '爆量上漲', note: '成交量 ≥ 20 日均量 2 倍且收漲，20 日均量至少 500 張' },
  { key: 'volDown', label: '爆量下跌', note: '成交量 ≥ 20 日均量 2 倍且收跌，20 日均量至少 500 張' },
]
const highColumns = (tab) => {
  const vsHigh = (v) => (v == null ? '-' : colored(v, fmtPct(v)))
  const common = [
    { label: '成交值(億)', term: '成交值', render: r => r.value.toFixed(2) },
    { label: '量比', term: '量比', render: r => <span className={r.volRatio >= 2 ? 'font-bold' : ''}>{ratio(r.volRatio)}</span> },
  ]
  if (tab === 'high52') return [...priceCols, { label: '超過前高', term: '超過前高', render: r => vsHigh(r.vsHigh250) }, ...common]
  if (tab === 'high20') return [...priceCols, { label: '超過前高', term: '超過前高', render: r => vsHigh(r.vsHigh20) },
    { label: '距52週高', term: '距52週高', render: r => vsHigh(r.vsHigh250) }, ...common]
  return [...priceCols,
    { label: '成交量(張)', term: '成交量', render: r => fmtLots(r.vol) },
    { label: '20日均量(張)', term: '20日均量', render: r => fmtLots(r.vol20) },
    { label: '量比', term: '量比', render: r => <span className="font-bold">{ratio(r.volRatio)}</span> },
    { label: '距52週高', term: '距52週高', render: r => vsHigh(r.vsHigh250) }]
}

// ===== 融資券異常 =====
const MARGIN_TABS = [
  { key: 'marginUp', label: '融資大增', note: '融資餘額比前一天增加 10% 以上，且至少 500 張' },
  { key: 'marginDown', label: '融資大減', note: '融資餘額比前一天減少 10% 以上，且至少 500 張' },
  { key: 'usage', label: '融資使用率高', note: '融資使用率 ≥ 30%' },
  { key: 'shortRatio', label: '券資比高', note: '券資比 ≥ 20%，且融資餘額至少 1,000 張' },
]
const marginColumns = () => [
  ...priceCols,
  { label: '融資餘額(張)', term: '融資餘額', render: r => fmtLots(r.balance) },
  { label: '增減(張)', term: '融資增減', render: r => colored(r.change, fmtLots(r.change, true)) },
  { label: '增減幅度', term: '融資增減', render: r => colored(r.changePct, fmtPct(r.changePct, 1)) },
  { label: '使用率', term: '融資使用率', render: r => plain(r.usage) },
  { label: '融券(張)', term: '融券', render: r => fmtLots(r.shortBalance) },
  { label: '券資比', term: '券資比', render: r => plain(r.shortRatio) },
]

// ===== 月營收亮點 =====
const REVENUE_TABS = [
  { key: 'allTimeHigh', label: '創歷史新高', note: '當月營收高於過去所有月份（至少 24 個月資料），依年增率排序' },
  { key: 'high12', label: '創12個月新高', note: '當月營收高於前 11 個月，依年增率排序' },
  { key: 'growth3', label: '連3個月高成長', note: '近 3 個月年增率都 ≥ 20%，依年增率排序' },
  { key: 'recent', label: '最新公布', note: '這個營收月份最近 3 個公布日公布的公司' },
]
const revenueColumns = () => [
  ...priceCols,
  { label: '營收(億)', term: '月營收', render: r => (r.revenue == null ? '-' : r.revenue.toFixed(2)) },
  { label: '月增率', term: '月增率', render: r => pctCell(r.mom) },
  { label: '年增率', term: '年增率', render: r => <b>{pctCell(r.yoy)}</b> },
  { label: '累計年增率', term: '累計年增率', render: r => pctCell(r.ytdYoy) },
  { label: '公布日', render: r => r.reportDate?.slice(5) ?? '-' },
]

const RevenueCard = () => {
  const [month, setMonth] = useState(null)
  const { data, isLoading, isFetching } = useGetScanRevenue({ month })
  if (isLoading) return <Loading />
  const months = data?.months || []
  return (
    <RankCard
      title="月營收亮點" tabs={REVENUE_TABS} storageKey="scanPage.revenueTab" data={data} columns={revenueColumns}
      right={`${data?.month ?? ''} 營收・已公布 ${data?.reported ?? 0} 家${isFetching ? '・更新中…' : ''}`}
      extra={months.length > 1 && (
        <div className="mt-1 flex items-center gap-1 text-xs">
          <span className="text-gray-400">營收月份</span>
          {months.map(m => (
            <button key={m.month} type="button" onClick={() => setMonth(m.month)}
              className={`rounded border px-2 py-0.5 ${data?.month === m.month ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
              {m.month}（{m.count} 家）
            </button>
          ))}
        </div>
      )}
    />
  )
}

// 盤後掃描：新高與爆量、融資券異常、月營收亮點
function index() {
  const { data: highs, isLoading: highsLoading } = useGetScanHighs()
  const { data: margin, isLoading: marginLoading } = useGetScanMargin()

  return (
    <Box sx={{ p: 2 }}>
      <h3 className="mb-1 text-2xl font-bold">盤後掃描</h3>
      <p className="mb-3 text-sm text-gray-500">上市櫃普通股的新高、爆量、融資券與月營收篩選，只是整理過的名單，不代表買賣建議。</p>
      <div className="flex flex-col gap-3">
        {highsLoading ? <Loading /> : (
          <RankCard title="新高與爆量" tabs={HIGH_TABS} storageKey="scanPage.highTab" data={highs} columns={highColumns}
            right={`${highs?.date ?? ''}・上市櫃普通股`} />
        )}
        {marginLoading ? <Loading /> : (
          <RankCard title="融資券異常" tabs={MARGIN_TABS} storageKey="scanPage.marginTab" data={margin} columns={marginColumns}
            right={`融資券資料 ${margin?.marginDate ?? '-'}${margin?.date && margin?.marginDate !== margin?.date ? `・股價 ${margin.date}` : ''}`} />
        )}
        <RevenueCard />
      </div>
    </Box>
  )
}

export default index
