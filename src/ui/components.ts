import type { Screen } from '../render/screen.ts'
import { style } from '../render/ansi.ts'

export const BOX_CHARS = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
} as const

export const drawBox = (
  screen: Screen,
  row: number,
  col: number,
  width: number,
  height: number,
  title?: string
): void => {
  const titlePart = title ? ` ${title} ` : ''
  const topLine = BOX_CHARS.topLeft +
    BOX_CHARS.horizontal +
    titlePart +
    BOX_CHARS.horizontal.repeat(Math.max(0, width - 4 - titlePart.length)) +
    BOX_CHARS.topRight

  screen.writeAt(row, col, topLine)

  for (let i = 1; i < height - 1; i++) {
    screen.writeAt(row + i, col, BOX_CHARS.vertical + ' '.repeat(width - 2) + BOX_CHARS.vertical)
  }

  screen.writeAt(row + height - 1, col, BOX_CHARS.bottomLeft + BOX_CHARS.horizontal.repeat(width - 2) + BOX_CHARS.bottomRight)
}

export const drawText = (
  screen: Screen,
  row: number,
  col: number,
  text: string,
  maxWidth?: number
): void => {
  const displayText = maxWidth ? text.slice(0, maxWidth) : text
  screen.writeAt(row, col, displayText)
}

export const drawHighlightedText = (
  screen: Screen,
  row: number,
  col: number,
  text: string,
  highlighted: boolean
): void => {
  if (highlighted) {
    screen.writeStyled(row, col, style.inverse, text)
  } else {
    screen.writeAt(row, col, text)
  }
}

export const drawMenuItem = (
  screen: Screen,
  row: number,
  col: number,
  text: string,
  selected: boolean,
  width: number
): void => {
  const prefix = selected ? '> ' : '  '
  const paddedText = (prefix + text).padEnd(width)
  drawHighlightedText(screen, row, col, paddedText, selected)
}

export const drawInput = (
  screen: Screen,
  row: number,
  col: number,
  label: string,
  value: string,
  width: number
): void => {
  screen.writeAt(row, col, label)
  const inputWidth = width - label.length - 2
  const displayValue = value.slice(-inputWidth).padEnd(inputWidth)
  screen.writeStyled(row, col + label.length, style.dim, '[' + displayValue + ']')
}
