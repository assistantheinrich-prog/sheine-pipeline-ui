# Social posting loop — operations

The closed loop: a draft is created → passes blocking eval gates → goes to
Telegram for approval → approve fires it (X auto, LinkedIn assisted) → queue
health is watched → engagement is imported and shown. Built per
`00-memory/system/handover-2026-06-11-sheine-pipeline-ui-directive.md`.

Canonical runtime is the **mini** (`heinrichs-mac-mini`, Tailscale
`100.127.35.79`). The laptop clone is dev only.

## Where things run (mini)

| Piece | What | How it runs |
|---|---|---|
| Dashboard UI | this Next app on `127.0.0.1:3737` | launchd `ai.sheine.pipeline-ui` (KeepAlive), **Node 20** via nvm, `next start` |
| Tailscale URL | `https://heinrichs-mac-mini.tail279e04.ts.net/` | `tailscale serve --bg http://127.0.0.1:3737` |
| Poster + queue health | `social-due` every 15 min | launchd `ai.harness.social-due` |
| Telegram approvals | Approve/Edit/Kill callbacks | commandos bot module (activation below) |

Reach the dashboard from the phone / M5: open the Tailscale URL above (both must
be on the tailnet). The app binds localhost only; Tailscale serve is the only
ingress.

## Drafts location (TCC workaround — important)

`~/Documents` is TCC-protected; a launchd **node** binary has no consent, so
reading the vault drafts dir *hangs*. So on the mini the real files live at a
non-TCC path and the vault path is a symlink to it:

```
~/.sheine/social-drafts          <- real files (canonical runtime queue)
~/Documents/.../social-drafts    -> symlink to ~/.sheine/social-drafts
~/.sheine/research-notes         <- same treatment for research notes
```

- The **UI** reads the real path via env `SOCIAL_DRAFTS_DIR` / `SOCIAL_RESEARCH_DIR`
  (set in the UI launchd plist).
- The **python** poster/approval tools read the vault path; python *is*
  TCC-authorized, so it follows the symlink to the same files.
- Single source of truth = `~/.sheine/social-drafts`. No two-copy drift.

Alternative (if you prefer files in the vault): grant the node binary
`Full Disk Access` in System Settings → Privacy & Security, then unset the two
env vars and restore the real dir. The symlink approach needs no GUI step.

## Install / reinstall on the mini

```bash
# 1. UI: deploy + build (Node 20!)
cd ~/Projects/sheine-pipeline-ui
git fetch origin && git checkout assistantheinrich-prog/social-pipeline-posting-loop
export PATH=$HOME/.nvm/versions/node/v20.20.0/bin:$PATH
npm ci && npm run build
# launchd plist: ~/Library/LaunchAgents/ai.sheine.pipeline-ui.plist (Node 20 npm, -H 127.0.0.1,
#   env SOCIAL_DRAFTS_DIR + SOCIAL_RESEARCH_DIR)
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.sheine.pipeline-ui.plist

# 2. Tailscale ingress
/usr/local/bin/tailscale serve --bg http://127.0.0.1:3737

# 3. Poster + queue-health every 15 min
cp ~/agent-harness/tools/social-pipeline/launchd/ai.harness.social-due.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.harness.social-due.plist
```

> Node 25 (brew default) hangs Next 14 dynamic rendering — pin Node 20 LTS.
> better-sqlite3 is native: if you switch Node, `npm rebuild better-sqlite3`.

## Telegram approval — activate the inline buttons

Sending works already (the PATCH `status=ready` handler shells `social-tg-send`,
posting a card to the **Social Approvals** topic — chat `-1003890811068`, thread
`22420`). The card's "🖥 Open in dashboard" button + link work immediately.

The inline **Approve / Edit / Kill** buttons need the commandos bot to route
their callbacks (it owns `getUpdates` for the shared `@heinrichassistant_bot`
token, so a second poller 409s). The handler module is pre-positioned and
import-verified at `~/Projects/commandos/apps/command/handlers_social_approval.py`.
To activate, add to `apps/command/main.py` after `dp.include_router(router)`:

```python
from .handlers_social_approval import router as social_approval_router
dp.include_router(social_approval_router)
```

then restart: `launchctl kickstart -k gui/$(id -u)/com.commandos.bot`.
(Approve/Kill fully work; Edit points to the dashboard — reply-capture would
collide with the commandos catch-all message handler.)

A standalone alternative exists (`social-approve-bot` = `approve.py poll`, full
Approve/Edit/Kill incl. reply-capture) but needs its **own** bot token to avoid
the 409 — use it only if you give approvals a dedicated bot.

## Eval gates (block the `ready` transition)

`lib/gates.ts`, run by PATCH `/api/drafts/[file]` when `status=ready` (preview
via GET `/api/drafts/[file]/gates`). **Fail** = banned words (humanizer block
list), <2 named entities, no visual. **Warn** = >2 "not X but Y" reframes,
>60-word sentence, vague words. A failing draft is refused (422) and never
reaches Telegram. Escape hatch: frontmatter `allow_no_visual: true`.

## Queue-health alarm

`poster/queue_health.py`, piggybacked on the social-due cron, throttled to 1
alert/day. Pings the approvals topic when <3 approved queued OR nothing
scheduled in the next 5 days.

## Engagement ingestion

`/analytics` → **Import LinkedIn xlsx** → `/api/analytics/upload` →
`social-analytics-ingest` parses the Content export into `social-posts.sqlite`
(`li_daily`, `li_followers`, `li_top_posts`, `li_meta`). `/analytics` shows
followers / impressions / top posts. `GET /api/weekly-numbers` feeds the Sunday
digest (posts shipped vs planned, queue depth, follower count).

## M5-primary drafting (Option 2 — when the mini's claude is logged out)

The mini's `claude` is not authenticated for headless/launchd use ("Not logged
in"), so the dashboard's in-browser generation (`/api/ideas/draft`, `/api/assist`)
won't run on the mini. While that's the case, draft on the **M5** (where claude
works) and let new drafts flow to the mini queue:

- **`social-reg-draft --list [N]`** — recent crypto/compliance reg hits (from the
  mini's `agency.db` over SSH) with ids.
- **`social-reg-draft <id> [--x]`** — generate a LinkedIn (or X) draft from that
  hit with local claude, write it to the M5 vault, and push to the mini queue.
- **`social-draft-push`** — one-way `rsync --ignore-existing` of new M5 drafts →
  mini `~/.sheine/social-drafts`. Runs every 15 min via launchd
  `ai.sheine.social-draft-push` (M5), and is called automatically after a draft
  is generated. `--ignore-existing` means the mini owns status once a draft lands
  there (approve/schedule/posted is never clobbered by a re-push); only brand-new
  drafts cross over. Edit-after-push happens on the mini dashboard, not the M5.

To retire Option 2: log into Claude Code on the mini, confirm `claude -p` works
headless there, and the dashboard's own "Draft this"/assist buttons light up.

## Harness files (separate from this repo, under ~/agent-harness)

`tools/social-pipeline/telegram/approve.py` (send/poll/apply/create-topic),
`poster/queue_health.py`, `analytics/ingest_linkedin.py`; bins `social-tg-send`,
`social-approve-bot`, `social-analytics-ingest`. Synced to the mini.
