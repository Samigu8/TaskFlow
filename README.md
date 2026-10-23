# TaskFlow — Full‑Stack Task Management App

TaskFlow is a full‑stack task management application built with React, Node.js/FastAPI, and PostgreSQL.  
It includes authentication, task CRUD operations, and a clean UI designed for real‑world use.

This project demonstrates full‑stack engineering, API design, database modeling, deployment, and CI/CD.

---

## 🚀 Features

- User registration & login (JWT authentication)
- Create, edit, delete, and categorize tasks
- Priority levels and status tracking
- Responsive UI built with React + TailwindCSS
- PostgreSQL relational database
- REST API backend
- Dockerized frontend and backend
- CI/CD pipeline using GitHub Actions
- Production deployment on Railway/Render

---

## 🏗️ Architecture

**Frontend:** React + TailwindCSS  
**Backend:** Node.js (Express) or FastAPI  
**Database:** PostgreSQL  
**ORM:** Prisma (Node) or SQLAlchemy (Python)  
**Deployment:** Railway / Render  
**CI/CD:** GitHub Actions  
**Containerization:** Docker + docker‑compose

---

## 📁 Project Structure

    TaskFlow/
    │
    ├── backend/
    │   ├── src/
    │   │   ├── controllers/
    │   │   ├── routes/
    │   │   ├── models/
    │   │   ├── middleware/
    │   │   └── utils/
    │   ├── tests/
    │   ├── Dockerfile
    │   └── README.md
    │
    ├── frontend/
    │   ├── src/
    │   ├── public/
    │   ├── tests/
    │   ├── Dockerfile
    │   └── README. md
    │
    ├── docs/
    │   ├── architecture-diagram.png
    │   ├── api-spec.md
    │   └── screenshots/
    │
    ├── docker-compose.yml
    ├── .github/workflows/ci.yml
    └── README.md

---

## 🔌 API Overview

Full API documentation is available in `docs/api-spec.md`.

Example endpoints:

    POST /auth/register

    POST /auth/login

    GET /tasks

    POST /tasks

    PATCH /tasks/:id
    DELETE /tasks/:id

`GET /tasks` supports the following optional query parameters:

    status=TODO|IN_PROGRESS|COMPLETED
    priority=LOW|MEDIUM|HIGH
    search=term
    sortBy=createdAt|updatedAt|dueDate|title|priority|status
    sortOrder=asc|desc

Authentication endpoints:

    POST /auth/register
    POST /auth/login
    GET /auth/me

Send the returned JWT on task requests:

    Authorization: Bearer <token>

All task reads and writes are scoped to the authenticated user.

---

## 🛠️ Installation & Setup

### 1. Clone the repository

    git clone https://github.com/YOUR_USERNAME/TaskFlow.git 

    cd TaskFlow

---

### 2. Backend Setup

    cd backend

    npm install

    cp .env.example .env

    npm run dev

---

### 3. Frontend Setup

    cd frontend

    npm install

    npm run dev

---

### 4. Run with Docker

    docker-compose up --build

---

## 🧪 Testing

### Backend tests

    npm run test

### Frontend tests

    npm run test

---

## 📸 Screenshots

Add UI screenshots or GIF demos here.

---

## 📈 Future Improvements

- Drag‑and‑drop task sorting
- Calendar integration
- Team collaboration features
- Dark mode
- Notifications and reminders

---

## 📜 License

This project is licensed under the MIT License.
