# AI Platform

A production-grade AI-powered platform with RAG pipelines, multi-step agents, real-time chat, document processing, and project management.

## 🚀 Tech Stack

**Backend**
- FastAPI + Uvicorn (async, multi-worker)
- **SQLite** + SQLAlchemy 2.0 async ORM (`aiosqlite`) — zero config, file-based
- Redis + Celery (background document processing)
- AWS S3 (file storage) + FAISS (vector store)
- OpenAI GPT-4 (chat + embeddings + function calling agents)
- JWT authentication (access + refresh tokens) + bcrypt

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS (premium dark theme)
- Zustand (state), React Query (server state), React Router v6
- Streaming SSE chat (ChatGPT-like), react-markdown + syntax highlighting
- Recharts (dashboard analytics)

## 📁 Structure

```
ai-platform/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # Route handlers
│   │   ├── core/               # Config, security, middleware, exceptions
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic layer
│   │   ├── db/                 # DB session and base
│   │   └── workers/            # Celery tasks
│   ├── alembic/                # DB migrations
│   ├── tests/
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/         # Layout, UI primitives, Chat, Documents, Projects
│   │   ├── pages/              # All application pages
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API service layer
│   │   ├── store/              # Zustand stores
│   │   ├── types/              # TypeScript type definitions
│   │   └── utils/              # Helpers, constants
│   ├── package.json
│   └── .env.example
└── docker-compose.yml
```

## ⚡ Quick Start

### With Docker Compose (recommended)

```bash
# Clone and configure
cp backend/.env.example backend/.env
# Edit backend/.env with your OpenAI key, AWS credentials, etc.

# Start everything
docker compose up -d

# Run migrations
docker compose exec backend alembic upgrade head

# Frontend dev server
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your credentials

# Start Redis (SQLite needs no server)
docker run -d -p 6379:6379 redis:7-alpine

# Tables are auto-created on first startup

# Start API server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Start Celery worker (separate terminal)
celery -A app.workers.celery_app worker --loglevel=info -Q documents,embeddings
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 🔑 Environment Variables

### Backend `.env` (critical fields)

| Variable | Description |
|---|---|
| `SECRET_KEY` | JWT signing secret (min 32 chars, random) |
| `DATABASE_URL` | SQLite: `sqlite+aiosqlite:///./data/ai_platform.db` (default) |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `AWS_ACCESS_KEY_ID` | AWS credentials for S3 |
| `AWS_SECRET_ACCESS_KEY` | AWS secret |
| `S3_BUCKET_NAME` | S3 bucket for document storage |

### Frontend `.env`

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (default: http://localhost:8000) |

## 📡 API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register new account |
| POST | `/api/v1/auth/login` | Login, receive JWT tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/users/me` | Get current user |
| PUT | `/api/v1/users/me` | Update profile |
| GET/POST | `/api/v1/projects` | List / Create projects |
| GET/PUT/DELETE | `/api/v1/projects/{id}` | Project CRUD |
| POST | `/api/v1/documents/upload` | Upload document |
| GET | `/api/v1/documents` | List documents |
| POST | `/api/v1/documents/search` | Semantic search |
| POST | `/api/v1/chat/sessions` | Create chat session |
| POST | `/api/v1/chat/sessions/{id}/messages` | Send message (SSE stream) |
| POST | `/api/v1/agent/run` | Run multi-step agent |
| GET | `/api/v1/dashboard/stats` | Dashboard statistics |
| GET | `/health` | Health check |

Interactive docs: `http://localhost:8000/docs`

## 🤖 AI Features

### RAG Pipeline
1. Upload PDF/DOCX/TXT → extracted text
2. Text chunked (512 words, 50 word overlap)
3. OpenAI `text-embedding-3-small` embeddings
4. Stored in FAISS (inner product / cosine)
5. On chat: query embedded → top-k chunks retrieved → injected into prompt

### Agent System
- OpenAI function calling with tools: `search_documents`, `calculate`, `summarize_text`
- Multi-step reasoning loop (up to 10 steps)
- All steps persisted to DB with inputs/outputs
- Full execution history accessible via API

### Streaming Chat
- Server-Sent Events (SSE) for real-time token streaming
- Context window management (last 20 messages)
- Auto-titles sessions from first message
- Token usage tracked per message and session

## 🛡️ Security

- JWT access tokens (15 min) + refresh tokens (7 days)
- bcrypt password hashing (cost factor 12)
- Role-based access: Admin / User
- File type + size validation on upload
- S3 server-side encryption (AES256)
- Presigned URLs for downloads (1hr expiry)
- SQL injection prevention via SQLAlchemy ORM
- CORS configured per environment
- Rate limiting via SlowAPI

## 🚢 Production Deployment

**Backend on any VM / container:**
```bash
docker build -t ai-platform-backend ./backend
docker run -d -p 8000:8000 --env-file backend/.env ai-platform-backend
```

**Frontend on Vercel:**
```bash
cd frontend
npm run build  # outputs to dist/
# Deploy dist/ to Vercel, set VITE_API_URL env variable
```

## 🧪 Tests

```bash
cd backend
pytest tests/ -v
```

## 📝 License

MIT
