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