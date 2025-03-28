import React, { useState } from 'react'
import MySnackbar from '@mui/material/Snackbar';
import { Slide, Button, SnackbarContent } from '@mui/material';
import useSnackbarStore from '../../../store/snackbar'

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

function Snackbar(props) {
  const { snackbar, closeSnackbar, message, open, anchorOrigin, autoHideDuration, status } = useSnackbarStore(state => state)

  const action = (
    <React.Fragment>
      <Button color="inherit" size="small" onClick={closeSnackbar}>
        確認
      </Button>
    </React.Fragment>
  );

  const getStatusMsg = (status) => {
    switch (status) {
      case 401:
        return "沒有權限！"
      case 500:
        return "API發生未知錯誤！"
    }
  }

  return (
    <MySnackbar
      open={open}
      onClose={closeSnackbar}
      anchorOrigin={anchorOrigin}
      TransitionComponent={SlideTransition}
      autoHideDuration={autoHideDuration}
      children={
        <div className='rainbow'>
          <div className='rainbow-container'>
            <SnackbarContent message={status != null ? getStatusMsg(status) : message} action={action} />
          </div>
        </div>
      }
    />
  )
}

export default Snackbar