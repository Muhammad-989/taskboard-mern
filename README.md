# Taskboard

> A polished, full-stack Kanban board built as an educational MERN project.

Taskboard is a responsive project workspace for organizing work across boards, columns, and cards. It demonstrates a practical separation between a React client, an Express API, and a MongoDB data layer, with authentication, optimistic UI updates, and a production-ready Docker workflow.

## Highlights

- JWT authentication with short-lived access tokens and HTTP-only refresh cookies
- MongoDB persistence through Mongoose
- Board creation and board selection
- Card creation, editing, deletion, labels, descriptions, and priorities
- Drag-and-drop cards across columns using dnd-kit
- Fractional card positions for efficient reordering
- Optimistic drag updates with rollback on API failure
- Search and priority filtering
- Responsive, modern interface
- Docker Compose setup for the client, API, and MongoDB
- Centralized API validation and error handling with Zod

## Architecture

```text
React + Vite
    │
    │ HTTP/JSON + TanStack Query
    ▼
Express API ── Mongoose ──► MongoDB
    ▲
    └── JWT access tokens + HTTP-only refresh cookies
```

### Repository layout

```text
.
├── client/                 # React + Vite frontend
│   └── src/
│       ├── api.js          # API client and token refresh
│       ├── AuthContext.jsx # Authentication state
│       ├── App.jsx         # Board UI and interactions
│       └── App.css         # Application styles
├── server/                 # Express + Mongoose API
│   ├── src/
│   │   ├── models/         # User, Board, and Card schemas
│   │   ├── routes/         # Auth, board, and card endpoints
│   │   ├── middleware/     # Authentication and board access
│   │   └── utils/          # JWT helpers
│   └── tests/              # API tests
├── docker-compose.yml      # MongoDB, API, and client services
└── README.md
```

## Quick start with Docker

Docker Compose is the recommended setup because it provides a reproducible environment and persists MongoDB data in a named volume.

### Prerequisites

- Docker Desktop with Docker Compose
- Git

### Run the application

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Set a strong value for `JWT_SECRET` in `.env`.

3. Build and start the services:

   ```bash
   docker compose up --build
   ```

4. Open the application at [http://localhost:5173](http://localhost:5173).

The services are available at:

| Service | URL |
| --- | --- |
| Web client | http://localhost:5173 |
| API health check | http://localhost:4000/api/health |
| MongoDB | mongodb://localhost:27017 |

Use `http://localhost:5173` as the client URL. The production client proxies `/api` requests to the API container, which avoids browser CORS and hostname issues.

Stop the stack with:

```bash
docker compose down
```

Remove the persisted MongoDB volume only when you want to reset all data:

```bash
docker compose down -v
```

## Run without Docker

### 1. Start MongoDB

Use a local MongoDB installation or MongoDB Atlas, then configure `server/.env` from `server/.env.example`.

### 2. Start the API

```bash
cd server
npm install
npm run dev
```

The API runs on `http://localhost:4000`.

### 3. Start the client

In another terminal:

```bash
cd client
npm install
npm run dev
```

The Vite client runs on `http://localhost:5173`.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create an account |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/refresh` | Refresh an access token |
| `GET` | `/api/auth/me` | Get the current user |
| `GET` | `/api/boards` | List boards for the current user |
| `POST` | `/api/boards` | Create a board |
| `GET` | `/api/boards/:id` | Load a board and its cards |
| `POST` | `/api/cards/boards/:boardId/cards` | Create a card |
| `PATCH` | `/api/cards/:cardId` | Edit a card |
| `PATCH` | `/api/cards/:cardId/move` | Move a card |
| `DELETE` | `/api/cards/:cardId` | Delete a card |

## Development commands

```bash
# Client
cd client
npm run build
npm run lint

# Server
cd server
npm test
```

## Security notes

- Never commit `.env` files or production secrets.
- Use a long, random `JWT_SECRET` outside development.
- Keep refresh tokens in HTTP-only cookies.
- Use HTTPS and set `COOKIE_SECURE=true` when deploying behind TLS.
- Restrict `CLIENT_URL` to the deployed frontend origin.

## Roadmap

- Real-time collaboration with Socket.IO board rooms
- Member invitations and viewer/editor role management
- Due dates and assignees in the card editor
- Shared card-position service and expanded integration tests
- Production deployment documentation

## License

This project is provided for educational and portfolio use. Add a license file before distributing it as an open-source package.
