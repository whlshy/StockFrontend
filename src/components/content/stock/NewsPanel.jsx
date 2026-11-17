import React from 'react'

import { useGetStockNews } from '@/apis'
import Loading from '@/components/elements/Loading'
import StockTag from '@/components/elements/StockTag'

const pad = (n) => String(n).padStart(2, '0')
const fmtTime = (t) => {
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 個股新聞：鉅亨網（含公司公告）與 Google 新聞，點標題用新分頁開原文
const NewsPanel = ({ code }) => {
  const { data, isLoading, isError } = useGetStockNews({ code })
  if (isLoading) return <Loading />

  const items = data?.items || []
  const errors = data?.errors || []

  return (
    <div className="pt-2">
      {(isError || items.length === 0) && (
        <div className="py-8 text-center text-gray-400">{isError ? '新聞暫時抓不到，請稍後再試' : '最近沒有這檔股票的新聞'}</div>
      )}
      <ul className="divide-y divide-gray-100">
        {items.map((n, i) => (
          <li key={i} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:gap-3">
            <span className="shrink-0 text-xs tabular-nums text-gray-400 sm:w-32">{fmtTime(n.time)}</span>
            <span className="min-w-0 flex-1">
              {n.announcement && <StockTag name="公告" sx={{ mr: 0.75 }} />}
              <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-blue-700 hover:underline">
                {n.title}
              </a>
            </span>
            <span className="shrink-0 text-xs text-gray-400">{n.source}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 text-xs text-gray-400">
        資料來源：鉅亨網、Google 新聞，每 30 分鐘更新一次
        {errors.length > 0 && `・暫時抓不到：${errors.map(e => e.split('：')[0]).join('、')}`}
      </div>
    </div>
  )
}

export default NewsPanel
