# Spaced Memory

Personal spaced-repetition notebook built with Next.js, Prisma, a single-user password gate, TS FSRS, Mathpix OCR, and optional pgvector semantic search.

## Prerequisites
- Node.js 18+
- PostgreSQL with the `vector` extension (`CREATE EXTENSION IF NOT EXISTS vector;`).

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template and fill values:
   ```bash
   cp .env.example .env
   ```
3. Run Prisma migrations (creates schema and enables pgvector if included in your DB init):
   ```bash
   npx prisma migrate dev
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

## Environment
- `DATABASE_URL` – Postgres connection string
- `APP_PASSWORD` – passphrase required to unlock the app
- `APP_USER_EMAIL` – stored email for the single user (purely informational)
- `OPENAI_API_KEY` – for embeddings
- `MATHPIX_APP_ID` / `MATHPIX_APP_KEY` – for image-to-LaTeX OCR

## Usage
- Visit `/auth/login` and enter the password from `APP_PASSWORD`.
- Add cards at `/cards/new` via text or image upload (Mathpix OCR).
- Browse and edit cards at `/cards` and `/cards/[id]`.
- Study due cards at `/study` using FSRS (Again/Hard/Good/Easy), which updates schedules and logs reviews.
- Semantic search calls `/api/search` and uses OpenAI embeddings stored in `CardEmbedding` (pgvector).

## Notes
- Auth is a single password gate; after logging in, a secure cookie unlocks the UI and APIs.
- FSRS defaults come from `ts-fsrs` with fuzzing enabled and short-term disabled.
- Embedding generation and Mathpix calls require the respective API keys; errors are logged server-side if absent.
