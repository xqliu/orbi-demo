import { createDemoServer } from "./server.js";

const address = "http://127.0.0.1:4178/";
const server = createDemoServer();
server.once("error", (error) => {
  console.error(`Could not start demo at ${address} (${error.code}). Check that port 4178 is available.`);
  process.exitCode = 1;
});
server.listen(4178, "127.0.0.1", () => {
  console.log(`Orbi Demo is running at ${address}\nPress Ctrl+C to stop.`);
});
