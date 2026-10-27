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

test("register, login, and current-user authentication flow", async () => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `auth-${suffix}@example.com`;
  const password = "password-123";

  const registered = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert.equal(registered.response.status, 201);
  assert.equal(registered.body.user.email, email);
  assert.ok(registered.body.token);

  const loggedIn = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert.equal(loggedIn.response.status, 200);
  assert.ok(loggedIn.body.token);

  const me = await request("/auth/me", {
    headers: { Authorization: `Bearer ${loggedIn.body.token}` },
  });
  assert.equal(me.response.status, 200);
  assert.equal(me.body.user.email, email);

  const unauthenticated = await request("/auth/me");
  assert.equal(unauthenticated.response.status, 401);
});
