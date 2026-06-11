# Hunter Planner — spec completo para o Kiro

## Visão geral

Kanban pessoal estilo Solo Leveling. Uma pessoa só, sem multi-tenant. Interface web acessível de qualquer lugar via deploy. Quests têm rank, deadline com hora, sistema de XP e progressão de rank do jogador.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Python 3.11 + FastAPI |
| Banco | POSTEGRES (`planner.db`) |
| ORM | POSTEGRES |
| Frontend | React 18 + Vite + TypeScript |
| Estilo | Tailwind CSS |
| Fontes | Rajdhani + Share Tech Mono (Google Fonts) |
| Deploy backend | Render (free tier) |
| Deploy frontend | Vercel |

Monorepo com `/backend` e `/frontend`. Sem Docker obrigatório.

---

## Modelo de dados

### Quest

```
id            UUID (PK, auto)
title         string, obrigatório
description   string, opcional
status        enum: "pending" | "active" | "scheduled" | "cleared" | "archived"
rank          enum: "E" | "D" | "C" | "B" | "A" | "S" | "S+"
tags          list[string] — JSON no POSTEGRES
deadline      datetime com timezone, opcional
activate_at   datetime com timezone, opcional — só quando status = "scheduled"
created_at    datetime, auto
updated_at    datetime, auto
cleared_at    datetime, opcional — preenchido ao mover para "cleared"
xp_earned     int, opcional — XP ganho ao concluir (calculado no backend)
```

### PlayerState (tabela única, 1 linha)

```
id            int PK = 1
total_xp      int, default 0
rank          enum: "E" | "D" | "C" | "B" | "A" | "S" | "S+"
updated_at    datetime, auto
```

---

## Regras de negócio

### Ranks de quest

Ordem crescente: E → D → C → B → A → S → S+

XP base por rank ao concluir:

| Rank | XP base |
|------|---------|
| E    | 10      |
| D    | 20      |
| C    | 40      |
| B    | 80      |
| A    | 160     |
| S    | 320     |
| S+   | 500     |

### Cálculo de XP ao concluir

O XP ganho depende do tempo restante no momento da conclusão:

```
ratio = (deadline - now) / (deadline - created_at)

se ratio > 0.5  → xp = xp_base          (concluiu com mais da metade do tempo sobrando)
se ratio > 0.1  → xp = xp_base * (0.2 + ratio * 1.6)   (chegando no prazo)
se ratio >= 0   → xp = xp_base * 0.2    (últimos 10%)
se ratio < 0    → xp = -xp_base * 0.5   (passou do prazo — perde XP)
```

Se a quest não tem deadline → xp = xp_base (sem multiplicador).

O campo `xp_earned` é salvo na quest. O `total_xp` do PlayerState é atualizado. `total_xp` nunca vai abaixo de 0.

### Rank do jogador (PlayerState)

Calculado a partir do `total_xp`:

| Rank | XP mínimo |
|------|-----------|
| E    | 0         |
| D    | 50        |
| C    | 150       |
| B    | 350       |
| A    | 750       |
| S    | 1500      |
| S+   | 3000      |

O rank do jogador é recalculado sempre que `total_xp` muda.

### Status das quests

- `pending` — criada, aguardando ativação manual
- `active` — em andamento; aparece na coluna Active
- `scheduled` — será ativada automaticamente em `activate_at`
- `cleared` — concluída; XP já foi computado
- `archived` — removida da visualização sem apagar

**Transições válidas via drag and drop:**

| De         | Para      | Efeito                         |
|------------|-----------|--------------------------------|
| pending    | active    | Ativa a quest                  |
| pending    | cleared   | Completa com XP cheio          |
| active     | pending   | Desativa sem penalidade        |
| active     | cleared   | Completa com cálculo de XP     |
| cleared    | active    | Reabre sem alterar XP          |
| scheduled  | active    | Ativa imediatamente            |

Arquivar está disponível em qualquer status via botão no card.

### Ordenação da coluna Active

1. Rank da quest desc (S+ primeiro)
2. Deadline asc (mais urgente primeiro)
3. Quests sem deadline ficam no final

### Ativação agendada

O backend verifica quests com `status = "scheduled"` e `activate_at <= now` a cada minuto (via endpoint chamado pelo frontend com `setInterval`, ou APScheduler no backend). Ao ativar, muda status para `active`.

### Quest vencida

`status = "active"` e `deadline < now`. O frontend destaca visualmente (borda vermelha lateral). Não muda de status automaticamente — o usuário decide o que fazer.

---

## API — endpoints

Base URL: `/api/v1`

### Auth

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Retorna JWT. Body: `{ password }` |

### Quests

| Método | Rota | Descrição |
|---|---|---|
| GET | `/quests` | Lista quests (com filtros) |
| POST | `/quests` | Cria quest |
| GET | `/quests/{id}` | Busca quest |
| PATCH | `/quests/{id}` | Atualiza campos parcialmente |
| DELETE | `/quests/{id}` | Remove permanentemente |
| POST | `/quests/{id}/complete` | Conclui quest e calcula XP |
| POST | `/quests/{id}/archive` | Arquiva quest |
| POST | `/quests/tick` | Ativa quests agendadas com activate_at <= now |

**Query params do GET /quests:**
- `status` — filtra por status (pode ser múltiplo: `?status=active&status=pending`)
- `rank` — filtra por rank
- `tag` — filtra por tag
- `search` — busca em título e descrição (ILIKE)
- `overdue` — boolean: retorna só as vencidas

### Player

| Método | Rota | Descrição |
|---|---|---|
| GET | `/player` | Retorna `{ total_xp, rank, xp_to_next, pct }` |

---

## Frontend — estrutura de telas

### Board (tela principal)

3 colunas: **Pending** / **Active** / **Cleared**

**Header:**
- Logo + label "SYSTEM INTERFACE"
- Pills de navegação: Board / List / Log
- Badge de urgentes/vencidas (vermelho) com contagem
- Botão "+ NEW QUEST"

**Stats bar:**
- Total, Active, Cleared, Overdue, XP Total

**XP bar:**
- Barra de progresso dentro do rank atual
- Label: `XP_ATUAL / XP_PROXIMO XP`
- Badge de rank do jogador com cor do rank

**Cards:**

Cada card exibe:
- Título
- Descrição (se tiver)
- Rank pill com cor
- Tags coloridas (cada tag tem cor fixa, mapeada por nome)
- Timer block (só em Active com deadline):
  - Barra proporcional (azul → amarelo → vermelho conforme esgota)
  - Contagem regressiva: `Xd Yh` ou `Xh Ym`
  - Data/hora do deadline
- Para scheduled: label "ATIVA EM: DD/MM HH:MM"
- Footer com tags e deadline (para pending/cleared)

Ao hover no card, aparecem os botões de ação:
- Concluir (check) — só em active
- Editar (lápis)
- Arquivar (caixa)
- Apagar (lixeira) — abre confirm dialog

**Drag and drop:**
- Arrasta entre as três colunas
- Placeholder tracejado mostra posição de destino
- Card fica semitransparente durante o arrasto
- Ao soltar em Cleared: dispara `POST /quests/{id}/complete`, mostra popup de +XP

**Popup de XP:**
- Aparece flutuando acima do card ao concluir
- Verde com `+N XP` ou vermelho com `-N XP`
- Anima para cima e some em ~1s

### Modal de quest (criar e editar)

Campos:
- Título (obrigatório)
- Descrição
- Rank (select: S+ / S / A / B / C / D / E)
- Tags (input livre, separadas por vírgula)
- Deadline (datetime-local)
- Ativação: toggle "AGORA" / "AGENDAR"
  - Se "AGENDAR": mostra campo datetime-local para `activate_at`

### Cores dos ranks

| Rank | Fundo    | Texto    | Borda    |
|------|----------|----------|----------|
| S+   | #f0e0ff  | #5a0a9f  | #c080f0  |
| S    | #ffecec  | #8a1a1a  | #f0a0a0  |
| A    | #e0eaff  | #1a4aaf  | #aac0ef  |
| B    | #fff3dc  | #7a4a00  | #e0b860  |
| C    | #fff3dc  | #9a6a00  | #d4a840  |
| D    | #e8f5dc  | #2a5a0a  | #90c860  |
| E    | #f0f0f0  | #4a4a5a  | #c0c0d0  |

### Paleta de tags (rotativa por nome)

blue / purple / teal / amber / coral / red / green / pink — cada nome de tag recebe uma cor fixa na primeira vez que aparece, persistida no localStorage.

---

## Autenticação

- Um único usuário, senha via variável de ambiente `ADMIN_PASSWORD`
- `POST /auth/login` com `{ "password": "..." }` retorna `{ "token": "..." }`
- JWT com expiração de 7 dias, secret via `JWT_SECRET`
- Todas as rotas exigem `Authorization: Bearer <token>`
- Frontend armazena token no `localStorage`
- Se token expirado/inválido → redireciona para tela de login

---

## Estrutura de pastas

```
hunter-planner/
├── backend/
│   ├── main.py
│   ├── models.py          ← POSTEGRES: Quest, PlayerState
│   ├── database.py        ← engine, session, create_tables
│   ├── xp.py              ← lógica de cálculo de XP e rank
│   ├── scheduler.py       ← tick de quests agendadas
│   ├── routes/
│   │   ├── auth.py
│   │   ├── quests.py
│   │   └── player.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Board.tsx
│   │   │   ├── Column.tsx
│   │   │   ├── QuestCard.tsx
│   │   │   ├── QuestModal.tsx
│   │   │   ├── XpBar.tsx
│   │   │   ├── StatsBar.tsx
│   │   │   └── XpPopup.tsx
│   │   ├── hooks/
│   │   │   ├── useQuests.ts
│   │   │   ├── usePlayer.ts
│   │   │   └── useDragDrop.ts
│   │   ├── api/
│   │   │   ├── client.ts     ← axios com interceptor de JWT
│   │   │   ├── quests.ts
│   │   │   └── player.ts
│   │   ├── lib/
│   │   │   ├── xp.ts         ← cálculo de XP no frontend (para preview)
│   │   │   ├── ranks.ts      ← constantes de rank e cores
│   │   │   └── tags.ts       ← mapeamento de cores de tags
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   └── BoardPage.tsx
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## Variáveis de ambiente

### Backend (`.env`)
```
ADMIN_PASSWORD=sua_senha_aqui
JWT_SECRET=chave_secreta_longa_aleatoria
DATABASE_URL=POSTEGRES:///./planner.db
CORS_ORIGINS=https://seu-frontend.vercel.app
```

### Frontend (`.env`)
```
VITE_API_URL=https://seu-backend.onrender.com/api/v1
```

---

## Fora do escopo inicial

- App mobile
- Push notifications
- Recorrência de quests
- Múltiplos usuários
- Views de List e Log (a API já suporta, frontend pode adicionar depois)
- Upload de anexos
