import React from 'react'
import { Box } from '@mui/material'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './home'
import Stock from './stock'
import StockDialog from './stock/StockDialog'
import { getModalBackground } from './stock/stockModal'
import Folder from './folder'
import Group from './group'
import Sync from './sync'

function index() {
  const location = useLocation()
  // 個股彈跳視窗開著時，背景照舊顯示原本的頁面
  const background = getModalBackground(location)

  return (
    <Box sx={{ flex: "1 1 auto" }}>
      <Routes location={background || location}>
        <Route path="/" element={<Home />} />
        <Route path="/stock/:code" element={<Stock />} />
        <Route path="/folder" element={<Folder />} />
        <Route path="/group/:cid?" element={<Group />} />
        <Route path="/sync" element={<Sync />} />
      </Routes>
      {background && (
        <Routes>
          <Route path="/stock/:code" element={<StockDialog />} />
        </Routes>
      )}
    </Box>
  )
}

export default index
