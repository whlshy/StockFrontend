// 內建策略：點一下套用一組條件（min／max 留空代表不限；是非條件只要列出 key）
export const PRESETS = [
  {
    name: '投信連買＋站上月線',
    desc: '投信連續買超 3 天以上，且收盤在 20 日均線之上',
    conditions: [{ key: 'tDays', min: 3 }, { key: 'vsMA20', min: 0 }],
    sortKey: 'tNet5',
  },
  {
    name: '土洋同買',
    desc: '外資、投信當日都買超 0.1 億以上，且站上月線',
    conditions: [{ key: 'coBuy' }, { key: 'vsMA20', min: 0 }],
    sortKey: 'aAmt',
  },
  {
    name: '營收創新高＋外資買超',
    desc: '最新月營收創歷史新高，且外資當日買超',
    conditions: [{ key: 'revAllTimeHigh' }, { key: 'fNet', min: 1 }],
    sortKey: 'revYoy',
  },
  {
    name: '爆量突破52週新高',
    desc: '收盤創 52 週新高，且成交量是 20 日均量 2 倍以上',
    conditions: [{ key: 'newHigh52' }, { key: 'volRatio', min: 2 }],
    sortKey: 'volRatio',
  },
  {
    name: '高殖利率＋低本益比',
    desc: '殖利率 5% 以上、本益比 15 倍以下，且成交值至少 0.5 億',
    conditions: [{ key: 'yield', min: 5 }, { key: 'pe', max: 15 }, { key: 'value', min: 0.5 }],
    sortKey: 'yield',
  },
  {
    name: '籌碼安定',
    desc: '融資減少 3% 以上，但近 5 日股價上漲 3% 以上',
    conditions: [{ key: 'marginChgPct', max: -3 }, { key: 'pct5', min: 3 }],
    sortKey: 'pct5',
  },
  {
    name: 'KD低檔黃金交叉',
    desc: 'K 值在 30 以下，今天 K 值往上穿過 D 值',
    conditions: [{ key: 'kdGolden' }, { key: 'kdK', max: 30 }],
    sortKey: 'value',
  },
  {
    name: '營收連3月高成長',
    desc: '近 3 個月營收年增率都 ≥ 20%，且站上季線',
    conditions: [{ key: 'revMinYoy3', min: 20 }, { key: 'vsMA60', min: 0 }],
    sortKey: 'revMinYoy3',
  },
]
