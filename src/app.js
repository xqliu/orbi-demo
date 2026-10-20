import { addTodo, toggleTodo, removeTodo, visibleTodos } from "./todo.js";

let todos = [
  { id: 1, title: "Sign in to Orbi Cloud", done: true },
  { id: 2, title: "Connect your demo repository", done: true },
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
    const del = document.createElement("button");
    del.type = "button";
    del.className = "button secondary";
    del.textContent = "Delete";
    del.setAttribute("aria-label", `Delete ${todo.title}`);
    del.addEventListener("click", () => {
      todos = removeTodo(todos, todo.id);
      render();
      focusTask("button", index);
      status.textContent = "Task deleted.";
    });
    label.append(box, title);
    item.append(label, del);
    return item;
  }));
  empty.hidden = visible.length > 0;
  empty.textContent = {
    all: "No tasks yet. Add your first task above.",
    active: "No active tasks. Choose All to see completed tasks, or add a new one.",
    done: "No completed tasks. Check off a task in All to see it here.",
  }[filter];
  for (const button of filters) {
    button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
  }
}

function clearError() {
  error.hidden = true;
  input.removeAttribute("aria-invalid");
}
input.addEventListener("input", clearError);
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
render();
