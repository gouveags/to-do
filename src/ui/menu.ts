import type { Screen } from '../render/screen.ts'
import type { AppState, Todo } from '../state/types.ts'
import { style } from '../render/ansi.ts'
import { drawBox, drawMenuItem, drawText, drawInput, drawHighlightedText } from './components.ts'

const BOX_WIDTH = 45
const BOX_HEIGHT = 12
const START_ROW = 2
const START_COL = 2

const MAIN_MENU_ITEMS = [
  '1. Create a new to-do',
  '2. Load a to-do',
  '3. Quit',
]

const HELP_TEXT = [
  '[↑/↓] Navigate  [Enter] Select',
  '[1-3] Quick select  [Ctrl+C] Quit',
  '[ESC] Back to menu',
]

export const renderMainMenu = (screen: Screen, state: AppState): void => {
  drawBox(screen, START_ROW, START_COL, BOX_WIDTH, BOX_HEIGHT, 'To-Do App')

  for (let i = 0; i < MAIN_MENU_ITEMS.length; i++) {
    const item = MAIN_MENU_ITEMS[i]
    if (item) {
      drawMenuItem(screen, START_ROW + 2 + i, START_COL + 2, item, i === state.menuIndex, BOX_WIDTH - 4)
    }
  }

  for (let i = 0; i < HELP_TEXT.length; i++) {
    const help = HELP_TEXT[i]
    if (help) {
      screen.writeStyled(START_ROW + 7 + i, START_COL + 2, style.dim, help)
    }
  }
}

export const renderCreateTodo = (screen: Screen, state: AppState): void => {
  drawBox(screen, START_ROW, START_COL, BOX_WIDTH, 8, 'Create To-Do')
  drawText(screen, START_ROW + 2, START_COL + 2, 'Enter a name for your to-do:')
  drawInput(screen, START_ROW + 4, START_COL + 2, 'Name: ', state.inputBuffer, BOX_WIDTH - 4)
  screen.writeStyled(START_ROW + 6, START_COL + 2, style.dim, '[Enter] Create  [ESC] Cancel')
}

export const renderLoadTodo = (screen: Screen, state: AppState): void => {
  const todoCount = state.todos.length
  const boxHeight = Math.max(8, Math.min(16, todoCount + 5))
  drawBox(screen, START_ROW, START_COL, BOX_WIDTH, boxHeight, 'Load To-Do')

  if (todoCount === 0) {
    screen.writeStyled(START_ROW + 2, START_COL + 2, style.dim, 'No to-dos found.')
    screen.writeStyled(START_ROW + 4, START_COL + 2, style.dim, '[ESC] Back')
    return
  }

  const maxVisible = boxHeight - 5
  const startIdx = Math.max(0, state.menuIndex - maxVisible + 1)

  for (let i = 0; i < maxVisible && startIdx + i < todoCount; i++) {
    const todo = state.todos[startIdx + i]
    if (todo) {
      const doneCount = todo.items.filter(it => it.done).length
      const label = `${todo.title} (${doneCount}/${todo.items.length})`
      drawMenuItem(screen, START_ROW + 2 + i, START_COL + 2, label, startIdx + i === state.menuIndex, BOX_WIDTH - 4)
    }
  }

  screen.writeStyled(START_ROW + boxHeight - 2, START_COL + 2, style.dim, '[Enter] Select  [ESC] Back')
}

export const renderViewTodo = (screen: Screen, state: AppState): void => {
  const todo = state.todos.find(t => t.id === state.selectedTodoId)
  if (!todo) return

  const itemCount = todo.items.length
  const boxHeight = Math.max(10, Math.min(18, itemCount + 7))
  drawBox(screen, START_ROW, START_COL, BOX_WIDTH, boxHeight, todo.title)

  if (itemCount === 0) {
    screen.writeStyled(START_ROW + 2, START_COL + 2, style.dim, 'No items yet. Add one below.')
  } else {
    const maxVisible = boxHeight - 7
    const startIdx = Math.max(0, state.menuIndex - maxVisible + 1)

    for (let i = 0; i < maxVisible && startIdx + i < itemCount; i++) {
      const item = todo.items[startIdx + i]
      if (item) {
        const checkbox = item.done ? '[x]' : '[ ]'
        const text = `${checkbox} ${item.text}`
        drawHighlightedText(screen, START_ROW + 2 + i, START_COL + 2, text.padEnd(BOX_WIDTH - 4), startIdx + i === state.menuIndex)
      }
    }
  }

  drawInput(screen, START_ROW + boxHeight - 4, START_COL + 2, 'Add: ', state.inputBuffer, BOX_WIDTH - 4)
  screen.writeStyled(START_ROW + boxHeight - 2, START_COL + 2, style.dim, '[Enter] Toggle/Add  [ESC] Back')
}

export const render = (screen: Screen, state: AppState): void => {
  switch (state.view) {
    case 'main_menu':
      renderMainMenu(screen, state)
      break
    case 'create_todo':
      renderCreateTodo(screen, state)
      break
    case 'load_todo':
      renderLoadTodo(screen, state)
      break
    case 'view_todo':
      renderViewTodo(screen, state)
      break
  }
}
