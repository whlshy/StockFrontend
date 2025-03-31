import React, { Fragment, useRef, useState, useCallback, useEffect } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { rehypePlugins } from '.'
import Config from 'Config'

function MarkdwonEditor({
  cid = null, onChange, value, onKeyDown, autoFocus = true, placeholder = "Esc鍵離開編輯器"
}) {
  const mdEl = useRef(null)
  const inputRef = useRef(null)

  const [insertImg, setInsertImg] = useState("")
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setIsFullscreen(mdEl.current?.fullscreen)
  }, [mdEl.current?.fullscreen]);

  const handleUploadMDPic = async (file) => {
    let response = await api({
      method: "POST",
      cmd: `api/File`,
      fileObj: { ...(cid == null ? {} : { cid }), files: [file], bMD: true }
    })
    if (response.ok) {
      return `${Config.apiurl}/${cid == null ? "Assets" : "api/File"}?uuid=${response.body.uuid}`
    } else {
      return "上傳圖片失敗"
    }
  }

  const EditorChild = (
    <MDEditor
      ref={mdEl}
      value={value}
      height={"100%"}
      visibleDragbar={false}
      textareaProps={{ placeholder: placeholder, onKeyDown }}
      onChange={(text, event) => onChange(text, event)}
      // onPaste={async (event) => {
      //   await onImagePasted(event.clipboardData, onChange);
      // }}
      fullscreen={isFullscreen}
      previewOptions={{
        className: 'category_md_container',
        rehypePlugins: rehypePlugins,
        rehypeRewrite: (node, index, parent) => {
          if (node.tagName == "img") {
            node.properties.src = (node.properties.src?.[0] == '/' ? Config.apiurl : "") + node.properties.src
          }
        }
      }}
      // commands={[...commands.getCommands().filter(f => f.name != 'image'), ...editChoice(inputRef, textApiRef)]}
      autoFocus={autoFocus}
    />
  )


  return (
    <Fragment>
      <input
        ref={inputRef}
        style={{ visibility: "hidden", display: "none" }}
        type="file"
        accept=".jpg,.png,.jpeg,.jfif,.gif"
        name="avatar"
        // value={insertImg}
        // onChange={inputImageHandler}
      />
      {isFullscreen ?
        <Portal>
          {EditorChild}
        </Portal> :
        EditorChild
      }
    </Fragment>
  )
}

export default MarkdwonEditor