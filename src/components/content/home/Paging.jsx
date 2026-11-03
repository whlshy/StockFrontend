import React, { useState } from 'react'
import { TablePagination } from '@mui/material'

const PAGE_SIZES = [10, 20, 50]

// 首頁排行表的分頁：切換分頁籤時呼叫 reset 回到第一頁
export const usePaging = (rows) => {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(PAGE_SIZES[0])
  // 資料重新抓取後筆數變少時，不要停在不存在的頁
  const last = Math.max(0, Math.ceil((rows?.length || 0) / size) - 1)
  const current = Math.min(page, last)
  return {
    page: current,
    size,
    offset: current * size,
    pageRows: (rows || []).slice(current * size, current * size + size),
    reset: () => setPage(0),
    setPage,
    setSize: (v) => { setSize(v); setPage(0) },
    count: rows?.length || 0,
  }
}

// 筆數少時也顯示，讓人看得到總共幾名（只有一頁時換頁按鈕會自動停用）
const Paging = ({ paging }) => {
  if (paging.count === 0) return null
  return (
    <TablePagination
      component="div"
      count={paging.count}
      page={paging.page}
      onPageChange={(_, p) => paging.setPage(p)}
      rowsPerPage={paging.size}
      onRowsPerPageChange={e => paging.setSize(Number(e.target.value))}
      rowsPerPageOptions={PAGE_SIZES}
      labelRowsPerPage="每頁"
      labelDisplayedRows={({ from, to, count }) => `第 ${from}–${to} 名，共 ${count} 名`}
    />
  )
}

export default Paging
