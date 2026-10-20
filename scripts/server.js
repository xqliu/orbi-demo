import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { extname, relative, resolve, sep } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp" };

// Serve the application, not repository metadata, tests or local credentials.
export function createDemoServer() {
  return createServer(async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end("Method not allowed");
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    } catch {
      response.writeHead(400);
      response.end("Invalid URL");
      return;
    }
    const path = pathname === "/" ? "index.html" : pathname.slice(1);
    if (path !== "index.html" && (!path.startsWith("src/") || path.split("/").some((part) => part.startsWith(".")))) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    try {
      const filePath = await realpath(resolve(root, path));
      const localPath = relative(root, filePath);
      if (localPath !== "index.html" && !localPath.startsWith(`src${sep}`)) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      const file = await readFile(filePath);
      response.writeHead(200, { "Content-Type": `${types[extname(filePath)] || "application/octet-stream"}; charset=utf-8`, "Cache-Control": "no-store" });
      response.end(file);
    } catch (error) {
      const missing = ["ENOENT", "ENOTDIR", "EISDIR"].includes(error.code);
      if (!missing) console.error(`demo_read_failed code=${error.code}`);
      response.writeHead(missing ? 404 : 500);
      response.end(missing ? "Not found" : "Could not read this file");
    }
  });
}
