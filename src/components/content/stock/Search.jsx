import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useSearchStock } from '@/apis'

import OptionSearchbar from '@/components/elements/searchbar/OptionSearchbar'

function Search() {
  const navigate = useNavigate()

  const [searchstr, setSearchStr] = useState("")
  const query = useSearchStock({ searchstr })

  const handleSubmit = (value) => {
    navigate(`/stock/${value.split(' ')?.[0]}`)
  }

  return (
    <OptionSearchbar
      sx={{ mb: 1, mt: 1 }}
      value={searchstr}
      onChange={(value) => setSearchStr(value)}
      handleSummit={(value) => (handleSubmit(value), setSearchStr(""))}
      options={query?.data || []}
      placeholder='搜尋股票...'
      isIcon={false}
      onlyOptionSearch={true}
      autoHighlight={true}
    />
  )
}

export default Search