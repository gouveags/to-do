import { style } from "../render/ansi.ts";
import type { Screen } from "../render/screen.ts";
import { defaultTheme, type Theme } from "../render/theme.ts";
import type { InputBuffer } from "../state/types.ts";
import { BOX_CHARS } from "./components.ts";

export type InputFieldOptions = {
  width: number;
  maxLines?: number;
  showCursor?: boolean;
  label?: string;
  withBorders?: boolean;
  padding?: number;
};

type WrappedLine = {
  text: string;
  bufferLine: number;
  startCol: number;
};

const wrapLines = (
  lines: string[],
  width: number,
  labelLen: number,
): WrappedLine[] => {
  const result: WrappedLine[] = [];

  for (let bufferLine = 0; bufferLine < lines.length; bufferLine++) {
    const line = lines[bufferLine] ?? "";
    const effectiveWidth = bufferLine === 0 ? width - labelLen : width;

    if (line.length === 0) {
      result.push({ text: "", bufferLine, startCol: 0 });
      continue;
    }

    let startCol = 0;
    let isFirstWrap = true;
    while (startCol < line.length) {
      const wrapWidth =
        isFirstWrap && bufferLine === 0 ? effectiveWidth : width;
      const chunk = line.slice(startCol, startCol + wrapWidth);
      result.push({ text: chunk, bufferLine, startCol });
      startCol += wrapWidth;
      isFirstWrap = false;
    }

    if (line.length > 0 && line.length % width === 0 && bufferLine === 0) {
    }
  }

  return result;
};

const findCursorVisualLine = (
  wrapped: WrappedLine[],
  cursorLine: number,
  cursorCol: number,
  width: number,
  labelLen: number,
): number => {
  for (let i = 0; i < wrapped.length; i++) {
    const w = wrapped[i];
    if (!w || w.bufferLine !== cursorLine) continue;

    const effectiveWidth =
      w.bufferLine === 0 && w.startCol === 0 ? width - labelLen : width;
    if (cursorCol >= w.startCol && cursorCol < w.startCol + effectiveWidth) {
      return i;
    }
    if (
      cursorCol === w.startCol + w.text.length &&
      w.text.length < effectiveWidth
    ) {
      return i;
    }
  }
  return wrapped.length - 1;
};

const drawBoxLine = (
  screen: Screen,
  row: number,
  col: number,
  width: number,
  borderColor: string,
): void => {
  const innerWidth = width - 2;
  screen.writeStyled(row, col, borderColor, BOX_CHARS.vertical);
  screen.writeAt(row, col + 1, " ".repeat(innerWidth));
  screen.writeStyled(
    row,
    col + 1 + innerWidth,
    borderColor,
    BOX_CHARS.vertical,
  );
};

export const drawInputField = (
  screen: Screen,
  row: number,
  col: number,
  input: InputBuffer,
  options: InputFieldOptions,
  theme: Theme = defaultTheme,
): void => {
  const {
    width,
    maxLines = 5,
    showCursor = true,
    label,
    withBorders = true,
    padding = 2,
  } = options;

  let currentRow = row;
  const innerWidth = width - 2;
  const textPadding = padding - 1;
  const labelLen = label ? label.length + 1 : 0;
  const textAreaWidth = innerWidth - textPadding * 2;

  const wrapped = wrapLines(input.lines, textAreaWidth - labelLen, labelLen);
  const cursorVisualLine = findCursorVisualLine(
    wrapped,
    input.cursor.line,
    input.cursor.col,
    textAreaWidth - labelLen,
    labelLen,
  );

  const totalVisualLines = Math.max(1, wrapped.length);
  const visibleLines = Math.min(totalVisualLines, maxLines);

  let startVisualLine = 0;
  if (cursorVisualLine >= startVisualLine + visibleLines) {
    startVisualLine = cursorVisualLine - visibleLines + 1;
  }
  if (cursorVisualLine < startVisualLine) {
    startVisualLine = cursorVisualLine;
  }
  startVisualLine = Math.max(
    0,
    Math.min(startVisualLine, totalVisualLines - visibleLines),
  );

  if (withBorders) {
    screen.writeStyled(
      currentRow,
      col,
      theme.colors.inputBorder,
      BOX_CHARS.roundedTopLeft +
        BOX_CHARS.horizontal.repeat(innerWidth) +
        BOX_CHARS.roundedTopRight,
    );
    currentRow++;
  }

  drawBoxLine(screen, currentRow, col, width, theme.colors.inputBorder);
  currentRow++;

  for (let i = 0; i < visibleLines; i++) {
    const visualLineIdx = startVisualLine + i;
    const wrappedLine = wrapped[visualLineIdx];
    const displayRow = currentRow + i;

    screen.writeStyled(
      displayRow,
      col,
      theme.colors.inputBorder,
      BOX_CHARS.vertical,
    );
    screen.writeAt(displayRow, col + 1, " ".repeat(textPadding));

    let textStartCol = col + 1 + textPadding;
    const isFirstLineOfBuffer =
      wrappedLine?.bufferLine === 0 && wrappedLine?.startCol === 0;

    if (label && isFirstLineOfBuffer) {
      screen.writeStyled(
        displayRow,
        textStartCol,
        theme.colors.inputLabel,
        label,
      );
      screen.writeAt(displayRow, textStartCol + label.length, " ");
      textStartCol += labelLen;
    } else if (label && i === 0 && visualLineIdx === 0) {
      screen.writeStyled(
        displayRow,
        textStartCol,
        theme.colors.inputLabel,
        label,
      );
      screen.writeAt(displayRow, textStartCol + label.length, " ");
      textStartCol += labelLen;
    }

    const lineWidth = isFirstLineOfBuffer
      ? textAreaWidth - labelLen
      : textAreaWidth;
    const lineText = wrappedLine?.text ?? "";

    const isCursorOnThisLine =
      wrappedLine &&
      wrappedLine.bufferLine === input.cursor.line &&
      visualLineIdx === cursorVisualLine;

    if (showCursor && isCursorOnThisLine) {
      const cursorPosInLine = input.cursor.col - wrappedLine.startCol;
      const before = lineText.slice(0, cursorPosInLine);
      const cursorChar = lineText[cursorPosInLine] ?? " ";
      const after = lineText.slice(cursorPosInLine + 1);

      screen.writeAt(displayRow, textStartCol, before);
      screen.writeStyled(
        displayRow,
        textStartCol + before.length,
        style.inverse,
        cursorChar,
      );
      const afterPadded = after.padEnd(lineWidth - before.length - 1);
      screen.writeAt(displayRow, textStartCol + before.length + 1, afterPadded);
    } else {
      screen.writeAt(displayRow, textStartCol, lineText.padEnd(lineWidth));
    }

    screen.writeAt(
      displayRow,
      textStartCol + lineWidth,
      " ".repeat(
        Math.max(
          0,
          innerWidth -
            textPadding -
            lineWidth -
            (isFirstLineOfBuffer ? labelLen : 0),
        ),
      ),
    );
    screen.writeStyled(
      displayRow,
      col + 1 + innerWidth,
      theme.colors.inputBorder,
      BOX_CHARS.vertical,
    );
  }

  currentRow += visibleLines;

  drawBoxLine(screen, currentRow, col, width, theme.colors.inputBorder);
  currentRow++;

  if (withBorders) {
    screen.writeStyled(
      currentRow,
      col,
      theme.colors.inputBorder,
      BOX_CHARS.roundedBottomLeft +
        BOX_CHARS.horizontal.repeat(innerWidth) +
        BOX_CHARS.roundedBottomRight,
    );
  }
};

export const getInputFieldHeight = (
  input: InputBuffer,
  maxLines: number,
  withBorders = true,
  textAreaWidth = 50,
  labelLen = 0,
): number => {
  const wrapped = wrapLines(input.lines, textAreaWidth - labelLen, labelLen);
  const contentLines = Math.min(Math.max(1, wrapped.length), maxLines);
  const borderLines = withBorders ? 2 : 0;
  const emptyLines = 2;
  return contentLines + borderLines + emptyLines;
};
