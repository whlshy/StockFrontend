import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

import { useAccountStore } from '@/store'
import { useGetFolder } from '@/apis'

import { Box, Divider } from '@mui/material'
import Loading from '@/components/elements/Loading'
import Path from './elements/Path'
import FolderList, { FolderListItem, BackItem } from './elements/FolderList'
import { Title } from './elements/Title'
import MarkdownView from '@/components/elements/markdown'
import AddDialogButton from './elements/AddDialogButton'
import EditDialogButton from './elements/EditDialogButton'
import { Table, TableHeadRow, TableBody, TableRow, TableCell, tablerow_sx } from '@/components/elements/table'
import { CandleChartWithCid } from '@/components/content/group'

function index() {
  const { classes, mid, isLoading, ...account_atom } = useAccountStore()

  const root_cid = classes?.['選股']?.CID

  const [searchParams, setSearchParams] = useSearchParams()
  const cid = searchParams.get('cid') || root_cid

  if (!!isLoading) {
    return (
      <Box sx={{ p: 2 }}><Loading /></Box>
    )
  }
  // 未登入
  else if (!root_cid && mid === 0) {
    return (
      <div className='flex aic jcc pt-5 pb-5'>請先登入</div>
    )
  }

  return (
    <Folder cid={cid || root_cid} root_cid={root_cid} />
  )
}

const Folder = ({
  root_cid,
  cid,
  ...props
}) => {

  const { refetch, ...query } = useGetFolder({ cid })
  const navigate = useNavigate()

  const { data, folder, stocks } = query?.data || {}

  // 轉換總金額格式 (xxxM)
  const convertTradeValueAvg = (value) => {
    if (value < 10000) return value
    if (value < 1000000) return (value / 10000).toFixed(2) + "萬"
    return (value / 1000000).toFixed(2) + "億"
  }

  return (
    <Box sx={{ p: 2 }}>
      <Path
        idpath={data?.idpath}
        namepath={data?.namepath}
        root_cid={root_cid}
      />
      <Divider sx={{ mt: 2, mb: 2 }} />
      <TitleContenter {...props} data={data} refetch={refetch} isRoot={root_cid == cid} />
      <FolderList>
        {// 如果不是根目錄，需要有返回上一層的按鈕
          data?.nLevel > 0 &&
          <BackItem to={`/folder?cid=${data?.PCID}`} />
        }
        {Array.isArray(folder) && folder.map((d, idx) =>
          <FolderListItem
            key={d?.CCID}
            to={`/folder?cid=${d?.CCID}`}
            CName={<>{d?.CName} {d?.PercentAvg ? <b style={{ color: d?.PercentAvg > 0 ? "#ff333a" : "#00ab5e" }}>({d?.PercentAvg}%, 平均金額{convertTradeValueAvg(d?.TradeValueAvg)})</b> : ""}</>}
          />
        )}
      </FolderList>
      <br />
      <CandleChartWithCid cid={cid} />
      <br />
      <Table>
        <TableHeadRow>
        <TableCell>股票代號</TableCell>
          <TableCell>名稱</TableCell>
          <TableCell>上市櫃</TableCell>
          <TableCell>漲跌</TableCell>
          <TableCell>漲跌幅(%)</TableCell>
          <TableCell>開盤</TableCell>
          <TableCell>收盤</TableCell>
          <TableCell>最高</TableCell>
          <TableCell>最低</TableCell>
          <TableCell>成交量(股)</TableCell>
        </TableHeadRow>
        <TableBody>
          {Array.isArray(stocks) && stocks.map((d, idx) =>
            <TableRow key={d?.OID} onClick={() => navigate(`/stock/${d?.Code}`)}>
              <TableCell>{d?.Code}</TableCell>
              <TableCell>{d?.Name}</TableCell>
              <TableCell>{d?.Market}</TableCell>
              <TableCell sx={{ color: d?.Change > 0 ? "#ff333a" : "#00ab5e" }}><b>{d?.Change}</b></TableCell>
              <TableCell sx={{ color: d?.ChangeRate > 0 ? "#ff333a" : "#00ab5e" }}><b>{d?.ChangeRate}%</b></TableCell>
              <TableCell>{d?.OpeningPrice}</TableCell>
              <TableCell sx={{ color: d?.ClosingPrice > d?.OpeningPrice ? "#ff333a" : "#00ab5e" }}><b>{d?.ClosingPrice}</b></TableCell>
              <TableCell>{d?.HighestPrice}</TableCell>
              <TableCell>{d?.LowestPrice}</TableCell>
              <TableCell>{d?.TradeVolume}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  )
}

const TitleContenter = ({
  isRoot = true,
  data,
  refetch,
}) => {
  const { CCID, CName, CDes } = data || {}

  return (
    <Box sx={{ mb: 2 }}>
      <Box className={"flex aic jcsb flex-wrap"}>
        <EditDialogButton isRoot={isRoot} initData={{ cid: CCID, CName, Des: CDes }} refetch={refetch}>
          <Title title={CName} />
        </EditDialogButton>
        <Box>
          <AddDialogButton
            cid={CCID}
            refetch={refetch}
          />
        </Box>
      </Box>
      {!!CDes &&
        <Box sx={{ mt: 2 }}>
          <MarkdownView source={CDes} />
        </Box>
      }
    </Box>
  )
}

export default index