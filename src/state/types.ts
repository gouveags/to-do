export type Todo = {
  id: string
  title: string
  items: TodoItem[]
  createdAt: number
  updatedAt: number
}

export type TodoItem = {
  text: string
  done: boolean
}

export type AppView =
  | 'main_menu'
  | 'create_todo'
  | 'load_todo'
  | 'view_todo'
  | 'quit'

export type AppState = {
  view: AppView
  menuIndex: number
  todos: Todo[]
  selectedTodoId: string | null
  inputBuffer: string
  message: string | null
}

export const createInitialState = (): AppState => ({
  view: 'main_menu',
  menuIndex: 0,
  todos: [],
  selectedTodoId: null,
  inputBuffer: '',
  message: null,
})
