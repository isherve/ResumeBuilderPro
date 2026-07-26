# ResumeBuilder Pro

Enterprise-grade Resume/CV Builder Web Application — build professional, ATS-friendly resumes with AI assistance.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, Framer Motion, Zustand, TanStack Query |
| Backend | Node.js, Express.js, Prisma ORM, JWT Auth |
| Database | PostgreSQL |
| AI | OpenAI API |
| Storage | Cloudinary |
| Export | html2pdf, jsPDF, react-pdf |

## Project Structure

```
ResumeBuilderPro/
├── frontend/          # React SPA
│   └── src/
│       ├── components/   # UI & resume components
│       ├── pages/        # Route pages
│       ├── hooks/        # Custom React hooks
│       ├── layouts/      # Page layouts
│       ├── services/     # API services
│       ├── store/        # Zustand state
│       ├── types/        # TypeScript types
│       └── utils/        # Helpers & export
├── backend/           # Express API
│   ├── prisma/        # Database schema & seeds
│   └── src/
│       ├── routes/       # API routes
│       ├── services/     # Business logic
│       ├── middleware/   # Auth, rate limiting
│       └── validators/   # Zod schemas
└── docker-compose.yml # PostgreSQL
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### 1. Clone & Install

```bash
git clone <repo-url>
cd ResumeBuilderPro
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. Start Database

```bash
docker compose up -d
```

### 3. Configure Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update `backend/.env` with your database URL and API keys.

### 4. Setup Database

```bash
cd backend
npx prisma generate
npx prisma db push
npm run db:seed
```

### 5. Run Development Servers

```bash
# From root
npm run dev

# Or separately:
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:5173
```

## Features

- **Landing Page** — Hero, features, testimonials, pricing, FAQ
- **Authentication** — Email/password, Google OAuth, JWT, email verification
- **Dashboard** — Stats, recent resumes, activity, quick actions
- **Resume Builder** — Real-time preview, autosave, undo/redo, theme customization
- **25+ Templates** — Modern, Classic, Corporate, ATS-friendly, and more
- **AI Tools** — Summary generation, bullet improvement, ATS checker, job matching
- **Export** — PDF, JSON, TXT with share links
- **Profile Management** — Avatar upload, settings, account deletion
- **Admin Panel** — User management, analytics, feedback

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get profile |
| GET/POST | `/api/resumes` | List/create resumes |
| PUT | `/api/resumes/:id` | Update resume |
| GET | `/api/templates` | List templates |
| POST | `/api/ai/summary` | AI summary generation |
| POST | `/api/ai/ats/:id` | ATS analysis |
| POST | `/api/ai/job-match/:id` | Job matching |
| GET | `/api/dashboard` | Dashboard data |

## Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

Set environment variables in Vercel dashboard:
- `VITE_API_URL` — Your backend API URL

### Backend (Railway / Render)

1. Connect your repository
2. Set root directory to `backend`
3. Add environment variables from `.env.example`
4. Railway will auto-detect `railway.json` config

### Database

Use Railway PostgreSQL, Supabase, or Neon for production PostgreSQL.

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for full list.

Required for production:
- `DATABASE_URL`
- `JWT_SECRET` / `JWT_REFRESH_SECRET` (min 32 chars)
- `OPENAI_API_KEY` (for AI features)
- `CLOUDINARY_*` (for image uploads)

## License

MIT
