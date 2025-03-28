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

  const { Name, Code, Industry, Market, Date, ClosingPrice, Change, 每股股利, 殖利率,PerdictPE, Eps } = data || {}

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
            <TableCell sx={{ fontWeight: "bolder" }}>漲跌幅</TableCell>
            <TableCell sx={{ fontWeight: "bolder" }}>每股股利</TableCell>
            <TableCell sx={{ fontWeight: "bolder" }}>殖利率</TableCell>
            <TableCell sx={{ fontWeight: "bolder" }}>淨值比</TableCell>
            <TableCell sx={{ fontWeight: "bolder" }}>PE</TableCell>
            <TableCell sx={{ fontWeight: "bolder" }}>EPS (估)</TableCell>
          </TableHeadRow>
          <TableBody>
            <TableRow>
              <TableCell>{Date?.split("T")?.[0]}</TableCell>
              <TableCell>{ClosingPrice}</TableCell>
              <TableCell>{Change}</TableCell>
              <TableCell>{每股股利}</TableCell>
              <TableCell>{殖利率}</TableCell>
              <TableCell>{PerdictPE}</TableCell>
              <TableCell>{ClosingPrice}</TableCell>
              <TableCell>{Eps}</TableCell>
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