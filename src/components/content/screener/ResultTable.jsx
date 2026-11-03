import React, { useEffect } from 'react'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel } from '@mui/material'

import Term from '@/components/elements/Term'
import { useOpenStock } from '../stock/stockModal'
import Paging, { usePaging } from '../home/Paging'
import { formatField } from './format'

const head = { fontWeight: 'bold' }

// 篩選結果：欄位依條件自動加入；點欄位標題由後端重新排序，點列開個股彈跳視窗
const ResultTable = ({ data, fieldMap, sortKey, sortDesc, onSort }) => {
  const openStock = useOpenStock()
  const rows = data?.rows || []
  const columns = data?.columns || []
  const paging = usePaging(rows)
  // 條件或排序改變、結果重新算過時回到第一頁
  useEffect(() => { paging.reset() }, [data])

  return (
    <>
      <TableContainer>
        <Table size="small" sx={{ '& td, & th': { whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={head}>#</TableCell>
              <TableCell sx={head}>個股</TableCell>
              {columns.map(k => {
                const f = fieldMap[k]
                return (
                  <TableCell key={k} align="right" sx={head}>
                    <TableSortLabel active={sortKey === k} direction={sortKey === k && !sortDesc ? 'asc' : 'desc'}
                      onClick={() => onSort(k)}>
                      <Term tip={f?.desc}>{f?.label ?? k}</Term>
                      {f?.unit && f.kind !== 'bool' && <span className="ml-0.5 text-xs font-normal text-gray-400">({f.unit})</span>}
                    </TableSortLabel>
                  </TableCell>
                )
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={columns.length + 2} align="center" sx={{ color: 'text.secondary', py: 4 }}>沒有符合條件的股票</TableCell></TableRow>
            )}
            {paging.pageRows.map((r, i) => (
              <TableRow key={r.code} hover sx={{ cursor: 'pointer' }} onClick={() => openStock(r.code, rows)}>
                <TableCell sx={{ color: 'text.secondary' }}>{paging.offset + i + 1}</TableCell>
                <TableCell>
                  <span className="font-medium">{r.code} {r.name}</span>
                  <span className="ml-1 text-xs text-gray-400">{r.market}{r.industry ? `・${r.industry}` : ''}</span>
                </TableCell>
                {columns.map(k => {
                  const { text, color } = formatField(fieldMap[k], r.values?.[k])
                  return <TableCell key={k} align="right" style={{ color }}>{text}</TableCell>
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Paging paging={paging} />
    </>
  )
}

export default ResultTable
