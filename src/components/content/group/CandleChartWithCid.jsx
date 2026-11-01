import React from 'react'

import { useGetStockGroupCandles } from '@/apis'
import Loading from '@/components/elements/Loading'
import CandleChart from '@/components/content/stock/CandleChart'

// 選股資料夾頁使用：只計算直接放在資料夾內的股票（vd_GroupDayInfo）
const CandleChartWithCid = ({ cid }) => {
  const { data, isLoading } = useGetStockGroupCandles({ cid })

  if (!Array.isArray(data) || isLoading) return <Loading />

  if (data?.length === 0) return <>資料夾內沒有股票</>

  return (
    <CandleChart candlestickData={data || []} />
  )
}

export default CandleChartWithCid
