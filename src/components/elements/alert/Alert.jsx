import React from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import useAlertStore from '../../../store/alert'

function Alert() {
  const { open, closeAlert, title, content, handleAgree, handleDisagree } = useAlertStore(state => state)

  return (
    <Dialog
      open={open}
      onClose={closeAlert}
    >
      <DialogTitle>
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ whiteSpace: "pre-line" }}>
          {content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={(handleDisagree, closeAlert)}>取消</Button>
        <Button onClick={() => handleAgree(closeAlert)} autoFocus>
          確認
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default Alert