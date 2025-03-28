import React from 'react'
import { CircularProgress, Box } from '@mui/material'

function Loading() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <CircularProgress />
    </Box>
  )
}

export default Loading