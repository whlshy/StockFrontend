import React from 'react'
import { Box } from '@mui/material'

import { useGetHomeMarket, useGetHomeBreadth, useGetHomeFocus, useGetHomeChips } from '@/apis'
import Search from '../stock/Search'
import Loading from '@/components/elements/Loading'
import MarketCards from './MarketCards'
import Breadth from './Breadth'
import FocusTable from './FocusTable'
import ChipsTable from './ChipsTable'

// 首頁市場總覽：大盤卡片、市場寬度、今日焦點、籌碼排行
function index() {
  const { data: market, isLoading: marketLoading } = useGetHomeMarket()
  const { data: breadth, isLoading: breadthLoading } = useGetHomeBreadth()
  const { data: focus, isLoading: focusLoading } = useGetHomeFocus()
  const { data: chips, isLoading: chipsLoading } = useGetHomeChips()

  return (
    <Box sx={{ p: 2 }}>
      <Search />
      <div className="mt-3 flex flex-col gap-3">
        {marketLoading ? <Loading /> : <MarketCards data={market} />}
        {breadthLoading ? <Loading /> : <Breadth data={breadth} />}
        {focusLoading ? <Loading /> : <FocusTable data={focus} />}
        {chipsLoading ? <Loading /> : <ChipsTable data={chips} />}
      </div>
    </Box>
  )
}

export default index
