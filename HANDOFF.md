# EduVerse: handover guide

This repository is the EduVerse website: **`index.html` is the black 3D design**, connected to the real
backend. The old "classic" site has been removed; its study data and its Live Lesson board were moved into
this design first (`data/site-data.js`, `lesson.js`). The old files are still in the Git history.
Work happens on the branch `claude/new-design`; `main` (the live site) changes only when the owner says so.
EduVerse launches in **January 2027**.

---

## 1. Run it

```bash
cd Edu-Verse            # the repo root
python3 -m http.server 8767
# open http://localhost:8767/index.html
```

On GitHub Pages it works as is (static files, no build step). Double-clicking `index.html` also works, with
the same data; it only shows a flat Earth instead of the 3D one (browsers block 3D textures on `file://`).
All code is local, including Three.js r128 (`vendor/three-r128.min.js`, MIT licence). The only external requests
are Supabase, Google Fonts, the contact-form service (formsubmit.co) and, for photo scans, Tesseract from jsDelivr.

## 2. Files

| File | What it holds |
|---|---|
| `index.html` | The new design: page shell and **all CSS** (design tokens on `:root`), top bar, ☰ drawer, bell, Knovo side sheet, Knovo plans modal |
| `live.js` | **Every real connection** (`window.EVLive`): Supabase sign-in / sign-up / refresh / sign-out, Knovo edge function, XP ledger + leaderboard sync, leaderboard choice, seasons, owner tools, photo text reader, saved progress (`ev_state_v1`) |
| `core.js` | `window.EV`: reads the data files, saved progress, effort-only XP, router + members-only gate, Knovo engine (`EV.knovoAsk`, `EV.kSend`, `EV.kFlash`), Markdown, side sheet |
| `hero.js` | **Home hero**: 4-slide slideshow (`EV.heroHTML`), the real Earth in WebGL, floating formula / equation / quote / fact cards, ticker and stats band. Defines `EV.mountHero` |
| `tex/` | Earth textures used by `hero.js` (see the licence note in section 8) |
| `views.js` | Home (with the Contact section), qualification shelves, level pages, subject hub tabs (PDF library with the Pro lock on topical material), Maths topic engine |
| `views2.js` | Dashboard, technique, mistakes, **mock area (free mock papers)**, **papers (topical, Pro only)**, ranks + seasons, **admin** (rewards, Gift Pro, database setup helper), Knovo workspace, about, sign in / create account, ideas |
| `menu.js` | ☰ side menu (plan, leaderboard switch, Start a Live Lesson, Instagram sneak peeks, owner admin link), notifications bell, text size |
| `lesson.js`, `lesson.css` | **Live Lesson board**: Knovo teaches a topic on a board with voice (`window.knovoLiveLesson(topic)`). Opened from Knovo's "Live lesson" mode, the ☰ menu, and the "✨ Live Lesson" button under any Knovo answer. Start screen (a lesson only starts after the student types a topic and presses Start), sentence-by-sentence voice engine, neat boards (tables and statements, working, graphs, flows, timelines, code, points), raise-hand questions with lesson memory |
| `data/site-data.js` | **All study content, the single source of truth**: `EV_DB` (Maths topic engine), `EV_HUB` (every subject: papers, notes, flashcards, questions), `EV_HUB_DEEP` (longer notes), `EV_RESOURCES` (PDF lists). Edit content here |
| `data/pastpapers.js` | `EV_PASTPAPERS`: past-paper question bank (still empty; the schema is in the file) |
| `data/extra.js` | `EV_EXTRA`: exam command words and the home-page FAQ |
| `sw.js`, `manifest.webmanifest` | Offline support and "install app". The worker is **network-first**, so updates always show at once; bump `CACHE` in `sw.js` only if you change how it works |
| `signin.html` | A small forwarder: old links land on the sign-in page inside `index.html` |
| `admin-database-setup.txt` | One-time Supabase setup for the owner check (`eduverse_is_admin`) and the profiles table (run before `database-update.sql`; already done on the live project) |
| `database-update.sql` | **The one database setup file. Run once in Supabase** (safe to run again): XP table and effort-only XP rules, leaderboard choice, seasons, mystery rewards, owner tools, and Gift Pro. Admin has a "Copy the setup code" button for it |
| `vendor/` | Three.js r128 and its licence |
| `assets/` | `eduverse-logo.png`, `knovo-logo-sm.png`, and `eduverse-social.png` (the picture shown when the site link is shared) |
| `resources/`, `notes/` | The PDFs listed in `EV_RESOURCES` |

## 3. How it works

- **Data:** `index.html` loads `data/site-data.js`, `data/pastpapers.js` and `data/extra.js` with plain
  script tags before the app scripts, so `EV.load()` just reads `window.EV_HUB`, `EV_DB`, `EV_HUB_DEEP`,
  `EV_RESOURCES`, `EV_PASTPAPERS` and `EV_EXTRA`. `site-data.js` keeps the original readable source (including
  the step that merges each O Level subject with its IGCSE twin into one shared folder). PDFs open with relative
  paths through `EV.pdfView`. `EV.boot()` is called at the bottom of `index.html`, after every script has loaded.
- **Members only:** `EV.render` shows the sign-in page for every route until a student is signed in, then
  returns them to the page they asked for. Top-bar navigation, Knovo and the menu are hidden while signed out.
- **Sign-in:** Supabase email + password through `live.js`, stored under `ev_auth_token`, `ev_auth_refresh`,
  `ev_auth_expires` and `ev_auth_user`. Sign-up keeps the classic
  site's fields and username rules. Tokens renew silently.
- **Saved progress:** design settings are in `localStorage["ev_design_v1"]`. Study progress is also kept in
  `ev_state_v1`, the key the classic site used, so students who studied on the old site keep everything
  (`EV.syncFromLive` / `EV.syncToLive`): streak, daily
  goal, topics, cards, attempts, mistakes, mocks, liked subjects, display name. Maths topic-engine ids are
  mapped to the classic ids (`chapter/topic[/n]`). Changes made in another tab are picked up.
- **XP (effort only):** XP is one ledger (`ev_state_v1.xpLedger`), synced with `eduverse_sync_xp`,
  `eduverse_leaderboard` and `eduverse_my_xp`. The design only creates these events:
  `q:<id>` +15 for a correct answer (once per question, not faster than one per 15 s),
  `mastery:<topic>` +50 when every question in a Maths topic is right, and
  `exam:<subject>:<paper>:w<week>` +100 for a timed mock with half the time used and 40%+ scored.
  Ticking chapters, flashcards, daily visits and wrong answers earn nothing. `database-update.sql` makes the
  **server** enforce the same rules with daily caps (40 answers, 5 masteries, 3 mocks), so XP cannot be farmed
  by editing the page or calling the server directly. XP students earned before stays earned.
- **Leaderboard choice:** asked at sign-in and sign-up, changeable in the ☰ menu (`ev_lb_optin`). "Off" stops
  XP syncing and, after the database update, hides the student on the server too.
- **Seasons:** January–June and July–December (UTC), starting January 2027. Ranks shows a countdown and the
  season standings. After a season ends, the top 3 by season XP each pick one of three mystery rewards that the
  owner sets in Admin. Server functions: `eduverse_season_board`, `eduverse_my_season_reward`,
  `eduverse_claim_season_reward`.
- **Knovo:** `EV.knovoAsk` calls the Supabase `Knovo` edge function with the student's Bearer token. The rules
  from `EV.knovoRules` go in `systemInstruction` (the server adds its own rules first and keeps up to 3,000
  characters of ours); the subject's EduVerse notes go in the first student message. 429 `LIMIT_REACHED` with
  `msLeft` shows the real wait and sets `knovo_chat_blocked_until`. Photo scans read the text in the browser
  with Tesseract, then ask Knovo. Flashcards from an answer also go through the edge function. Modes: chat,
  mark my answer, scan a question, and live lesson, which opens the Live Lesson board.
- **Live Lesson board (`lesson.js`):** `mode:"whiteboard"` asks the server for a lesson as JSON (steps with
  `voice` plus either a structured `board` or `svgElements`); questions use `mode:"lesson_qa"` and carry the
  lesson plan, current step, board text and earlier Q&A. The lesson is tailored to the subject chosen in the
  Knovo workspace. Free accounts get 3 lessons per 6 hours (counted by the server; refunded if generation fails).
- **Free and Pro:** everything is free with an account except the **topical** material. Pro only:
  the whole **Papers** section (topical past papers, `papersLocked` in `views2.js`), topical question banks
  and topic tests (`PRO_CATS` in `views.js`). **Mock papers are free**: the Mock area lists each subject's
  challenge mocks, full yearly practice papers, mixed-topic tests and full-syllabus assessments (`MOCK_CATS`
  in `views2.js`) next to the interactive timed papers. `EVLive.isPro()` is true for the owner, for accounts
  the owner gave Pro to, and for old early-access accounts (`ev_state_v1.plan.tier === "pro"`). This is a
  display lock; the PDF files are still public in the repository.
- **No purchases:** nothing is on sale and there is no checkout code anywhere. Price tags for paper folders
  were removed; the Knovo plans window shows the planned plans with every button disabled ("Not on sale
  yet"). The only way to get Pro is a gift from the owner.
- **Gift Pro:** Admin → "Gift EduVerse Pro": type the student's sign-up email, choose how long (30 days to
  1 year, or no end date), press Give Pro. It sets `user_limits.plan = 'pro'` (and `pro_until`), which the
  Knovo server already treats as unlimited. The student sees "You now have EduVerse Pro" next time they open
  the site (`EVLive.loadPlan` → `eduverse_my_plan`, cached in `ev_plan`). The same card lists every Pro
  account with a Remove button, and season winners have a one-press "Give Pro" button.
- **Admin (`#admin`):** owner and co-owner only (checked on the server with `eduverse_is_admin`). Site counts,
  Gift Pro, season reward options, winners and their choices, "mark delivered", the Students list, leaderboard snapshot, messages, and
  **Server features**: five lines (XP leaderboard, seasons and rewards, leaderboard choice, Gift Pro, students and roles) that
  show ✓ On once `database-update.sql` has been run. Until then the card shows the steps with two buttons:
  "Copy the setup code" and "Open Supabase".
- **Owner security:** the Admin page and every owner server function need two things: the owner or
  co-owner role (checked in the database), and the **owner entry password**, a second password typed once
  per sign-in. The owner creates it the first time they open Admin and shares it privately with co-owners.
  Only a scrambled copy is stored (`admin_entry`); it is never in this repository or in the browser. Five
  wrong tries lock that account's entry for 15 minutes; the pass lasts 12 hours and is tied to one sign-in.
  `adminCodeLock` in `views2.js` is the screen; `eduverse_admin_code_ok()` in `database-update.sql` enforces
  it on the server. Admin also holds the **Students** list (search, Reset XP, make a developer (stored as `co-owner`) by email or
  from the list). Only the owner can change roles or the entry password; nobody can be made a second owner;
  co-owners never see the owner's or other co-owners' names and emails.
  The old separate page `ctrl-panel-x94k.html` was removed; these tools replace it.
- **Contact:** the home page ends with the Contact EduVerse section. It sends through formsubmit.co to
  educationalverse2027@gmail.com, with an email-app fallback.

## 4. Owner checklist before launch

1. Run the database setup once: Admin → "Server features" → **Copy the setup code** → **Open Supabase** →
   paste → Run. (It is the file `database-update.sql`; tested on PostgreSQL 16, safe to run twice.) Admin
   should then show ✓ On for all five lines, and Gift Pro and the Students list start working.
   Run it again after any update to `database-update.sql`.
2. In Admin, set the three mystery rewards for Season 2027-H1 before it ends on 30 June 2027.
3. Decide whether **topic tests** stay Pro (they are, as "topical" material) and whether solved/practice
   **questions** should also be Pro (this design keeps them open because the Questions tab, daily quiz and
   mocks depend on them).
4. To go live, merge `claude/new-design` into `main` (GitHub Pages serves `main`). Use "Squash and merge".

## 5. Not connected yet / known limits

| Item | Status |
|---|---|
| Payments | Switched off on purpose (no payment account is linked). No checkout code exists; Pro is given only by the owner in Admin |
| Email links | After a student confirms their email or asks for a password reset, Supabase sends them back to the site with a token in the address. Nothing reads that token yet, so they must sign in by hand, and a reset password cannot be set on the site |
| Light theme | Black only |
| Paid PDFs | Display lock only; real protection needs private storage (e.g. Cloudflare R2) and signed links |
| Past-paper questions | `EV_PASTPAPERS` (interactive past-paper questions) is still empty; Papers shows the topical PDF papers only |
| XP from Knovo marking | Not awarded (cannot be verified yet) |

## 6. Testing

Tested with Playwright against a stand-in Supabase (sign-in, sign-up, Knovo, leaderboard, owner check,
contact form) at 1366 px and 390 px: every page, no sideways scrolling, no console errors; plus the progress
bridge, the XP rules, Knovo requests (system prompt size, notes, 429, flashcards, photo scan), seasons UI,
the Papers lock for free students and its opening for gifted Pro and the owner, free mock papers (every PDF
link checked), "nothing can be bought" on every page, Gift Pro (give, list, remove), the database setup
helper, admin and sign-out; the Live Lesson board (start screen, lesson, board table, question, close) at both
widths; offline reload through the service worker; and double-click opening. The SQL was run on a local PostgreSQL 16 on top of the owner setup, including a
season-end test with the clock set to August 2027 and the gift functions (give, expire, remove).

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
