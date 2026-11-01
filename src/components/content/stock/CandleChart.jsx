import React, { useRef, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import {
  createChart, createSeriesMarkers, CandlestickSeries, HistogramSeries, LineSeries, CrosshairMode,
} from 'lightweight-charts'

import {
  useGetStockAdjustedCandles, useGetStockInstitution, useGetStockMargin, useGetStockEvents, useGetMarketIndex,
} from '@/apis'
import {
  UP_COLOR, DOWN_COLOR, changeColor, day, normalizeCandles, toAdjustedCandles, aggregateCandles, alignToBars,
  barTimeForDate, calcMA, calcKD, calcMACD, calcRSI, subtractMonths, fmtValue, fmtPrice, fmtLots, instChipStats,
} from './chartUtils'

const PERIODS = [
  { key: 'D', label: '日K' },
  { key: 'W', label: '週K' },
  { key: 'M', label: '月K' },
]

// months: 顯示幾個月；null = 全部
const RANGES = [
  { key: '1M', label: '1月', months: 1 },
  { key: '3M', label: '3月', months: 3 },
  { key: '6M', label: '6月', months: 6 },
  { key: '1Y', label: '1年', months: 12 },
  { key: '3Y', label: '3年', months: 36 },
  { key: 'ALL', label: '全部', months: null },
]

const MAS = [
  { len: 5, color: '#f59e0b' },
  { len: 10, color: '#3b82f6' },
  { len: 20, color: '#a855f7' },
  { len: 60, color: '#0d9488' },
  { len: 120, color: '#e11d48' },
  { len: 240, color: '#64748b' },
]

// 副圖；needCode: 需要個股代碼才有資料（族群頁沒有）
const PANES = [
  { key: 'volume', label: '成交量' },
  { key: 'institution', label: '法人', needCode: true },
  { key: 'margin', label: '融資券', needCode: true },
  { key: 'kd', label: 'KD' },
  { key: 'macd', label: 'MACD' },
  { key: 'rsi', label: 'RSI' },
]

const INST_TYPES = [
  { key: 'total', label: '合計' },
  { key: 'foreign', label: '外資' },
  { key: 'trust', label: '投信' },
  { key: 'dealer', label: '自營' },
]

const EVENT_TYPES = [
  { key: 'dividend', label: '除權息', color: '#2563eb', text: '息', shape: 'circle' },
  { key: 'attention', label: '注意', color: '#f59e0b', text: '注', shape: 'square' },
  { key: 'disposition', label: '處置', color: '#dc2626', text: '處', shape: 'arrowDown' },
  { key: 'note', label: '筆記', color: '#7c3aed', text: '記', shape: 'circle', below: true },
]

const MARKET_COLOR = '#0ea5e9'
const COST_COLOR = '#7c3aed'
const MAIN_HEIGHT = 420
const SUB_HEIGHT = 110

// 依週期給預設區間，避免月K只顯示幾根
const DEFAULT_RANGE = { D: '6M', W: '3Y', M: 'ALL' }

// 工具列設定存在 localStorage；每個週期各自記住區間
const SETTINGS_KEY = 'stockChart.settings'
const DEFAULT_SETTINGS = {
  period: 'D',
  ranges: DEFAULT_RANGE,
  mas: MAS.map(m => m.len),
  panes: ['volume', 'institution'],
  instType: 'total',
  events: EVENT_TYPES.map(e => e.key),
  adjusted: false,
  market: false,
  costLine: false,
}

const pickList = (value, allowed, fallback) =>
  Array.isArray(value) ? value.filter(v => allowed.includes(v)) : fallback

const loadSettings = () => {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    const ranges = { ...DEFAULT_RANGE }
    for (const p of PERIODS) {
      if (RANGES.some(r => r.key === s.ranges?.[p.key])) ranges[p.key] = s.ranges[p.key]
    }
    return {
      period: PERIODS.some(p => p.key === s.period) ? s.period : DEFAULT_SETTINGS.period,
      ranges,
      mas: pickList(s.mas, MAS.map(m => m.len), DEFAULT_SETTINGS.mas),
      panes: pickList(s.panes, PANES.map(p => p.key), DEFAULT_SETTINGS.panes),
      instType: INST_TYPES.some(t => t.key === s.instType) ? s.instType : DEFAULT_SETTINGS.instType,
      events: pickList(s.events, EVENT_TYPES.map(e => e.key), DEFAULT_SETTINGS.events),
      adjusted: typeof s.adjusted === 'boolean' ? s.adjusted : DEFAULT_SETTINGS.adjusted,
      market: typeof s.market === 'boolean' ? s.market : DEFAULT_SETTINGS.market,
      costLine: typeof s.costLine === 'boolean' ? s.costLine : DEFAULT_SETTINGS.costLine,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

const saveSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch { /* 無痕模式等情況存不了就算了 */ }
}

const toggleIn = (list, key) => (list.includes(key) ? list.filter(x => x !== key) : [...list, key])

const byTime = (rows) => new Map((rows || []).map(r => [r.time, r]))

const StockChart = ({ candlestickData, code, notes, onNoteClick }) => {
  const containerRef = useRef()
  const chartRef = useRef()
  const savedRangeRef = useRef(null)
  const onNoteClickRef = useRef(onNoteClick)
  onNoteClickRef.current = onNoteClick

  const [settings, setSettings] = useState(loadSettings)
  const [hoverTime, setHoverTime] = useState(null)

  useEffect(() => saveSettings(settings), [settings])

  const { period, mas: enabledMAs, instType, adjusted, market } = settings
  const costLine = !!code && settings.costLine
  const range = settings.ranges[period]
  const hasCode = !!code
  const panes = PANES.filter(p => settings.panes.includes(p.key) && (!p.needCode || hasCode)).map(p => p.key)
  const panesKey = panes.join(',')
  const events = hasCode ? settings.events : []
  const useAdjusted = hasCode && adjusted

  // 資料來源
  const { data: adjRows } = useGetStockAdjustedCandles({ code, enabled: useAdjusted })
  const { data: instRows } = useGetStockInstitution({ code, enabled: panes.includes('institution') || costLine })
  const { data: marginRows } = useGetStockMargin({ code, enabled: panes.includes('margin') })
  const { data: eventRows } = useGetStockEvents({ code, enabled: events.length > 0 })
  const { data: marketRows } = useGetMarketIndex({ enabled: market })

  const rawDaily = useMemo(() => normalizeCandles(candlestickData), [candlestickData])
  const daily = useMemo(
    () => (useAdjusted && Array.isArray(adjRows) ? toAdjustedCandles(adjRows, rawDaily) : rawDaily),
    [useAdjusted, adjRows, rawDaily]
  )
  const bars = useMemo(() => aggregateCandles(daily, period), [daily, period])
  const indexByTime = useMemo(() => new Map(bars.map((b, i) => [b.time, i])), [bars])

  const maData = useMemo(() => Object.fromEntries(MAS.map(m => [m.len, calcMA(bars, m.len)])), [bars])
  const kd = useMemo(() => (panes.includes('kd') ? calcKD(bars) : null), [bars, panesKey])
  const macd = useMemo(() => (panes.includes('macd') ? calcMACD(bars) : null), [bars, panesKey])
  const rsi = useMemo(
    () => (panes.includes('rsi') ? { r6: calcRSI(bars, 6), r12: calcRSI(bars, 12) } : null),
    [bars, panesKey]
  )

  // 法人：股 → 張，週/月加總
  const inst = useMemo(() => {
    if (!Array.isArray(instRows)) return []
    return alignToBars(instRows, bars, period, ['foreign', 'trust', 'dealer', 'total'], 'sum')
      .map(r => ({ ...r, foreign: r.foreign / 1000, trust: r.trust / 1000, dealer: r.dealer / 1000, total: r.total / 1000 }))
  }, [instRows, bars, period])

  const margin = useMemo(
    () => (Array.isArray(marginRows) ? alignToBars(marginRows, bars, period, ['marginBalance', 'shortBalance'], 'last') : []),
    [marginRows, bars, period]
  )

  const marketLine = useMemo(
    () => (market && Array.isArray(marketRows) ? alignToBars(marketRows, bars, period, ['close'], 'last') : []),
    [market, marketRows, bars, period]
  )

  // 加權指數換算到股價刻度：在所選區間的第一根與股價對齊，方便比較相對強弱
  const marketScaled = useMemo(() => {
    if (marketLine.length === 0 || bars.length === 0) return []
    const r = RANGES.find(x => x.key === range)
    const from = r?.months ? subtractMonths(bars[bars.length - 1].time, r.months) : bars[0].time
    const anchor = marketLine.find(m => m.time >= from && m.close)
    const bar = anchor && bars.find(b => b.time === anchor.time)
    if (!bar) return []
    const factor = bar.close / anchor.close
    return marketLine.filter(m => m.close != null).map(m => ({ time: m.time, value: +(m.close * factor).toFixed(2) }))
  }, [marketLine, bars, range])

  // 法人 20 日均價：用畫面上的日K收盤（開還原時就是還原價）計算
  const costPrice = useMemo(() => {
    if (!costLine || !Array.isArray(instRows)) return null
    const closeByTime = new Map(daily.map(b => [b.time, b.close]))
    const st = instChipStats(instRows, closeByTime, instType)
    return st?.cost ? +st.cost.toFixed(2) : null
  }, [costLine, instRows, daily, instType])

  // 事件（含筆記）→ 依K棒時間分組
  const eventsByBar = useMemo(() => {
    const all = []
    if (Array.isArray(eventRows)) all.push(...eventRows)
    if (events.includes('note') && Array.isArray(notes)) {
      for (const n of notes) {
        if (n.NoteDate) all.push({ type: 'note', time: day(n.NoteDate), title: n.Title || '筆記', note: n })
      }
    }
    const map = new Map()
    for (const e of all) {
      if (!events.includes(e.type)) continue
      const t = barTimeForDate(day(e.time), bars, period)
      if (!t) continue
      map.has(t) || map.set(t, [])
      map.get(t).push(e)
    }
    return map
  }, [eventRows, notes, events.join(','), bars, period])

  const lookups = useMemo(() => ({
    inst: byTime(inst),
    margin: byTime(margin),
    market: byTime(marketLine),
    kdK: byTime(kd?.k), kdD: byTime(kd?.d),
    dif: byTime(macd?.dif), macd: byTime(macd?.macd), osc: byTime(macd?.osc),
    r6: byTime(rsi?.r6), r12: byTime(rsi?.r12),
  }), [inst, margin, marketLine, kd, macd, rsi])

  const totalHeight = MAIN_HEIGHT + panes.length * SUB_HEIGHT

  // 建立圖表；設定或資料變動時整張重建，並保留目前可視範圍
  useEffect(() => {
    const el = containerRef.current
    const chart = createChart(el, {
      width: el.clientWidth,
      height: totalHeight,
      layout: {
        background: { color: 'transparent' },
        textColor: '#4b5563',
        fontSize: 12,
        panes: { separatorColor: '#e5e7eb', enableResize: true },
      },
      grid: { vertLines: { color: '#f3f4f6' }, horzLines: { color: '#f3f4f6' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#e5e7eb', minimumWidth: 70 },
      timeScale: { borderColor: '#e5e7eb', rightOffset: 3, minBarSpacing: 1 },
      localization: { locale: 'zh-TW', dateFormat: 'yyyy-MM-dd' },
    })

    // 主圖
    const candle = chart.addSeries(CandlestickSeries, {
      upColor: UP_COLOR, downColor: DOWN_COLOR, wickUpColor: UP_COLOR, wickDownColor: DOWN_COLOR,
      borderVisible: false, priceLineStyle: 2,
    })
    candle.setData(bars)

    for (const m of MAS) {
      if (!enabledMAs.includes(m.len)) continue
      chart.addSeries(LineSeries, {
        color: m.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
        // 價格刻度只依K棒縮放，長天期均線離太遠時不會把K棒壓扁
        autoscaleInfoProvider: () => null,
      }).setData(maData[m.len])
    }

    if (marketScaled.length) {
      chart.addSeries(LineSeries, {
        color: MARKET_COLOR, lineWidth: 1, lineStyle: 2,
        priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false, autoscaleInfoProvider: () => null,
      }).setData(marketScaled)
    }

    // 事件標記
    const markers = []
    for (const [time, list] of eventsByBar) {
      for (const et of EVENT_TYPES) {
        if (!list.some(e => e.type === et.key)) continue
        markers.push({
          time, position: et.below ? 'belowBar' : 'aboveBar', color: et.color, shape: et.shape, text: et.text, size: 1,
        })
      }
    }
    markers.sort((a, b) => (a.time < b.time ? -1 : 1))
    createSeriesMarkers(candle, markers)

    // 法人 20 日均價（依目前選的法人類型）
    if (costPrice) {
      candle.createPriceLine({
        price: costPrice, color: COST_COLOR, lineWidth: 1, lineStyle: 2, axisLabelVisible: true,
        title: `${INST_TYPES.find(t => t.key === instType)?.label}均價`,
      })
    }

    // 副圖
    const lineOpts = { lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false }
    panes.forEach((key, i) => {
      const pane = i + 1
      if (key === 'volume') {
        chart.addSeries(HistogramSeries, {
          priceFormat: { type: 'custom', formatter: fmtValue, minMove: 1 }, priceLineVisible: false,
        }, pane).setData(bars.map((b, j) => ({
          time: b.time, value: b.value, color: changeColor(b.close - (j > 0 ? bars[j - 1].close : b.open)) + '99',
        })))
      } else if (key === 'institution') {
        chart.addSeries(HistogramSeries, {
          priceFormat: { type: 'custom', formatter: v => fmtLots(v), minMove: 1 }, priceLineVisible: false,
        }, pane).setData(inst.map(r => ({ time: r.time, value: r[instType], color: changeColor(r[instType]) + 'aa' })))
      } else if (key === 'margin') {
        chart.addSeries(LineSeries, {
          ...lineOpts, color: UP_COLOR, priceFormat: { type: 'custom', formatter: v => fmtLots(v), minMove: 1 },
        }, pane).setData(margin.filter(r => r.marginBalance != null).map(r => ({ time: r.time, value: r.marginBalance })))
        // 融券量級差很多，放獨立的隱藏刻度
        const short = chart.addSeries(LineSeries, { ...lineOpts, color: DOWN_COLOR, priceScaleId: 'short' }, pane)
        short.setData(margin.filter(r => r.shortBalance != null).map(r => ({ time: r.time, value: r.shortBalance })))
        short.priceScale().applyOptions({ visible: false })
      } else if (key === 'kd') {
        const k = chart.addSeries(LineSeries, { ...lineOpts, color: '#f59e0b' }, pane)
        k.setData(kd.k)
        chart.addSeries(LineSeries, { ...lineOpts, color: '#3b82f6' }, pane).setData(kd.d)
        for (const p of [80, 20]) k.createPriceLine({ price: p, color: '#d1d5db', lineWidth: 1, lineStyle: 2, axisLabelVisible: false })
      } else if (key === 'macd') {
        chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false }, pane).setData(macd.osc)
        chart.addSeries(LineSeries, { ...lineOpts, color: '#f59e0b' }, pane).setData(macd.dif)
        chart.addSeries(LineSeries, { ...lineOpts, color: '#3b82f6' }, pane).setData(macd.macd)
      } else if (key === 'rsi') {
        const r6 = chart.addSeries(LineSeries, { ...lineOpts, color: '#f59e0b' }, pane)
        r6.setData(rsi.r6)
        chart.addSeries(LineSeries, { ...lineOpts, color: '#3b82f6' }, pane).setData(rsi.r12)
        for (const p of [70, 30]) r6.createPriceLine({ price: p, color: '#d1d5db', lineWidth: 1, lineStyle: 2, axisLabelVisible: false })
      }
    })

    // setHeight 依窗格目前的實際高度分配，要等第一次排版後再設；剩餘高度會平均分給副圖
    const raf = requestAnimationFrame(() => {
      const allPanes = chart.panes()
      allPanes.length > 1 && allPanes[0].setHeight(MAIN_HEIGHT)
    })

    const observer = new ResizeObserver(entries => {
      const w = Math.floor(entries[0].contentRect.width)
      w > 0 && chart.applyOptions({ width: w })
    })
    observer.observe(el)

    if (savedRangeRef.current) chart.timeScale().setVisibleLogicalRange(savedRangeRef.current)

    chart.subscribeCrosshairMove(param => setHoverTime(param.time ?? null))
    chart.subscribeClick(param => {
      const note = param.time && eventsByBar.get(param.time)?.find(e => e.type === 'note')?.note
      note && onNoteClickRef.current?.(note)
    })

    chartRef.current = chart
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      savedRangeRef.current = chart.timeScale().getVisibleLogicalRange()
      chart.remove()
      chartRef.current = null
    }
  }, [bars, maData, enabledMAs.join(','), panesKey, instType, inst, margin, kd, macd, rsi, marketScaled, eventsByBar, totalHeight, costPrice])

  // 顯示區間（切換區間或K棒重算時套用）
  useEffect(() => {
    const chart = chartRef.current
    if (!chart || bars.length === 0) return
    const r = RANGES.find(x => x.key === range)
    if (!r?.months) {
      chart.timeScale().fitContent()
      return
    }
    const fromTime = subtractMonths(bars[bars.length - 1].time, r.months)
    const fromIdx = bars.findIndex(b => b.time >= fromTime)
    chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, fromIdx) - 0.5, to: bars.length - 1 + 3 })
  }, [range, bars])

  const update = (patch) => setSettings(s => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }))
  const changePeriod = (p) => update({ period: p })
  const setRange = (r) => update(s => ({ ranges: { ...s.ranges, [s.period]: r } }))

  // 切換週期後舊的懸停日期可能不存在，退回最後一根
  const idx = indexByTime.get(hoverTime) ?? bars.length - 1
  const bar = bars[idx]
  const time = bar?.time
  const prevClose = idx > 0 ? bars[idx - 1]?.close : bar?.open
  const diff = bar ? bar.close - prevClose : 0
  const diffPct = bar && prevClose ? (diff / prevClose) * 100 : 0
  const maAt = (len) => {
    const i = idx - (len - 1)
    return i >= 0 ? maData[len][i]?.value : null
  }
  const barEvents = (time && eventsByBar.get(time)) || []

  // 資訊列高度鎖定：只增不減；設定或寬度改變時重新量
  const legendRef = useRef()
  const [legendMinHeight, setLegendMinHeight] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const layoutKey = `${panesKey}|${enabledMAs.join(',')}|${market}|${useAdjusted}|${events.join(',')}|${containerWidth}`
  const lastLayoutKeyRef = useRef(null)
  useLayoutEffect(() => {
    const h = legendRef.current?.offsetHeight ?? 0
    if (lastLayoutKeyRef.current !== layoutKey) {
      lastLayoutKeyRef.current = layoutKey
      setLegendMinHeight(h)
    } else if (h > legendMinHeight) {
      setLegendMinHeight(h)
    }
  })
  useEffect(() => {
    const el = legendRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => setContainerWidth(Math.round(entries[0].contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="w-full rounded-lg border border-gray-200">
      {/* 工具列 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-200 px-3 py-2 text-sm">
        <ButtonGroup items={PERIODS} value={period} onChange={changePeriod} />
        <ButtonGroup items={RANGES} value={range} onChange={setRange} />
        <div className="flex flex-wrap gap-1">
          {MAS.map(m => (
            <Toggle key={m.len} on={enabledMAs.includes(m.len)} color={m.color}
              onClick={() => update(s => ({ mas: toggleIn(s.mas, m.len) }))}>
              MA{m.len}
            </Toggle>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {hasCode && (
            <Toggle on={adjusted} color="#334155" onClick={() => update(s => ({ adjusted: !s.adjusted }))}
              title="以還原權息價格計算K線與指標">
              還原
            </Toggle>
          )}
          <Toggle on={market} color={MARKET_COLOR} onClick={() => update(s => ({ market: !s.market }))}
            title="疊加加權指數，於所選區間起點與股價對齊">
            加權指數
          </Toggle>
          {hasCode && (
            <Toggle on={costLine} color={COST_COLOR} onClick={() => update(s => ({ costLine: !s.costLine }))}
              title="近20日法人買超日的收盤價，依買超張數加權平均；跟著法人副圖的「合計／外資／投信／自營」切換">
              法人均價
            </Toggle>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-200 px-3 py-2 text-sm">
        <Group label="副圖">
          {PANES.filter(p => !p.needCode || hasCode).map(p => (
            <Toggle key={p.key} on={panes.includes(p.key)} color="#334155"
              onClick={() => update(s => ({ panes: toggleIn(s.panes, p.key) }))}>
              {p.label}
            </Toggle>
          ))}
        </Group>
        {panes.includes('institution') && (
          <Group label="法人">
            <ButtonGroup items={INST_TYPES} value={instType} onChange={t => update({ instType: t })} />
          </Group>
        )}
        {hasCode && (
          <Group label="事件">
            {EVENT_TYPES.map(e => (
              <Toggle key={e.key} on={settings.events.includes(e.key)} color={e.color}
                onClick={() => update(s => ({ events: toggleIn(s.events, e.key) }))}>
                <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: e.color }} />
                {e.label}
              </Toggle>
            ))}
          </Group>
        )}
      </div>

      {/* 資訊列：高度只增不減，避免滑鼠移動時內容換行把圖表往下推 */}
      <div style={{ minHeight: legendMinHeight }}>
      <div ref={legendRef}>
      <div className="flex min-h-[36px] flex-wrap items-center gap-x-4 gap-y-1 px-3 pt-1.5 text-sm tabular-nums">
        {bar ? (
          <>
            <span className="font-semibold text-gray-700">{bar.time}</span>
            <Field label="開" value={fmtPrice(bar.open)} />
            <Field label="高" value={fmtPrice(bar.high)} color={changeColor(bar.high - prevClose)} />
            <Field label="低" value={fmtPrice(bar.low)} color={changeColor(bar.low - prevClose)} />
            <Field label="收" value={fmtPrice(bar.close)} color={changeColor(diff)} bold />
            <V w={15} color={changeColor(diff)} bold>
              {diff > 0 ? '▲' : diff < 0 ? '▼' : ''}{fmtPrice(Math.abs(diff))}
              （{diff > 0 ? '+' : ''}{diffPct.toFixed(2)}%）
            </V>
            <Field label="成交值" value={fmtValue(bar.value)} w={9} />
            {MAS.filter(m => enabledMAs.includes(m.len)).map(m => (
              <span key={m.len} style={{ color: m.color }}>MA{m.len} <V w={6}>{fmtPrice(maAt(m.len))}</V></span>
            ))}
            {market && <span style={{ color: MARKET_COLOR }}>加權 <V w={8}>{fmtPrice(lookups.market.get(time)?.close)}</V></span>}
            {useAdjusted && <span className="rounded bg-slate-100 px-1.5 text-xs leading-5 text-slate-600">還原價</span>}
          </>
        ) : (
          <span className="text-gray-400">沒有K線資料</span>
        )}
      </div>
      {bar && panes.some(p => p !== 'volume') && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 pt-1 text-sm tabular-nums">
          {panes.includes('institution') && (() => {
            const r = lookups.inst.get(time)
            return (
              <span>
                <span className="text-gray-400">法人(張) </span>
                {INST_TYPES.map(t => (
                  <span key={t.key} className="mr-2">
                    {t.label} <V w={8} color={changeColor(r?.[t.key])}>{fmtLots(r?.[t.key], true)}</V>
                  </span>
                ))}
              </span>
            )
          })()}
          {panes.includes('margin') && (() => {
            const r = lookups.margin.get(time)
            return (
              <span>
                <span className="text-gray-400">餘額(張) </span>
                <span style={{ color: UP_COLOR }}>融資 <V w={8}>{fmtLots(r?.marginBalance)}</V></span>{' '}
                <span style={{ color: DOWN_COLOR }}>融券 <V w={7}>{fmtLots(r?.shortBalance)}</V></span>{' '}
                <span className="text-gray-500">
                  {r?.marginBalance
                    ? <>券資比 <V w={7}>{((r.shortBalance / r.marginBalance) * 100).toFixed(2)}%</V></>
                    : margin.length > 0 && time > margin[margin.length - 1].time
                      ? <span className="text-gray-400">（資料至 {margin[margin.length - 1].time}）</span>
                      : <V w={13}>{' '}</V>}
                </span>
              </span>
            )
          })()}
          {panes.includes('kd') && (
            <span>
              <span style={{ color: '#f59e0b' }}>K <V w={5}>{fmtPrice(lookups.kdK.get(time)?.value)}</V></span>{' '}
              <span style={{ color: '#3b82f6' }}>D <V w={5}>{fmtPrice(lookups.kdD.get(time)?.value)}</V></span>
            </span>
          )}
          {panes.includes('macd') && (
            <span>
              <span style={{ color: '#f59e0b' }}>DIF <V w={7}>{fmtPrice(lookups.dif.get(time)?.value)}</V></span>{' '}
              <span style={{ color: '#3b82f6' }}>MACD <V w={7}>{fmtPrice(lookups.macd.get(time)?.value)}</V></span>{' '}
              <span style={{ color: changeColor(lookups.osc.get(time)?.value) }}>OSC <V w={7}>{fmtPrice(lookups.osc.get(time)?.value)}</V></span>
            </span>
          )}
          {panes.includes('rsi') && (
            <span>
              <span style={{ color: '#f59e0b' }}>RSI6 <V w={5}>{fmtPrice(lookups.r6.get(time)?.value)}</V></span>{' '}
              <span style={{ color: '#3b82f6' }}>RSI12 <V w={5}>{fmtPrice(lookups.r12.get(time)?.value)}</V></span>
            </span>
          )}
        </div>
      )}
      {hasCode && events.length > 0 && (
        // 固定一行，事件多時截斷，滑鼠移上去看全文
        <div
          className="h-5 truncate px-3 pt-1 text-xs leading-4"
          title={barEvents.map(e => `【${e.title}】${e.type === 'note' ? '' : e.detail || ''}`).join('\n')}
        >
          {barEvents.map((e, i) => {
            const et = EVENT_TYPES.find(x => x.key === e.type)
            return (
              <span key={i} className="mr-3">
                <span className="font-semibold" style={{ color: et?.color }}>【{e.title}】</span>
                <span className="text-gray-600">{e.type === 'note' ? '點K棒可開啟筆記' : e.detail}</span>
              </span>
            )
          })}
        </div>
      )}
      </div>
      </div>

      <div ref={containerRef} style={{ height: totalHeight }} className="mt-1 w-full" />
    </div>
  )
}

const ButtonGroup = ({ items, value, onChange }) => (
  <div className="inline-flex overflow-hidden rounded border border-gray-300">
    {items.map((it, i) => (
      <button
        key={it.key}
        type="button"
        onClick={() => onChange(it.key)}
        className={[
          'px-2.5 py-0.5 text-xs transition-colors',
          i > 0 ? 'border-l border-gray-300' : '',
          value === it.key ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100',
        ].join(' ')}
      >
        {it.label}
      </button>
    ))}
  </div>
)

const Toggle = ({ on, color, onClick, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="inline-flex items-center rounded border px-2 py-0.5 text-xs transition-colors"
    style={on
      ? { borderColor: color, color, fontWeight: 600 }
      : { borderColor: '#e5e7eb', color: '#9ca3af' }}
  >
    {children}
  </button>
)

const Group = ({ label, children }) => (
  <div className="flex flex-wrap items-center gap-1">
    <span className="mr-1 text-xs text-gray-400">{label}</span>
    {children}
  </div>
)

const Field = ({ label, value, color, bold, w = 6 }) => (
  <span>
    <span className="text-gray-400">{label} </span>
    <V w={w} color={color} bold={bold}>{value}</V>
  </span>
)

// 固定最小寬度的數值，避免數字長短不同造成資訊列換行位置改變（圖表跳動）
const V = ({ w, color, bold, children }) => (
  <span className={`inline-block ${bold ? 'font-semibold' : ''}`} style={{ color, minWidth: `${w}ch` }}>{children}</span>
)

export default StockChart
