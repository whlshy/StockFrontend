import React, { useMemo, useState } from 'react'
import { Chip } from '@mui/material'
import { Link } from 'react-router-dom'

import { useGetStockGroups } from '@/apis'

// 每個來源先顯示幾個，其餘收合（概念股常有二、三十個）
const COLLAPSED = 6

// 個股頁：所屬族群，依第一層分類分組，點了進族群頁
const StockGroups = ({ code }) => {
  const { data } = useGetStockGroups({ code })
  const [expanded, setExpanded] = useState({})

  const roots = useMemo(() => {
    const map = new Map()
    for (const g of Array.isArray(data) ? data : []) {
      if (!map.has(g.rootCid)) map.set(g.rootCid, { cid: g.rootCid, name: g.rootName, items: [] })
      map.get(g.rootCid).items.push(g)
    }
    return [...map.values()]
  }, [data])

  if (!roots.length) return null

  return (
    <div className="mb-3 flex flex-col gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm">
      <span className="font-semibold text-gray-700">所屬族群</span>
      {roots.map(r => {
        const open = expanded[r.cid]
        const shown = open ? r.items : r.items.slice(0, COLLAPSED)
        const more = r.items.length - shown.length
        return (
          <div key={r.cid} className="flex items-start gap-1">
            <Link to={`/group/${r.cid}`} className="mr-1 w-28 shrink-0 pt-0.5 text-xs text-gray-500 hover:text-blue-700">{r.name}</Link>
            <div className="flex flex-wrap items-center gap-1">
              {shown.map(g => (
                <Chip
                  key={g.cid}
                  label={g.path}
                  size="small"
                  variant="outlined"
                  clickable
                  component={Link}
                  to={`/group/${g.cid}`}
                  sx={{ height: 22, fontSize: 12 }}
                />
              ))}
              {more > 0 && (
                <button type="button" className="text-xs text-blue-700 hover:underline" onClick={() => setExpanded(e => ({ ...e, [r.cid]: true }))}>
                  +{more} 個
                </button>
              )}
              {open && r.items.length > COLLAPSED && (
                <button type="button" className="text-xs text-gray-500 hover:underline" onClick={() => setExpanded(e => ({ ...e, [r.cid]: false }))}>
                  收合
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default StockGroups
