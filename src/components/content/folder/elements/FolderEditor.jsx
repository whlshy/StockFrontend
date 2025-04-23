import React, { useState } from 'react'
import { Box, TextField } from '@mui/material'
import { MarkdwonEditor } from '@/components/elements/markdown'

function FolderEditor({
  initData,
  onChange,
}) {
  const [data, setData] = useState(initData || {})
  const { CName, Des } = data || {}

  const onDataChange = (d) => {
    setData({ ...data, ...d })
    onChange?.({ ...data, ...d })
  }

  return (
    <Box className="flex flex-col" sx={{ height: "100%" }}>
      <TextField
        label="資料夾名稱"
        variant="standard"
        value={CName || ""}
        name="CName"
        onChange={(e) => onDataChange({ CName: e.target.value })}
        autoFocus={true}
        fullWidth
      />
      <br />
      <Box className="flex-1-1">
        <MarkdwonEditor
          value={Des}
          onChange={(text) => onDataChange({ Des: text })}
          placeholder='請輸入資料夾描述'
          autoFocus={false}
        />
      </Box>
    </Box>
  )
}

export default FolderEditor