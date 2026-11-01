import api from '../lib/api'
import { useQuery } from '@tanstack/react-query'

// 取得K棒歷史全部資料
export const getStockCandles = async (data = {}) => {
  const response = await api({ method: "GET", cmd: "api/Stock/Candles", data: { ...data } })
  return response
}
export const useGetStockCandles = ({ code }) => {
  return useQuery({ queryKey: ['getStockCandles', code], queryFn: () => getStockCandles({ code }), enabled: !!code })
}

// 取得股票詳情
export const getStockInfo = async (data = {}) => {
  const response = await api({ method: "GET", cmd: "api/Stock/Info", data: { ...data } })
  return response
}
export const useGetStockInfo = ({ code }) => {
  return useQuery({ queryKey: ['getStockInfo', code], queryFn: () => getStockInfo({ code }), enabled: !!code })
}

// 搜尋股票
export const searchStock = async (data = {}) => {
  const response = await api({ method: "GET", cmd: "api/Stock/Search", data: { ...data } })
  return response
}
export const useSearchStock = ({ searchstr = "" }) => {
  return useQuery({ queryKey: ['searchStock', searchstr], queryFn: () => searchStock({ searchstr }), enabled: !!searchstr })
}

// 取得族群K棒歷史365天資料
export const getStockGroupCandles = async (data = {}) => {
  const response = await api({ method: "GET", cmd: "api/Stock/GroupCandles", data: { ...data } })
  return response
}
export const useGetStockGroupCandles = ({ cid }) => {
  return useQuery({ queryKey: ['getStockGroupCandles', cid], queryFn: () => getStockGroupCandles({ cid }), enabled: !!cid })
}

// 取得 Codex 股票筆記
export const getCodexStockNotes = async (data = {}) => {
  const response = await api({ method: "GET", cmd: "api/Stock/ReadCodexNote", data: { ...data } })
  return response
}
export const useGetCodexStockNotes = ({ code }) => {
  return useQuery({ queryKey: ['getCodexStockNotes', code], queryFn: () => getCodexStockNotes({ code }), enabled: !!code })
}
// 個股延伸資料（還原K棒、籌碼、財報、事件、大盤）
const makeStockQuery = (key, cmd) => {
  const fetcher = async (data = {}) => api({ method: "GET", cmd, data: { ...data } })
  const useHook = ({ code, enabled = true }) =>
    useQuery({ queryKey: [key, code], queryFn: () => fetcher({ code }), enabled: !!code && enabled, staleTime: 5 * 60 * 1000 })
  return [fetcher, useHook]
}

export const [getStockAdjustedCandles, useGetStockAdjustedCandles] = makeStockQuery('getStockAdjustedCandles', 'api/Stock/AdjustedCandles')
export const [getStockInstitution, useGetStockInstitution] = makeStockQuery('getStockInstitution', 'api/Stock/Institution')
export const [getStockMargin, useGetStockMargin] = makeStockQuery('getStockMargin', 'api/Stock/Margin')
export const [getStockRevenue, useGetStockRevenue] = makeStockQuery('getStockRevenue', 'api/Stock/Revenue')
export const [getStockEps, useGetStockEps] = makeStockQuery('getStockEps', 'api/Stock/Eps')
export const [getStockEvents, useGetStockEvents] = makeStockQuery('getStockEvents', 'api/Stock/Events')

export const getMarketIndex = async (data = {}) => api({ method: "GET", cmd: "api/Stock/MarketIndex", data: { ...data } })
export const useGetMarketIndex = ({ indexCode = 'TAIEX', enabled = true } = {}) =>
  useQuery({ queryKey: ['getMarketIndex', indexCode], queryFn: () => getMarketIndex({ indexCode }), enabled, staleTime: 5 * 60 * 1000 })
