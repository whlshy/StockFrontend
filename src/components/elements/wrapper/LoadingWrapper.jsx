import React, { Fragment, cloneElement } from 'react'
import { Box } from '@mui/material'
import Loading from '../Loading'

function LoadingWrapper({ children, query }) {

  if (query.isLoading) {
    return (
      <Box sx={{ m: 2, width: "100%" }} className="flex aic jcc">
        <Loading />
      </Box>
    )
  }

  return (
    <Fragment>
      {children}
    </Fragment>
  )
}

export default LoadingWrapper