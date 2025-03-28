import React, { Fragment } from 'react'
import { Box, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

function Path({
  data = null,
  root_cid = null,
  onClick = null,
}) {
  const { idpath, namepath, vListDes } = data || {}
  const base_path = "/folder"

  const name_arr = namepath?.length > 0 ? namepath?.split('/') : []
  const id_arr = namepath?.length > 0 ? idpath?.split('/') : []

  const onLinkClick = (e, cid) => {
    if (onClick !== null) {
      e.preventDefault();
      onClick?.(cid)
    }
  };


  return (
    <Box>
      <Box>
        <Link to={`${base_path}?cid=${root_cid}`} onClick={(e) => onLinkClick(e, root_cid)}>
          <Typography variant='b' sx={{ color: data !== null ? "#666666" : "#222222", "&:hover": { color: "#000" } }} className='transition-2'>
            <b>根目錄</b>
          </Typography>
        </Link>
        {name_arr?.map((d, idx) =>
          <Fragment key={`${d}_${idx}`}>
            &ensp;/&ensp;
            <Link to={`${base_path}?cid=${id_arr?.[idx]}`} onClick={(e) => onLinkClick(e, id_arr?.[idx])}>
              <Typography variant='b' sx={{ color: idx !== (name_arr?.length - 1) ? "#666666" : "#222222", "&:hover": { color: "#000" } }} className='transition-2'>
                <b>{d?.replaceAll('<\\>', '/')}</b>
              </Typography>
            </Link>
          </Fragment>
        )}
      </Box>
    </Box>
  )
}

export default Path;