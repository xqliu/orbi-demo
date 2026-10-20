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

export function visibleTodos(todos, filter) {
  if (filter === "active") return todos.filter((t) => !t.done);
  if (filter === "done") return todos.filter((t) => t.done);
  return todos;
}
