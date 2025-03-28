import React, { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import Search from '../stock/Search'
function index() {

  return (
    <Box sx={{ p: 2 }}>
      <Search />
    </Box>
  )
}

export default index