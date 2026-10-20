import { test } from "node:test";
import assert from "node:assert/strict";
import { addTodo, toggleTodo, removeTodo, visibleTodos, clearCompleted, remainingLabel } from "../src/todo.js";

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
