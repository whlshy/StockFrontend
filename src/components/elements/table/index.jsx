import React from 'react'
import { Paper, TableContainer, Table as MuiTable, TableHead, TableRow as MuiTableRow, TableCell, TableBody } from '@mui/material'

function Table({ children, sx, ...props }) {
  return (
    <TableContainer component={Paper} sx={{ mt: 1, ...sx }} {...props}>
      <MuiTable sx={{ minWidth: 200 }}>
        {children}
      </MuiTable>
    </TableContainer>
  )
}

const TableHeadRow = ({ children }) => {
  return (
    <TableHead>
      <MuiTableRow sx={{ borderTop: "5px solid #1f1f1f;" }}>
        {children}
      </MuiTableRow>
    </TableHead>
  )
}

const tablerow_sx = {
  '&:last-child td, &:last-child th': { border: 0 },
  '&:nth-of-type(odd)': { backgroundColor: "#f9f9f9" },
  '&:hover': { backgroundColor: "rgba(0, 0, 0, .1)", cursor: "pointer", transition: "all .2s" }
}

const TableRow = ({ children, sx, ...props }) => {
  return (
    <MuiTableRow sx={{ ...tablerow_sx, ...sx }} {...props}>
      {children}
    </MuiTableRow >
  )
}

export { Table, TableHeadRow, TableBody, TableRow, TableCell, tablerow_sx }