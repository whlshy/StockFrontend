import api from '@/lib/api'
import { useQuery, useMutation } from '@tanstack/react-query'

// 取得K棒歷史全部資料
export const getFolder = async ({ cid }) => {
  const response = await api({ method: "GET", cmd: `api/Folder/${cid}` })
  return response
}
export const useGetFolder = ({ cid }) => {
  return useQuery({ queryKey: ['getFolder', cid], queryFn: () => getFolder({ cid }), enabled: !!cid })
}

// 新增資料夾
export const addFolder = async ({ cid, ...data }) => {
  const response = await api({ method: "POST", cmd: `api/Folder/${cid}`, data: { ...data } })
  return response
}
export const useAddFolder = (query = {}) => {
  return useMutation({ mutationFn: addFolder, ...query })
}

// 編輯資料夾
export const editFolder = async ({ cid, ...data }) => {
  const response = await api({ method: "PUT", cmd: `api/Folder/${cid}`, data: { ...data } })
  return response
}
export const useEditFolder = (query = {}) => {
  return useMutation({ mutationFn: editFolder, ...query })
}