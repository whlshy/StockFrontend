import React, { cloneElement, Fragment, useState, useEffect } from 'react'
import { useMediaQuery, Box } from '@mui/material'
import useAppStore from '../../../store/app'

function RwdWrapper(props) {
  const { children, margin = 15, sx = {}, content_sx = {}, data = null, onlyProps = false, noDrawer = false } = props
  const isDrawerOpen = useAppStore()?.isDrawerOpen && !noDrawer;

  const lg = useMediaQuery(!isDrawerOpen ? '(min-width:1200px)' : "(min-width:1440px)")
  const md = useMediaQuery(!isDrawerOpen ? '(min-width:992px)' : '(min-width:1232px)')
  const xs = useMediaQuery(!isDrawerOpen ? '(min-width:768px)' : '(min-width:1008px)')

  let content_width = lg ? "1170px" : md ? "970px" : xs ? "750px" : "100%"

  let width = (data)?.length < 3 ? `${100 / data.length}%` : lg ? (1170 / 3) : md ? (970 / 3) : xs ? (750 / 2) : content_width

  const nextProps = {
    content_width,
    margin: `${margin}px`,
    width,
    width_margin: !(typeof (width) === "string") ? (width - margin * 2) : `calc(${width} - ${margin * 2}px)`,
    lg,
    md,
    xs,
  }

  if (onlyProps == true) {
    return (
      <Fragment>
        {cloneElement(children, {
          ...nextProps
        })}
      </Fragment>
    )
  }
  return (
    <Box className="flex flex-1-1 jcsb flex-col aic" sx={{ ...sx }}>
      <Box sx={{ width: content_width, display: "flex", flexWrap: "wrap", ...content_sx }}>
        {cloneElement(children, {
          ...nextProps
        })}
      </Box>
    </Box>
  )
}

export default RwdWrapper