const test = require("node:test");
const assert = require("node:assert/strict");
const { createServer } = require("../server");

test("health endpoint responds with provider status", async () => {
  const server = createServer();

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.status, "ok");
    assert.ok(payload.provider.officialApiState.includes("May 15, 2026"));
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test("search endpoint returns fixture products", async () => {
  const server = createServer();

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/search?q=portable%20blender&source=fixture`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.mode, "fixture");
    assert.equal(payload.products.length, 3);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
