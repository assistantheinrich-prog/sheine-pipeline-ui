# sheine-pipeline-ui

Local-first social pipeline web UI. Reads/writes the markdown drafts and
SQLite engagement log already produced by the CLI tools at
`~/agent-harness/bin/`. Localhost-only on port `3737`.

Inspired by [Typefully](https://typefully.com/) — three-panel layout
(drafts list / composer / research+assist rail) with platform-tuned
preview, voice lints, and AI assist.

## Run

```bash
cd ~/Projects/sheine-pipeline-ui
npm run dev          # http://localhost:3737
```

Stack: Next.js 14 (App Router) + Tailwind + Lucide + react-markdown +
recharts + better-sqlite3. `claude -p` for AI assist + Gmail snapshot
refresh.

## Routes

| Route | What |
|---|---|
| `/` | Composer — drafts panel (Drafts / Scheduled / Posted tabs), center canvas, right rail (Research / AI assist tabs) |
| `/inbox` | Card grid of pending drafts |
| `/queue` | Table of pending+approved with `scheduled_at` |
| `/research` | List of research notes |
| `/research/:date` | Single research note rendered with markdown |
| `/library` | Archive of posted drafts |
| `/analytics` | 5-up stat row + posts/engagement chart + top posts table (last 30d, reads `social-posts.sqlite`) |
| `/kols` | KOL list (currently read-only; CLI manages) |
| `/settings` | Run-trigger buttons for the 5 pipeline scripts + voice rules + keyboard shortcuts reference |

## API

| Method | Path | What |
|---|---|---|
| GET | `/api/drafts` | List drafts |
| POST | `/api/drafts` | Create new draft `{platform, slug?}` |
| GET | `/api/drafts/:filename` | Read single draft |
| PATCH | `/api/drafts/:filename` | Update body / status / scheduled_at / auto_post |
| GET | `/api/research` | List notes + return latest body |
| GET | `/api/research/:date` | Single note |
| POST | `/api/run/:cmd` | Whitelisted command runner: `research-run`, `research-draft`, `social-due`, `refresh-gmail-snapshot`, `x-digest`. Returns `{ok, stdout, stderr, code}`. Timeouts: 30s–240s depending on command. |
| POST | `/api/assist` | AI assist via headless `claude -p`. Body: `{preset?, instruction?, body, platform}`. Presets: `punchier`, `shorter`, `longer`, `variants`, `voicelint`. Returns `{output}` or `{variants[]}`. |

## Composer features

- **Tabs**: Drafts / Scheduled / Posted — derived from frontmatter status + scheduled_at
- **Filter input**: live free-text search across draft body / slug / filename
- **Draft cards**: line-clamped 3-line preview, platform + status colour, scheduled_at badge
- **New draft modal** (⌘N): platform picker + slug input → POST `/api/drafts` → auto-select
- **Schedule modal** (button or `Reschedule` if already scheduled): datetime-local + presets (in 1h / in 4h / tomorrow 9am / next Mon 9am) + clear-schedule
- **Save** (⌘S): writes body via PATCH; schedule button additionally flips status to `approved`
- **Toolbar**: for LinkedIn drafts, B / I apply Unicode bold/italic transforms (LinkedIn doesn't render markdown, so 𝗯𝗼𝗹𝗱 𝘪𝘵𝘢𝘭𝘪𝘤 glyphs are the trick); plain-text reset; insert link; insert bullet list. For X drafts, just insert link
- **Live preview**: platform-tuned card under the textarea — X (avatar + handle + body) / LinkedIn (full LI card chrome with role line, see-more truncation, reaction count, Like/Comment/Repost/Send action bar)
- **Voice lints**: live banned-word + emoji detection (delve, leverage, navigate, robust, seamless, tapestry, intricate, dive into, unlock, game-changer, supercharged)
- **Char counter**: SVG progress arc for X (turns warm <20 left, danger when over)
- **Right rail tabs**: Research (rendered markdown of latest note) / AI assist (Claude rewriter)

## AI assist

Right-rail tab. 5 presets + freeform input. Hits `/api/assist` which
shells out to `claude -p --model sonnet --no-session-persistence` and
parses the response.

| Preset | What |
|---|---|
| Make punchier | Tighten without changing meaning |
| Shorten | Roughly half the length, strongest single point |
| Expand | One extra concrete detail (regulator name, rule reference) |
| 3 variants | 3 different angles, separator-delimited |
| Voice lint | LLM bullet-list of voice-rule violations or "Voice clean." |

Apply or Copy each suggestion. Variants get individual Apply buttons.
Custom instruction input handles any phrasing not in the presets.

## Keyboard shortcuts

- `⌘N` — New draft
- `⌘S` — Save current draft
- `⌘K` — Toggle drafts panel
- `⌘.` — Toggle research panel
- `⌘1` / `⌘2` / `⌘3` — Drafts / Scheduled / Posted tabs
- `Esc` — Close any open modal

## Responsive

Auto-collapses on resize:
- `< 640px` (mobile) → both panels hidden, hamburger toggles drafts
- `< 1024px` (tablet) → research panel hidden
- `≥ 1024px` (desktop) → all panels visible

## Files

```
app/
  page.tsx                  Server: load drafts + research, render <Composer>
  composer.tsx              Client: 3-panel layout
  layout.tsx                Root layout (no global sidebar — composer owns nav)
  globals.css               Tailwind base + Inter/JetBrains Mono fonts
  inbox/page.tsx            Card grid of pending
  queue/page.tsx            Table view
  research/page.tsx         List
  research/[date]/page.tsx  Single note (MarkdownView)
  library/page.tsx          Posted archive
  analytics/page.tsx        Stats + charts (server) + AnalyticsCharts (client)
  analytics/charts.tsx      Recharts ComposedChart
  kols/page.tsx             KOL list (read-only)
  settings/page.tsx         Run-trigger buttons (calls /api/run/<cmd>)
  api/
    drafts/route.ts                GET list / POST create
    drafts/[filename]/route.ts     GET / PATCH single
    research/route.ts              GET list + latest
    research/[date]/route.ts       GET single
    run/[cmd]/route.ts             POST whitelisted shell command
    assist/route.ts                POST → headless `claude -p`

components/
  ui.tsx              Card / Button / StatusBadge / PlatformBadge / H1/H2 / Empty
  sidebar.tsx         (unused — kept for legacy reference)
  page-header.tsx     Slim breadcrumb header for non-composer pages
  markdown.tsx        Styled react-markdown renderer
  composer-canvas.tsx Center composer card with toolbar + live preview
  modals.tsx          Modal wrapper + ScheduleModal + NewDraftModal
  assist-panel.tsx    AI assist right-rail content

lib/
  paths.ts            Resolves vault + harness paths
  drafts.ts           Read/write draft markdown via gray-matter
  research.ts         Read research notes
  posts.ts            Better-sqlite3 reader for engagement log
  li-format.ts        Unicode bold/italic transforms for LinkedIn

DESIGN.md             Light theme, decoupled from SHeine brand
```

## Source-of-truth files (read/write)

- Drafts: `~/Documents/ObsidianVault/00-memory/inbox/social-drafts/*.md`
- Research notes: `~/Documents/ObsidianVault/00-memory/inbox/research-notes/*.md`
- Engagement log: `~/Documents/ObsidianVault/00-memory/system/social-posts.sqlite`
- KOL list: `~/agent-harness/tools/social-pipeline/kol/kol-list.json`

The UI never owns its own data — it's a view layer over the same files
the CLI tools (`social-draft`, `social-post`, `research-run`, etc.)
read and write. Editing in Obsidian and editing in the UI both work;
last write wins.

## Security posture

- Localhost-only (Next dev binds to 127.0.0.1; production deploys
  pending). No login screen.
- `/api/run/:cmd` allowlists exactly 5 commands; anything else is
  rejected. `social-due` is hard-coded to `--dry-run` so the UI can't
  fire real posts. Real publishing goes through the composer's Save
  flow, which only updates frontmatter status — actual posting stays
  with `bin/social-post` invoked manually or by the launchd scheduler.
- AI assist uses your existing Claude Code OAuth session; no API key
  in the UI.
- Banned `..` and `/` in filename params.

## Deferred

- Calendar view of queue (drag-to-reschedule)
- KOL add/remove via UI
- Vercel preview deploy with HTTP-basic auth
- Voice-rule editor (currently constants in source)
- Thread support for X (multiple connected posts in one draft)

## Smoke-test cheatsheet

```bash
# Routes
for p in / /inbox /queue /research /research/2026-05-01 /library /analytics /kols /settings; do
  curl -s -o /dev/null -w '%{http_code} %{url_effective}\n' "http://127.0.0.1:3737$p"
done

# Create a new draft via API
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"platform":"x","slug":"test"}' http://127.0.0.1:3737/api/drafts

# Trigger social-due (dry-run)
curl -s -X POST http://127.0.0.1:3737/api/run/social-due | jq

# AI assist
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"preset":"punchier","platform":"x","body":"This is a draft."}' \
  http://127.0.0.1:3737/api/assist | jq
```
