import React from 'react'

import { Box } from '@mui/material'

import { useAccountStore } from '@/store'
import { useGetFolder } from '@/apis'

import Path from './elements/Path'
import Loading from '@/components/elements/Loading'

function index() {
  const { classes, mid, isLoading, ...account_atom } = useAccountStore()

  const root_cid = classes?.['選股']?.CID

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
    <Folder cid={root_cid} />
  )
}

const Folder = ({
  cid,
  ...props
}) => {
  const { ...query } = useGetFolder({ cid })

  const { data, folder } = query?.data || {}

  return (
    <Box sx={{ p: 2 }}>
      <Path />
      Hi
    </Box>
  )
}

export default index