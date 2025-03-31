import React from 'react'
import { Box } from '@mui/material'

function Title({ sx = {}, className = "", title }) {
  return (
    <Box className={"flex" + className.length > 0 ? ` ${className}` : ""} sx={{ position: "relative", ...sx }}>
      <Box sx={{ width: "4px", backgroundColor: "#666666", position: "absolute", left: 0, top: 0, bottom: 0 }} />
      <Box sx={{ ml: 2, fontSize: "18px" }}><b>{title || ""}</b></Box>
    </Box>
  )
}

export { Title }