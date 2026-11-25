/* ==== EduVerse — PAST PAPERS DATA (Batch C) ====
   window.EV_PASTPAPERS is the past-paper question bank. It starts EMPTY on purpose:
   entries are added later as real papers are transcribed. The 📄 Papers view renders
   a polished empty state until then.

   Entry schema (one object per paper sat in a given session):

   {
     id:       "5070-2024-MJ-12",        // unique string id: code-year-session-variant
     subject:  "olevel/chem5070",        // hub subject ref ("olevel/<id>" | "alevel/<id>")
                                        // or "db:olm4024" for an EV_DB deep-engine subject
     paper:    "Paper 1",                // paper label, matches the hub paper pattern naming
     code:     "5070/12",                // Cambridge component code for that sitting
     year:     2024,                     // number
     session:  "May/June",               // "May/June" | "Oct/Nov" | "Feb/March" …
     topic:    "optional",               // OPTIONAL — only for topic-tagged question packs
     questions: [
       {
         q:     "Full question text…",   // string (may contain simple HTML)
         marks: 4,                       // number of marks
         ms:    ["marking point 1", …]   // mark scheme: array of marking-point strings
       }
     ]
   }

   Filters in the Papers view are built from whatever values exist, so any subset of
   paper / year / session / topic works. Keep ids unique across the whole file. */
window.EV_PASTPAPERS = [];
