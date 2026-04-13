# Incremental Dashboard — Sheldon's App

> Claude Code onboarding for the Incremental Dashboard. Read this first, every session.
> For full portfolio context, all API keys, env vars, and Supabase schema — read `CLAUDE.md`
> in the **private** `AIDigital-Labs-Design-System` repo (Boris can grant access).

## App Overview

| Field | Value |
|-------|-------|
| App | Incremental Dashboard |
| Owner | Sheldon Bickel |
| URL (production) | https://incrementaldashboard.apps.aidigitallabs.com |
| URL (staging) | https://develop--aidigital-incremental.netlify.app |
| Repo | `AiDigital-com/Incremental-Dashboard` |
| GitHub user | sheldonbickel-strategy (Admin) |
| Netlify Site ID | `5ef32e18-0962-44fa-b499-26cdbaf3008a` |
| Netlify site name | aidigital-incremental |
| Purpose | Sheldon's custom dashboard — blank canvas with standard AIDigital Labs components |
| Supabase table | `id_sessions` (needs to be created — see below) |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, TypeScript |
| Auth | Clerk (@clerk/react, @clerk/backend) |
| Database | Supabase PostgreSQL (@supabase/supabase-js) |
| AI | Google Gemini via @google/genai v1.46.0+ |
| Backend | Netlify Functions |
| Design System | @AiDigital-com/design-system v7.45.1 |
| Hosting | Netlify (branch deploys enabled for `main` + `develop`) |

## What's Already Built

The scaffold is complete. Do NOT rebuild AppShell, auth, Clerk, or sidebar from scratch.

```
src/
  main.tsx          -- ClerkProvider + applyTheme + resolveTheme + HelpPage routing
  App.tsx           -- AppShell + Sidebar + useSessionPersistence + session CRUD
  App.css           -- (empty, add custom styles here)
  index.css         -- (base styles)
  pages/
    HelpPage.tsx    -- Public help page at /help
netlify/
  functions/        -- (empty, add orchestrator + Netlify Functions here)
netlify.toml        -- Build config + redirects
package.json        -- All deps installed (DS 7.45.1, Clerk, Supabase, Gemini)
.npmrc              -- GitHub Packages auth configured
```

### What App.tsx Already Has

- `AppShell` with `appTitle="Incremental Dashboard"`, `activityLabel="Session"`, `helpUrl="/help"`
- `Sidebar` wired to `id_sessions` table — new, select, delete sessions
- `useSessionPersistence` — auto-saves messages + session fields to Supabase
- `ChatPanel` with placeholder orchestrator (returns hardcoded reply — replace with SSE)
- Constants at top: `APP_NAME`, `APP_TITLE`, `SESSION_TABLE`, `TITLE_FIELD`, `ACTIVITY_LABEL`

## What Still Needs Doing

**Step 1 — Define the product**
Ask Sheldon (or Boris) what this dashboard should do before writing any features.

**Step 2 — Create the Supabase table**
The app references `id_sessions` which does not exist yet. Get the Supabase credentials
from the private DS repo CLAUDE.md, then run in the Supabase SQL Editor:

```sql
create table id_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  brand_name text,
  status text default 'chatting',
  messages jsonb default '[]',
  intake_summary jsonb,
  deleted_by_user boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table id_sessions enable row level security;
create policy "Users own their sessions"
  on id_sessions for all
  using (user_id = requesting_user_id());
```

Run on both production (`njwzbptrhgznozpndcxf`) and staging (`rqpvrikighrlgjxzkqde`).

**Step 3 — Wire the orchestrator**
Replace the placeholder in App.tsx `handleSend` with a real SSE call to
`/.netlify/functions/orchestrator`. Reference pattern:
`netlify/functions/orchestrator.mts` in `AI-Labs-Neuromarketing-Audit`.

## Environment Variables

All shared vars are pre-set at Netlify team level — no manual Netlify setup needed.
Available automatically in all deploys: Clerk keys, Gemini key, Supabase keys, NPM_TOKEN.

For local `.env.local` — get the actual values from the private DS repo CLAUDE.md,
section "Local .env.local Template". The `.env.example` in this repo shows the variable names.

## Development Workflow

No localhost testing. All testing on staging branch deploys.

| Environment | Branch | URL |
|-------------|--------|-----|
| Staging | `develop` | https://develop--aidigital-incremental.netlify.app |
| Production | `main` | https://incrementaldashboard.apps.aidigitallabs.com |

1. All work on `develop` branch
2. Push to `develop` — staging auto-deploys in ~2-3 min
3. Verify deploy reaches `ready` before testing
4. When ready to ship: merge `develop` to `main`

### Git Push (Windows Git Bash)

```bash
export PATH="/c/Program Files/nodejs:$PATH"
git checkout develop

# Embedded token required on Windows due to tty limitations
# Get the GitHub OAuth token from the private DS repo CLAUDE.md
git push https://AiDigital-com:{GITHUB_TOKEN}@github.com/AiDigital-com/Incremental-Dashboard.git develop
```

### Verify deploy after push

```bash
curl -s "https://api.netlify.com/api/v1/sites/5ef32e18-0962-44fa-b499-26cdbaf3008a/deploys?per_page=1" \
  -H "Authorization: Bearer {NETLIFY_TOKEN}" | \
  node -e "const c=[]; process.stdin.on('data',x=>c.push(x)); process.stdin.on('end',()=>{const d=JSON.parse(c.join('')); console.log(d[0].state, d[0].branch)})"
```

(Get the Netlify token from the private DS repo CLAUDE.md — reference_credentials.md in memory.)

## Design System

Package: `@AiDigital-com/design-system` — installed at v7.45.1.

Key imports already used in this app:
```typescript
import { AppShell, ChatPanel, Sidebar, useJobStatus, useSessionPersistence } from '@AiDigital-com/design-system'
```

Rules:
- Check DS first before building any custom component
- Read the DS source before using any component — understand every prop
- DS changes require Boris's approval — they affect all 15+ apps

## AI / Gemini Rules

- Never use Gemini models prior to 3.0
- `gemini-3-flash-preview` — chat / streaming orchestrator
- `gemini-3.1-pro-preview` — analysis / scoring
- SDK: `@google/genai` v1.46.0+ (already in package.json)

## Standing Instructions

- Execute all bash commands, git commits, pushes, and deploys without asking for confirmation
- Always use `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>` in commits
- Work on `develop` branch by default
- After every push, verify the Netlify deploy reaches `ready` before moving on
- Run `npm run build` before committing — zero TypeScript errors required

## Coding Conventions

- CSS: BEM naming; `aidl-` prefix for DS, custom prefix for app-specific styles
- Components: one directory per component (`ComponentName/ComponentName.tsx` + `index.ts`)
- State: `useReducer` for complex state, `useState` for simple
- No `as any` at DS boundaries — fix the type, do not suppress the error
- All times displayed in ET (convert from UTC before showing)

## Reference Patterns

For SSE orchestrator streaming: `AI-Labs-Neuromarketing-Audit/netlify/functions/orchestrator.mts`
For background job pattern: `AI-Labs-Neuromarketing-Audit/netlify/functions/api-submit.mts`
For job status hook: `AIDigital-Labs-Design-System/src/hooks/useJobStatus.ts`
