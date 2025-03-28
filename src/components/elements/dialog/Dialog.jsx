import React, { cloneElement, useState, Fragment } from 'react'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Box } from '@mui/material'
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

function Index(props) {
  const { isRwdWidth } = props

  return !!isRwdWidth ? (
    <RwdWrapper onlyProps={true} noDrawer={true}>
      <CustomDialog {...props} />
    </RwdWrapper>
  ) :
    <CustomDialog {...props} />
}

export default Index

const CustomDialog = (props) => {
  const { content_width,
    open, title, content, actions, body, closeDialog, disableScrollLock, fullWidth, fullHeight, maxWidth, fullScreen, isRwdWidth, contentProps = {} } = props

  const p = isRwdWidth ? {
    sx: {
      width: "100%",
      maxWidth: `${content_width} !important`,
      height: fullHeight ? "100%" : "auto",
    }
  } : { fullWidth, maxWidth, fullScreen }

  return (
    <BootstrapDialog
      onClose={closeDialog}
      open={open}
      disableScrollLock={!!disableScrollLock}
      {...(!!isRwdWidth ? {} : p)}
      PaperProps={{
        ...(!!isRwdWidth ? p : {})
      }}
    >
      <Box className="flex aic jcsb" sx={{ p: 1 }}>
        <DialogTitle sx={{ m: 0, p: 0, pl: 1 }}>
          {title}
        </DialogTitle>
        <IconButton
          onClick={closeDialog}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      {
        !!body ? cloneElement(body, { closeDialog }) :
          <>
            <DialogContent dividers sx={{ ...contentProps }}>
              {!!content && cloneElement(content, { closeDialog })}
            </DialogContent>
            {!!actions &&
              <DialogActions>
                {cloneElement(actions, { closeDialog })}
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

export { DialogWrapper }