# Hunter Planner

Kanban pessoal com sistema de XP e progressão de rank, estética Solo Leveling.

## Stack

- **Backend:** Python 3.11 + FastAPI + PostgreSQL
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Copiar .env.example para .env e configurar
cp .env.example .env

# Rodar
uvicorn main:main --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install

# Copiar .env.example para .env
cp .env.example .env

# Dev server
npm run dev
```

## Variáveis de Ambiente

### Backend (.env)
- `ADMIN_PASSWORD` — senha de acesso
- `JWT_SECRET` — secret para assinar tokens
- `DATABASE_URL` — connection string PostgreSQL
- `CORS_ORIGINS` — origens permitidas (separadas por vírgula)

### Frontend (.env)
- `VITE_API_URL` — URL base da API (ex: `http://localhost:8000/api/v1`)

## Endpoints Principais

- `POST /api/v1/auth/login` — Login com `{ password }`
- `GET /api/v1/quests` — Listar quests
- `POST /api/v1/quests` — Criar quest
- `POST /api/v1/quests/{id}/complete` — Concluir quest (calcula XP)
- `GET /api/v1/player` — Status do jogador (XP, rank)
