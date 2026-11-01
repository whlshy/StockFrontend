import api from '../lib/api'
import { useQuery, keepPreviousData } from '@tanstack/react-query'

// 族群分析（433 族群底下的分類）

export const getGroupRoots = async () => api({ method: "GET", cmd: "api/Group/Roots" })
export const useGetGroupRoots = () =>
  useQuery({ queryKey: ['getGroupRoots'], queryFn: getGroupRoots, staleTime: 5 * 60 * 1000 })

export const getGroupNode = async (data = {}) => api({ method: "GET", cmd: "api/Group/Node", data: { ...data } })
export const useGetGroupNode = ({ cid }) =>
  useQuery({ queryKey: ['getGroupNode', cid], queryFn: () => getGroupNode({ cid }), enabled: !!cid, staleTime: 5 * 60 * 1000 })

// inst：total / foreign / trust / dealer；direct：只算直接放在此分類、不屬於子分類的個股
export const getGroupFlow = async (data = {}) => api({ method: "GET", cmd: "api/Group/Flow", data: { ...data } })
export const useGetGroupFlow = ({ cid, inst = 'total', direct = false, enabled = true }) =>
  useQuery({
    queryKey: ['getGroupFlow', cid, inst, direct],
    queryFn: () => getGroupFlow({ cid, inst, direct }),
    enabled: !!cid && enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  })

export const getGroupCandles = async (data = {}) => api({ method: "GET", cmd: "api/Group/Candles", data: { ...data } })
export const useGetGroupCandles = ({ cid }) =>
  useQuery({ queryKey: ['getGroupCandles', cid], queryFn: () => getGroupCandles({ cid }), enabled: !!cid, staleTime: 5 * 60 * 1000 })

// 資金輪動回放：近 20 個交易日每天的泡泡位置
export const getGroupFlowHistory = async (data = {}) => api({ method: "GET", cmd: "api/Group/FlowHistory", data: { ...data } })
export const useGetGroupFlowHistory = ({ cid, inst = 'total', enabled = true }) =>
  useQuery({
    queryKey: ['getGroupFlowHistory', cid, inst],
    queryFn: () => getGroupFlowHistory({ cid, inst }),
    enabled: !!cid && enabled,
    staleTime: 5 * 60 * 1000,
  })
