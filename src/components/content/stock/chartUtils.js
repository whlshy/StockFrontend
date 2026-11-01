// K線圖用的資料整理與技術指標計算

export const UP_COLOR = '#ef4444'
export const DOWN_COLOR = '#16a34a'
export const FLAT_COLOR = '#9ca3af'

export const changeColor = (diff) => (diff > 0 ? UP_COLOR : diff < 0 ? DOWN_COLOR : FLAT_COLOR)

const toNum = (v) => (v === null || v === undefined || v === '' ? null : Number(v))

export const day = (t) => String(t ?? '').slice(0, 10)

// API 回傳的 time 可能是 'yyyy-mm-dd hh:mi:ss'，且未保證排序
export const normalizeCandles = (rows) => {
  const map = new Map()
  for (const r of rows || []) {
    const time = day(r.time)
    const open = toNum(r.open), high = toNum(r.high), low = toNum(r.low), close = toNum(r.close)
    if (!time || [open, high, low, close].some(v => v === null || Number.isNaN(v))) continue
    map.set(time, { time, open, high, low, close, value: toNum(r.value) || 0 })
  }
  return [...map.values()].sort((a, b) => (a.time < b.time ? -1 : 1))
}

// 還原K棒：以最新一天對齊實際股價（API 回傳的是向後還原，最新價會大於實際價）
export const toAdjustedCandles = (adjRows, rawBars) => {
  const rows = normalizeCandles(adjRows)
  if (rows.length === 0) return rawBars
  const last = adjRows.find(r => day(r.time) === rows[rows.length - 1].time)
  const ratio = last?.rawClose ? Number(last.rawClose) / rows[rows.length - 1].close : 1
  const valueByTime = new Map(rawBars.map(b => [b.time, b.value]))
  const round = (v) => +(v * ratio).toFixed(2)
  return rows.map(r => ({
    time: r.time,
    open: round(r.open), high: round(r.high), low: round(r.low), close: round(r.close),
    value: valueByTime.get(r.time) ?? 0,
  }))
}

export const periodKey = (time, period) => {
  if (period === 'M') return time.slice(0, 7)
  if (period === 'D') return time
  // 週：以該週週一為 key
  const d = new Date(time + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

export const aggregateCandles = (bars, period) => {
  if (period === 'D') return bars
  const out = []
  let cur = null, curKey = null
  for (const b of bars) {
    const k = periodKey(b.time, period)
    if (k !== curKey) {
      cur && out.push(cur)
      curKey = k
      cur = { ...b }
    } else {
      cur.high = Math.max(cur.high, b.high)
      cur.low = Math.min(cur.low, b.low)
      cur.close = b.close
      cur.value += b.value
    }
  }
  cur && out.push(cur)
  return out
}

// 把日資料對齊到目前週期的K棒時間；mode: 'sum' 加總、'last' 取期末值
export const alignToBars = (rows, bars, period, fields, mode = 'sum') => {
  const barTimeByKey = new Map(bars.map(b => [periodKey(b.time, period), b.time]))
  const out = new Map()
  for (const r of rows || []) {
    const t = barTimeByKey.get(periodKey(day(r.time), period))
    if (!t) continue
    const prev = out.get(t)
    if (!prev || mode === 'last') {
      out.set(t, Object.fromEntries([['time', t], ...fields.map(f => [f, toNum(r[f])])]))
    } else {
      for (const f of fields) prev[f] = (prev[f] ?? 0) + (toNum(r[f]) ?? 0)
    }
  }
  return [...out.values()].sort((a, b) => (a.time < b.time ? -1 : 1))
}

// 事件日期對應到K棒：日K找當天或之後最近一根，週/月K找所屬那一根
export const barTimeForDate = (date, bars, period) => {
  if (period !== 'D') {
    const key = periodKey(date, period)
    const b = bars.find(x => periodKey(x.time, period) === key)
    return b?.time ?? null
  }
  let lo = 0, hi = bars.length - 1, ans = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (bars[mid].time >= date) { ans = mid; hi = mid - 1 } else lo = mid + 1
  }
  return ans >= 0 ? bars[ans].time : null
}

export const calcMA = (bars, len) => {
  const out = []
  let sum = 0
  for (let i = 0; i < bars.length; i++) {
    sum += bars[i].close
    if (i >= len) sum -= bars[i - len].close
    if (i >= len - 1) out.push({ time: bars[i].time, value: +(sum / len).toFixed(2) })
  }
  return out
}

// KD(9,3,3)
export const calcKD = (bars, n = 9) => {
  const k = [], d = []
  let pk = 50, pd = 50
  for (let i = 0; i < bars.length; i++) {
    if (i < n - 1) continue
    let hh = -Infinity, ll = Infinity
    for (let j = i - n + 1; j <= i; j++) {
      hh = Math.max(hh, bars[j].high)
      ll = Math.min(ll, bars[j].low)
    }
    const rsv = hh === ll ? 50 : ((bars[i].close - ll) / (hh - ll)) * 100
    pk = (2 / 3) * pk + rsv / 3
    pd = (2 / 3) * pd + pk / 3
    k.push({ time: bars[i].time, value: +pk.toFixed(2) })
    d.push({ time: bars[i].time, value: +pd.toFixed(2) })
  }
  return { k, d }
}

const ema = (values, len) => {
  const a = 2 / (len + 1)
  const out = []
  let prev = null
  for (const v of values) {
    prev = prev === null ? v : a * v + (1 - a) * prev
    out.push(prev)
  }
  return out
}

// MACD(12,26,9)：DIF、MACD(訊號線)、OSC(柱)
export const calcMACD = (bars, fast = 12, slow = 26, signal = 9) => {
  const closes = bars.map(b => b.close)
  const ef = ema(closes, fast), es = ema(closes, slow)
  const dif = closes.map((_, i) => ef[i] - es[i])
  const sig = ema(dif, signal)
  const out = { dif: [], macd: [], osc: [] }
  for (let i = slow - 1; i < bars.length; i++) {
    const t = bars[i].time
    const osc = dif[i] - sig[i]
    out.dif.push({ time: t, value: +dif[i].toFixed(3) })
    out.macd.push({ time: t, value: +sig[i].toFixed(3) })
    out.osc.push({ time: t, value: +osc.toFixed(3), color: changeColor(osc) + 'aa' })
  }
  return out
}

// RSI (Wilder)
export const calcRSI = (bars, len) => {
  const out = []
  let gain = 0, loss = 0
  for (let i = 1; i < bars.length; i++) {
    const diff = bars[i].close - bars[i - 1].close
    const g = Math.max(diff, 0), l = Math.max(-diff, 0)
    if (i <= len) {
      gain += g / len
      loss += l / len
      if (i < len) continue
    } else {
      gain = (gain * (len - 1) + g) / len
      loss = (loss * (len - 1) + l) / len
    }
    const rsi = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss)
    out.push({ time: bars[i].time, value: +rsi.toFixed(2) })
  }
  return out
}

export const subtractMonths = (time, months) => {
  const d = new Date(time + 'T00:00:00Z')
  d.setUTCMonth(d.getUTCMonth() - months)
  return d.toISOString().slice(0, 10)
}

// value 單位為千元
export const fmtValue = (v) => {
  if (v === null || v === undefined) return '-'
  const yuan = v * 1000
  if (Math.abs(yuan) >= 1e8) return (yuan / 1e8).toFixed(2) + '億'
  if (Math.abs(yuan) >= 1e4) return (yuan / 1e4).toFixed(0) + '萬'
  return yuan.toFixed(0)
}

export const fmtPrice = (v) =>
  v === null || v === undefined || Number.isNaN(v) ? '-' : Number(v).toFixed(2).replace(/\.?0+$/, '')

// 張數：帶正負號與千分位
export const fmtLots = (v, signed = false) => {
  if (v === null || v === undefined) return '-'
  const s = Math.round(v).toLocaleString('zh-TW')
  return signed && v > 0 ? '+' + s : s
}

// ===== 法人籌碼統計 =====

export const DEFAULT_SIGMA = 2
export const COST_DAYS = [5, 20, 60]

// instRows：Institution API（股）；closeByTime：Map(日期 → 收盤價)；key：foreign / trust / dealer / total
// 回傳當日、連續天數、5/20 日累計（張）、動能、異常標記、法人 20 日均價
export const instChipStats = (instRows, closeByTime, key, sigma = DEFAULT_SIGMA) => {
  const rows = (instRows || [])
    .map(r => ({ time: day(r.time), net: toNum(r[key]) }))
    .filter(r => r.net !== null)
    .sort((a, b) => (a.time < b.time ? -1 : 1))
  if (rows.length === 0) return null

  const lots = rows.map(r => r.net / 1000)
  const n = lots.length
  const today = lots[n - 1]

  // 連續買超或賣超天數（0 視為中斷）
  let streak = 0
  const sign = Math.sign(today)
  if (sign !== 0) {
    for (let i = n - 1; i >= 0 && Math.sign(lots[i]) === sign; i--) streak++
  }

  const last = (k) => lots.slice(Math.max(0, n - k))
  const sum = (arr) => arr.reduce((a, b) => a + b, 0)
  const sum5 = sum(last(5)), sum20 = sum(last(20))
  const avg5 = sum5 / Math.min(5, n), avg20 = sum20 / Math.min(20, n)

  // 異常：與今天之前 20 天比較，超出 sigma 個標準差
  const prev = lots.slice(Math.max(0, n - 21), n - 1)
  let zscore = null, abnormal = null
  if (prev.length >= 10) {
    const mean = sum(prev) / prev.length
    const sd = Math.sqrt(sum(prev.map(v => (v - mean) ** 2)) / prev.length)
    if (sd > 0) {
      zscore = (today - mean) / sd
      if (zscore >= sigma && today > 0) abnormal = 'buy'
      else if (zscore <= -sigma && today < 0) abnormal = 'sell'
    }
  }

  // 法人 N 日均價：近 N 日法人買超日的收盤價，依買超張數加權
  const costOf = (days) => {
    let w = 0, ws = 0
    for (const r of rows.slice(Math.max(0, n - days))) {
      const c = closeByTime?.get(r.time)
      if (r.net > 0 && c) { w += r.net; ws += r.net * c }
    }
    return w > 0 ? ws / w : null
  }
  const costs = Object.fromEntries(COST_DAYS.map(d => [d, costOf(d)]))

  return { date: rows[n - 1].time, today, streak, sign, sum5, sum20, avg5, avg20, zscore, abnormal, cost: costs[20], costs }
}
