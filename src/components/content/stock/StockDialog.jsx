import React, { useEffect, useRef } from 'react'
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import Stock from './index'
import { useCloseStock, useSwitchStock } from './stockModal'

// 正在輸入文字時不攔截方向鍵
const isTyping = (el) => el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

// 以彈跳視窗顯示個股頁（路由見 content/index.jsx）
const StockDialog = () => {
  const { code } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const close = useCloseStock()
  const switchStock = useSwitchStock()
  const fullScreen = useMediaQuery('(max-width:899px)')
  const scrollRef = useRef(null)

  const list = location.state?.stockList || []
  const idx = list.findIndex(s => s.code === code)
  const prev = idx > 0 ? list[idx - 1] : null
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null

  // ← → 切換外層列表的上一檔、下一檔
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isTyping(e.target)) return
      const target = e.key === 'ArrowLeft' ? prev : e.key === 'ArrowRight' ? next : null
      if (!target) return
      e.preventDefault()
      switchStock(target.code)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, switchStock])

  // 換股票時回到最上面
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [code])

  const label = (s) => `${s.code} ${s.name ?? ''}`.trim()

  return (
    <Dialog open onClose={close} fullWidth maxWidth="xl" fullScreen={fullScreen} scroll="paper">
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
        {idx >= 0 && list.length > 1 && (
          <div className="mr-1 flex items-center rounded-full bg-gray-100 text-xs text-gray-500 tabular-nums">
            <Tooltip title={prev ? `上一檔：${label(prev)}（←）` : ''}>
              <span>
                <IconButton size="small" disabled={!prev} onClick={() => switchStock(prev.code)}>
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <span>{idx + 1} / {list.length}</span>
            <Tooltip title={next ? `下一檔：${label(next)}（→）` : ''}>
              <span>
                <IconButton size="small" disabled={!next} onClick={() => switchStock(next.code)}>
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </div>
        )}
        <Tooltip title="開啟完整個股頁">
          <IconButton size="small" onClick={() => navigate(`/stock/${code}`, { replace: true })}>
            <OpenInFullIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="關閉">
          <IconButton size="small" onClick={close}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
      <div ref={scrollRef} className="overflow-y-auto">
        <Stock inDialog />
      </div>
    </Dialog>
  )
}

export default StockDialog
