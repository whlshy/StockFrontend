import React, { useEffect, useState } from 'react'
import { Box, Divider, Chip } from '@mui/material'
import { useParams } from 'react-router-dom'

import { useGetStockCandles, useGetStockInfo } from '@/apis'

import CandleChart from '@/components/content/stock/CandleChart'
import Header from './Header'
import Search from './Search'
import Loading from '@/components/elements/Loading'
import { Table, TableHeadRow, TableBody, TableRow, TableCell } from '@/components/elements/table'

const index = ({ ...props }) => {
  let { code } = useParams()

  const { data, isLoading } = useGetStockInfo({ code })

  const { Name, Code, Industry, Market, Date, ClosingPrice, 每股股利, 殖利率, PerdictPE, Eps,
    OpeningPrice, HighestPrice, LowestPrice,
  } = data || {}

  const Change = (ClosingPrice - OpeningPrice).toFixed(2)
  const ChangeRate = ((ClosingPrice - OpeningPrice) / OpeningPrice * 100).toFixed(2)

  return (
    <Box sx={{ p: 2 }}>
      <Search />
      {data && <Header Name={Name} Code={Code} Industry={Industry} Market={Market} />}
      <Divider sx={{ mt: 1, mb: 2 }} />
      <CandleChartWithCode code={code} />
      <br />
      <Box>
        <Table>
          <TableHeadRow>
            <TableCell sx={{ fontWeight: "bolder" }}>日期</TableCell>
            <TableCell sx={{ fontWeight: "bolder" }}>收盤價</TableCell>
            <TableCell>漲跌</TableCell>
            <TableCell>漲跌幅(%)</TableCell>
            <TableCell sx={{ fontWeight: "bolder" }}>開盤</TableCell>
            <TableCell sx={{ fontWeight: "bolder" }}>收盤</TableCell>
            <TableCell sx={{ fontWeight: "bolder" }}>最高</TableCell>
            <TableCell sx={{ fontWeight: "bolder" }}>最低</TableCell>
          </TableHeadRow>
          <TableBody>
            <TableRow>
              <TableCell>{Date?.split("T")?.[0]}</TableCell>
              <TableCell>{ClosingPrice}</TableCell>
              <TableCell sx={{ color: Change > 0 ? "#ff333a" : "#00ab5e" }}><b>{Change}</b></TableCell>
              <TableCell sx={{ color: ChangeRate > 0 ? "#ff333a" : "#00ab5e" }}><b>{ChangeRate}%</b></TableCell>
              <TableCell>{OpeningPrice}</TableCell>
              <TableCell sx={{ color: ClosingPrice > OpeningPrice ? "#ff333a" : "#00ab5e" }}><b>{ClosingPrice}</b></TableCell>
              <TableCell>{HighestPrice}</TableCell>
              <TableCell>{LowestPrice}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>
    </Box>
  )
}

export default index

const CandleChartWithCode = ({ code }) => {
  const { data, isLoading } = useGetStockCandles({ code })

  if (!Array.isArray(data) || isLoading) return <Loading />

  return (
    <CandleChart candlestickData={data || []} volumeData={data || []} />
  )
}