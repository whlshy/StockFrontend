import React, { cloneElement, useState, Fragment } from 'react'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Box, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { styled } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import RwdWrapper from '../wrapper/RwdWrapper'

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

export default function Index(props) {
  const { isRwdWidth } = props

  return !!isRwdWidth ? (
    <RwdWrapper onlyProps={true} noDrawer={true}>
      <CustomDialog {...props} />
    </RwdWrapper>
  ) :
    <CustomDialog {...props} />
}

const CustomDialog = (props) => {
  const { content_width,
    open, title, content, actions, body, handleClose, disableScrollLock, fullWidth, fullHeight, maxWidth, fullScreen, isRwdWidth, contentProps = {} } = props

  const theme = useTheme()
  const isFullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const p = isRwdWidth ? {
    sx: {
      width: "100%",
      maxWidth: `${content_width} !important`,
      maxHeight: "100%",
      height: fullHeight ? "100%" : "auto",
    }
  } : { fullWidth, maxWidth, fullScreen }

  return (
    <BootstrapDialog
      onClose={handleClose}
      open={open}
      disableScrollLock={!!disableScrollLock}
      {...(!!isRwdWidth ? {} : p)}
      PaperProps={{
        ...(!!isRwdWidth ? p : {})
      }}
      fullScreen={isFullScreen}
    >
      <Box className="flex aic jcsb" sx={{ p: 1 }}>
        <DialogTitle sx={{ m: 0, p: 0, pl: 1 }}>
          {title}
        </DialogTitle>
        <IconButton
          onClick={handleClose}
          sx={{
            // position: 'absolute',
            // right: 8,
            // top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      {
        !!body ? cloneElement(body, { handleClose }) :
          <>
            <DialogContent dividers sx={{ ...contentProps }}>
              {!!content && cloneElement(content, { handleClose })}
            </DialogContent>
            {!!actions &&
              <DialogActions>
                {cloneElement(actions, { handleClose })}
              </DialogActions>
            }
          </>
      }
    </BootstrapDialog>
  )
}

const DialogWrapper = ({
  dialogProps = {},
  children,
}) => {
  const [open, setOpen] = useState(false)
  return (
    <Fragment>
      <Index
        {...dialogProps}
        open={open}
        handleClose={() => setOpen(false)}
      />
      {children && cloneElement(children, { onClick: () => setOpen(true) })}
    </Fragment>
  )
}

const full_props = {
  fullWidth: true,
  isRwdWidth: true,
  fullHeight: "100%",
}

export { DialogWrapper, full_props }