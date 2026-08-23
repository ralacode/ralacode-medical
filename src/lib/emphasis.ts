/** CommonMark の強調規則は、）** のように閉じ括弧の直後だと ** を無視する。 */
const boldSource = /\*\*([^*]+)\*\*/
const underlineSource = /__([^_]+)__/

export function applyEmphasisToHtml(source: string) {
  return source
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
}

type TextNode = { type: "text"; value: string }
type StrongNode = { type: "strong"; children: TextNode[] }
type PhrasingContent = TextNode | StrongNode

function splitEmphasis(value: string, pattern: RegExp): PhrasingContent[] | null {
  const children: PhrasingContent[] = []
  let lastIndex = 0
  let matched = false

  for (const match of value.matchAll(pattern)) {
    matched = true
    const index = match.index ?? 0
    if (index > lastIndex) {
      children.push({ type: "text", value: value.slice(lastIndex, index) })
    }
    children.push({
      type: "strong",
      children: [{ type: "text", value: match[1]! }],
    })
    lastIndex = index + match[0].length
  }

  if (!matched) return null

  if (lastIndex < value.length) {
    children.push({ type: "text", value: value.slice(lastIndex) })
  }

  return children
}

function splitAllEmphasis(value: string): PhrasingContent[] | null {
  const withBold = splitEmphasis(value, new RegExp(boldSource, "g"))
  if (!withBold) return null

  const flattened: PhrasingContent[] = []
  for (const node of withBold) {
    if (node.type !== "text" || !node.value.includes("__")) {
      flattened.push(node)
      continue
    }

    const withUnderline = splitEmphasis(
      node.value,
      new RegExp(underlineSource, "g")
    )
    if (withUnderline) {
      flattened.push(...withUnderline)
    } else {
      flattened.push(node)
    }
  }

  return flattened
}

type MdastNode = {
  type: string
  value?: string
  children?: MdastNode[]
}

/** remark プラグイン: パースされなかった **…** を strong に直す */
export function remarkFixEmphasis() {
  return (tree: MdastNode) => {
    walk(tree)
  }
}

function walk(node: MdastNode) {
  if (!node.children) return

  for (let index = node.children.length - 1; index >= 0; index -= 1) {
    const child = node.children[index]!

    if (child.type === "text" && typeof child.value === "string") {
      const replacement = splitAllEmphasis(child.value)
      if (replacement) {
        node.children.splice(index, 1, ...replacement)
        continue
      }
    }

    walk(child)
  }
}
