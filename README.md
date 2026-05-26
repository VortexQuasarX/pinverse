# Pinverse

A Pinterest-inspired visual discovery platform built with **Next.js 16**, **TypeScript**, **Tailwind CSS 4**, **shadcn/ui**, **Prisma ORM**, and **Framer Motion**.

Discover, save, and share creative ideas in a beautiful, responsive interface.

---

## Features

- **Pin Discovery** — Masonry grid layout with category filtering and search
- **Pin Creation** — Upload images with titles, descriptions, and categories
- **Boards** — Organize pins into custom boards (public or private)
- **Social** — Like, save, comment, and follow other creators
- **Notifications** — Real-time notification bell with unread counts
- **Dark Mode** — System-aware dark/light theme toggle
- **Responsive** — Mobile-first design that works on all screen sizes
- **Authentication** — Secure JWT-based auth with cookie sessions

---

## Quick Start (Local Development)

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 18+
- Git

### 1. Clone & Install

```bash
# If you downloaded the workspace ZIP, extract it and cd into the folder
cd pinverse

# Install dependencies
bun install
```

### 2. Set Up Environment

```bash
# Copy the example env file
cp .env.example .env
```

The default `.env` is pre-configured for local development with SQLite. **No changes needed** to run locally.

### 3. Initialize Database

```bash
# Push the Prisma schema to create the SQLite database
bun run db:push

# Seed the database with demo data
bun run db:seed
```

This creates a demo account:
- **Email:** `demo@pinverse.com`
- **Password:** `demo123`

### 4. Start Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. That's it!

---

## Project Structure

```
pinverse/
├── prisma/
│   ├── schema.prisma          # Database schema (8 models)
│   └── seed.ts                # Demo data seeder
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (fonts, theme, SEO)
│   │   ├── page.tsx           # Main SPA page
│   │   ├── globals.css        # Global styles
│   │   └── api/               # API routes (auth, pins, boards, etc.)
│   ├── components/
│   │   ├── pinverse/          # App-specific components
│   │   │   ├── Header.tsx     # Navigation, search, notifications
│   │   │   ├── MasonryGrid.tsx
│   │   │   ├── PinCard.tsx
│   │   │   ├── PinDetailView.tsx
│   │   │   ├── CreatePinView.tsx
│   │   │   ├── ProfileView.tsx
│   │   │   ├── BoardsView.tsx
│   │   │   ├── BoardDetailView.tsx
│   │   │   └── AuthViews.tsx
│   │   ├── providers/         # Theme provider
│   │   └── ui/                # shadcn/ui components (40+)
│   ├── stores/                # Zustand state management
│   │   ├── auth-store.ts      # Auth state & actions
│   │   ├── pin-store.ts       # Pins CRUD & pagination
│   │   ├── view-store.ts      # SPA navigation state
│   │   └── notification-store.ts
│   ├── lib/
│   │   ├── auth.ts            # JWT auth (jose)
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── storage.ts         # Local + S3 storage providers
│   │   ├── password.ts        # SHA-256 + salt hashing
│   │   ├── rate-limit.ts      # In-memory rate limiter
│   │   ├── csrf.ts            # CSRF token protection
│   │   └── notify.ts          # Notification push (optional)
│   └── proxy.ts               # Next.js 16 proxy (security headers)
├── mini-services/
│   └── realtime-service/      # Socket.io server (optional)
├── public/
│   └── uploads/               # Local image uploads
├── db/
│   └── custom.db              # SQLite database
├── .env                       # Environment variables
├── .env.example               # Template for env vars
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS config
└── package.json
```

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Database** | Prisma ORM (SQLite locally, PostgreSQL for production) |
| **Auth** | JWT (jose) with httpOnly cookies |
| **State** | Zustand |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Images** | Sharp (processing), AWS S3 (production storage) |
| **Realtime** | Socket.io (optional microservice) |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server on port 3000 |
| `bun run build` | Generate Prisma client + build for production |
| `bun run lint` | Run ESLint checks |
| `bun run db:push` | Push schema changes to database |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Create and apply migrations |
| `bun run db:seed` | Seed database with demo data |
| `bun run db:reset` | Reset database and re-seed |

---

## Deploying to Production (Vercel + Supabase + S3)

For production deployment, see [DEPLOY.md](./DEPLOY.md) for the full step-by-step guide.

### Quick Summary

1. **Database:** Switch from SQLite to Supabase PostgreSQL
   - Update `prisma/schema.prisma`: change `provider = "sqlite"` to `provider = "postgresql"`
   - Set `DATABASE_URL` to your Supabase connection string

2. **Image Storage:** Switch from local to AWS S3
   - Set `STORAGE_PROVIDER="s3"` in environment variables
   - Provide AWS S3 credentials

3. **Deploy to Vercel:**
   - Push code to GitHub
   - Import repo in Vercel
   - Add all environment variables from `.env.example`

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `file:./db/custom.db` | Database connection string |
| `JWT_SECRET` | Yes | — | Secret for signing JWT tokens |
| `STORAGE_PROVIDER` | No | `local` | `local` or `s3` |
| `AWS_ACCESS_KEY_ID` | S3 only | — | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | S3 only | — | AWS secret key |
| `AWS_S3_BUCKET_NAME` | S3 only | — | S3 bucket name |
| `AWS_REGION` | S3 only | `ap-south-1` | AWS region |
| `NEXT_PUBLIC_URL` | No | `http://localhost:3000` | App URL for SEO |

---

## Demo Accounts

After seeding, these accounts are available:

| Email | Password | Description |
|-------|----------|-------------|
| `demo@pinverse.com` | `demo123` | Main demo user with boards and notifications |
| `creator1@pinverse.com` | `password123` | Sample creator |
| `creator2@pinverse.com` | `password123` | Sample creator |
| `creator3@pinverse.com` | `password123` | Sample creator |
| `creator4@pinverse.com` | `password123` | Sample creator |
| `creator5@pinverse.com` | `password123` | Sample creator |

---

## License

MIT
