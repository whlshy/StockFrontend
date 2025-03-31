import React, { Fragment, useState } from 'react'

import { useAtom } from 'jotai'
import { atomWithStorage } from "jotai/utils"

import { useAddFolder } from '@/apis'

import { DialogContent, DialogActions, TextField, Box, Button } from '@mui/material'
import { AddButton } from '@/components/elements/buttons'
import { DialogWrapper, full_props } from '@/components/elements/dialog/Dialog'
import { MarkdwonEditor } from '@/components/elements/markdown'

function AddDialogButton(props) {

  return (
    <DialogWrapper
      dialogProps={{
        ...full_props,
        title: "新增資料夾",
        body: <AddFolderBody {...props} />,
      }}
    >
      <AddButton size={"small"} />
    </DialogWrapper>
  )
}

const addFolderAtom = atomWithStorage("addFolder", { CName: "", Des: "" })

const AddFolderBody = ({ cid, handleClose, refetch }) => {
  const [data, setData] = useAtom(addFolderAtom)
  const { CName, Des } = data

  const onChange = (e) => {
    setData({
      ...data,
      [e.target.name]: e.target.value
    })
  }

  const addFolderApi = useAddFolder({ onSuccess: () => refetch?.() })

  const clearData = () => {
    setData({ CName: "", Des: "" })
  }

  const handleSubmit = () => {
    addFolderApi.mutate({ cid, ...data }, { onSuccess: (res) => res?.body?.status && (clearData(), handleClose?.()) })
  }

  return (
    <Fragment>
      <DialogContent dividers>
        <Box className="flex flex-col" sx={{ height: "100%" }}>
          <TextField
            label="資料夾名稱"
            variant="standard"
            value={CName}
            name="CName"
            onChange={onChange}
            autoFocus={true}
            fullWidth
          />
          <br />
          <Box className="flex-1-1">
            <MarkdwonEditor
              value={Des}
              onChange={(text) => setData({ ...data, Des: text })}
              placeholder='請輸入資料夾描述'
              autoFocus={false}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSubmit}>
          完成
        </Button>
      </DialogActions>
    </Fragment>
  )
}

export default AddDialogButton