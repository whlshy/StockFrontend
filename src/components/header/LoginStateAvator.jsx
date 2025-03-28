import React from 'react'

import { Button, IconButton } from '@mui/material'

import Login from '../elements/dialog/Login'
import { Avatar } from '../ui'

import { useDialogStore, useAlertStore, useAccountStore } from '../../store'

const LoginStateAvator = ({
  logout = () => { },
}) => {
  const { isLogin, isLoading, name = "" } = useAccountStore()
  const { setDialog, closeDialog } = useDialogStore()
  const { setAlert } = useAlertStore()

  // 抓取使用者資訊中
  if (!!isLoading) {
    return (
      <span>Loading...</span>
    )
  }

  // 未登入
  if (!isLogin) {
    return (
      <Button
        color="inherit"
        onClick={() => setDialog({
          title: '登入',
          content: <Login state={`${location.pathname}${location.search}`} />,
          actions: <Button onClick={() => closeDialog()}>關閉</Button>
        })}
      >
        登入
      </Button>
    )
  }

  // 登入
  return (
    <IconButton
      size="large"
      color="inherit"
      onClick={() => setAlert({
        title: "登出",
        content: "確定要登出？",
        handleAgree: (callback) => (logout(), callback())
      })}
    >
      <Avatar name={name} />
    </IconButton>
  )
}

export default LoginStateAvator;