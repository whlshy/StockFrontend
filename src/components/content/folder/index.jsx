import React from 'react'
import { useSearchParams } from 'react-router-dom'

import { useAccountStore } from '@/store'
import { useGetFolder } from '@/apis'

import { Box, Divider } from '@mui/material'
import Loading from '@/components/elements/Loading'
import Path from './elements/Path'
import FolderList, { FolderListItem, BackItem } from './elements/FolderList'
import { Title } from './elements/Title'
import MarkdownView from '@/components/elements/markdown'
import AddDialogButton from './elements/AddDialogButton'

function index() {
  const { classes, mid, isLoading, ...account_atom } = useAccountStore()

  const root_cid = classes?.['選股']?.CID

  const [searchParams, setSearchParams] = useSearchParams()
  const cid = searchParams.get('cid') || root_cid

  if (!isLoading) {
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

  const { data, folder } = query?.data || {}

  return (
    <Box sx={{ p: 2 }}>
      <Path
        idpath={data?.idpath}
        namepath={data?.namepath}
        root_cid={root_cid}
      />
      <Divider sx={{ mt: 2, mb: 2 }} />
      <TitleContenter {...props} data={data} refetch={refetch} />
      <FolderList>
        {// 如果不是根目錄，需要有返回上一層的按鈕
          data?.nLevel > 0 &&
          <BackItem to={`/folder?cid=${data?.PCID}`} />
        }
        {Array.isArray(folder) && folder.map((d, idx) =>
          <FolderListItem
            key={d?.CCID}
            to={`/folder?cid=${d?.CCID}`}
            CName={d?.CName}
          />
        )}
      </FolderList>
    </Box>
  )
}

const TitleContenter = ({
  data,
  refetch,
}) => {
  const { CCID, CName, CDes } = data || {}

  return (
    <Box sx={{ mb: 2 }}>
      <Box className={"flex aic jcsb"}>
        <Title title={CName} />
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