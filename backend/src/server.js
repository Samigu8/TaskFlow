require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { PrismaClient, Priority, Status } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const demoUserEmail = "demo@taskflow.local";

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "TaskFlow API running" });
});

async function getDemoUser() {
  return prisma.user.upsert({
    where: { email: demoUserEmail },
    update: {},
    create: {
      email: demoUserEmail,
      password: "development-only",
    },
  });
}

function isValidEnumValue(value, enumObject) {
  return value === undefined || Object.values(enumObject).includes(value);
}

app.get("/tasks", async (req, res) => {
  try {
    const user = await getDemoUser();
    const tasks = await prisma.task.findMany({
      where: { userId: user.id },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    res.json(tasks);
  } catch (error) {
    console.error("Failed to load tasks:", error);
    res.status(500).json({ error: "Unable to load tasks" });
  }
});

app.post("/tasks", async (req, res) => {
  const { title, description, priority, dueDate } = req.body;

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
    const user = await getDemoUser();
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: typeof description === "string" && description.trim() ? description.trim() : null,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId: user.id,
      },
    });
    res.status(201).json(task);
  } catch (error) {
    console.error("Failed to create task:", error);
    res.status(500).json({ error: "Unable to create task" });
  }
});

app.patch("/tasks/:id", async (req, res) => {
  const taskId = Number(req.params.id);
  const { title, description, priority, status, dueDate } = req.body;

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
    const user = await getDemoUser();
    const existingTask = await prisma.task.findFirst({ where: { id: taskId, userId: user.id } });
    if (!existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
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
    res.json(task);
  } catch (error) {
    console.error("Failed to update task:", error);
    res.status(500).json({ error: "Unable to update task" });
  }
});

app.delete("/tasks/:id", async (req, res) => {
  const taskId = Number(req.params.id);
  if (!Number.isInteger(taskId) || taskId < 1) {
    return res.status(400).json({ error: "Invalid task id" });
  }

  try {
    const user = await getDemoUser();
    const result = await prisma.task.deleteMany({ where: { id: taskId, userId: user.id } });
    if (result.count === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(204).end();
  } catch (error) {
    console.error("Failed to delete task:", error);
    res.status(500).json({ error: "Unable to delete task" });
  }
});

const server = app.listen(3000, () => console.log("Server running on port 3000"));

async function shutdown() {
  await prisma.$disconnect();
  server.close();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
