import React from 'react'
import { Link } from 'react-router-dom'

import { Box, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { ArrowBack as ArrowBackIcon, Folder as FolderIcon } from '@mui/icons-material'

function FolderList({
  children,
  ...props
}) {
  return (
    <Box sx={{ p: 2, backgroundColor: "#f1f1f1" }}>
      {children}
    </Box>
  )
}

const BackItem = ({ to }) => {
  return (
    <ListItemButton component={Link} to={to} >
      <ListItemIcon><ArrowBackIcon /></ListItemIcon>
      <ListItemText>
        回上一層...
      </ListItemText>
    </ListItemButton>
  )
}

const FolderListItem = ({ to, CName }) => {
  return (
    <ListItemButton component={Link} to={to}>
      <ListItemIcon><FolderIcon /></ListItemIcon>
      <ListItemText>
        {CName}
      </ListItemText>
    </ListItemButton>
  )
}

export default FolderList
export { FolderListItem, BackItem }