import React, { Fragment } from 'react'

import { useEditFolder } from '@/apis'

import { DialogContent, DialogActions, Button, Tooltip } from '@mui/material'
import { DialogWrapper, full_props } from '@/components/elements/dialog/Dialog'
import FolderEditor from './FolderEditor'

function EditDialogButton({
  isRoot = true,
  initData,
  refetch,
  children
}) {

  if (isRoot == false) {
    return (
      <DialogWrapper
        dialogProps={{
          ...full_props,
          title: "編輯資料夾",
          body: <EditDialog initData={initData || {}} refetch={refetch} />,
        }}
      >
        <Tooltip title={"編輯資料夾"}>
          <div className='cursor-pointer'>
            {children}
          </div>
        </Tooltip>
      </DialogWrapper>
    )
  }

  return (
    children
  )
}

export default EditDialogButton

const EditDialog = ({ initData, refetch, handleClose }) => {
  const [data, setData] = React.useState(initData || {})


  const editFolderApi = useEditFolder({ onSuccess: () => refetch?.() })

  const handleSubmit = () => {
    editFolderApi.mutate({ cid: data?.cid, cname: data?.CName, des: data?.Des }, { onSuccess: (res) => res?.body?.status && (handleClose?.()) })
  }

  return (
    <Fragment>
      <DialogContent dividers>
        <FolderEditor
          initData={initData}
          onChange={d => setData({ ...data, ...d })}
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