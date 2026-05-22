import React, { useEffect, useState } from 'react'
import { Box, Divider, Chip } from '@mui/material'
import { useParams } from 'react-router-dom'

import { useGetStockGroupCandles } from '@/apis'

import Loading from '@/components/elements/Loading'
import CandleChart from '@/components/content/stock/CandleChart'

function index() {
  let { cid } = useParams()

  if (!cid) {
    return (
      <Box sx={{ p: 2 }}>
        
      </Box>
    )
  }
  return (
    <Box sx={{ p: 2 }}>
      <CandleChartWithCid cid={cid} />
    </Box>
  )
}

export default index

const CandleChartWithCid = ({ cid }) => {
  const { data, isLoading } = useGetStockGroupCandles({ cid })

  if (!Array.isArray(data) || isLoading) return <Loading />

  if (data?.length === 0) return <>資料夾內沒有股票</>

  return (
    <CandleChart candlestickData={data || []} volumeData={data || []} />
  )
}

export { CandleChartWithCid }