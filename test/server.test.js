import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoServer } from "../scripts/server.js";

test("HTTP_root_serves_the_app", async (t) => {
  const server = createDemoServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.match(await response.text(), /id="new-todo"/);
});

test("HTTP_public_assets_HEAD_and_errors", async (t) => {
  const server = createDemoServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const [path, type] of [["/src/app.js", "text/javascript"], ["/src/todo.js", "text/javascript"], ["/src/style.css", "text/css"]]) {
    const response = await fetch(`${base}${path}?version=1`);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type"), new RegExp(type));
    assert.ok((await response.text()).length > 0);
  }
  const head = await fetch(base, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  for (const path of ["/missing", "/.git/config", "/package.json", "/scripts/server.js", "/src/%2e%2e/package.json", "/src/missing.js", "/src/"]) {
    assert.equal((await fetch(`${base}${path}`)).status, 404, path);
  }
  assert.equal((await fetch(`${base}/%ZZ`)).status, 400);
  const post = await fetch(base, { method: "POST" });
  assert.equal(post.status, 405);
  assert.equal(post.headers.get("allow"), "GET, HEAD");
});

test("HTTP_source_assets_do_not_expose_symlink_targets_or_hide_read_failures", async (t) => {
  const { mkdtemp, writeFile, symlink, chmod, rm } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const { basename } = await import("node:path");
  const directory = await mkdtemp(fileURLToPath(new URL("../src/server-test-", import.meta.url)));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const server = createDemoServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/src/${basename(directory)}`;
  await writeFile(`${directory}/asset.txt`, "hello");
  const asset = await fetch(`${base}/asset.txt`);
  assert.equal(asset.status, 200);
  assert.equal(await asset.text(), "hello");
  assert.match(asset.headers.get("content-type"), /application\/octet-stream/);
  assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/index.html`)).status, 200);
  await writeFile(`${directory}/.private`, "secret");
  assert.equal((await fetch(`${base}/.private`)).status, 404);
  if (process.platform !== "win32") {
    await symlink(fileURLToPath(new URL("../package.json", import.meta.url)), `${directory}/outside.js`);
    assert.equal((await fetch(`${base}/outside.js`)).status, 404);
    if (process.getuid() !== 0) {
      await chmod(`${directory}/asset.txt`, 0);
      const log = t.mock.method(console, "error", () => {});
      const denied = await fetch(`${base}/asset.txt`);
      assert.equal(denied.status, 500);
      assert.equal(await denied.text(), "Could not read this file");
      assert.match(log.mock.calls[0].arguments[0], /EACCES/);
    }
  }
});
