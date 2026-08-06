# Prep — Interview cards

Mobile-friendly Next.js app for studying interview topics from markdown Topic/Guide pairs. Hosted on Vercel free tier with Neon Postgres.

## Features

- **Categories** from `*Topics.md` files, descriptions from matching `*Guide.md` files
- **Study mode** — swipe right (studied) / left (skip)
- **Random drill** — configurable 10/20/30/50 questions; double-tap to reveal; swipe got-it / missed
- **Auth** — username + password signup; `allow` boolean gates login (default `false`)

## Setup

```bash
cd web
cp .env.example .env.local
# fill DATABASE_URL and SESSION_SECRET

npm install
npm run seed    # create tables + import markdown into Neon
npm run dev
```

### Allow a user to sign in

After signup, approve in Neon SQL:

```sql
UPDATE users SET allow = true WHERE username = 'yourname';
```

### Re-import markdown

```bash
npm run seed
```

Upserts categories/topics from `content/*.md`.

## Vercel

1. Import the repo
2. Set **Root Directory** to `web`
3. Add env vars: `DATABASE_URL`, `SESSION_SECRET`
4. Deploy, then run `npm run seed` locally (or once via a one-off script) against the same DB

## Content pairing

| Topics file | Guide file |
|---|---|
| `React Topics.md` | `React Topics Guide.md` |
| `Java Core V2 Topics.md` | `Java Core V2 Guide.md` |
| `Spring V2 Topics.md` | `Spring V2 Guide.md` |
| `Python & Flask Topics.md` | `Python & Flask Guide.md` |
| `Python Data Engineering Cloud Systems Topics.md` | `Python Data Engineering Cloud Systems Guide.md` |
