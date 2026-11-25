# EduVerse

Revision for Cambridge O Level, IGCSE, A Level and Pearson Edexcel IAL: short notes, study books, flashcards,
question practice, timed mocks, free mock papers and Knovo, the EduVerse study tutor. Launching January 2027.

This repository is the static EduVerse website (no build step).

- `index.html` — the EduVerse site. Students sign in to use it.
- `data/site-data.js` — all study content: subjects, notes, flashcards, questions and PDF lists.
- `lesson.js` — the Live Lesson board, where Knovo teaches a topic with voice.
- `resources/`, `notes/` — PDF study resources.
- `HANDOFF.md` — how everything works, file by file.

Nothing is on sale on the site and it takes no payments. Topical past papers are EduVerse Pro, which only
the owner can give from the private owner site.

## Open it

Double-click `index.html`, or for the full 3D Earth run a local server in this folder:

```bash
python3 -m http.server 8767
```

then open `http://localhost:8767/index.html`.

## Live site

GitHub Pages serves the `main` branch (Settings → Pages → branch `main`, folder `/`):

https://junaidbintahir1-lgtm.github.io/Edu-Verse/
