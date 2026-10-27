# TaskFlow

TaskFlow is a full-stack task management application with JWT authentication,
user-scoped task ownership, search, filtering, sorting, and PostgreSQL
persistence.

## Features

- User registration, login, and logout
- JWT-based authentication
- Bcrypt password hashing
- User ownership checks for every task operation
- Create, list, update, and delete tasks
- Task status and priority management
- Optional due dates and descriptions
- Search by task title or description
- Filter by status and priority
- Sort by title, status, priority, created date, updated date, or due date
- Responsive React interface
- Prisma migrations for PostgreSQL
- Backend integration tests and Playwright browser tests
- GitHub Actions CI for backend and frontend checks

## Technology

- **Frontend:** React 19, Vite, Axios, Tailwind CSS
- **Backend:** Node.js, Express 5
- **Database:** PostgreSQL
- **ORM:** Prisma 6
- **Authentication:** JSON Web Tokens and bcryptjs
- **Testing:** Node.js test runner and Playwright
- **CI:** GitHub Actions

## Project structure

```text
TaskFlow/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   └── server.js
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── ownership.test.js
│   │   └── querying.test.js
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── tests/
│   │   └── app.spec.js
│   ├── playwright.config.js
│   ├── package.json
│   └── package-lock.json
└── .github/
    └── workflows/
        └── ci.yml
```

## Prerequisites

- Node.js 20 or newer
- PostgreSQL database
- npm

## Local setup

### 1. Configure the backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Edit `backend/.env` and set:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="use-a-long-random-secret"
```

Apply the Prisma migration and generate the client:

```powershell
npx prisma migrate dev
npx prisma generate
```

Start the API:

```powershell
npm run dev
```

The API runs at `http://localhost:3000`.

### 2. Start the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs at the URL printed by Vite, normally
`http://localhost:5173`.

To use a different API URL, create `frontend/.env` with:

```env
VITE_API_URL="http://localhost:3000"
```

## API

### Authentication

```text
POST /auth/register
POST /auth/login
GET  /auth/me
```

Registration and login accept:

```json
{
  "email": "user@example.com",
  "password": "password-123"
}
```

The register and login responses include a JWT. Include it on protected
requests:

```text
Authorization: Bearer <token>
```

### Tasks

```text
GET    /tasks
POST   /tasks
PATCH  /tasks/:id
DELETE /tasks/:id
```

`GET /tasks` supports:

```text
status=TODO|IN_PROGRESS|COMPLETED
priority=LOW|MEDIUM|HIGH
search=term
sortBy=createdAt|updatedAt|dueDate|title|priority|status
sortOrder=asc|desc
```

Every task request is scoped to the authenticated user. A user cannot read,
update, or delete another user's tasks.

## Testing

Start the backend first, then run the backend integration tests:

```powershell
cd backend
npm test
```

The backend tests cover authentication, persistence, search/filter behavior,
and ownership isolation.

Start both the backend and frontend, then run the browser test:

```powershell
cd frontend
npx playwright install chromium
npx playwright test
```

The Playwright test covers registration, task creation, search, status updates,
and deletion through the browser.

Run frontend quality checks:

```powershell
cd frontend
npm run lint
npm run build
```

## Continuous integration

The workflow in [.github/workflows/ci.yml](.github/workflows/ci.yml) runs on
pushes and pull requests targeting `main`.

It performs:

- Backend dependency installation
- JavaScript syntax validation
- Prisma schema validation and client generation
- Backend integration tests when `DATABASE_URL` and `JWT_SECRET` repository
  secrets are configured
- Frontend dependency installation
- Frontend linting
- Frontend production build

## Current scope

This repository does not currently include Docker or a production deployment
configuration. PostgreSQL must be provided separately for local development
and integration testing.

## Future improvements

- Production deployment and live demo
- Rate limiting for authentication endpoints
- Restrict CORS to the deployed frontend origin
- Password reset and email verification
- Refresh-token rotation
- Team collaboration and shared tasks

## License

This project is licensed under the MIT License.
