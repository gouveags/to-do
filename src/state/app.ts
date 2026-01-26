import type { AppState, Todo, TodoItem } from './types.ts'

export type Action =
  | { type: 'NAVIGATE_UP' }
  | { type: 'NAVIGATE_DOWN' }
  | { type: 'SELECT' }
  | { type: 'BACK' }
  | { type: 'QUIT' }
  | { type: 'QUICK_SELECT'; option: number }
  | { type: 'INPUT_CHAR'; char: string }
  | { type: 'INPUT_BACKSPACE' }
  | { type: 'SUBMIT' }
  | { type: 'LOAD_TODOS'; todos: Todo[] }

const MAIN_MENU_OPTIONS = 3

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

const mainMenuTransition = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'NAVIGATE_DOWN':
      return { ...state, menuIndex: (state.menuIndex + 1) % MAIN_MENU_OPTIONS }
    case 'NAVIGATE_UP':
      return { ...state, menuIndex: (state.menuIndex - 1 + MAIN_MENU_OPTIONS) % MAIN_MENU_OPTIONS }
    case 'SELECT': {
      const views = ['create_todo', 'load_todo', 'quit'] as const
      return { ...state, view: views[state.menuIndex] ?? 'main_menu', menuIndex: 0 }
    }
    case 'QUICK_SELECT': {
      const views = ['create_todo', 'load_todo', 'quit'] as const
      return { ...state, view: views[action.option - 1] ?? 'main_menu', menuIndex: 0 }
    }
    default:
      return state
  }
}

const createTodoTransition = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'BACK':
      return { ...state, view: 'main_menu', inputBuffer: '', menuIndex: 0 }
    case 'INPUT_CHAR':
      return { ...state, inputBuffer: state.inputBuffer + action.char }
    case 'INPUT_BACKSPACE':
      return { ...state, inputBuffer: state.inputBuffer.slice(0, -1) }
    case 'SUBMIT': {
      if (!state.inputBuffer.trim()) return state
      const now = Date.now()
      const newTodo: Todo = {
        id: generateId(),
        title: state.inputBuffer.trim(),
        items: [],
        createdAt: now,
        updatedAt: now,
      }
      return {
        ...state,
        view: 'view_todo',
        todos: [...state.todos, newTodo],
        selectedTodoId: newTodo.id,
        inputBuffer: '',
        menuIndex: 0,
      }
    }
    default:
      return state
  }
}

const loadTodoTransition = (state: AppState, action: Action): AppState => {
  const todoCount = state.todos.length

  switch (action.type) {
    case 'BACK':
      return { ...state, view: 'main_menu', menuIndex: 0 }
    case 'NAVIGATE_DOWN':
      return { ...state, menuIndex: todoCount > 0 ? (state.menuIndex + 1) % todoCount : 0 }
    case 'NAVIGATE_UP':
      return { ...state, menuIndex: todoCount > 0 ? (state.menuIndex - 1 + todoCount) % todoCount : 0 }
    case 'SELECT': {
      const todo = state.todos[state.menuIndex]
      if (!todo) return state
      return { ...state, view: 'view_todo', selectedTodoId: todo.id, menuIndex: 0 }
    }
    default:
      return state
  }
}

const viewTodoTransition = (state: AppState, action: Action): AppState => {
  const todo = state.todos.find(t => t.id === state.selectedTodoId)
  if (!todo) return { ...state, view: 'main_menu', menuIndex: 0 }

  switch (action.type) {
    case 'BACK':
      return { ...state, view: 'main_menu', selectedTodoId: null, menuIndex: 0, inputBuffer: '' }
    case 'NAVIGATE_DOWN':
      return { ...state, menuIndex: (state.menuIndex + 1) % Math.max(1, todo.items.length) }
    case 'NAVIGATE_UP':
      return { ...state, menuIndex: (state.menuIndex - 1 + Math.max(1, todo.items.length)) % Math.max(1, todo.items.length) }
    case 'SELECT': {
      const item = todo.items[state.menuIndex]
      if (!item) return state
      const updatedItems = todo.items.map((it, i) =>
        i === state.menuIndex ? { ...it, done: !it.done } : it
      )
      const updatedTodo = { ...todo, items: updatedItems, updatedAt: Date.now() }
      return {
        ...state,
        todos: state.todos.map(t => t.id === todo.id ? updatedTodo : t),
      }
    }
    case 'INPUT_CHAR':
      return { ...state, inputBuffer: state.inputBuffer + action.char }
    case 'INPUT_BACKSPACE':
      return { ...state, inputBuffer: state.inputBuffer.slice(0, -1) }
    case 'SUBMIT': {
      if (!state.inputBuffer.trim()) return state
      const newItem: TodoItem = { text: state.inputBuffer.trim(), done: false }
      const updatedTodo = {
        ...todo,
        items: [...todo.items, newItem],
        updatedAt: Date.now(),
      }
      return {
        ...state,
        todos: state.todos.map(t => t.id === todo.id ? updatedTodo : t),
        inputBuffer: '',
        menuIndex: updatedTodo.items.length - 1,
      }
    }
    default:
      return state
  }
}

export const transition = (state: AppState, action: Action): AppState => {
  if (action.type === 'QUIT') {
    return { ...state, view: 'quit' }
  }

  if (action.type === 'LOAD_TODOS') {
    return { ...state, todos: action.todos }
  }

  switch (state.view) {
    case 'main_menu':
      return mainMenuTransition(state, action)
    case 'create_todo':
      return createTodoTransition(state, action)
    case 'load_todo':
      return loadTodoTransition(state, action)
    case 'view_todo':
      return viewTodoTransition(state, action)
    default:
      return state
  }
}
