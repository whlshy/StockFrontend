import api from '../lib/api'
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query'

// 條件選股

// 可篩選的欄位：分類、單位、說明
export const getScreenerFields = async () => api({ method: "GET", cmd: "api/Screener/Fields" })
export const useGetScreenerFields = () =>
  useQuery({ queryKey: ['getScreenerFields'], queryFn: getScreenerFields, staleTime: Infinity })

// 範圍：所有族群、登入會員的選股資料夾
export const getScreenerScopes = async () => api({ method: "GET", cmd: "api/Screener/Scopes" })
export const useGetScreenerScopes = () =>
  useQuery({ queryKey: ['getScreenerScopes'], queryFn: getScreenerScopes, staleTime: 5 * 60 * 1000 })

// req：{ conditions: [{ key, min, max }], market, groupCid, folderCid, sortKey, sortDesc }
export const runScreener = async (req) => api({ method: "POST", cmd: "api/Screener/Run", data: req })
export const useRunScreener = (req, enabled = true) =>
  useQuery({
    queryKey: ['runScreener', JSON.stringify(req)],
    queryFn: () => runScreener(req),
    enabled,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })

// 自訂策略：登入會員自己的策略，回傳 { loggedIn, cid（會員的「條件選股」分類）, items }
export const getScreenerStrategies = async () => api({ method: "GET", cmd: "api/Screener/Strategies" })
export const useGetScreenerStrategies = () =>
  useQuery({ queryKey: ['getScreenerStrategies'], queryFn: getScreenerStrategies })

// cid：會員的「條件選股」分類；有 id 是更新，沒有是新增
export const saveScreenerStrategy = async ({ cid, id, name, des, definition }) =>
  api({ method: id ? "PUT" : "POST", cmd: id ? `api/Screener/Strategies/${cid}/${id}` : `api/Screener/Strategies/${cid}`, data: { name, des, definition } })
export const useSaveScreenerStrategy = (query = {}) => useMutation({ mutationFn: saveScreenerStrategy, ...query })

export const deleteScreenerStrategy = async ({ cid, id }) => api({ method: "DELETE", cmd: `api/Screener/Strategies/${cid}/${id}` })
export const useDeleteScreenerStrategy = (query = {}) => useMutation({ mutationFn: deleteScreenerStrategy, ...query })

// 把篩選結果加入選股資料夾（需要登入）
export const addScreenerToFolder = async ({ cid, codes }) => api({ method: "POST", cmd: `api/Screener/ToFolder/${cid}`, data: { codes } })
export const useAddScreenerToFolder = (query = {}) => useMutation({ mutationFn: addScreenerToFolder, ...query })
