# EduVerse: handover guide

This repository is the EduVerse website. **`index.html` is the new black 3D design**, connected to the real
backend. The classic site is kept beside it as **`classic.html`** and still holds the study data.
Work happens on the branch `claude/new-design`; `main` (the live site) changes only when the owner says so.
EduVerse launches in **January 2027**.

---

## 1. Run it

```bash
cd Edu-Verse            # the repo root
python3 -m http.server 8767
# open http://localhost:8767/index.html
```

On GitHub Pages it works as is (static files, no build step). Double-clicking `index.html` also works: it then
uses the saved data copy in `data/snapshot.js` and shows a flat Earth (browsers block 3D textures on `file://`).
All code is local, including Three.js r128 (`vendor/three-r128.min.js`, MIT licence). The only external requests
are Supabase, Google Fonts, the contact-form service (formsubmit.co) and, for photo scans, Tesseract from jsDelivr.

## 2. Files

| File | What it holds |
|---|---|
| `index.html` | The new design: page shell and **all CSS** (design tokens on `:root`), top bar, ☰ drawer, bell, Knovo side sheet, Knovo plans modal |
| `live.js` | **Every real connection** (`window.EVLive`): Supabase sign-in / sign-up / refresh / sign-out, Knovo edge function, XP ledger + leaderboard sync, leaderboard choice, seasons, owner tools, photo text reader, the live site's saved progress |
| `core.js` | `window.EV`: live data loading, saved progress + the bridge to the live site, effort-only XP, router + members-only gate, Knovo engine (`EV.knovoAsk`, `EV.kSend`, `EV.kFlash`), Markdown, side sheet, 3D hero |
| `hero.js` | **Home hero**: 4-slide slideshow (`EV.heroHTML`), the real Earth in WebGL, floating formula / equation / quote / fact cards, ticker and stats band. Defines `EV.mountHero` |
| `tex/` | Earth textures used by `hero.js` (see the licence note in section 8) |
| `views.js` | Home (with the Contact section), qualification shelves, level pages, subject hub tabs (PDF library with the Pro lock), Maths topic engine |
| `views2.js` | Dashboard, technique, mistakes, mock, papers, ranks + seasons, **admin**, Knovo workspace, about, sign in / create account, ideas |
| `menu.js` | ☰ side menu (plan, leaderboard switch, Instagram sneak peeks, owner admin link), notifications bell, text size |
| `data/extra.json` | Command-word table and FAQ (design copy; the FAQ says EduVerse is members-only) |
| `data/snapshot.js` | Saved copy of the study data, used **only** for double-click (`file://`) viewing. Refresh with `node tools/make-snapshot.js` |
| `tools/make-snapshot.js` | Rebuilds `data/snapshot.js` from `classic.html` |
| `classic.html` | The classic site (was `index.html`). **Single source of the study data**: edit notes, questions and PDF lists here. Also has the rebuilt Live Lesson |
| `signin.html`, `ctrl-panel-x94k.html`, `subject.html`, `xp-leaderboard.js`, `pastpapers.js` | Classic pages and scripts, unchanged. `signin.html` sends students to `index.html` after login |
| `database-update.sql` | **Run once in Supabase**: effort-only XP rules, leaderboard choice, seasons, mystery rewards, owner tools |
| `vendor/` | Three.js r128 and its licence |
| `assets/` | Logos. The new design uses `eduverse-logo.png` and `knovo-logo-sm.png`; the others belong to the classic pages |

## 3. How it works

- **Data:** `classic.html` is the single source of truth. Its subject data (`EV_DB`, `EV_HUB`,
  `EV_HUB_DEEP`, `EV_RESOURCES`) is written *inside* `classic.html` (the separate `data1-3.js` and `deep/*.js`
  files are older copies that nothing loads). `EV.loadLive()` fetches `classic.html`, runs only the
  data blocks (from `==== DATA 1 (embedded)` to `==== DEEP NOTES (embedded)`, plus the `window.EV_RESOURCES = {`
  section up to `function resFor(`) and loads `pastpapers.js`. If those markers are renamed in classic.html,
  update them in `EV.loadLive` and in `tools/make-snapshot.js`. PDFs open with relative paths through `EV.pdfView`.
- **Members only:** `EV.render` shows the sign-in page for every route until a student is signed in, then
  returns them to the page they asked for. Top-bar navigation, Knovo and the menu are hidden while signed out.
- **Sign-in:** same Supabase project and same localStorage keys as `signin.html` (`ev_auth_token`,
  `ev_auth_refresh`, `ev_auth_expires`, `ev_auth_user`), so one login works on both designs. Sign-up uses the
  same fields and username rules as signin.html. Tokens renew silently.
- **Saved progress:** design-only settings are in `localStorage["ev_design_v1"]`. Shared progress is kept in
  step with the classic site's `ev_state_v1` both ways (`EV.syncFromLive` / `EV.syncToLive`): streak, daily
  goal, topics, cards, attempts, mistakes, mocks, liked subjects, display name. Maths topic-engine ids are
  mapped to the classic ids (`chapter/topic[/n]`). Changes made in another tab are picked up.
- **XP (effort only):** XP is one shared ledger (`ev_state_v1.xpLedger`, the same one xp-leaderboard.js uses),
  synced with the same server functions. The design only creates these events:
  `q:<id>` +15 for a correct answer (once per question, not faster than one per 15 s),
  `mastery:<topic>` +50 when every question in a Maths topic is right, and
  `exam:<subject>:<paper>:w<week>` +100 for a timed mock with half the time used and 40%+ scored.
  Ticking chapters, flashcards, daily visits and wrong answers earn nothing. `database-update.sql` makes the
  **server** enforce the same rules with daily caps (40 answers, 5 masteries, 3 mocks), so XP cannot be farmed
  from the classic site or by editing the page. XP students earned before stays earned.
- **Leaderboard choice:** asked at sign-in and sign-up, changeable in the ☰ menu (`ev_lb_optin`). "Off" stops
  XP syncing and, after the database update, hides the student on the server too.
- **Seasons:** January–June and July–December (UTC), starting January 2027. Ranks shows a countdown and the
  season standings. After a season ends, the top 3 by season XP each pick one of three mystery rewards that the
  owner sets in Admin. Server functions: `eduverse_season_board`, `eduverse_my_season_reward`,
  `eduverse_claim_season_reward`.
- **Knovo:** `EV.knovoAsk` calls the Supabase `Knovo` edge function with the student's Bearer token. The rules
  from `EV.knovoRules` go in `systemInstruction` (the server adds its own rules first and keeps up to 3,000
  characters of ours); the subject's EduVerse notes go in the first student message. 429 `LIMIT_REACHED` with
  `msLeft` shows the real wait and sets `knovo_chat_blocked_until` (shared with the classic site). Photo scans
  read the text in the browser with Tesseract (like the classic site), then ask Knovo. Flashcards from an answer
  also go through the edge function. Modes: chat, mark my answer, scan a question, live lesson (3-part guided
  lesson in chat).
- **Pro lock:** topical banks, topic tests, mixed tests and full-syllabus assessments in the PDF library are
  locked unless the student is the owner, has early-access Pro (`ev_state_v1.plan.tier === "pro"`) — the same
  rule as the classic site. This is a display lock; the files are still public in the repository.
- **Admin (`#admin`):** owner and co-owner only (checked on the server with `eduverse_is_admin`). Site counts,
  season reward options, winners and their choices (emails shown only after the classic dashboard's two-step
  owner check), "mark delivered", leaderboard snapshot, messages, a link to `ctrl-panel-x94k.html`, and which
  server features are switched on.
- **Contact:** the home page ends with the Contact EduVerse section. It sends through formsubmit.co to
  educationalverse2027@gmail.com, exactly like the classic site, with an email-app fallback.

## 4. Owner checklist before launch

1. In Supabase, run `database-update.sql` once (tested on PostgreSQL 16 against the leaderboard
   setup; safe to run twice). Admin → "Server features" should then show ✓ On for all three.
2. In Admin, set the three mystery rewards for Season 2027-H1 before it ends on 30 June 2027.
3. Decide whether solved/practice **questions** should also be Pro (the classic site locks them; this design
   keeps them open because the Questions tab, daily quiz and mocks depend on them).
4. To go live, merge `claude/new-design` into `main` (GitHub Pages serves `main`). Use "Squash and merge".
5. `classic.html` is not linked for students but opens without sign-in for anyone who knows the address.
   If the old design should be fully closed, add a redirect at its top or remove its app code (keep the data blocks).

## 5. Not connected yet / known limits

| Item | Status |
|---|---|
| Payments | "Coming soon" only, as on the classic site |
| Light theme | Black only |
| Service worker / PWA | `sw.js` and `manifest.webmanifest` exist but no page registers them |
| Paid PDFs | Display lock only; real protection needs private storage (e.g. Cloudflare R2) and signed links |
| Past-paper questions | `EV_PASTPAPERS` is still empty; Papers shows the empty state |
| XP from Knovo marking | Not awarded (cannot be verified yet) |

## 6. Testing

Tested with Playwright against a stand-in Supabase (sign-in, sign-up, Knovo, leaderboard, owner check,
contact form) at 1366 px and 390 px: every page, no sideways scrolling, no console errors; plus the progress
bridge, the XP rules, Knovo requests (system prompt size, notes, 429, flashcards, photo scan), seasons UI,
Pro lock, admin and sign-out. The SQL was run on a local PostgreSQL 16 with the leaderboard setup, including a
season-end test with the clock set to August 2027.

## 7. Design rules to keep

- Colours come from the two logos: **gold = EduVerse actions, teal = Knovo only**, navy for depth, true-black ground.
- Fonts: Bricolage Grotesque (headings), Inter (text), JetBrains Mono (syllabus codes).
- One 3D moment per screen: the Earth (home hero), book shelves (qualifications), star map (subject overview), flip cards (quiz and flashcards).
- Honest labels: estimates are marked "indicative", payments say "coming soon", and original practice is not presented as official papers.

## 8. The home hero (hero.js)

- **Earth:** a custom three.js shader (day map, night city lights, ocean sun-glint, clouds, atmosphere glow). Each slide turns the globe to a region; visitors can drag to rotate.
- **Cards:** content pools are in `hero.js` (`FORMULAS`, `CHEMS`, `QUOTES`, `FACTS`, `ELEMENTS`). Cards that would overlap are hidden automatically. The "Your progress" card shows the real streak and XP (`EV.shownXP`).
- **Accuracy rule:** quotes must be word-for-word with a named source; facts and equations must be checkable.
- **Fallbacks:** without WebGL the page shows a flat CSS Earth. With reduced-motion settings there is no autoplay.
- **Earth image licence — confirm before launch:** the four files in `tex/` came from the open-source three-globe package and look like NASA Blue Marble data, but their original licence was not confirmed. Before launch, re-download the originals from NASA Visible Earth (public domain), replace the files in `tex/`, and update the footer credit.
