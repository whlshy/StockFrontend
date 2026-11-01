import React from 'react'
import { Box, Card, CardActionArea, CardContent, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

import { useGetGroupRoots } from '@/apis'
import Loading from '@/components/elements/Loading'

// 族群分析首頁：只列第一層分類，不畫圖表
const GroupHome = () => {
  const { data, isLoading } = useGetGroupRoots()

  return (
    <Box sx={{ p: 2 }}>
      <h3 className="mb-1 text-2xl font-bold">族群分析</h3>
      <p className="mb-4 text-sm text-gray-500">選擇一個分類，查看底下族群的法人資金流向與強弱。</p>
      {isLoading ? <Loading /> : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data || []).map(g => (
            <Card key={g.cid} variant="outlined" sx={{ height: '100%' }}>
              {/* 撐滿整張卡片，沒有描述的卡片點擊與反白範圍才不會只到一半 */}
              <CardActionArea
                component={Link}
                to={`/group/${g.cid}`}
                className="reset-link"
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{g.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {g.nChildren > 0 ? `${g.nChildren} 個子分類・` : ''}{g.nStocks} 檔股票
                  </Typography>
                  {!!g.des && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} noWrap title={g.des}>{g.des}</Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </div>
      )}
    </Box>
  )
}

export default GroupHome
