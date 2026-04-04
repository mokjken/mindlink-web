# MindLink

MindLink is a privacy-conscious emotional check-in and empathy platform designed for shared environments such as classrooms, student communities, and guided wellbeing programs.

It helps people express how they feel in seconds, while giving educators and operators a clearer view of trends, participation, and support needs through dedicated dashboards.

## What MindLink Includes

- `Student Portal`
  - Lightweight emotional check-in with tap and long-press interactions
  - Class-level status community with low-friction reactions
  - First-run onboarding flow optimized for shared tablets
- `Teacher Portal`
  - Class trend monitoring
  - AI-generated intervention suggestions
  - Detailed activity logs and emotional distribution views
- `Admin Portal`
  - School-wide dashboard
  - Heatmap / spatial overview
  - Risk summaries and operational visibility
- `Console`
  - Class management
  - Usage analytics
  - Historical records
  - Data maintenance tools for real deployments
- `Demo Mode`
  - A separated demonstration experience with isolated demo data

## Core Principles

- `Anonymous by default`
  - The student experience is designed to minimize identity exposure in shared spaces.
- `Low-friction interaction`
  - The main flows are optimized for quick, repeatable use on tablets.
- `Empathy over formality`
  - Students should be able to express a feeling without writing paragraphs.
- `Operational clarity`
  - Teachers and admins get structured dashboards instead of raw, messy inputs.

## Tech Stack

- `Frontend`: React, TypeScript, Vite, Tailwind CSS, Framer Motion
- `Backend`: Hono on Cloudflare Workers
- `Database`: Cloudflare D1
- `Charts / Visualization`: Recharts and custom visual components
- `AI`: Gemini-based advice generation through Worker-side integration

## Repository Structure

```text
.
├── components/          # Student, teacher, admin, console UI
├── hooks/               # Shared hooks
├── public/              # Static public assets
├── services/            # Frontend API and mock logic
├── worker/              # Cloudflare Worker backend
├── App.tsx              # Top-level portal routing
├── runtimeConfig.ts     # Hostname / portal runtime behavior
└── README.md
```

## Local Development

### 1. Install dependencies

```bash
npm install
cd worker && npm install
```

### 2. Configure local secrets

Create your local secrets using `.env.example` as a reference.

Important:
- Do not commit real API keys or passwords
- Use Cloudflare secrets for deployed environments

### 3. Run the frontend

```bash
npm run dev
```

### 4. Run the Worker locally

```bash
cd worker
npx wrangler d1 execute mindlink-db --local --file=./schema.sql
npx wrangler dev
```

## Deployment Notes

- Frontend is intended for Cloudflare Pages
- Backend is intended for Cloudflare Workers + D1
- `worker/wrangler.toml` in this public repo uses placeholder database IDs on purpose
- Production secrets should be set through Wrangler / Cloudflare, not committed to Git

For a step-by-step deployment walkthrough, see [DEPLOY.md](./DEPLOY.md).

## Privacy & Security Notes

- This repository is prepared for public sharing
- Production database IDs have been replaced with placeholders
- Local runtime databases are ignored and should not be committed
- Secrets belong in Cloudflare secrets or local untracked env files

## Current Status

MindLink is an actively iterated product prototype focused on:

- shared-tablet usability
- emotional check-in interaction design
- teacher/admin operational tooling
- analytics and onboarding for real pilot environments

## Why This Repo Exists

This repository documents both the product experience and the engineering work behind MindLink:

- interaction design for emotional expression
- serverless deployment architecture
- privacy-aware operational dashboards
- readiness for future systems such as engagement and achievement layers

## License

MIT. See [LICENSE](./LICENSE).
