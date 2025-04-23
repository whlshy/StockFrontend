import React, { Fragment } from 'react'

import { useAtom } from 'jotai'
import { atomWithStorage } from "jotai/utils"

import { useAddFolder } from '@/apis'

import { DialogContent, DialogActions, Button } from '@mui/material'
import { AddButton } from '@/components/elements/buttons'
import { DialogWrapper, full_props } from '@/components/elements/dialog/Dialog'
import FolderEditor from './FolderEditor'

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
        <FolderEditor
          initData={data}
          onChange={d => setData(d)}
        />
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