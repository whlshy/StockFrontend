import api from '../lib/api'
import { useQuery, keepPreviousData } from '@tanstack/react-query'

// 首頁市場總覽

// 今日焦點、籌碼排行每個分頁取幾名，前端再分頁顯示
const HOME_RANK_TOP = 100

// 大盤卡片：加權、櫃買近 60 日收盤與成交值，三大法人上市、上櫃買賣超（億）
export const getHomeMarket = async () => api({ method: "GET", cmd: "api/Home/Market" })
export const useGetHomeMarket = () =>
  useQuery({ queryKey: ['getHomeMarket'], queryFn: getHomeMarket, staleTime: 5 * 60 * 1000 })

// 市場寬度：上漲、下跌、平盤、漲停、跌停家數
export const getHomeBreadth = async () => api({ method: "GET", cmd: "api/Home/Breadth" })
export const useGetHomeBreadth = () =>
  useQuery({ queryKey: ['getHomeBreadth'], queryFn: getHomeBreadth, staleTime: 5 * 60 * 1000 })

export const getHomeFocus = async () => api({ method: "GET", cmd: "api/Home/Focus", data: { top: HOME_RANK_TOP } })
export const useGetHomeFocus = () =>
  useQuery({ queryKey: ['getHomeFocus'], queryFn: getHomeFocus, staleTime: 5 * 60 * 1000 })

// 籌碼排行：外資投信同買／同賣、外資與投信連買／連賣、逆勢買超
export const getHomeChips = async () => api({ method: "GET", cmd: "api/Home/Chips", data: { top: HOME_RANK_TOP } })
export const useGetHomeChips = () =>
  useQuery({ queryKey: ['getHomeChips'], queryFn: getHomeChips, staleTime: 5 * 60 * 1000 })

// 盤後掃描：新高與爆量、融資券異常、月營收亮點
export const getScanHighs = async () => api({ method: "GET", cmd: "api/Home/Highs", data: { top: HOME_RANK_TOP } })
export const useGetScanHighs = () =>
  useQuery({ queryKey: ['getScanHighs'], queryFn: getScanHighs, staleTime: 5 * 60 * 1000 })

export const getScanMargin = async () => api({ method: "GET", cmd: "api/Home/Margin", data: { top: HOME_RANK_TOP } })
export const useGetScanMargin = () =>
  useQuery({ queryKey: ['getScanMargin'], queryFn: getScanMargin, staleTime: 5 * 60 * 1000 })

// month：yyyy-MM，不給為最新營收月份
export const getScanRevenue = async ({ month } = {}) =>
  api({ method: "GET", cmd: "api/Home/Revenue", data: month ? { month, top: HOME_RANK_TOP } : { top: HOME_RANK_TOP } })
export const useGetScanRevenue = ({ month } = {}) =>
  useQuery({ queryKey: ['getScanRevenue', month ?? ''], queryFn: () => getScanRevenue({ month }), staleTime: 5 * 60 * 1000, placeholderData: keepPreviousData })
