import React from 'react'
import MDEditor from '@uiw/react-md-editor'
import { rehypePlugins } from '.'
import Config from 'Config'

function MarkdownView({
  source,
  style,
  ...props
}) {
  return (
    <MDEditor.Markdown
      className='markdown-body'
      source={source}
      // linkTarget="_blank"
      style={style ? { style } : {}}
      rehypePlugins={rehypePlugins}
      rehypeRewrite={(node, index, parent) => {
        if (node.tagName == "img") {
          const title = node.properties.title, alt = node.properties.alt;
          node.properties.title = title || alt || "圖片"
          node.properties.alt = alt || title || "圖片"
          node.properties.src = (node.properties.src?.[0] == '/' ? Config.apiurl : "") + node.properties.src
        }
        if (node.tagName === "a" && parent && /^h(1|2|3|4|5|6)/.test(parent.tagName)) {
          parent.children = parent.children.slice(1)
        }
      }}
      {...props}
    />
  )
}

export default MarkdownView