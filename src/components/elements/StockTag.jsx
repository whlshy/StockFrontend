import React from 'react'
import { Chip } from '@mui/material'

import Term from './Term'

// 股票狀態標籤：名稱和顏色只定義在這裡，各頁只要給名稱；GLOSSARY 有這個名稱時會自動加上滑鼠提示
const TAGS = {
  漲停: { bgcolor: '#ef4444' },
  跌停: { bgcolor: '#16a34a' },
  除權息: { bgcolor: '#6b7280' },
  土洋同買: { bgcolor: '#ea580c' },
  土洋同賣: { bgcolor: '#0891b2' },
  土洋對作: { bgcolor: '#f59e0b' },
  異常大買: { bgcolor: '#d32f2f' },
  異常大賣: { bgcolor: '#2e7d32' },
  公告: { bgcolor: '#2563eb' },
  集中: { bgcolor: '#fff7ed', color: '#c2410c' },
}

// name：標籤名稱；sx：位置、大小等版面調整
const StockTag = ({ name, sx }) => (
  <Term k={name}>
    <Chip label={name} size="small" sx={{ height: 18, fontSize: 11, color: '#fff', ...TAGS[name], ...sx }} />
  </Term>
)

export default StockTag
