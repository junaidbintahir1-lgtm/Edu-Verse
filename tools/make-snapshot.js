/* Rebuilds data/snapshot.js: a saved copy of the study data, used only when index.html is opened
   straight from a folder (double-click). The live website never uses it; it reads classic.html.
   Run from the repo root after changing notes, questions or PDFs:   node tools/make-snapshot.js   */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'classic.html'), 'utf8');
const scripts = []; const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi; let m;
while ((m = re.exec(html))) { if (m[1] && /\bsrc\s*=/.test(m[1])) continue; scripts.push(m[2]); }
const first = scripts.findIndex(s => s.includes('==== DATA 1 (embedded)'));
const last = scripts.findIndex(s => s.includes('==== DEEP NOTES (embedded)'));
const app = scripts.find(s => s.includes('window.EV_RESOURCES = {')) || '';
const rs = app.indexOf('window.EV_RESOURCES = {'), re2 = app.indexOf('function resFor(', rs);
if (first < 0 || last < first || rs < 0 || re2 < 0) throw new Error('The data blocks in classic.html were not found');
const w = {}; w.window = w; vm.createContext(w);
vm.runInContext(fs.readFileSync(path.join(root, 'pastpapers.js'), 'utf8'), w);
vm.runInContext('(function(){' + scripts.slice(first, last + 1).join('\n;\n') + '\n;\n' + app.slice(rs, re2) + '\n})();', w);
const snap = { EV_DB: w.EV_DB, EV_HUB: w.EV_HUB, EV_HUB_DEEP: w.EV_HUB_DEEP, EV_RESOURCES: w.EV_RESOURCES, EV_PASTPAPERS: w.EV_PASTPAPERS,
  extra: JSON.parse(fs.readFileSync(path.join(root, 'data/extra.json'), 'utf8')) };
fs.writeFileSync(path.join(root, 'data/snapshot.js'),
  '/* Saved copy of the EduVerse study data (made by tools/make-snapshot.js on ' + new Date().toISOString().slice(0, 10) + ').\n   Used only when index.html is opened by double-click; the live site reads classic.html. */\nwindow.EV_SNAPSHOT=' + JSON.stringify(snap) + ';\n');
const subjects = Object.values(w.EV_HUB).reduce((n, l) => n + l.subjects.length, 0);
console.log('data/snapshot.js written:', subjects, 'subjects');
