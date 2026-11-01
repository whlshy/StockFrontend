import React, { useMemo, useState } from 'react'
import { Box, Breadcrumbs, ToggleButton, ToggleButtonGroup, Paper, Button } from '@mui/material'
import { History, BubbleChart as BubbleIcon } from '@mui/icons-material'
import { Link, useNavigate } from 'react-router-dom'

import { useGetGroupNode, useGetGroupFlow, useGetGroupCandles } from '@/apis'
import Loading from '@/components/elements/Loading'
import CandleChart from '@/components/content/stock/CandleChart'
import BubbleChart from './BubbleChart'
import ReplayBubble from './ReplayBubble'
import RankingTable from './RankingTable'
import {
  QUADRANTS, INST_TYPES, CRASH_THRESHOLD, quadrantOf, isContrarianBuy, changeColor, fmtAmt, fmtPct,
} from './groupUtils'

const INST_KEY = 'groupPage.inst'
const loadInst = () => {
  try {
    const v = localStorage.getItem(INST_KEY)
    return INST_TYPES.some(t => t.key === v) ? v : 'total'
  } catch {
    return 'total'
  }
}

const Section = ({ title, extra, children }) => (
  <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <h4 className="text-lg font-bold">{title}</h4>
      {extra}
    </div>
    {children}
  </Paper>
)

const GroupNode = ({ cid }) => {
  const navigate = useNavigate()
  const [inst, setInst] = useState(loadInst)
  const [replay, setReplay] = useState(false)

  const { data: nodeData, isLoading: nodeLoading, isError } = useGetGroupNode({ cid })
  const { data: flow, isLoading: flowLoading, isFetching } = useGetGroupFlow({ cid, inst })
  const { data: candles, isLoading: candlesLoading } = useGetGroupCandles({ cid })

  const node = nodeData?.node
  const hasOther = node?.nChildren > 0 && node?.nOtherStocks > 0
  const { data: otherFlow } = useGetGroupFlow({ cid, inst, direct: true, enabled: hasOther })

  const items = flow?.items || []
  const market = flow?.market
  const isStockLevel = items.length > 0 && items.every(it => it.itemType === 'stock')
  const instLabel = INST_TYPES.find(t => t.key === inst)?.label

  const changeInst = (_, v) => {
    if (!v) return
    setInst(v)
    try { localStorage.setItem(INST_KEY, v) } catch { /* 存不了就算了 */ }
  }

  const onSelect = (it) => {
    if (it.itemType === 'stock') navigate(`/stock/${it.code}`)
    else navigate(`/group/${it.id}`)
  }

  if (nodeLoading) return <Box sx={{ p: 2 }}><Loading /></Box>
  if (isError || !node) return <Box sx={{ p: 2 }}>找不到這個族群分類。<Link to="/group">回族群分析</Link></Box>

  return (
    <Box sx={{ p: 2 }}>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link to="/group" className="text-blue-700">族群分析</Link>
        {(nodeData?.breadcrumb || []).map((b, i, arr) => (
          i === arr.length - 1
            ? <span key={b.cid} className="text-gray-700">{b.name}</span>
            : <Link key={b.cid} to={`/group/${b.cid}`} className="text-blue-700">{b.name}</Link>
        ))}
      </Breadcrumbs>

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-2xl font-bold">{node.name}</h3>
          <p className="text-sm text-gray-500">
            {node.nChildren > 0 ? `${node.nChildren} 個子分類・` : ''}{node.nStocks} 檔股票
            {market?.date && <>・資料日期 {String(market.date).slice(0, 10)}</>}
            {market?.taiexPct1 != null && (
              <>・加權 <span style={{ color: changeColor(market.taiexPct1) }}>{fmtPct(market.taiexPct1)}</span></>
            )}
          </p>
          {!!node.des && <p className="text-sm text-gray-500">{node.des}</p>}
        </div>
        <ToggleButtonGroup size="small" exclusive value={inst} onChange={changeInst}>
          {INST_TYPES.map(t => <ToggleButton key={t.key} value={t.key} sx={{ px: 1.5 }}>{t.label}</ToggleButton>)}
        </ToggleButtonGroup>
      </div>

      {flowLoading ? <Loading /> : (
        <>
          <Highlights items={items} market={market} instLabel={instLabel} onSelect={onSelect} />

          <Section
            title={isStockLevel ? '個股資金分布' : '族群資金分布'}
            extra={
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500">
                  橫軸：近5日{instLabel}淨買超｜縱軸：資金動能｜泡泡大小：近20日成交值｜滾輪縮放、拖曳平移
                  {isFetching && '｜更新中…'}
                </span>
                {items.length > 0 && (
                  <Button
                    size="small"
                    variant={replay ? 'contained' : 'outlined'}
                    startIcon={replay ? <BubbleIcon /> : <History />}
                    onClick={() => setReplay(r => !r)}
                  >
                    {replay ? '回到今天' : '回放近20日'}
                  </Button>
                )}
              </div>
            }
          >
            {items.length === 0
              ? <div className="py-8 text-center text-gray-400">這個分類沒有股票資料</div>
              : replay
                ? <ReplayBubble cid={cid} inst={inst} items={items} onSelect={onSelect} />
                : <BubbleChart items={items} onSelect={onSelect} />}
          </Section>

          <Section title={isStockLevel ? '個股排行' : '族群排行'} extra={<span className="text-xs text-gray-500">點欄位排序，點名稱進入</span>}>
            <RankingTable items={items} onSelect={onSelect} />
          </Section>
        </>
      )}

      <Section title="族群 K 線" extra={<span className="text-xs text-gray-500">包含所有子分類的股票，以前一日收盤為基準平均後累積成指數</span>}>
        {candlesLoading || !Array.isArray(candles)
          ? <Loading />
          : candles.length === 0
            ? <div className="py-8 text-center text-gray-400">沒有K線資料</div>
            : <CandleChart candlestickData={candles} />}
      </Section>

      {hasOther && (
        <Section title="其他個股" extra={<span className="text-xs text-gray-500">直接放在這個分類、不屬於任何子分類的股票</span>}>
          <RankingTable items={otherFlow?.items || []} onSelect={onSelect} />
        </Section>
      )}
    </Box>
  )
}

// 今日重點：象限分布，大跌日列出法人逆勢買超，其他日子列出法人當日買最多
const Highlights = ({ items, market, instLabel, onSelect }) => {
  const counts = useMemo(() => {
    const c = Object.fromEntries(QUADRANTS.map(q => [q.key, 0]))
    for (const it of items) {
      const q = quadrantOf(it)
      if (q) c[q] += 1
    }
    return c
  }, [items])

  const isCrash = market?.taiexPct1 != null && market.taiexPct1 <= CRASH_THRESHOLD
  const picks = useMemo(() => {
    const list = isCrash
      ? items.filter(isContrarianBuy)
      : items.filter(it => it.flow1 > 0)
    return list.sort((a, b) => b.flow1 - a.flow1).slice(0, 5)
  }, [items, isCrash])

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-6">
      {QUADRANTS.map(q => (
        <div key={q.key} className="rounded-lg border px-3 py-2" style={{ background: q.bg, borderColor: q.color + '55' }}>
          <div className="text-sm font-semibold" style={{ color: q.color }}>{q.label}</div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: q.color }}>{counts[q.key]}</div>
          <div className="text-xs text-gray-500">{q.desc}</div>
        </div>
      ))}
      <div className="col-span-2 rounded-lg border border-gray-200 px-3 py-2">
        <div className="text-sm font-semibold text-gray-700">
          {isCrash ? `⚓ 大跌日${instLabel}逆勢買超` : `${instLabel}當日買超最多`}
        </div>
        {picks.length === 0
          ? <div className="mt-1 text-sm text-gray-400">{isCrash ? '今天沒有逆勢買超的族群' : '今天沒有買超的項目'}</div>
          : (
            <ul className="mt-1 space-y-0.5 text-sm">
              {picks.map(it => (
                <li key={`${it.itemType}-${it.id}`} className="flex cursor-pointer justify-between gap-2 hover:bg-gray-50" onClick={() => onSelect(it)}>
                  <span className="truncate text-blue-700">{it.code ? `${it.code} ` : ''}{it.name}</span>
                  <span className="whitespace-nowrap tabular-nums">
                    <span style={{ color: changeColor(it.flow1) }}>{fmtAmt(it.flow1)}億</span>{' '}
                    <span style={{ color: changeColor(it.pct1) }}>{fmtPct(it.pct1)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  )
}

export default GroupNode
