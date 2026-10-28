import { test } from "node:test";
import assert from "node:assert/strict";
import { addTodo, toggleTodo, removeTodo, visibleTodos, clearCompleted, remainingLabel, emptyFilterMessage, deleteConfirmMessage, completionDate, completedLabel, statusLabel, EMPTY_FILTER_MESSAGE, STATUS_ACTIVE, STATUS_DONE } from "../src/todo.js";

test("addTodo appends a trimmed title with the next id", () => {
  const one = addTodo([], "  Buy milk ");
  assert.deepEqual(one, [{ id: 1, title: "Buy milk", done: false }]);
  assert.equal(addTodo(one, "Walk dog")[1].id, 2);
});

test("addTodo ignores an empty title", () => {
  assert.deepEqual(addTodo([], "   "), []);
});

test("toggleTodo flips only the matching todo", () => {
  const todos = addTodo(addTodo([], "a"), "b");
  const toggled = toggleTodo(todos, 2);
  assert.equal(toggled[0].done, false);
  assert.equal(toggled[1].done, true);
});

test("removeTodo drops the matching todo", () => {
  const todos = addTodo(addTodo([], "a"), "b");
  assert.deepEqual(removeTodo(todos, 1).map((t) => t.title), ["b"]);
});

test("visibleTodos filters by active and done", () => {
  const todos = toggleTodo(addTodo(addTodo([], "a"), "b"), 1);
  assert.deepEqual(visibleTodos(todos, "active").map((t) => t.title), ["b"]);
  assert.deepEqual(visibleTodos(todos, "done").map((t) => t.title), ["a"]);
  assert.equal(visibleTodos(todos, "all").length, 2);
});

test("clearCompleted removes completed todos and keeps active ones", () => {
  const todos = toggleTodo(addTodo(addTodo(addTodo([], "a"), "b"), "c"), 2);
  assert.deepEqual(clearCompleted(todos).map((t) => [t.title, t.done]), [["a", false], ["c", false]]);
});

test("clearCompleted keeps every todo when nothing is completed", () => {
  const todos = addTodo(addTodo([], "a"), "b");
  assert.deepEqual(clearCompleted(todos), todos);
});

test("remainingLabel counts only incomplete todos", () => {
  const todos = [
    { id: 1, title: "a", done: true },
    { id: 2, title: "b", done: true },
    { id: 3, title: "c", done: false },
    { id: 4, title: "d", done: false },
    { id: 5, title: "e", done: false },
  ];
  assert.equal(remainingLabel(todos), "3 items left");
  assert.equal(remainingLabel([]), "0 items left");
  assert.equal(remainingLabel([{ id: 1, title: "a", done: false }]), "1 item left");
});

test("remainingLabel follows toggles, additions and removals", () => {
  let todos = addTodo(addTodo(addTodo([], "a"), "b"), "c");
  assert.equal(remainingLabel(todos), "3 items left");
  todos = toggleTodo(todos, 2);
  assert.equal(remainingLabel(todos), "2 items left");
  todos = toggleTodo(todos, 2);
  assert.equal(remainingLabel(todos), "3 items left");
  todos = addTodo(todos, "d");
  assert.equal(remainingLabel(todos), "4 items left");
  todos = removeTodo(todos, 4);
  assert.equal(remainingLabel(todos), "3 items left");
});

test("remainingLabel keeps its count after clearCompleted and filter changes", () => {
  const todos = toggleTodo(addTodo(addTodo(addTodo([], "a"), "b"), "c"), 2);
  assert.equal(remainingLabel(todos), "2 items left");
  assert.equal(visibleTodos(todos, "active").length, 2);
  assert.equal(visibleTodos(todos, "done").length, 1);
  assert.equal(remainingLabel(todos), "2 items left");
  assert.equal(remainingLabel(clearCompleted(todos)), "2 items left");
});

test("emptyFilterMessage shows the required sentence for every empty filter and hides it otherwise", () => {
  assert.equal(EMPTY_FILTER_MESSAGE, "当前没有符合筛选条件的待办。");
  const todos = toggleTodo(addTodo(addTodo([], "a"), "b"), 1);
  for (const filter of ["all", "active", "done"]) {
    assert.equal(emptyFilterMessage(visibleTodos(todos, filter)), "", filter);
  }
  assert.equal(emptyFilterMessage(visibleTodos([], "all")), EMPTY_FILTER_MESSAGE);
  assert.equal(emptyFilterMessage(visibleTodos([], "active")), EMPTY_FILTER_MESSAGE);
  assert.equal(emptyFilterMessage(visibleTodos([], "done")), EMPTY_FILTER_MESSAGE);
  const doneOnly = toggleTodo(addTodo([], "a"), 1);
  assert.equal(emptyFilterMessage(visibleTodos(doneOnly, "active")), EMPTY_FILTER_MESSAGE);
  assert.equal(emptyFilterMessage(visibleTodos(doneOnly, "done")), "");
  const activeOnly = addTodo([], "a");
  assert.equal(emptyFilterMessage(visibleTodos(activeOnly, "done")), EMPTY_FILTER_MESSAGE);
  assert.equal(emptyFilterMessage(visibleTodos(activeOnly, "active")), "");
});

test("deleteConfirmMessage names the task and warns that deletion is final", () => {
  assert.equal(deleteConfirmMessage("Buy milk"), 'Delete "Buy milk"? This cannot be undone.');
  assert.match(deleteConfirmMessage("Walk dog"), /Walk dog/);
  assert.match(deleteConfirmMessage("Sign in to Orbi Cloud"), /cannot be undone/);
});

test("emptyFilterMessage follows add, toggle, delete and Clear completed", () => {
  const shown = (todos, filter) => emptyFilterMessage(visibleTodos(todos, filter)) === EMPTY_FILTER_MESSAGE;
  let todos = [];
  assert.deepEqual(["all", "active", "done"].map((f) => shown(todos, f)), [true, true, true]);
  todos = addTodo(todos, "a");
  assert.deepEqual(["all", "active", "done"].map((f) => shown(todos, f)), [false, false, true]);
  todos = toggleTodo(todos, 1);
  assert.deepEqual(["all", "active", "done"].map((f) => shown(todos, f)), [false, true, false]);
  todos = addTodo(todos, "b");
  todos = clearCompleted(todos);
  assert.deepEqual(["all", "active", "done"].map((f) => shown(todos, f)), [false, false, true]);
  todos = toggleTodo(todos, 2);
  todos = clearCompleted(todos);
  assert.deepEqual(["all", "active", "done"].map((f) => shown(todos, f)), [true, true, true]);
  todos = addTodo(addTodo(todos, "c"), "d");
  todos = removeTodo(todos, 3);
  assert.deepEqual(["all", "active", "done"].map((f) => shown(todos, f)), [false, false, true]);
});

test("visibleTodos puts active todos first and keeps creation order in the all filter", () => {
  let todos = addTodo(addTodo(addTodo([], "A"), "B"), "C");
  todos = toggleTodo(todos, 2);
  todos = toggleTodo(todos, 1);
  assert.deepEqual(visibleTodos(todos, "all").map((t) => t.title), ["C", "A", "B"]);
});

test("visibleTodos returns an uncompleted todo to creation order inside the active group", () => {
  let todos = addTodo(addTodo(addTodo([], "A"), "B"), "C");
  todos = toggleTodo(todos, 2);
  todos = toggleTodo(todos, 1);
  todos = toggleTodo(todos, 2);
  assert.deepEqual(visibleTodos(todos, "all").map((t) => t.title), ["B", "C", "A"]);
  assert.deepEqual(visibleTodos(todos, "active").map((t) => t.title), ["B", "C"]);
  assert.deepEqual(visibleTodos(todos, "done").map((t) => t.title), ["A"]);
});

test("visibleTodos keeps the partition stable across repeated filter switches", () => {
  let todos = addTodo(addTodo(addTodo(addTodo([], "A"), "B"), "C"), "D");
  todos = toggleTodo(todos, 3);
  todos = toggleTodo(todos, 1);
  todos = toggleTodo(todos, 4);
  const expectedAll = ["B", "A", "C", "D"];
  const expectedActive = ["B"];
  const expectedDone = ["A", "C", "D"];
  for (let i = 0; i < 3; i += 1) {
    assert.deepEqual(visibleTodos(todos, "all").map((t) => t.title), expectedAll);
    assert.deepEqual(visibleTodos(todos, "active").map((t) => t.title), expectedActive);
    assert.deepEqual(visibleTodos(todos, "done").map((t) => t.title), expectedDone);
  }
});

test("visibleTodos order follows creation order, not the order tasks were completed", () => {
  const todos = addTodo(addTodo(addTodo(addTodo([], "A"), "B"), "C"), "D");
  const completedInReverse = [4, 3, 2].reduce((acc, id) => toggleTodo(acc, id), todos);
  const completedInOrder = [2, 3, 4].reduce((acc, id) => toggleTodo(acc, id), todos);
  assert.deepEqual(
    [completedInReverse, completedInOrder].map((list) => visibleTodos(list, "all").map((t) => t.title)),
    [["A", "B", "C", "D"], ["A", "B", "C", "D"]],
  );
  assert.deepEqual(visibleTodos(completedInReverse, "done").map((t) => t.title), ["B", "C", "D"]);
});

test("visibleTodos does not mutate the stored array", () => {
  let todos = addTodo(addTodo(addTodo([], "A"), "B"), "C");
  todos = toggleTodo(todos, 2);
  const snapshot = todos.slice();
  const visible = visibleTodos(todos, "all");
  assert.deepEqual(todos, snapshot);
  assert.deepEqual(todos.map((t) => t.title), ["A", "B", "C"]);
  assert.deepEqual(visible.map((t) => t.title), ["A", "C", "B"]);
});

test("visibleTodos empties the active filter when the last active todo is completed", () => {
  let todos = toggleTodo(addTodo(addTodo([], "A"), "B"), 1);
  assert.deepEqual(visibleTodos(todos, "active").map((t) => t.title), ["B"]);
  todos = toggleTodo(todos, 2);
  assert.deepEqual(visibleTodos(todos, "active"), []);
  assert.equal(emptyFilterMessage(visibleTodos(todos, "active")), EMPTY_FILTER_MESSAGE);
  assert.deepEqual(visibleTodos(todos, "all").map((t) => t.title), ["A", "B"]);
  assert.deepEqual(visibleTodos(todos, "done").map((t) => t.title), ["A", "B"]);
});

test("visibleTodos applies the partition to the sample tasks on first load", () => {
  const sample = [
    { id: 1, title: "Sign in to Orbi Cloud", done: true },
    { id: 2, title: "Connect your demo repository", done: true },
    { id: 3, title: "Ask Orbi to add Clear completed", done: false },
    { id: 4, title: "Open your delivered change", done: false },
    { id: 5, title: "Connect your own project", done: false },
  ];
  assert.deepEqual(visibleTodos(sample, "all").map((t) => t.id), [3, 4, 5, 1, 2]);
  assert.deepEqual(visibleTodos(sample, "active").map((t) => t.id), [3, 4, 5]);
  assert.deepEqual(visibleTodos(sample, "done").map((t) => t.id), [1, 2]);
});

test("completionDate formats the local calendar day as YYYY-MM-DD", () => {
  assert.equal(completionDate(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(completionDate(new Date(2026, 9, 28, 23, 59)), "2026-10-28");
  assert.equal(completionDate(new Date(2026, 11, 31)), "2026-12-31");
});

test("completedLabel shows the completion date only on a completed task that has one", () => {
  assert.equal(completedLabel({ id: 1, title: "a", done: true, completedAt: "2026-10-28" }), "完成于 2026-10-28");
  assert.equal(completedLabel({ id: 1, title: "a", done: false, completedAt: "2026-10-28" }), "");
  assert.equal(completedLabel({ id: 1, title: "a", done: true }), "");
});

test("toggleTodo records the completion date and clears it when the task goes back to active", () => {
  let todos = toggleTodo(addTodo(addTodo([], "a"), "b"), 2, new Date(2026, 9, 28));
  assert.equal(todos[1].done, true);
  assert.equal(todos[1].completedAt, "2026-10-28");
  assert.equal(completedLabel(todos[1]), "完成于 2026-10-28");
  todos = toggleTodo(todos, 2, new Date(2026, 10, 3));
  assert.equal(todos[1].done, false);
  assert.equal("completedAt" in todos[1], false);
  assert.equal(completedLabel(todos[1]), "");
  todos = toggleTodo(todos, 2, new Date(2026, 10, 3));
  assert.equal(completedLabel(todos[1]), "完成于 2026-11-03");
});

test("toggleTodo stamps only the toggled task", () => {
  const todos = toggleTodo(addTodo(addTodo([], "a"), "b"), 1, new Date(2026, 9, 28));
  assert.equal(todos[0].completedAt, "2026-10-28");
  assert.equal(todos[1].completedAt, undefined);
  assert.equal(completedLabel(todos[1]), "");
});

test("completion date survives filtering and keeps working with clearCompleted", () => {
  let todos = toggleTodo(addTodo(addTodo([], "a"), "b"), 1, new Date(2026, 9, 28));
  assert.equal(completedLabel(visibleTodos(todos, "all")[1]), "完成于 2026-10-28");
  assert.equal(completedLabel(visibleTodos(todos, "done")[0]), "完成于 2026-10-28");
  assert.deepEqual(visibleTodos(todos, "active").map(completedLabel), [""]);
  todos = clearCompleted(todos);
  assert.deepEqual(todos.map(completedLabel), [""]);
});

test("statusLabel shows 待完成 for an unchecked task, including a newly added one", () => {
  assert.equal(STATUS_ACTIVE, "待完成");
  assert.equal(statusLabel(false), "待完成");
  const todos = addTodo([], "Buy milk");
  assert.equal(statusLabel(todos[0].done), "待完成");
  assert.equal(statusLabel(visibleTodos(todos, "all")[0].done), "待完成");
});

test("statusLabel shows 已完成 once the task is checked", () => {
  assert.equal(STATUS_DONE, "已完成");
  assert.equal(statusLabel(true), "已完成");
  const todos = toggleTodo(addTodo([], "Buy milk"), 1, new Date(2026, 9, 28));
  assert.equal(statusLabel(todos[0].done), "已完成");
  assert.equal(statusLabel(visibleTodos(todos, "all")[0].done), "已完成");
});

test("statusLabel returns to 待完成 when the task is unchecked again", () => {
  const todos = toggleTodo(toggleTodo(addTodo([], "Buy milk"), 1, new Date(2026, 9, 28)), 1);
  assert.equal(todos[0].done, false);
  assert.equal(statusLabel(todos[0].done), "待完成");
  assert.equal(statusLabel(visibleTodos(todos, "all")[0].done), "待完成");
});
