# EduVerse

Revision for Cambridge O Level, IGCSE, A Level and Pearson Edexcel IAL: short notes, study books, flashcards,
question practice, timed mocks and Knovo, the EduVerse study tutor. Launching January 2027.

This repository is the static EduVerse website (no build step).

- `index.html` — the EduVerse site (black 3D design). Students sign in to use it.
- `classic.html` — the classic design. It also holds the study data that `index.html` reads.
- `resources/`, `notes/` — PDF study resources.
- `HANDOFF.md` — how everything works, file by file.
- `database-update.sql` and the `*-database-setup.txt` files — one-time Supabase setup.

## Open it

Double-click `index.html`, or for the full 3D Earth run a local server in this folder:

```bash
python3 -m http.server 8767
```

then open `http://localhost:8767/index.html`.

## Live site

GitHub Pages serves the `main` branch (Settings → Pages → branch `main`, folder `/`):

https://junaidbintahir1-lgtm.github.io/Edu-Verse/
