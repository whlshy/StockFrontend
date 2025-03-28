import React from 'react'
import { Box, Chip } from '@mui/material'

function Header({
  Code,
  Name,
  Market,
  Industry,
}) {
  return (
    <Box className="flex aic">
      <h3 className="text-3xl font-bold dark:text-white"><span>{Code}</span>&ensp;<span>{Name}</span></h3>
      <Box sx={{ ml: 2 }}>
        <Chip label={Market} color="primary" />
        {!!Industry && <Chip label={Industry} color="success" sx={{ ml: 2 }} />}
      </Box>
    </Box>
  )
}

export default Header