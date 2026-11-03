import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// 個股彈跳視窗：網址換成 /stock/:code，背景維持原本的頁面
// history.state 重新整理後還在，所以加上這次載入的識別碼；重新整理後識別碼不同，就改成顯示完整個股頁
const MODAL_SESSION = Math.random().toString(36).slice(2)

// 目前是彈跳視窗時，回傳背後原本頁面的 location；否則回傳 null
export const getModalBackground = (location) => {
  const s = location?.state
  return s?.stockModal === MODAL_SESSION && s.backgroundLocation ? s.backgroundLocation : null
}

// 在任何頁面以彈跳視窗開啟個股；已在彈跳視窗中時沿用原本的背景頁
// list：外層列表目前的順序（[{ code, name }]），彈跳視窗內可用方向鍵前後切換
export const useOpenStock = () => {
  const navigate = useNavigate()
  const location = useLocation()
  return useCallback((code, list) => {
    const backgroundLocation = getModalBackground(location) || location
    const depth = (getModalBackground(location) ? location.state.depth : 0) + 1
    const stockList = Array.isArray(list) ? list.map(s => ({ code: s.code, name: s.name })) : null
    navigate(`/stock/${code}`, { state: { stockModal: MODAL_SESSION, backgroundLocation, depth, stockList } })
  }, [navigate, location])
}

// 彈跳視窗內切換到列表中的另一檔：取代目前的歷史紀錄，關閉時一樣回到開啟前的網址
export const useSwitchStock = () => {
  const navigate = useNavigate()
  const location = useLocation()
  return useCallback((code) => navigate(`/stock/${code}`, { replace: true, state: location.state }), [navigate, location])
}

// 關閉彈跳視窗：退回開啟前的網址（中間若又開了別檔個股，一次退到底）
export const useCloseStock = () => {
  const navigate = useNavigate()
  const location = useLocation()
  return useCallback(() => navigate(-(location.state?.depth || 1)), [navigate, location])
}
