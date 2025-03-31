import React, { Fragment } from 'react'
import { Box, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { reClassName } from '@/lib/fn'

function Path({
  namepath,
  idpath,
  root_cid = null,
  base_path = "/folder",
  ...props
}) {

  const name_arr = namepath?.length > 0 ? namepath?.split('/') : []
  const id_arr = namepath?.length > 0 ? idpath?.split('/') : []

  return (
    <Box>
      <Box>
        <Link to={`${base_path}?cid=${root_cid}`}>
          <Typography variant='b' sx={{ color: idpath !== null ? "#666666" : "#222222", "&:hover": { color: "#000" } }} className='transition-2'>
            <b>根目錄</b>
          </Typography>
        </Link>
        {name_arr?.map((d, idx) =>
          <Fragment key={`${d}_${idx}`}>
            &ensp;/&ensp;
            <Link to={`${base_path}?cid=${id_arr?.[idx]}`}>
              <Typography variant='b' sx={{ color: idx !== (name_arr?.length - 1) ? "#666666" : "#222222", "&:hover": { color: "#000" } }} className='transition-2'>
                <b>{reClassName(d || "")}</b>
              </Typography>
            </Link>
          </Fragment>
        )}
      </Box>
    </Box>
  )
}

export default Path;