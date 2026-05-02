# DESIGN.md — SHeine app/web surfaces

This file is a [Google Stitch DESIGN.md](https://stitch.withgoogle.com/docs/design-md/overview/) — a markdown design system any AI agent (Claude Design, Codex, Cursor, Lovable) reads to render pixel-consistent SHeine UI on first try. Drop it at the project root.

Sebastian Heine — sheine.ai — crypto compliance consultancy + SHeine Brief newsletter. The aesthetic is **institutional, not startup**: dignified serif headlines, navy-and-gold palette, generous whitespace, numbers and specifics over generic icons. Linear-meets-Coinbase-meets-FT, but with a Cinzel headline.

## Brand identity

- **Voice in design**: institutional, confident, not flashy. Numbers and specifics. Dark mode default. Footer always reads `© <YEAR> sheine.ai · sheine.ai/newsletter`.
- **Audience**: compliance / legal / licensing / risk practitioners at VASPs and FS firms. They read 10-K disclosures for breakfast. UI must respect that — no gamification, no toasts that say "🎉 Awesome!".

## Colors

```
--navy-dark:    #020c1b   /* primary background, full-page canvas */
--navy-mid:     #0a192f   /* secondary background, panel separator */
--navy-card:    #112240   /* card / surface elevation 1 */
--navy-elev2:   #1a2c4e   /* hover / surface elevation 2 */

--text-white:   #e6f1ff   /* primary text */
--text-gray:    #8892b0   /* secondary text, captions, timestamps */
--text-dim:     #495670   /* tertiary / disabled */

--gold:         #FFD700   /* primary accent — headlines, status: approved, key metrics */
--gold-soft:    #d4af37   /* gold on hover or muted contexts */

--cyan:         #64ffda   /* secondary accent — links, data viz, active state */
--rose:         #ff6b6b   /* destructive only — delete, reject, error */
--amber:        #ffb86c   /* pending state, warnings */

--border-subtle: #1c2942
--border-strong: #2c3f6d
```

Light mode is **not supported** by default. If a screen genuinely needs light mode (printable client deliverables, public web pages with SEO concerns), invert: cream canvas `#fdfcf7`, navy-on-cream type, gold preserved as-is.

## Typography

- **Headings**: `Cinzel` (Google Fonts), weights 400 / 600 / 700. Letter-spacing -0.01em on h1–h2, normal otherwise.
- **Body / UI**: `Inter` (Google Fonts), weights 400 / 500 / 600 / 700. Default 14px, line-height 1.5.
- **Mono / data**: `JetBrains Mono` for IDs, timestamps, URLs, code blocks.

Scale (rem):

```
h1 — 2.25rem   /36px      Cinzel 700
h2 — 1.75rem   /28px      Cinzel 600
h3 — 1.375rem  /22px      Cinzel 600
h4 — 1.125rem  /18px      Inter 600
body — 0.875rem /14px     Inter 400
small — 0.75rem /12px     Inter 500   (uppercase tracking 0.06em for labels)
```

## Layout

- **Grid**: 12-column max-width 1280px. Sidebar 240px (collapsible to 56px icon rail).
- **Spacing**: 4px base. Use 8 / 12 / 16 / 24 / 32 / 48 / 64. Avoid arbitrary values.
- **Radius**: 8px on cards, 6px on inputs, 4px on small chips, **never** fully rounded ("pill" buttons read consumer-startup, off-brand).
- **Density**: medium. Tables are dense (40px row height) because compliance practitioners scan large lists.

## Components

### Surface

- **Card**: `bg-navy-card` + `border border-border-subtle` + 16px padding + 8px radius. Hover: `bg-navy-elev2`.
- **Modal**: full-screen overlay `bg-navy-dark/80 backdrop-blur`, centered card max-width 480px.

### Buttons

- **Primary** (rare — 1 per screen): `bg-gold text-navy-dark font-semibold`. Hover: `bg-gold-soft`. Use only for the dominant action.
- **Secondary**: `bg-transparent border border-border-strong text-text-white`. The default for ~80% of buttons.
- **Ghost**: text-only, color `text-cyan`. For inline links and "Cancel".
- **Destructive**: `bg-rose/10 text-rose border border-rose/30`. Always paired with a confirm dialog.

### Inputs

- 36px height, 6px radius, `bg-navy-mid` + `border border-border-subtle`. Focus: `border-cyan` + 2px cyan ring at 30% opacity. **Never** an underline-only input — too consumer.

### Status badges (used everywhere — drafts, posts, KOL replies)

```
pending    → amber on amber/10
approved   → gold on gold/10
posted     → cyan on cyan/10
rejected   → rose on rose/10
draft      → text-gray on navy-card
```

Always uppercase, tracking 0.06em, 11px Inter 600.

### Data viz (analytics dashboard)

- Single-color preferred (cyan as default, gold for the highlighted series). Multi-series uses cyan / gold / amber / rose in that priority.
- Background grid lines `border-border-subtle` at 20% opacity. No 3D, no gradients in axis labels.
- Numbers in tooltips use `JetBrains Mono`, two decimals max for percentages, comma thousands for counts.

### Tables

- Header row: `bg-navy-mid`, `text-text-gray`, uppercase 11px Inter 600.
- Body rows: 40px height, alternating `bg-navy-card` / `bg-navy-mid`. Hover: `bg-navy-elev2`.
- Sortable column headers show a 10px chevron icon at the trailing edge.
- Empty state: serif italic, "No items in window." centered, with a subdued help link below.

## Iconography

- **Lucide icons** at 16px / 20px / 24px. No filled variants — line-style only.
- **Never** use emoji as icons in the UI chrome (data exception: post body previews are allowed to render emoji as part of the user content).
- Custom icons reserved for the SHeine logo lockup (gold-on-navy, monochrome only, never colorized).

## Voice in copy

The same voice rules that govern Sebastian's posts apply to UI copy:

- No emojis in chrome. No exclamation marks.
- No "Welcome back, Sebastian! 👋". Just "Today" + the date.
- Empty states are factual, not encouraging: "No KOL replies in the last 24h." not "Looks like the KOLs are quiet — perfect time to start a post! ✨".
- Banned words in UI chrome: "delve", "leverage", "navigate", "robust", "seamless", "tapestry", "intricate", "dive into", "unlock", "game-changer", "supercharged", "AI-powered" (already implied).
- Prefer concrete labels: "Approve & schedule" not "Looks good →".

## Reference inspiration

- **Linear** (linear.app) — density + precision + restraint
- **Stripe Atlas / dashboard** — hierarchy + serif headings + navy-on-white discipline (we invert)
- **FT.com long-form pages** — editorial weight + restrained palette
- **Coinbase Institutional** — financial-grade trustworthy data layout

**Avoid** as inspiration: every SaaS dashboard with gradients, every web3 site with neon, every "AI-powered" hero with a glowing orb.

## Anti-patterns (will be rejected in review)

- ❌ Hero with "Generate your first post" + giant gold button. Drafting is the default state, not a feature pitch.
- ❌ Confetti on successful post.
- ❌ "AI" badges next to AI-generated drafts. The whole pipeline is AI-assisted; flagging it inside the UI is noise. Indicate provenance via a `based_on:` line in the draft frontmatter (small, gray text below the body).
- ❌ Large rounded "pill" buttons. Compliance UIs aren't consumer apps.
- ❌ Light mode default. The brief is read at 6am in dim rooms.

## Per-route hints (social pipeline UI)

| Route | Layout primer |
|---|---|
| `/` (composer) | Two-column: research note left (50%, scrollable, no border), draft canvas right (50%, sticky, full-height). 36px gap between. Status switcher in top-right of canvas. |
| `/queue` | Single-column table with date / platform / status / scheduled_at / preview-snippet. Drag-handle on left of each row to reschedule. |
| `/inbox` | Card grid (3 cols on desktop, 1 on mobile). Each card = a generated draft, with quick-actions: Approve / Edit / Reject inline. |
| `/analytics` | 4-up stat row at top (posts last 7d / total likes / total replies / avg engagement velocity), then 2 charts side-by-side, then a "top posts" table. |
| `/library` | Search input top, results list with subtle dividers, no cards (this is for searching, not browsing). |
| `/kols` | Two-column: KOL list left (sortable by handle / last interaction), notes/preview right. |
| `/settings` | Stacked sections, no tabs. Each section is its own card. Save buttons live with their section. |

## Footer (every page)

```
© 2026 sheine.ai · sheine.ai/newsletter
```

Inter 400, 11px, `text-text-dim`. Right-aligned.
