import { changeColor } from '../stock/chartUtils'

// 會有正負號、用紅綠色表示的欄位（漲跌幅、相對均線、買賣超、增減、年增率等）
const SIGNED = /^(pct|vs|rev(Yoy|Mom|YtdYoy|MinYoy)|epsYoy|marginChg|[ftda](Net|Amt|Days)|macdOsc)/

export const isSigned = (key) => SIGNED.test(key)

// 依欄位的單位與小數位數格式化，回傳 { text, color }
export const formatField = (field, v) => {
  if (v === null || v === undefined || Number.isNaN(v)) return { text: '-' }
  if (field?.kind === 'bool') return { text: v === 1 ? '是' : '否' }
  const digits = field?.digits ?? 2
  const signed = isSigned(field?.key)
  const num = Math.abs(v) >= 1000
    ? Math.round(v).toLocaleString('zh-TW')
    : v.toFixed(digits)
  const unit = field?.unit === '%' ? '%' : field?.unit === '倍' ? 'x' : ''
  return {
    text: `${signed && v > 0 ? '+' : ''}${num}${unit}`,
    color: signed ? changeColor(v) : undefined,
  }
}
