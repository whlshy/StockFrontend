import React from 'react'
import { useParams } from 'react-router-dom'

import GroupHome from './GroupHome'
import GroupNode from './GroupNode'
import CandleChartWithCid from './CandleChartWithCid'

// 族群分析：/group 第一層分類，/group/:cid 該分類底下的族群
function index() {
  let { cid } = useParams()

  if (!cid) return <GroupHome />

  return <GroupNode key={cid} cid={cid} />
}

export default index

export { CandleChartWithCid }
