const test = require("node:test");
const assert = require("node:assert/strict");

const apiUrl = process.env.API_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const text = await response.text();
  return { response, body: text ? JSON.parse(text) : null };
}

test("task creation persists and query filters are applied", async () => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const auth = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email: `query-${suffix}@example.com`, password: "password-123" }),
  });
  assert.equal(auth.response.status, 201);
  const headers = { Authorization: `Bearer ${auth.body.token}` };

  const created = await request("/tasks", {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: `Searchable task ${suffix}`,
      description: "important release work",
      priority: "HIGH",
    }),
  });
  assert.equal(created.response.status, 201);

  const filtered = await request("/tasks?search=release&priority=HIGH&sortBy=title&sortOrder=asc", { headers });
  assert.equal(filtered.response.status, 200);
  assert.ok(filtered.body.some((task) => task.id === created.body.id));

  const invalidSort = await request("/tasks?sortBy=password", { headers });
  assert.equal(invalidSort.response.status, 400);

  const deleted = await request(`/tasks/${created.body.id}`, { method: "DELETE", headers });
  assert.equal(deleted.response.status, 204);
});
