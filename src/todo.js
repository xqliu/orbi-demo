// Todo list logic. Pure functions over an array of { id, title, done, completedAt? }.
// The page (src/app.js) only renders what these return; test/todo.test.js covers them.

export function addTodo(todos, title) {
  const text = String(title).trim();
  if (text === "") return todos;
  const id = todos.reduce((max, t) => Math.max(max, t.id), 0) + 1;
  return [...todos, { id, title: text, done: false }];
}

// Completion date of a done todo, as the local calendar day YYYY-MM-DD.
export function completionDate(now = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function completedLabel(todo) {
  return todo.done && todo.completedAt ? `完成于 ${todo.completedAt}` : "";
}

// Checking a todo records the day it was completed; unchecking drops the date,
// so a later completion shows its own day instead of a stale one.
export function toggleTodo(todos, id, now = new Date()) {
  return todos.map((t) => {
    if (t.id !== id) return t;
    if (t.done) {
      const { completedAt, ...active } = t;
      return { ...active, done: false };
    }
    return { ...t, done: true, completedAt: completionDate(now) };
  });
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

// Display order only: active todos first, then done ones, each group in creation
// order. The stored array keeps creation order, so unchecking restores a todo to
// its original place instead of the end.
export function visibleTodos(todos, filter) {
  if (filter === "active") return todos.filter((t) => !t.done);
  if (filter === "done") return todos.filter((t) => t.done);
  return [...todos.filter((t) => !t.done), ...todos.filter((t) => t.done)];
}

// Shown under the list whenever the current filter has no visible todos.
export const EMPTY_FILTER_MESSAGE = "当前没有符合筛选条件的待办。";

export function emptyFilterMessage(visible) {
  return visible.length === 0 ? EMPTY_FILTER_MESSAGE : "";
}

// The browser asks this before a task is removed, so a mis-click cannot lose it.
export function deleteConfirmMessage(title) {
  return `Delete "${title}"? This cannot be undone.`;
}
