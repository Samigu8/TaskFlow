require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient, Priority, Status } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const jwtSecret = process.env.JWT_SECRET;
const corsOrigin = process.env.CORS_ORIGIN || true;

if (!jwtSecret) {
  throw new Error("JWT_SECRET must be configured");
}

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "TaskFlow API running" });
});

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({ status: "unavailable", database: "disconnected" });
  }
});

function createToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, jwtSecret, { expiresIn: "7d" });
}

function authenticate(req, res, next) {
  const authorization = req.get("Authorization");
  const token = authorization && authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function isValidEnumValue(value, enumObject) {
  return value === undefined || Object.values(enumObject).includes(value);
}

const sortableFields = new Set(["createdAt", "updatedAt", "dueDate", "title", "priority", "status"]);

function parseTaskQuery(query) {
  const status = query.status || undefined;
  const priority = query.priority || undefined;
  const { search = "", sortBy = "createdAt", sortOrder = "desc" } = query;

  if (!isValidEnumValue(status, Status) || !isValidEnumValue(priority, Priority)) {
    return { error: "Invalid status or priority filter" };
  }
  if (!sortableFields.has(sortBy)) {
    return { error: "Invalid sort field" };
  }
  if (!["asc", "desc"].includes(sortOrder)) {
    return { error: "Invalid sort order" };
  }
  if (typeof search !== "string" || search.length > 100) {
    return { error: "Search must be a string of 100 characters or fewer" };
  }

  return {
    where: {
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(search.trim()
        ? {
            OR: [
              { title: { contains: search.trim(), mode: "insensitive" } },
              { description: { contains: search.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { [sortBy]: sortOrder },
  };
}

app.post("/auth/register", async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: "A valid email is required" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: normalizedEmail, password: passwordHash },
    });
    res.status(201).json({ token: createToken(user), user: { id: user.id, email: user.email } });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "An account with that email already exists" });
    }
    console.error("Failed to register user:", error);
    res.status(500).json({ error: "Unable to create account" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const passwordMatches = user && await bcrypt.compare(password, user.password);
    if (!user || !passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    res.json({ token: createToken(user), user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error("Failed to log in user:", error);
    res.status(500).json({ error: "Unable to log in" });
  }
});

app.get("/auth/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true },
    });
    if (!user) {
      return res.status(401).json({ error: "User account no longer exists" });
    }
    res.json({ user });
  } catch (error) {
    console.error("Failed to load current user:", error);
    res.status(500).json({ error: "Unable to load account" });
  }
});

app.get("/tasks", authenticate, async (req, res) => {
  const query = parseTaskQuery(req.query);
  if (query.error) {
    return res.status(400).json({ error: query.error });
  }

  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.userId, ...query.where },
      orderBy: query.orderBy,
    });
    res.json(tasks);
  } catch (error) {
    console.error("Failed to load tasks:", error);
    res.status(500).json({ error: "Unable to load tasks" });
  }
});

app.post("/tasks", authenticate, async (req, res) => {
  const { title, description, priority, dueDate } = req.body || {};

  if (typeof title !== "string" || title.trim().length === 0) {
    return res.status(400).json({ error: "A task title is required" });
  }
  if (!isValidEnumValue(priority, Priority)) {
    return res.status(400).json({ error: "Invalid task priority" });
  }
  if (dueDate !== undefined && dueDate !== null && Number.isNaN(Date.parse(dueDate))) {
    return res.status(400).json({ error: "Invalid due date" });
  }

  try {
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: typeof description === "string" && description.trim() ? description.trim() : null,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: req.user.userId,
      },
    });
    res.status(201).json(task);
  } catch (error) {
    console.error("Failed to create task:", error);
    res.status(500).json({ error: "Unable to create task" });
  }
});

app.patch("/tasks/:id", authenticate, async (req, res) => {
  const taskId = Number(req.params.id);
  const { title, description, priority, status, dueDate } = req.body || {};

  if (!Number.isInteger(taskId) || taskId < 1) {
    return res.status(400).json({ error: "Invalid task id" });
  }
  if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
    return res.status(400).json({ error: "A task title is required" });
  }
  if (!isValidEnumValue(priority, Priority) || !isValidEnumValue(status, Status)) {
    return res.status(400).json({ error: "Invalid task priority or status" });
  }
  if (dueDate !== undefined && dueDate !== null && Number.isNaN(Date.parse(dueDate))) {
    return res.status(400).json({ error: "Invalid due date" });
  }

  try {
    const updateResult = await prisma.task.updateMany({
      where: { id: taskId, userId: req.user.userId },
      data: {
        ...(title === undefined ? {} : { title: title.trim() }),
        ...(description === undefined
          ? {}
          : { description: typeof description === "string" && description.trim() ? description.trim() : null }),
        ...(priority === undefined ? {} : { priority }),
        ...(status === undefined ? {} : { status }),
        ...(dueDate === undefined ? {} : { dueDate: dueDate ? new Date(dueDate) : null }),
      },
    });
    if (updateResult.count === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = await prisma.task.findFirst({ where: { id: taskId, userId: req.user.userId } });
    res.json(task);
  } catch (error) {
    console.error("Failed to update task:", error);
    res.status(500).json({ error: "Unable to update task" });
  }
});

app.delete("/tasks/:id", authenticate, async (req, res) => {
  const taskId = Number(req.params.id);
  if (!Number.isInteger(taskId) || taskId < 1) {
    return res.status(400).json({ error: "Invalid task id" });
  }

  try {
    const result = await prisma.task.deleteMany({ where: { id: taskId, userId: req.user.userId } });
    if (result.count === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(204).end();
  } catch (error) {
    console.error("Failed to delete task:", error);
    res.status(500).json({ error: "Unable to delete task" });
  }
});

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, () => console.log(`Server running on port ${port}`));

async function shutdown() {
  await prisma.$disconnect();
  server.close();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
