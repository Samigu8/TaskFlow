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

async function register(email) {
  const result = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password: "password-123" }),
  });
  assert.equal(result.response.status, 201);
  return result.body.token;
}

test("users can only read and mutate their own tasks", async () => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ownerToken = await register(`owner-${suffix}@example.com`);
  const otherToken = await register(`other-${suffix}@example.com`);
  const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };
  const otherHeaders = { Authorization: `Bearer ${otherToken}` };

  const created = await request("/tasks", {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({ title: `Private task ${suffix}`, priority: "HIGH" }),
  });
  assert.equal(created.response.status, 201);

  const ownerTasks = await request("/tasks", { headers: ownerHeaders });
  assert.equal(ownerTasks.response.status, 200);
  assert.ok(ownerTasks.body.some((task) => task.id === created.body.id));

  const otherTasks = await request("/tasks", { headers: otherHeaders });
  assert.equal(otherTasks.response.status, 200);
  assert.equal(otherTasks.body.some((task) => task.id === created.body.id), false);

  const crossUserUpdate = await request(`/tasks/${created.body.id}`, {
    method: "PATCH",
    headers: otherHeaders,
    body: JSON.stringify({ status: "COMPLETED" }),
  });
  assert.equal(crossUserUpdate.response.status, 404);

  const deleted = await request(`/tasks/${created.body.id}`, {
    method: "DELETE",
    headers: ownerHeaders,
  });
  assert.equal(deleted.response.status, 204);
});
