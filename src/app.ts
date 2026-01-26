import type { KeyEvent } from './input/keys.ts'
import type { AppState } from './state/types.ts'
import type { Action } from './state/app.ts'
import { createInitialState } from './state/types.ts'
import { transition } from './state/app.ts'
import { createScreen } from './render/screen.ts'
import { screen as screenCodes, cursor } from './render/ansi.ts'
import { enableRawMode, disableRawMode, startKeyListener } from './input/keyboard.ts'
import { render } from './ui/menu.ts'
import { ensureStorageDir, listTodos, saveTodo } from './storage/todos.ts'

const keyToAction = (key: KeyEvent, state: AppState): Action | null => {
  if (key.ctrl && key.name === 'c') return { type: 'QUIT' }
  if (key.name === 'escape') return { type: 'BACK' }

  if (state.view === 'main_menu') {
    switch (key.name) {
      case 'up': return { type: 'NAVIGATE_UP' }
      case 'down': return { type: 'NAVIGATE_DOWN' }
      case 'enter': return { type: 'SELECT' }
      case '1': return { type: 'QUICK_SELECT', option: 1 }
      case '2': return { type: 'QUICK_SELECT', option: 2 }
      case '3': return { type: 'QUICK_SELECT', option: 3 }
    }
    return null
  }

  if (state.view === 'load_todo') {
    switch (key.name) {
      case 'up': return { type: 'NAVIGATE_UP' }
      case 'down': return { type: 'NAVIGATE_DOWN' }
      case 'enter': return { type: 'SELECT' }
    }
    return null
  }

  if (state.view === 'create_todo' || state.view === 'view_todo') {
    if (key.name === 'enter') return { type: 'SUBMIT' }
    if (key.name === 'backspace') return { type: 'INPUT_BACKSPACE' }
    if (key.name.length === 1 && !key.ctrl) return { type: 'INPUT_CHAR', char: key.name }
  }

  if (state.view === 'view_todo') {
    switch (key.name) {
      case 'up': return { type: 'NAVIGATE_UP' }
      case 'down': return { type: 'NAVIGATE_DOWN' }
    }
  }

  return null
}

export const runApp = (): void => {
  ensureStorageDir()
  const todos = listTodos()
  let state: AppState = { ...createInitialState(), todos }
  const scr = createScreen()
  let stopListener: (() => void) | null = null

  const renderFrame = () => {
    process.stdout.write(scr.prepare())
    render(scr, state)
    process.stdout.write(scr.flush())
  }

  const cleanup = () => {
    process.stdout.write(screenCodes.clear + cursor.home + cursor.show)
    disableRawMode()
    if (stopListener) stopListener()
  }

  const handleKey = (key: KeyEvent) => {
    const action = keyToAction(key, state)
    if (!action) return

    const prevView = state.view
    state = transition(state, action)

    if (state.view === 'quit') {
      cleanup()
      process.exit(0)
    }

    if (state.view === 'main_menu' && prevView !== 'main_menu') {
      state = { ...state, todos: listTodos() }
    }

    const selectedTodo = state.todos.find(t => t.id === state.selectedTodoId)
    if (selectedTodo && (action.type === 'SUBMIT' || action.type === 'SELECT')) {
      saveTodo(selectedTodo)
    }

    renderFrame()
  }

  enableRawMode()
  stopListener = startKeyListener(handleKey)
  renderFrame()
}
