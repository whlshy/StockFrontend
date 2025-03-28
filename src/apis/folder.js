import api from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

// 取得K棒歷史全部資料
export const getFolder = async ({ cid }) => {
  const response = await api({ method: "GET", cmd: `api/Folder/${cid}` })
  return response
}
export const useGetFolder = ({ cid }) => {
  return useQuery({ queryKey: ['getFolder', cid], queryFn: () => getFolder({ cid }), enabled: !!cid })
}