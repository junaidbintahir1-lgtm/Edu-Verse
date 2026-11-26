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
| `vendor/` | Three.js r128 and its licence |
| `assets/` | `eduverse-logo.png`, `knovo-logo-sm.png`, and `eduverse-social.png` (the picture shown when the site link is shared) |
| `server-changes/knovo-credits.md` | The by-hand Supabase steps for Knovo plans and credits: the SQL, the edge-function logic and the cost log |
| `resources/`, `notes/` | The PDFs listed in `EV_RESOURCES` |

## 3. How it works

- **Data:** `index.html` loads `data/site-data.js`, `data/pastpapers.js` and `data/extra.js` with plain
  script tags before the app scripts, so `EV.load()` just reads `window.EV_HUB`, `EV_DB`, `EV_HUB_DEEP`,
  `EV_RESOURCES`, `EV_PASTPAPERS` and `EV_EXTRA`. `site-data.js` keeps the original readable source (including
  the step that merges each O Level subject with its IGCSE twin into one shared folder). PDFs open with relative
  paths through `EV.pdfView`. `EV.boot()` is called at the bottom of `index.html`, after every script has loaded.
- **Members only:** `EV.render` shows the sign-in page for every route until a student is signed in, then
  returns them to the page they asked for. Top-bar navigation, Knovo and the menu are hidden while signed out.
- **Signed-out page:** besides the forms it shows a static "Take a look inside" preview (`peekHTML` in
  `views2.js`): one real Physics note and flashcard read from `data/site-data.js`, and a fixed sample Knovo
  exchange. It makes no network request and does not open the members-only gate. The header Sign in button is
  hidden there (`body.onSignin`, set in `EV.render`).
- **Educators:** in Create account the role list is "a Student" / "an Educator (teacher)". Choosing Educator
  shows extra fields (school, city, subjects, school email, a school contact) which travel in the sign-up
  metadata. It grants nothing by itself. `#educator` (`V.educator` in `views2.js`) shows the request: a personal
  request sent to the owner (who is also emailed through formsubmit.co), a "we check in about 24 hours"
  message, and, as an optional faster route, a personal code such as `EV-7K2Q9M` with three ways to prove it by email (an email from the school address, a photo of a
  staff card with the handwritten code, or a photo of a Cambridge / Pearson teacher account with the code).
  The owner approves or rejects in the private owner site; approval lasts 12 months and shows a "Verified
  Educator" badge in the menu (`EVLive.isEducator`, cached in `ev_educator`). Server functions:
  `eduverse_teacher_status`, `eduverse_teacher_apply`, and for the owner `eduverse_admin_teacher_requests`,
  `eduverse_admin_teacher_decide`.
- **Banned accounts:** the owner site can ban an account. When the site opens it calls
  `eduverse_account_state` (`EVLive.accountState`); a banned account is signed out and the sign-in page shows
  the reason and the support email. Sign-in is refused the same way, and Knovo answers `ACCOUNT_SUSPENDED`.
- **Email links:** `EVLive.adoptLink()` runs before the page is built (bottom of `index.html`). A link from a
  Supabase email (confirm email, reset password) carries the session in the address, as `#access_token=…` or
  `?token_hash=…&type=…`. It signs the visitor in, cleans the address, and for a reset opens `#newpassword`
  (`V.newpassword`, `EVLive.updatePassword`). Expired links show a message on the sign-in page. Sign-up and
  "Forgot your password?" ask Supabase to send people back to `EVLive.siteUrl()`; that address must be in
  Supabase → Authentication → URL Configuration.
- **Paid papers are private:** every paid PDF (topical banks, topical past papers, topic tests) has a path that
  starts with `paid/` in `data/site-data.js`. `EV.pdfRow` draws buttons for them and `EV.openPaid` fetches the
  file with the student's session (`EVLive.paidBlob`). The file comes from the **Papers** Supabase edge function
  (shown as "Paper" in Supabase; its address is `/functions/v1/smooth-processor?path=…`, set in `EVLive.PAPERS_FN`), which checks the account (owner, developer or an active plan, and not banned)
  and then reads the PDF from a **private GitHub repository** named in its secrets (`PAPERS_REPO`,
  `PAPERS_TOKEN`). If that function is not connected, the private Supabase Storage bucket `paid-papers` is tried
  (read rule: `eduverse_can_read_paid`). **No paid PDF is in this public repository**: the private repository
  is `junaidbintahir1-lgtm/eduverse-papers`, with the same folder and file names as the `paid/…` paths. To add
  a paid paper, upload it there and add its entry to `site-data.js`; never add it to this repository.
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
- **Knovo credits:** 1 credit = 1 normal message. Costs: message 1 (+1 if very long), Live Lesson question 1,
  Live Lesson 10, image 3 (`EVLive.CREDIT_COSTS`). **Free** accounts get 20 credits a day
  (`EVLive.DAILY_CREDITS`), refilled 24 hours after the first use. **Paid plans** have a pool with no daily
  limit: Knovo Plus Monthly and Annual 1,500 a month, Exam Season Pass 5,000 for 120 days
  (`EVLive.PLAN_POOL`). **Top-up** credits (300 per pack, valid 12 months) are spent after the daily or plan
  credits. Only the owner is unlimited. The Knovo server does the counting and returns
  `usage.credits = {plan, left, daily, cost, resetMs, poolLeft, poolSize, poolResetsAt, topupLeft}`, kept in
  `EVLive.lastUsage`; `EVLive.loadCredits()` reads the same balance from `eduverse_my_credits` before the
  first message. `EV.allowance()` and `EV.creditLine()` in `core.js` turn it into the text students see.
  The server steps (SQL and edge function) are in `server-changes/knovo-credits.md`.
- **Knovo plans window** (`#plans` in `index.html`): Free, Knovo Plus Monthly, Exam Season Pass ("Best for
  exams"), Knovo Plus Annual and the Top-up pack. Each price is written twice on the element
  (`data-pkr`, `data-usd`); `EV.paintPrices` shows rupees when the browser's time zone is Asia/Karachi or
  its language is Urdu, dollars otherwise, and the two buttons at the top switch by hand. Every paid button
  is disabled and says "Not on sale yet".
- **Knovo attachments:** up to 5 photos, text files, or one zip, 10 MB at most (`EV.readAttachments` in
  `core.js`). Photos are read with the in-browser scanner; a zip is opened in the browser and only its photos
  and text files are used.
- **Phone layout:** at 720 px and below the top menu row is replaced by a bottom tab bar (`#tabbar`), and the
  floating Ask Knovo button is hidden because Knovo has its own tab.
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
- **No purchases:** nothing is on sale and there is no checkout code anywhere. The Knovo plans window shows
  the plans and prices with every paid button disabled ("Not on sale yet"). A plan or a top-up reaches a
  student only when the owner gives it.
- **Paid plans and gifts:** every paid plan sets `user_limits.plan = 'pro'` (with `pro_until`), which opens
  the topical material, plus `plan_type` (monthly / season / annual) and a credit pool for Knovo. In the
  private owner site, "Gift a plan or credits" takes the student's email, a plan and a length, and has a
  "Give 300 top-up credits" button (`EVLive.adminGiftPlan`, `EVLive.adminGiftTopup`). Accounts gifted Pro
  before plans existed, and season winners given Pro, get the Knovo Plus Monthly allowance. The student sees
  "You now have EduVerse Pro" next time they open the site (`EVLive.loadPlan` → `eduverse_my_plan`).
- **Admin (`#admin`):** owner and co-owner only (checked on the server with `eduverse_is_admin`). Site counts,
  Gift Pro, season reward options, winners and their choices, "mark delivered", the Students list, leaderboard snapshot, messages, and
  **Server features**: five lines (XP leaderboard, seasons and rewards, leaderboard choice, Gift Pro, students and roles) that
  show ✓ On once `database-update.sql` has been run. Until then the card shows the steps with two buttons:
  "Copy the setup code" and "Open Supabase".
- **Owner Admin (not in this repository):** the owner's tools (Gift Pro, Students, developers, season
  rewards, database setup code) live on a separate private site that the owner uploads to Cloudflare. Its
  files are encrypted behind an access password, then it asks for the EduVerse sign-in, then the owner
  entry password. This repository holds no Admin page and no database setup files; `#admin` here shows
  "Page not found". The database still checks every owner action (role + entry password,
  `eduverse_admin_code_ok()`). The Admin source and the database setup are not in this repository or its
  history; the owner keeps the current files privately.
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
| Payments | Switched off on purpose (no payment account is linked). No checkout code exists; plans and top-ups are given only by the owner |
| Light theme | Black only |
| Paid PDFs | Private (see above). The history of this repository was rewritten on 26 Nov 2026 to remove every old copy of the paid PDFs, the Admin page, the database setup files and the Knovo server code |
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

## Premium notes and the syllabus map (26 Nov 2026, work branch)

- **Premium notes** sit directly under the free "Full study book" on a subject's Notes tab. They appear only when the subject has a `premium` list in `data/site-data.js` (same shape as `detailed`, with `paid/...` paths, so the files live in the private papers store). Without a plan the files are listed with a lock and no Open button; with a plan they open through the Paper function. The PDF library locks the same list. No subject has premium notes yet, so nothing shows on the site today.
- **Syllabus map** (Overview tab): sections now run down two arcs, each on its own row, so labels cannot overlap and every dot sits on its line. The box grows taller for subjects with many sections.
- **Classroom tab** (after Study tools): a teacher's notes and recorded lessons together. Every subject has the tab; one not listed in `window.EV_CLASSROOM` shows "being prepared". A subject is listed in `window.EV_CLASSROOM` at the bottom of `data/extra.js` (teacher name, one line, photo in `assets/teachers/`, optional `whatsapp` number shown on the card, then `free` and `paid` items). Locked items show the teacher's photo instead of a padlock. Never put the link of a paid item in that file: it is public. Pakistan Studies 2059 (Sir Alam) is the first one; its recordings are not connected yet, so plan holders see "Being added".
- The word "Pro" is no longer shown on the premium notes box.
- Screen sizes checked on every page: 320, 360, 375, 390, 414, 430, 600, 768, 1024, 1366 and 1920 wide (no sideways scroll, nothing sticking out, no controls overlapping).
