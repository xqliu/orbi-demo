import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";

const cwd = new URL("../", import.meta.url);

test("start_prints_address_after_listening_and_fails_on_occupied_port", { timeout: 10000 }, async (t) => {
  const occupied = createServer();
  let busy = false;
  try {
    await new Promise((resolve, reject) => {
      occupied.once("error", reject);
      occupied.listen(4178, "127.0.0.1", resolve);
    });
    await new Promise((resolve) => occupied.close(resolve));
  } catch (error) {
    if (error.code !== "EADDRINUSE") throw error;
    busy = true;
    t.diagnostic("Port 4178 is already used; checking occupied-port failure only. CI also checks startup.");
  }
  if (!busy) {
    const child = spawn(process.execPath, ["scripts/start.js"], { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    child.stdout.on("data", (chunk) => { out += chunk; });
    child.stderr.on("data", (chunk) => { err += chunk; });
    t.after(() => child.kill());
    await Promise.race([
      once(child.stdout, "data"),
      once(child, "exit").then(([code]) => { throw new Error(`startup exited ${code}: ${err}`); }),
    ]);
    assert.match(out, /http:\/\/127\.0\.0\.1:4178\//);
    assert.equal((await fetch("http://127.0.0.1:4178/")).status, 200);
    child.kill();
    await once(child, "exit");
    await new Promise((resolve) => occupied.listen(4178, "127.0.0.1", resolve));
    t.after(() => new Promise((resolve) => occupied.close(resolve)));
  }
  const second = spawn(process.execPath, ["scripts/start.js"], { cwd, stdio: ["ignore", "pipe", "pipe"] });
  let output = "", errors = "";
  second.stdout.on("data", (chunk) => { output += chunk; });
  second.stderr.on("data", (chunk) => { errors += chunk; });
  const [code] = await once(second, "exit");
  assert.equal(code, 1);
  assert.equal(output, "");
  assert.match(errors, /EADDRINUSE/);
  assert.match(errors, /4178/);
});
