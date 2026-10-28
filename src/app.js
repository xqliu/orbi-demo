import { addTodo, toggleTodo, removeTodo, visibleTodos, clearCompleted, remainingLabel, emptyFilterMessage, deleteConfirmMessage, completionDate, completedLabel, statusLabel, canClearInput, clearInput } from "./todo.js";

// The two sample tasks start checked as examples, so they show today as their
// completion day instead of a hard-coded date that would age badly.
const today = completionDate();
let todos = [
  { id: 1, title: "Sign in to Orbi Cloud", done: true, completedAt: today },
  { id: 2, title: "Connect your demo repository", done: true, completedAt: today },
  { id: 3, title: "Ask Orbi to add Clear completed", done: false },
  { id: 4, title: "Open your delivered change", done: false },
  { id: 5, title: "Connect your own project", done: false },
];
let filter = "all";

const form = document.querySelector("#new-todo");
const input = document.querySelector("#title");
const list = document.querySelector("#list");
const status = document.querySelector("#app-status");
const error = document.querySelector("#input-error");
const empty = document.querySelector("#empty-list");
const filters = document.querySelectorAll("[data-filter]");
const clearButton = document.querySelector("#clear-completed");
const clearInputButton = document.querySelector("#clear-input");
const count = document.querySelector("#todo-count");

// Rerendering removes focused controls. Return focus to the same task or its
// next neighbour so keyboard users can continue toggling and deleting tasks.
function focusTask(selector, index) {
  const controls = list.querySelectorAll(selector);
  (controls[Math.min(index, controls.length - 1)] || input).focus();
}

function render() {
  const visible = visibleTodos(todos, filter);
  list.replaceChildren(...visible.map((todo, index) => {
    const item = document.createElement("li");
    const label = document.createElement("label");
    if (todo.done) label.className = "done";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = todo.done;
    box.addEventListener("change", () => {
      todos = toggleTodo(todos, todo.id);
      render();
      focusTask("input", index);
      status.textContent = box.checked ? "Task completed." : "Task marked active.";
    });
    const title = document.createElement("span");
    title.textContent = todo.title;
    // Plain text next to the title: the native checkbox stays the only focusable
    // control and the only carrier of the checked state.
    const state = document.createElement("span");
    state.className = "status";
    state.textContent = statusLabel(todo.done);
    const doneAt = completedLabel(todo);
    const del = document.createElement("button");
    del.type = "button";
    del.className = "button secondary";
    del.textContent = "Delete";
    del.setAttribute("aria-label", `Delete ${todo.title}`);
    del.addEventListener("click", () => {
      if (!window.confirm(deleteConfirmMessage(todo.title))) {
        status.textContent = "Delete cancelled.";
        return;
      }
      todos = removeTodo(todos, todo.id);
      render();
      focusTask("button", index);
      status.textContent = "Task deleted.";
    });
    label.append(box, title, state);
    if (doneAt) {
      const completed = document.createElement("span");
      completed.className = "completed-at";
      completed.textContent = doneAt;
      label.append(completed);
    }
    item.append(label, del);
    return item;
  }));
  const emptyMessage = emptyFilterMessage(visible);
  empty.textContent = emptyMessage;
  empty.hidden = emptyMessage === "";
  for (const button of filters) {
    button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
  }
  clearButton.disabled = !todos.some((todo) => todo.done);
  count.textContent = remainingLabel(todos);
}

function clearError() {
  error.hidden = true;
  input.removeAttribute("aria-invalid");
}

// Clear is usable only while there is text to clear, so keep it in step with
// every value change: typing, deleting by hand, Add and Clear itself.
function syncClearInputButton() {
  clearInputButton.disabled = !canClearInput(input.value);
}

input.addEventListener("input", () => {
  clearError();
  syncClearInputButton();
});
clearInputButton.addEventListener("click", () => {
  clearInput(input);
  syncClearInputButton();
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!input.value.trim()) {
    error.hidden = false;
    input.setAttribute("aria-invalid", "true");
    input.focus();
    return;
  }
  todos = addTodo(todos, input.value);
  filter = "all";
  input.value = "";
  clearError();
  syncClearInputButton();
  render();
  status.textContent = "Task added. Showing all tasks.";
  input.focus();
});
for (const button of filters) {
  button.addEventListener("click", () => {
    filter = button.dataset.filter;
    render();
    status.textContent = `Showing ${filter} tasks.`;
  });
}
clearButton.addEventListener("click", () => {
  todos = clearCompleted(todos);
  render();
  status.textContent = "Completed tasks cleared.";
  if (clearButton.disabled) input.focus();
});
render();
// The input starts empty, so Clear starts disabled.
syncClearInputButton();
