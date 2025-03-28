import React from 'react'
import { Box } from '@mui/material'
import { Routes, Route } from 'react-router-dom'
import Home from './home'
import Stock from './stock'
import Folder from './folder'

function index() {
  return (
    <Box sx={{ flex: "1 1 auto" }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stock/:code" element={<Stock />} />
        <Route path="/folder" element={<Folder />} />
      </Routes>
    </Box>
  )
}

export default index