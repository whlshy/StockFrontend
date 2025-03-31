import React from 'react'
import { Button } from '@mui/material'

function AddButton({
  ...props
}) {
  return (
    <Button
      variant="outlined"
      color="success"
      {...props}
    >
      新增
    </Button>
  )
}

export default AddButton