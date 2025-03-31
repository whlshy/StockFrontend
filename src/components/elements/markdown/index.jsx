import MarkdwonEditor from "./MarkdwonEditor"
import MarkdownView from "./MarkdownView"
import { defaultSchema } from 'hast-util-sanitize';
import rehypeSanitize from "rehype-sanitize";
import rehypeExternalLinks from 'rehype-external-links'

const schema = {
  ...defaultSchema,
  tagNames: [
    ...defaultSchema.tagNames,
    'iframe', 'figure', 'colgroup', 'col', 'svg', 'path'
  ],
  attributes: {
    ...defaultSchema.attributes,
    '*': [
      ...(defaultSchema.attributes['*'] || []),
      'className',
      'style',
      'title',
      'alt',
      'class',
      'rules',
    ],
    a: ['href', 'name', 'target'],
    img: ['src', 'alt', 'title'],
    iframe: [
      'src',
      'width',
      'height',
      'frameborder',
      'allow',
      'allowfullscreen',
      'title',
      'referrerpolicy'
    ],
    td: [
      ...(defaultSchema.attributes.td || []),
      'rowspan', // 允許 rowspan 屬性
      'colspan', // 如果你也需要 colspan 屬性，可以一起添加
    ],
    path: [
      ...(defaultSchema.attributes.path || []),
      'fill-rule',
      'd',
    ],
    svg: [
      ...(defaultSchema.attributes.svg || []),
      'fill',
      'viewBox'
    ]
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto'],
    src: ['http', 'https']
  }
}

const rehypePlugins = [[rehypeSanitize, schema], [rehypeExternalLinks, { target: '_blank' }]];

export default MarkdownView
export { MarkdwonEditor, MarkdownView, rehypePlugins }