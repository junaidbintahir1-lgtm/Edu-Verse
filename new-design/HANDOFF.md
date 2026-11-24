# EduVerse new design: handover guide

This folder is a **working test build of the new black 3D EduVerse design**. It was made beside the live site
(`index.html`, `signin.html`, `data*.js`, `deep/`, `resources/`), which it does not change. Use this file to continue the work.

The owner's goal for the next step: **move this design onto the real site and connect it to the real backend**
(Supabase sign-in, the real Knovo edge function, the real XP leaderboard).

---

## 1. Run it

The pages load JSON with `fetch`, so open them through a local web server, not `file://`:

```bash
cd new-design
python3 -m http.server 8766
# open http://localhost:8766/eduverse-app.html
```

Three.js r128 loads from cdnjs. Everything else is local.

## 2. Files

| File | What it holds |
|---|---|
| `eduverse-app.html` | Page shell, **all CSS** (design tokens on `:root`), top bar, ☰ drawer, bell box, Knovo side sheet, Knovo Pro plans modal |
| `core.js` | `window.EV` namespace: saved progress, XP rules, router, data loading, **Knovo AI engine**, Markdown renderer, side sheet, 3D hero (`EV.mountHero`) |
| `views.js` | Home, qualification shelves (`EV.qualCard`), level pages, subject hub and its tabs (`TAB.overview/notes/questions/cards/technique/library/tools/topics`), Maths 4024 topic engine |
| `views2.js` | Dashboard, Technique, Mistakes, Mock exam, Papers (`V.papers`, `V.paperSubj`), Ranks, Knovo workspace (`V.knovo`), About, Sign in, What to add. Calls `EV.boot()` at the end |
| `menu.js` | ☰ side menu (`EV.renderDrawer`), notifications bell (`EV.buildNotifs`), text size |
| `data/hub.json` | `window.EV_HUB` from the live site: 35 subjects across `olevel`, `alevel`, `alevel_edx`, `ielts`, `act`, `sat` |
| `data/deep.json` | `window.EV_HUB_DEEP` (expanded notes, which override `notes` where present) |
| `data/resources.json` | `window.EV_RESOURCES` (PDF lists per subject; paths point into `/resources` and `/notes`) |
| `data/db.json` | `window.EV_DB`, only subjects that have chapters (Maths 4024 topic engine) |
| `data/extra.json` | Command-word table and FAQ, taken from `index.html` |
| `assets/` | Resized EduVerse and Knovo logos |
| `tools/extract-data.js` | Playwright script that regenerates the JSON from the live `index.html` |

**The JSON files are copies.** When the real site's data changes, regenerate them from the repo root:
`node new-design/tools/extract-data.js new-design/data-raw`, then rebuild `data/*.json`. Or, better, have the
real pages read `window.EV_HUB` etc. directly instead of the JSON (see section 6).

## 3. How it works

- **Routing:** plain hash names only. Examples: `#home`, `#qualifications`, `#level-olevel`,
  `#<tab>-<slug>` (for example `#notes-olevelphys5054`), `#topic-num1`, `#papers-olevelmath4024`, `#dashboard`, `#knovo`.
  The slug is `lk + id` with non-alphanumerics removed (see `EV.BYSLUG`). Parsing is in `EV.parse`, and views register on `EV.views`.
- **State:** one object `EV.ST`, saved to `localStorage["evtest1"]` (`EV.save()`). Fields include `xp`, `xpLog`, `streak`,
  `today`, `goal`, `attempts`, `mistakes`, `cards`, `cardsSeen`, `topicsDone`, `notesSeen`, `mocks`, `favs`, `recent`, `exam`,
  `chats`, `kdeck`, `kn` (allowance), `profile`, `notifsRead`, `notifsHidden`, `futureNotify`, `font`.
  **This differs from the live site's `ST`.** Map one to the other when you merge (see section 6).
- **XP:** same rules as the live site: topic +50, question +10 (+5 if correct), flashcard +3, streak day +20, mock +100.
  Level = `floor(sqrt(xp/60))+1`. There are 11 badges, the same as the live site (`EV.badges`).
- **Members-only pages:** Knovo, Mock and the Knovo side sheet need `ST.profile`. In this build, "Test as a student" on `#signin` creates a local profile.

## 4. Knovo: the main thing to change

In the test build, Knovo calls **Claude through the claude.ai artifact `sample` capability** (`window.claude.use("sample")`).
That only works inside a claude.ai artifact. On the real site, Knovo must call the existing Supabase edge function.

Everything goes through **one function, `EV.knovoAsk(turns, opts)` in `core.js`**:

- `turns` is `[{role:"user"|"assistant", content}]`, ending on a user turn.
- `opts.mode` is `chat` | `mark` | `scan` | `lesson` | `plan`. `opts.ctx` is `{label, ref, topic, extra}`.
  `opts.images` is a Blob array (scan). `opts.onText` streams text. `opts.signal` is an AbortSignal.
- It returns a Promise of `{text}`.
- `EV.knovoRules(ctx, mode)` builds the system prompt. It includes the current subject's paper pattern and up to 8,000
  characters of its EduVerse notes, which is what makes answers subject-aware. Keep this.

To use the live backend, replace the body of `EV.knovoAsk` with a call shaped like the live site's `askEdge` in `index.html`:

```js
POST https://<project>.supabase.co/functions/v1/Knovo
Headers: Content-Type: application/json, Authorization: Bearer <student access token>
Body: { mode: "chat",
        systemInstruction: { parts: [{ text: EV.knovoRules(ctx, mode) }] },
        contents: turns.map(t => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] })) }
```

- Handle `429` with `error:"LIMIT_REACHED"` and `msLeft`, as the live site does. That replaces the local 20-messages/3-hours
  counter (`EV.allowance`, `EV.useAllowance`), which exists only for the test build.
- For photo scans, send the image the way the live site does (it uses Tesseract OCR in the browser plus the edge function).
- Keep `EV.kSend` (chat bubbles, Stop, "Exam answer / Test me / Make flashcards") and `EV.kFlash` (flashcards from an answer). They only depend on `EV.knovoAsk`.
- Remove the offline fallback (`EV.offlineAnswer`) and the "Live AI is off in this view" note, or keep the fallback for network errors.

## 5. Other things that are not connected yet

| Feature | Test build | Live site source to connect |
|---|---|---|
| Sign in | Local test profile (`V.signin`) | `signin.html` + Supabase (`ev_auth_token`, `ev_auth_user`, …) |
| Ranks | Shows only your own XP | `xp-leaderboard.js` (Supabase, signed-in students only) |
| XP sync | Local only | `xp-leaderboard.js` queues XP events |
| Past-paper questions | Empty state (`pastpapers.js` is empty) | `window.EV_PASTPAPERS`: add paper/year/session/topic filters when entries exist |
| Payments | "Coming soon" only | Not live on the real site either |
| Theme | Black only | The live site also has a light theme |
| Service worker / PWA | Not included | `sw.js` |

## 6. Suggested way to merge into the real site

1. Work on a branch. Keep the live `index.html` working until the new one is complete.
2. Keep the live data files as the single source (`data1.js`/`data2.js`/`data3.js`, `deep/*.js`, `pastpapers.js` and the inline `EV_HUB`/`EV_RESOURCES`).
   Change `EV.load()` to read `window.EV_HUB`, `window.EV_HUB_DEEP`, `window.EV_RESOURCES` and `window.EV_DB` instead of `data/*.json`.
3. Change `EV.pdfView` / `EV.pdfRaw` to use relative paths (`resources/...`). The test build links to GitHub because it is hosted elsewhere.
4. Map state: either migrate the live `ST` into `EV.ST` once, or make `EV.ST` read and write the live keys, so students keep their streaks, XP and mistakes.
5. Connect Knovo (section 4), sign-in and the leaderboard (section 5).
6. Test on a phone: no sideways scrolling, and the hero, menu, bell and Knovo sheet must all work at 390px width.

## 7. Design rules to keep

- Colours come from the two logos: **gold = EduVerse actions, teal = Knovo only**, navy for depth, true-black ground.
- Fonts: Bricolage Grotesque (headings), Inter (text), JetBrains Mono (syllabus codes).
- One 3D moment per screen: knowledge planet (home hero), book shelves (qualifications), star map (subject overview), flip cards (quiz and flashcards).
- Honest labels: estimates are marked "indicative", payments say "coming soon", and original practice is not presented as official papers.
