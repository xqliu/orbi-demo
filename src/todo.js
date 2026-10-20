// Todo list logic. Pure functions over an array of { id, title, done }.
// The page (src/app.js) only renders what these return; test/todo.test.js covers them.

export function addTodo(todos, title) {
  const text = String(title).trim();
  if (text === "") return todos;
  const id = todos.reduce((max, t) => Math.max(max, t.id), 0) + 1;
  return [...todos, { id, title: text, done: false }];
}

export function toggleTodo(todos, id) {
  return todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
}

export function removeTodo(todos, id) {
  return todos.filter((t) => t.id !== id);
}

export function clearCompleted(todos) {
  return todos.filter((t) => !t.done);
}

export function remainingLabel(todos) {
  const count = todos.filter((t) => !t.done).length;
  return `${count} ${count === 1 ? "item" : "items"} left`;
}

export function visibleTodos(todos, filter) {
  if (filter === "active") return todos.filter((t) => !t.done);
  if (filter === "done") return todos.filter((t) => t.done);
  return todos;
}

// Shown under the list whenever the current filter has no visible todos.
export const EMPTY_FILTER_MESSAGE = "当前没有符合筛选条件的待办。";

export function emptyFilterMessage(visible) {
  return visible.length === 0 ? EMPTY_FILTER_MESSAGE : "";
}
