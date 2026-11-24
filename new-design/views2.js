/* EduVerse test build — views part 2: dashboard, technique, mistakes, mock, papers, ranks, knovo, about, sign in, ideas */
(function(){
"use strict";
var EV=window.EV,$=EV.$,$$=EV.$$,esc=EV.esc,ST=EV.ST,V=EV.views;

/* Members-only pages show what they do before asking for sign-in */
function lockPage(el,title,text,preview){
  el.innerHTML='<div class="in page"><div style="position:relative;border-radius:24px;overflow:hidden;border:1px solid var(--rim);margin-top:10px"><div style="filter:blur(4px);opacity:.5;pointer-events:none;padding:24px" aria-hidden="true">'+preview+'</div><div style="position:absolute;inset:0;display:grid;place-items:center;align-content:center;gap:12px;text-align:center;padding:24px;background:linear-gradient(180deg,rgba(3,4,5,.2),rgba(3,4,5,.88))"><span class="eyebrow">Members only · free account</span><h2 class="h2" style="margin:0">'+esc(title)+'</h2><p class="muted" style="max-width:52ch">'+esc(text)+'</p><div class="row" style="justify-content:center"><a class="btn gold" href="#signin">Sign in to unlock</a><a class="btn" href="#signin">Create free account</a></div></div></div></div>';
}

/* =================== DASHBOARD =================== */
V.dashboard=function(el){
  var lp=EV.levelProgress(ST.xp),b=EV.badges(),earned=b.filter(function(x){return x.ok}).length;
  var tq=ST.today.d===EV.today()?ST.today.q:0,open=ST.mistakes.filter(function(m){return !m.resolved}).length;
  var STARTERS=['olevel/phys5054','olevel/chem5070','olevel/math4024','olevel/bio5090','alevel/m9709','olevel/eng1123'].map(function(r){return EV.BYREF[r]}).filter(Boolean);
  var h='<div class="in page"><div class="pageHead"><span class="eyebrow">My study dashboard'+(ST.profile?' · '+esc(ST.profile.name):'')+'</span><h1>Your progress</h1><p class="sub">Streaks, XP, mistakes and a quick way back into every subject. Everything here comes from what you actually do.</p></div>';
  h+='<div class="dashTop">'+
    '<div class="cell"><span class="eyebrow">Daily streak</span><div class="big">🔥 '+ST.streak.count+'<small> day'+(ST.streak.count===1?'':'s')+'</small></div></div>'+
    '<div class="cell"><span class="eyebrow">Today</span><div class="big">'+tq+'<small> / '+ST.goal+'</small></div><label class="field" for="goal">Daily goal<select id="goal">'+[5,10,15,20,30].map(function(g){return '<option value="'+g+'"'+(g===ST.goal?' selected':'')+'>'+g+' questions</option>';}).join('')+'</select></label></div>'+
    '<div class="cell"><span class="eyebrow">Questions attempted</span><div class="big">'+ST.attempts.length+'</div><span class="small muted">across all subjects</span></div>'+
    '<a class="cell" href="#mistakes" style="text-decoration:none"><span class="eyebrow">Mistakes to review</span><div class="big" style="color:'+(open?'var(--bad)':'inherit')+'">'+open+'</div><span class="small muted">in your notebook →</span></a></div>';
  h+='<section class="sect" style="padding-top:28px"><div class="card stack"><div class="hd"><h3 style="font-size:1.3rem">⭐ Level '+lp.l+' · '+ST.xp+' XP</h3><span class="pill gold">'+earned+' / '+b.length+' badges</span></div><div class="bar"><i style="width:'+lp.pct+'%"></i></div><p class="small muted">'+lp.pct+'% of the way to Level '+(lp.l+1)+' · topic +50 XP · question +10 XP (+5 if correct) · flashcard +3 XP · streak day +20 XP · mock +100 XP</p>'+
    '<div class="badges">'+b.map(function(x){return '<div class="badge'+(x.ok?' on':'')+'"><span class="e">'+x.ic+'</span><b>'+esc(x.t)+'</b><span>'+esc(x.d)+'</span></div>';}).join('')+'</div><div class="row"><a class="btn sm" href="#ranks">🏆 Open XP leaderboard</a></div></div></section>';
  var bySub={};ST.attempts.forEach(function(a){var s=bySub[a.ref]=bySub[a.ref]||{n:0,ok:0};s.n++;if(a.ok)s.ok++;});
  var refs=Object.keys(bySub).filter(function(r){return EV.BYREF[r]}).sort(function(a,b){return bySub[b].n-bySub[a].n});
  var read='<div class="card stack"><div class="hd"><h3>Readiness by subject</h3><span class="pill">From your attempts</span></div>';
  if(refs.length)read+=refs.map(function(r){var o=EV.BYREF[r],p=Math.round(100*bySub[r].ok/bySub[r].n),c=p>=70?'var(--ok)':p>=50?'var(--gold)':'var(--bad)';return '<a class="rrow" href="#questions-'+o.slug+'"><div class="nm"><b>'+o.s.icon+' '+esc(o.s.name)+'</b><span class="code">'+esc(o.s.code)+' · '+bySub[r].n+' attempts · '+EV.grade(p)+'</span></div><div class="bar"><i style="width:'+p+'%;background:'+c+'"></i></div><b class="r">'+p+'%</b></a>';}).join('');
  else{var pick=(ST.recent.length?ST.recent.map(function(r){return EV.BYREF[r]}).filter(Boolean):[]).concat(STARTERS).filter(function(o,i,a){return a.indexOf(o)===i}).slice(0,4);
    read+='<p class="small muted">Answer 5 questions in a subject and its readiness score appears here. Pick one to start:</p><div class="dRead">'+pick.map(function(o){return '<a class="ghostRow" href="#questions-'+o.slug+'"><span class="ic">'+o.s.icon+'</span><span><b style="font-size:.9rem">'+esc(o.s.name)+'</b> <span class="code muted">'+esc(o.s.code)+'</span><div class="gb"></div></span><span class="go">Practise →</span></a>';}).join('')+'</div>';}
  read+='</div>';
  var rec=ST.recent.map(function(r){return EV.BYREF[r]}).filter(Boolean).slice(0,5);
  var recH='<div class="card stack"><h3>Recent subjects</h3>'+(rec.length?'<div>'+rec.map(function(o){var n=EV.notesOf(o).length,d=0;for(var i=0;i<n;i++)if(ST.topicsDone.indexOf(o.ref+'#n'+i)>=0)d++;return '<a class="recRow" href="#overview-'+o.slug+'"><span class="ic">'+o.s.icon+'</span><span><b style="font-size:.88rem">'+esc(o.s.name)+'</b> <span class="code muted">'+esc(o.s.code)+'</span><small>'+d+' of '+n+' notes learned</small></span><span class="muted">→</span></a>';}).join('')+'</div>':'<p class="small muted">Nothing opened yet. Popular places to start:</p><div class="startGrid">'+STARTERS.slice(0,4).map(function(o){return '<a href="#overview-'+o.slug+'"><span>'+o.s.icon+'</span>'+esc(o.s.name)+' <span class="code muted">'+esc(o.s.code.split(' / ').pop())+'</span></a>';}).join('')+'</div>')+'</div>';
  var best=ST.mocks.reduce(function(m,x){return Math.max(m,x.pct)},0);
  var mockH='<div class="card stack"><div class="hd"><h3>Timed mocks</h3>'+(ST.mocks.length?'<span class="pill gold">Best '+best+'%</span>':'')+'</div>'+(ST.mocks.length?ST.mocks.slice().reverse().slice(0,4).map(function(m){return '<div class="row" style="justify-content:space-between;font-size:.84rem"><span>'+esc(m.subject)+' · '+esc(m.paper)+'</span><span class="pill gold">'+m.pct+'% · '+esc(m.grade)+'</span></div>';}).join(''):
    '<div class="watch"><div class="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="#191f27" stroke-width="8"/><circle cx="50" cy="50" r="42" fill="none" stroke="#f0b429" stroke-width="8" stroke-linecap="round" stroke-dasharray="263.9" stroke-dashoffset="198"/></svg><b>0:00</b></div><div class="stack" style="gap:6px"><span class="small">Sit a paper with a real countdown, then mark it against the solutions.</span><div class="row" style="gap:6px"><span class="pill gold">+100 XP</span><span class="pill">⏱ Exam Ready badge</span></div></div></div>')+'<a class="btn sm gold" href="#mock">Sit a timed mock →</a></div>';
  h+='<section class="sect" style="padding-top:28px"><div class="twoCol">'+read+'<div class="stack">'+recH+mockH+'</div></div></section>';
  h+='<section class="sect" style="padding-top:28px"><div class="dataCard"><div class="ico">💾</div><div class="stack"><div><h3 style="font-size:1.15rem">Your study data on this device</h3><p class="small muted" style="margin-top:4px">This test build keeps everything in this browser. On the live site, signed-in progress can sync to your account.</p></div>'+
    '<div class="dataChips"><span><b>'+ST.xp+'</b>XP</span><span><b>'+ST.attempts.length+'</b>attempts</span><span><b>'+ST.mistakes.length+'</b>mistakes</span><span><b>'+ST.topicsDone.length+'</b>topics learned</span><span><b>'+ST.chats.length+'</b>Knovo chats</span><span><b>'+ST.mocks.length+'</b>mocks</span></div>'+
    '<div class="row" id="resetRow"><button class="btn sm bad" type="button" id="resetA">Start fresh (reset progress)</button></div></div></div></section></div>';
  el.innerHTML=h;
  $('#goal').addEventListener('change',function(){ST.goal=+this.value;EV.save();EV.toast('Daily goal set to '+ST.goal);EV.render();});
  $('#resetA').addEventListener('click',function(){$('#resetRow').innerHTML='<span class="small">This clears XP, streak, attempts, mistakes, chats and mocks on this device.</span><button class="btn sm bad" type="button" id="resetY">Yes, reset</button><button class="btn sm" type="button" id="resetN">Cancel</button>';$('#resetY').addEventListener('click',EV.resetAll);$('#resetN').addEventListener('click',function(){EV.render()});});
};

/* =================== TECHNIQUE (general) =================== */
V.technique=function(el){
  var withFmt=EV.SUBJ.filter(function(o){return !o.soon&&o.s.fmt});
  el.innerHTML='<div class="in page"><div class="pageHead"><span class="eyebrow">Exam technique · the general guide</span><h1>How examiners award marks</h1><p class="sub">The universal command-word contract applies to every subject. Open a subject below for its own paper format and tips.</p></div>'+
  '<section class="stack"><h2 class="h2" style="font-size:1.5rem;margin:0">🗣 Command words: your answering contract</h2>'+EV.commandsTable()+'</section>'+
  '<section class="sect" style="padding-top:36px"><h2 class="h2" style="font-size:1.5rem;margin:0">📈 Answer-style ladder</h2><p class="sub">How the same question climbs from weak to A*. Use it for Business, Economics, History, English, Pakistan Studies, and "explain" questions in sciences.</p><div style="margin-top:14px">'+EV.ladderHTML()+'</div></section>'+
  '<section class="sect" style="padding-top:36px"><h2 class="h2" style="font-size:1.5rem;margin:0">Subject-specific technique</h2><div class="subjGrid">'+withFmt.map(function(o){return '<a class="subj" href="#technique-'+o.slug+'"><span class="ic">'+o.s.icon+'</span><b>'+esc(o.s.name)+' <span class="code muted">'+esc(o.s.code)+'</span></b><p>'+esc(EV.strip(o.s.fmt)).slice(0,140)+'…</p></a>';}).join('')+'</div></section></div>';
};

/* =================== MISTAKES =================== */
V.mistakes=function(el){
  var act=ST.mistakes.filter(function(m){return !m.resolved}),res=ST.mistakes.filter(function(m){return m.resolved});
  var rate=ST.mistakes.length?Math.round(100*res.length/ST.mistakes.length):0;
  var cnt={};act.forEach(function(m){cnt[m.ref]=(cnt[m.ref]||0)+1;});var pri=Object.keys(cnt).sort(function(a,b){return cnt[b]-cnt[a]})[0];
  var h='<div class="in page"><div class="pageHead"><span class="eyebrow"><b>Recover · Retry · Master</b></span><h1>Mistakes recovery</h1><p class="sub">Turn every lost mark into a next step. Retry a question and it resolves only when you get it right.</p></div>'+
  '<div class="dashTop"><div class="cell"><span class="eyebrow">Active reviews</span><div class="big">'+act.length+'</div></div><div class="cell"><span class="eyebrow">Resolved</span><div class="big">'+res.length+'</div></div><div class="cell"><span class="eyebrow">Recovery rate</span><div class="big">'+rate+'<small>%</small></div></div><div class="cell"><span class="eyebrow">Priority subject</span><div style="font-weight:700;font-size:1rem">'+(pri?esc(EV.BYREF[pri].s.name+' '+EV.BYREF[pri].s.code):'No open priority')+'</div></div></div>'+
  '<div class="row" style="margin-top:18px"><button class="btn teal" type="button" id="plan"'+(act.length?'':' disabled')+'>✦ Build my recovery plan with Knovo</button></div>';
  if(!ST.mistakes.length)h+='<div class="empty" style="margin-top:20px"><b>No mistakes recorded yet</b><span>Answer some questions. Anything you mark as missed, in practice, the daily quiz or a mock, is collected here.</span><a class="btn gold sm" href="#qualifications">Practise a subject</a></div>';
  else h+='<div class="mist" style="margin-top:20px" id="mList">'+act.concat(res).map(function(m){var o=EV.BYREF[m.ref];return '<div class="mi'+(m.resolved?' res':'')+'" data-mid="'+esc(m.id)+'"><div class="row"><span class="pill gold">'+(o?o.s.icon+' '+esc(o.s.name)+' '+esc(o.s.code):'')+'</span><span class="pill">'+esc(m.src||'')+'</span>'+(m.misses>1?'<span class="pill bad">Missed '+m.misses+'×</span>':'')+(m.resolved?'<span class="pill ok">Resolved</span>':'')+'</div><div style="font-size:.98rem">'+esc(m.q)+'</div><div class="reveal ans" hidden style="padding:10px 12px;border-radius:10px;background:var(--goldsoft);border:1px solid var(--goldline);font-size:.88rem">'+(m.steps&&m.steps.length?'<ol style="margin:0 0 6px;padding-left:18px">'+m.steps.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ol>':'')+'<b>Answer:</b> '+esc(m.a||'See the worked solution in the subject.')+'</div><div class="acts">'+(m.resolved?'':'<button class="btn sm" type="button" data-mr>Retry · show answer</button><button class="btn sm ok" type="button" data-mok>✓ Got it now</button><button class="btn sm bad" type="button" data-mno>✗ Still wrong</button>')+'<button class="btn sm teal" type="button" data-mask>Ask Knovo why</button><button class="btn sm ghost" type="button" data-mdel>Remove</button></div></div>';}).join('')+'</div>';
  h+='</div>';el.innerHTML=h;
  var pb=$('#plan');if(pb)pb.addEventListener('click',function(){var list=act.slice(0,12).map(function(m,i){var o=EV.BYREF[m.ref];return (i+1)+'. ['+(o?o.s.name+' '+o.s.code:'')+'] '+m.q;}).join('\n');EV.askKnovo('Build me a 7-day recovery plan for these questions I got wrong. Group them by topic, explain the misconception behind each group in one line, and give daily actions:\n\n'+list,'Mistakes notebook with '+act.length+' open items');});
  var L=$('#mList');if(!L)return;
  L.addEventListener('click',function(e){var card=e.target.closest('[data-mid]');if(!card)return;var m=ST.mistakes.find(function(x){return x.id===card.dataset.mid});if(!m)return;
    if(e.target.closest('[data-mr]')){card.querySelector('.reveal').hidden=false;return;}
    if(e.target.closest('[data-mok]')||e.target.closest('[data-mno]')){EV.attempt(m,!!e.target.closest('[data-mok]'));EV.render();return;}
    if(e.target.closest('[data-mask]')){EV.askKnovo('I got this question wrong. Diagnose the likely misconception, explain the correct method, then give me a similar question to retry:\n\n'+m.q+(m.a?'\n\nCorrect answer: '+m.a:''),'Mistake: '+m.q);return;}
    if(e.target.closest('[data-mdel]')){ST.mistakes=ST.mistakes.filter(function(x){return x!==m});EV.save();EV.render();}
  });
};

/* =================== MOCK EXAM =================== */
var MOCK=null,mockTimer=null;
function parseDur(t){t=String(t||'');var h=t.match(/(\d+(?:\.\d+)?)\s*h/i),m=t.match(/(\d+)\s*min/i),mins=0;if(h)mins+=parseFloat(h[1])*60;if(m)mins+=parseInt(m[1],10);return mins||60;}
function fmt(s){var h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return (h?h+':':'')+String(m).padStart(h?2:1,'0')+':'+String(x).padStart(2,'0');}
function mockSubs(){return EV.SUBJ.filter(function(o){return !o.soon&&EV.allQuestions(o).length});}
V.mock=function(el){
  if(!ST.profile){lockPage(el,'Timed mock exams','Full timed mock exams with a real countdown and mark schemes are member material. Sign in to sit a paper under exam conditions.','<div class="grid g3">'+mockSubs().slice(0,6).map(function(o){return '<div class="card"><b>'+o.s.icon+' '+esc(o.s.name)+'</b><p class="small muted">'+o.s.papers.length+' papers</p></div>';}).join('')+'</div>');return;}
  clearInterval(mockTimer);
  var st=MOCK?MOCK.stage:'subject';
  if(st==='paper')return mockPapers(el);
  if(st==='run')return mockRun(el);
  if(st==='mark')return mockMark(el);
  if(st==='result')return mockResult(el);
  var h='<div class="in page"><div class="pageHead"><span class="eyebrow">Timed mock exam</span><h1>Sit a paper under exam conditions</h1><p class="sub">Pick a subject, then a paper. A real countdown runs while you work; at zero the paper submits itself. Then mark each answer against the worked solution.</p></div><div class="subjGrid">'+
    mockSubs().map(function(o){return '<button class="subj" type="button" data-pick="'+o.ref+'" style="text-align:left;border:1px solid var(--rim);font:inherit;color:inherit;cursor:pointer"><span class="ic">'+o.s.icon+'</span><b>'+esc(o.s.name)+' <span class="code muted">'+esc(o.s.code)+'</span></b><span>'+o.s.papers.length+' papers · '+EV.allQuestions(o).length+' questions in pool'+(o.res&&o.res.mocks?' · '+o.res.mocks.length+' mock PDFs':'')+'</span></button>';}).join('')+'</div>';
  if(ST.mocks.length)h+='<section class="sect" style="padding-top:36px"><h2 class="h2" style="font-size:1.4rem;margin:0">Past mocks ('+ST.mocks.length+')</h2><div class="stack" style="margin-top:14px">'+ST.mocks.slice().reverse().map(function(m){return '<div class="card row" style="padding:14px 18px"><span class="grow"><b>'+esc(m.subject)+'</b> · '+esc(m.paper)+' <span class="small muted">'+esc(m.date)+'</span></span><span class="pill">'+m.score+'/'+m.total+' · '+m.pct+'%</span><span class="pill ok">Grade '+esc(m.grade)+'</span></div>';}).join('')+'</div></section>';
  el.innerHTML=h+'</div>';
  $$('[data-pick]',el).forEach(function(b){b.addEventListener('click',function(){MOCK={stage:'paper',ref:b.dataset.pick};EV.render();window.scrollTo(0,0);});});
};
function mockPapers(el){
  var o=EV.BYREF[MOCK.ref];
  var h='<div class="in page"><button class="crumb" type="button" id="mBack" style="border:0;background:none;padding:0">← All subjects</button><div class="pageHead" style="margin-top:10px"><span class="eyebrow">'+esc(o.s.board)+'</span><h1>'+o.s.icon+' '+esc(o.s.name)+' · choose your paper</h1></div>';
  if(o.res&&o.res.mocks)h+='<div class="libGroup"><h3>📝 100-mark challenge mock PDFs + marking guides</h3>'+o.res.mocks.map(EV.pdfRow).join('')+'</div>';
  h+='<section class="sect" style="padding-top:28px"><h2 class="h2" style="font-size:1.4rem;margin:0">Interactive timed papers</h2><p class="sub">The timer follows the paper\'s stated duration. Questions are drawn from this subject\'s question pool.</p><label class="field" for="mLen" style="max-width:260px;margin-top:12px">Timer<select id="mLen"><option value="real">Real paper duration</option><option value="15">15-minute practice run</option><option value="1">1-minute test of auto-submit</option></select></label><div class="stack" style="margin-top:14px">'+
    o.s.papers.map(function(p,i){return '<div class="card row"><span class="grow"><b>'+esc(p.p)+'</b> — '+esc(p.n||'')+'<br><span class="small muted">'+[p.t,p.m,p.w].filter(Boolean).map(esc).join(' · ')+'</span></span><button class="btn gold" type="button" data-start="'+i+'">Start mock →</button></div>';}).join('')+'</div></section></div>';
  el.innerHTML=h;
  $('#mBack').addEventListener('click',function(){MOCK=null;EV.render();});
  $$('[data-start]',el).forEach(function(b){b.addEventListener('click',function(){
    var p=o.s.papers[+b.dataset.start],len=$('#mLen').value,mins=len==='real'?parseDur(p.t):+len;
    var qs=EV.allQuestions(o).sort(function(){return Math.random()-.5}).slice(0,15);
    MOCK={stage:'run',ref:o.ref,paper:p,qs:qs,i:0,flags:{},ans:{},marks:{},endAt:Date.now()+mins*60000};
    EV.mockRunning=true;EV.render();window.scrollTo(0,0);});});
}
function mockSubmit(){clearInterval(mockTimer);if(!MOCK||MOCK.stage!=='run')return;MOCK.stage='mark';EV.mockRunning=false;EV.render();window.scrollTo(0,0);}
function mockRun(el){
  var o=EV.BYREF[MOCK.ref],q=MOCK.qs[MOCK.i];
  var h='<div class="in page"><div class="mockBar"><span class="clock" id="clock">--:--</span><span class="grow small"><b>'+esc(o.s.name)+' '+esc(o.s.code)+'</b> · '+esc(MOCK.paper.p)+' · question '+(MOCK.i+1)+' of '+MOCK.qs.length+'</span><button class="btn sm gold" type="button" id="mSub">Submit paper</button></div>'+
    '<div class="qnav" style="margin-bottom:16px">'+MOCK.qs.map(function(_,j){return '<button type="button" data-j="'+j+'" class="'+(j===MOCK.i?'cur ':'')+(MOCK.ans[j]?'ans ':'')+(MOCK.flags[j]?'fl':'')+'" aria-label="Question '+(j+1)+'">'+(j+1)+'</button>';}).join('')+'</div>'+
    '<div class="q"><div class="qh"><span class="pill gold">Question '+(MOCK.i+1)+'</span>'+(q.marks?'<span class="pill">'+q.marks+' marks</span>':'')+'<span class="small muted">'+esc(q.t||q.kind)+'</span></div><div class="qt" style="font-size:1.05rem">'+esc(q.q)+'</div><label class="field" for="mAns">Your answer (working counts)<textarea id="mAns" placeholder="Write your working and answer here">'+esc(MOCK.ans[MOCK.i]||'')+'</textarea></label>'+
    '<div class="row"><button class="btn sm" type="button" id="mPrev"'+(MOCK.i?'':' disabled')+'>← Previous</button><button class="btn sm '+(MOCK.flags[MOCK.i]?'bad':'')+'" type="button" id="mFlag">'+(MOCK.flags[MOCK.i]?'⚑ Flagged':'⚐ Flag for review')+'</button><button class="btn sm gold" type="button" id="mNext">'+(MOCK.i<MOCK.qs.length-1?'Next →':'Finish & submit')+'</button></div></div>'+
    '<p class="small muted" style="margin-top:14px">Answers stay hidden until you submit. Knovo is switched off during a mock.</p></div>';
  el.innerHTML=h;
  var ta=$('#mAns');ta.addEventListener('input',function(){MOCK.ans[MOCK.i]=ta.value;});
  function go(j){MOCK.ans[MOCK.i]=ta.value;MOCK.i=j;EV.render();}
  $$('.qnav button',el).forEach(function(b){b.addEventListener('click',function(){go(+b.dataset.j)});});
  $('#mPrev').addEventListener('click',function(){go(MOCK.i-1)});
  $('#mNext').addEventListener('click',function(){if(MOCK.i<MOCK.qs.length-1)go(MOCK.i+1);else{MOCK.ans[MOCK.i]=ta.value;mockSubmit();}});
  $('#mFlag').addEventListener('click',function(){MOCK.flags[MOCK.i]=!MOCK.flags[MOCK.i];MOCK.ans[MOCK.i]=ta.value;EV.render();});
  $('#mSub').addEventListener('click',function(){MOCK.ans[MOCK.i]=ta.value;mockSubmit();});
  function tick(){var s=Math.max(0,Math.round((MOCK.endAt-Date.now())/1000)),c=$('#clock');if(c){c.textContent=fmt(s);c.classList.toggle('low',s<60);}if(s<=0){EV.toast('Time! Your paper was submitted.');mockSubmit();}}
  tick();mockTimer=setInterval(tick,1000);
  EV.cleanup=function(){clearInterval(mockTimer);};
}
function mockMark(el){
  var o=EV.BYREF[MOCK.ref];
  var h='<div class="in page"><div class="pageHead"><span class="eyebrow">Mark your paper</span><h1>Self-mark against the solutions</h1><p class="sub">For each question, compare your answer with the worked solution and award marks honestly. Structured questions without published marks are out of 4.</p></div><div class="stack">'+
    MOCK.qs.map(function(q,j){var mx=q.marks||4,cur=MOCK.marks[j];return '<div class="q"><div class="qh"><span class="pill gold">Question '+(j+1)+'</span><span class="pill">'+mx+' marks</span>'+(MOCK.flags[j]?'<span class="pill bad">Flagged</span>':'')+'</div><div class="qt">'+esc(q.q)+'</div><div class="field">Your answer<div style="padding:10px 12px;border-radius:10px;background:var(--deck2);font-size:.9rem;white-space:pre-wrap;color:var(--ivory)">'+(MOCK.ans[j]?esc(MOCK.ans[j]):'<span class="muted">No answer written</span>')+'</div></div><div class="reveal">'+(q.steps&&q.steps.length?'<ol class="steps">'+q.steps.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ol>':'')+(q.a?'<div class="ans"><b>Answer:</b> '+esc(q.a)+'</div>':'')+(q.ms&&q.ms.length?'<ul class="ms"><b>Mark scheme</b>'+q.ms.map(function(m){return '<li>'+esc(m)+'</li>';}).join('')+'</ul>':'')+'</div><div class="row"><span class="small muted">Marks awarded:</span><div class="markOpts" data-j="'+j+'">'+Array.from({length:mx+1},function(_,k){return '<button type="button" data-m="'+k+'" class="'+(cur===k?'on':'')+'">'+k+'</button>';}).join('')+'</div></div></div>';}).join('')+
    '</div><div class="row" style="margin-top:18px"><button class="btn gold" type="button" id="mFin">See my result →</button><span class="small muted" id="mLeft"></span></div></div>';
  el.innerHTML=h;
  function left(){var n=MOCK.qs.filter(function(_,j){return MOCK.marks[j]==null}).length;$('#mLeft').textContent=n?n+' question'+(n>1?'s':'')+' still to mark':'All marked';}
  $$('.markOpts',el).forEach(function(g){g.addEventListener('click',function(e){var b=e.target.closest('[data-m]');if(!b)return;MOCK.marks[+g.dataset.j]=+b.dataset.m;$$('button',g).forEach(function(x){x.classList.toggle('on',x===b)});left();});});
  left();
  $('#mFin').addEventListener('click',function(){
    var score=0,total=0;MOCK.qs.forEach(function(q,j){var mx=q.marks||4;total+=mx;score+=MOCK.marks[j]||0;if((MOCK.marks[j]||0)<mx/2)EV.attempt(Object.assign({},q,{src:'Mock exam'}),false);else EV.attempt(q,true);});
    var pct=Math.round(100*score/total);
    MOCK.result={score:score,total:total,pct:pct,grade:EV.grade(pct)};
    ST.mocks.push({subject:o.s.name+' '+o.s.code,paper:MOCK.paper.p,score:score,total:total,pct:pct,grade:EV.grade(pct),date:new Date().toLocaleDateString()});
    EV.addXP(EV.XPR.mock,'mock');EV.save();MOCK.stage='result';EV.render();window.scrollTo(0,0);});
}
function mockResult(el){
  var o=EV.BYREF[MOCK.ref],R=MOCK.result;
  el.innerHTML='<div class="in page"><div class="card" style="display:grid;gap:16px;justify-items:center;text-align:center;padding:44px 24px;margin-top:20px;background:radial-gradient(500px 260px at 50% 0%,rgba(240,180,41,.15),transparent 70%),var(--deck)"><span class="eyebrow">'+esc(o.s.name+' '+o.s.code)+' · '+esc(MOCK.paper.p)+'</span><div class="gradeBig">'+esc(R.grade)+'</div><div class="big">'+R.score+'<small> / '+R.total+' · '+R.pct+'%</small></div><p class="muted" style="max-width:52ch">Indicative grade from typical boundaries. +100 XP earned. Questions where you scored under half went to your Mistakes notebook.</p><div class="row" style="justify-content:center"><a class="btn gold" href="#mistakes">Review mistakes</a><button class="btn" type="button" id="mAgain">Sit another mock</button><button class="btn teal" type="button" data-ask="I just scored '+R.pct+'% on a '+esc(o.s.name)+' mock. Give me 3 specific things to fix before my next attempt.">Ask Knovo what to fix</button></div></div></div>';
  $('#mAgain').addEventListener('click',function(){MOCK=null;EV.render();});
}

/* =================== PAPERS =================== */
/* Papers: same structure as the live site (search → O Level / A Level groups → subject paper page) */
function ppLevel(o){return o.lk.indexOf('alevel')===0?'A Level':'O Level';}
function usd(n){n=Number(n);return '$'+(Number.isInteger(n)?String(n):n.toFixed(2));}
EV.ppQ='';
V.papers=function(el){
  var subs=EV.SUBJ.filter(function(o){return !o.soon});
  el.innerHTML='<div class="in page"><div class="pageHead"><span class="eyebrow">📄 Past papers</span><h1>Past papers</h1><p class="sub">Find your subject, open compiled PDF papers, or filter interactive questions by paper, year, session and topic. Anything you miss goes straight to your ✎ Mistakes notebook.</p></div>'+
    '<form class="ppSearch" role="search" id="ppF"><label class="field" for="ppQ">Find a subject<input id="ppQ" type="search" autocomplete="off" placeholder="Search Mathematics, 0580, Cambridge, O Level…" value="'+esc(EV.ppQ)+'"></label><button class="btn gold" type="submit">Search</button><button class="btn" type="button" id="ppClear">Clear</button></form>'+
    '<div class="ppMeta" id="ppMeta" aria-live="polite"></div>'+
    '<div class="ppIntro"><b>Global one-time paper access · USD</b><span>O Level / IGCSE paper folders are planned as one-time purchases. Shared folders include both listed syllabus codes. Checkout is not connected yet; nothing here opens an email app or takes payment.</span></div><div id="ppRes"></div></div>';
  function match(o,q){return !q||(o.s.name+' '+o.s.code+' '+o.s.board+' '+ppLevel(o)+' '+(o.lk==='alevel_edx'?'pearson edexcel':'cambridge')).toLowerCase().indexOf(q)>=0;}
  function card(o){var n=EV.pdfCount(o);return '<a class="ppCard" href="#papers-'+o.slug+'"><div class="row" style="gap:6px"><span class="pill">'+esc(o.s.board)+'</span><span class="pill gold code">'+esc(o.s.code)+'</span></div><div class="t"><span>'+o.s.icon+'</span><b>'+esc(o.s.name)+'</b></div><div class="foot"><span>'+(n?n+' PDF resource'+(n>1?'s':'')+' available':'PDFs being prepared')+'</span>'+(o.s.oneTimeLaunch?'<span class="price">'+usd(o.s.oneTimeLaunch)+'<small>one-time launch</small></span>':'<span>→</span>')+'</div></a>';}
  function paint(){var q=EV.ppQ.trim().toLowerCase(),f=subs.filter(function(o){return match(o,q)}),out='';
    if(!f.length)out='<div class="empty" style="margin-top:28px"><b>No matching subjects</b><span>Try a subject name, syllabus code, board, "O Level" or "A Level".</span><button class="btn gold sm" type="button" data-ppclear>Clear search</button></div>';
    ['O Level','A Level'].forEach(function(lv){var g=f.filter(function(o){return ppLevel(o)===lv});if(!g.length)return;
      out+='<section><div class="ppLevelHead"><h2>'+lv+'</h2><p>'+(lv==='O Level'?'Including Cambridge IGCSE subjects':'Cambridge and Pearson Edexcel subjects')+' · '+g.length+' subject'+(g.length===1?'':'s')+'</p></div><div class="grid g3">'+g.map(card).join('')+'</div></section>';});
    $('#ppRes').innerHTML=out;$('#ppMeta').textContent=q?f.length+' matching subject'+(f.length===1?'':'s'):'Search by subject name, syllabus code, board or qualification.';}
  $('#ppQ').addEventListener('input',function(){EV.ppQ=this.value;paint();});
  $('#ppF').addEventListener('submit',function(e){e.preventDefault();EV.ppQ=$('#ppQ').value;paint();});
  function clear(){EV.ppQ='';$('#ppQ').value='';paint();$('#ppQ').focus();}
  $('#ppClear').addEventListener('click',clear);el.addEventListener('click',function(e){if(e.target.closest('[data-ppclear]'))clear();});
  paint();
};
V.paperSubj=function(el,r){
  var o=r.o,s=o.s,res=o.res||{},lv=ppLevel(o);
  var pay=lv!=='O Level'?'<div class="payCard"><div><b>A Level paper purchasing is not listed yet.</b><span>Paper checkout is planned for the O Level / IGCSE folders first. Existing study tools remain available.</span></div></div>':
    (s.oneTimeLaunch?'<div class="payCard"><div><b>'+usd(s.oneTimeLaunch)+' · one-time folder access</b><span>Global USD launch price · standard later '+usd(s.oneTimeStandard)+'. One payment is intended to open this whole paper folder. Checkout is coming soon; no payment is taken from this notice.</span></div><span class="pill">COMING SOON</span></div>':'');
  var h='<div class="in page"><a class="crumb" href="#papers">← All subjects</a><div class="pageHead" style="margin-top:10px"><span class="eyebrow">📄 Past papers · '+esc(s.board)+'</span><h1 style="font-size:clamp(1.9rem,4.4vw,3rem)">'+s.icon+' '+esc(s.name)+' <span class="code" style="font-size:.45em;color:var(--gold)">'+esc(s.code)+'</span></h1><p class="sub">Filter by paper, year, session or topic · attempt inline, then reveal the mark scheme and self-mark honestly.</p></div>'+pay+
    '<div class="noteBox">🎯 <b>Mark schemes are deliberately kept one step away.</b> Practice only works when you commit to an answer first. Attempt each question honestly, then reveal the worked solution and marking guidance afterwards.</div>';
  var hasPdf=(res.compiled&&res.compiled.length)||(res.yearly&&res.yearly.length);
  if(res.compiled&&res.compiled.length)h+='<section class="sect" style="padding-top:28px"><div class="libGroup"><h3>📑 Compiled topical papers (PDF) <span class="pill">Topic by topic</span></h3>'+res.compiled.map(EV.pdfRow).join('')+'</div></section>';
  if(res.yearly&&res.yearly.length)h+='<section class="sect" style="padding-top:28px"><div class="libGroup"><h3>🗓 Original yearly practice papers (PDF) <span class="pill">Full-length + marking schemes</span></h3>'+res.yearly.map(EV.pdfRow).join('')+'</div></section>';
  if(hasPdf)h+='<div class="noteBox" style="margin-top:22px"><b>Interactive questions are not added for this subject yet.</b><br>The downloadable PDF papers above are ready to use now.<div class="row" style="margin-top:12px"><a class="btn gold sm" href="#mock">⏱ Sit a timed mock instead</a><a class="btn sm" href="#overview-'+o.slug+'">📖 Open the '+esc(s.name)+' hub</a></div></div>';
  else h+='<div class="empty" style="margin-top:28px"><span style="font-size:2.4rem">📄</span><b>No past papers added yet for this selection. They will be added soon.</b><span>The past-paper bank for '+esc(s.name)+' ('+esc(s.code)+') is ready: once papers are added you can filter them by paper, year, session and topic, attempt them inline and check mark schemes here.</span><div class="row" style="justify-content:center"><a class="btn gold sm" href="#mock">⏱ Sit a timed mock instead</a><a class="btn sm" href="#overview-'+o.slug+'">📖 Open the '+esc(s.name)+' hub</a></div></div>';
  h+='<div style="margin-top:22px"><a class="btn" href="#papers">← All subjects</a></div></div>';
  el.innerHTML=h;
};

/* =================== RANKS =================== */
V.ranks=function(el){
  var lp=EV.levelProgress(ST.xp),wk=EV.weekXP(),mode=EV.rankMode||'all';
  var you=ST.profile?esc(ST.profile.name):'You (guest)';
  el.innerHTML='<div class="in page"><div class="pageHead"><span class="eyebrow"><b>EduVerse</b> · genuine student progress</span><h1>Study ranks</h1><p class="sub">Turn consistent revision into XP. Compare weekly or all-time progress with real signed-in students. Never bots, demo accounts or invented scores.</p></div>'+
  '<div class="lbHero"><div class="cell"><span class="eyebrow">Your XP · this device</span><div class="big">'+ST.xp+'</div></div><div class="cell"><span class="eyebrow">Your level</span><div class="big">'+lp.l+'</div></div><div class="cell"><span class="eyebrow">This week</span><div class="big">'+wk+'</div></div><div class="cell"><span class="eyebrow">All-time rank</span><div class="big">—</div></div></div>'+
  '<section class="sect" style="padding-top:28px"><div class="card stack"><div class="hd"><div class="seg" role="tablist"><button type="button" class="'+(mode==='all'?'on':'')+'" data-rm="all">All time</button><button type="button" class="'+(mode==='week'?'on':'')+'" data-rm="week">This week</button></div><span class="small muted">Live rankings come from your Supabase project on the real site</span></div>'+
  '<div class="scrollx"><table class="tbl"><thead><tr><th>Rank</th><th>Student</th><th>Level</th><th style="text-align:right">XP</th></tr></thead><tbody><tr style="background:var(--goldsoft)"><td>—</td><td>'+you+' <span class="pill gold">You</span></td><td>'+lp.l+'</td><td style="text-align:right;font-variant-numeric:tabular-nums">'+(mode==='week'?wk:ST.xp)+'</td></tr></tbody></table></div>'+
  '<div class="empty" style="padding:28px"><b>'+(ST.profile?'Other students appear on the live site':'Sign in to see genuine student rankings')+'</b><span>This test build cannot reach your database, so it shows only your own XP. On the live site, signed-in students with the student role are ranked here.</span>'+(ST.profile?'':'<a class="btn gold sm" href="#signin">Sign in or create a student account</a>')+'</div></div></section>'+
  '<section class="sect" style="padding-top:28px"><div class="grid g2"><div class="card stack"><h3>How XP is earned</h3><p class="small muted">Lifetime XP stays earned. Unticking a topic does not take it away.</p><table class="tbl">'+[['Complete a topic','+50 XP'],['Attempt a question','+10 XP'],['Correct-answer bonus','+5 XP'],['Review a flashcard','+3 XP'],['New study-streak day','+20 XP'],['Finish a timed mock','+100 XP']].map(function(r){return '<tr><td>'+r[0]+'</td><td style="text-align:right;color:var(--gold)">'+r[1]+'</td></tr>';}).join('')+'</table></div>'+
  '<div class="card stack"><h3>No bots. No invented scores.</h3><p class="small muted">Only signed-in accounts with the student role can appear. EduVerse adds no sample names, bot accounts or generated scores. Display names are shown; email addresses are never published. Fixed server rules award XP, so students cannot edit their own scores.</p></div></div></section></div>';
  $$('[data-rm]',el).forEach(function(b){b.addEventListener('click',function(){EV.rankMode=b.dataset.rm;EV.render();});});
};

/* =================== KNOVO WORKSPACE =================== */
var MODES=[['chat','Chat'],['mark','Mark my answer'],['scan','Scan a question'],['lesson','Live lesson']];
var STARTERS={chat:['Explain this topic simply, then test me','What do examiners look for in a 6-mark explain question?','Make me a 20-minute revision plan for tonight'],
  mark:['Question (6 marks): Explain how the structure of a leaf is adapted for photosynthesis.\nMy answer: Leaves are thin and have chlorophyll which absorbs light. They have stomata for gas exchange.'],
  scan:['Attach a photo of a question with the 📷 button, then press Send.'],
  lesson:['Teach me moments and the principle of moments','Teach me electrolysis of copper(II) sulfate','Teach me supply and demand diagrams']};
V.knovo=function(el){
  if(!ST.profile){lockPage(el,'Knovo is members-only','Sign in to chat with Knovo, mark your answers, scan questions and start Live Lessons. Your free allowance is waiting.',
    '<div class="stack" style="max-width:640px;margin:0 auto"><div class="m u" style="align-self:flex-end">Can you mark my 6-mark answer on photosynthesis?</div><div class="m a"><div class="who">Knovo</div>You scored 4/6. You named chlorophyll and light energy, but you missed the word equation and a limiting factor…</div><div class="m u" style="align-self:flex-end">Make me 5 flashcards from that</div><div class="m a"><div class="who">Knovo</div>1. What is the word equation for photosynthesis?…</div></div>');EV.wsConv=null;return;}
  var cur=ST.chats.find(function(c){return c.id===ST.chatCur});
  if(!cur){cur={id:'c'+Date.now(),title:'New chat',mode:'chat',ref:(EV.prevRef||''),turns:[],t:Date.now()};}
  var subOpts='<option value="">Any subject</option>'+EV.SUBJ.filter(function(o){return !o.soon}).map(function(o){return '<option value="'+o.ref+'"'+(o.ref===cur.ref?' selected':'')+'>'+esc(o.s.name+' '+o.s.code)+'</option>';}).join('');
  var h='<div class="in"><div class="kw"><aside class="kside" aria-label="Saved chats"><button class="btn teal" type="button" id="kNew" style="margin-bottom:6px">+ New chat</button><h4>Saved on this device</h4><div id="kList"></div></aside>'+
    '<div class="kmain"><div class="khead"><img src="assets/knovo-logo.png" alt=""><div><b>Knovo</b><span class="s">EduVerse study tutor</span></div><div class="modes" id="kModes">'+MODES.map(function(m){return '<button type="button" data-mode="'+m[0]+'" class="'+(cur.mode===m[0]?'on':'')+'">'+m[1]+'</button>';}).join('')+'</div></div>'+
    '<div class="log" id="klog" aria-live="polite"></div>'+
    '<div class="compose"><div class="pv" id="kPv" hidden></div><form id="kform" autocomplete="off"><button class="att" type="button" id="kAtt" title="Attach a photo" aria-label="Attach a photo">📷</button><input type="file" id="kFile" accept="image/*" hidden><label for="kq" class="sr">Message Knovo</label><textarea id="kq" rows="1" placeholder="Ask anything about your syllabus…"></textarea><button class="stop" type="button" id="kStop" hidden>Stop</button><button class="send" type="submit" id="kSend">Send</button></form></div></div>'+
    '<aside class="kctx" aria-label="Context"><h4>Knovo knows</h4><label class="field" for="kSub">Subject for this chat<select id="kSub">'+subOpts+'</select></label><div class="kv" id="kKnow"></div>'+
    '<h4>Free allowance</h4><div class="kv" id="kAllow"></div><div class="mini"><small>Knovo Pro</small>More messages, photo scans and Live Lessons. <button class="btn sm teal" type="button" data-plans style="justify-self:start">See plans</button></div>'+
    '<h4>Your Knovo deck</h4><div id="kDeck"></div><div class="aiNote" id="kAi"></div></aside></div></div>';
  el.innerHTML=h;
  var log=$('#klog'),conv={turns:cur.turns.slice(),log:log,mode:cur.mode,ctx:null};
  EV.wsConv=conv;
  function ctxFor(){var o=cur.ref?EV.BYREF[cur.ref]:null;return {label:o?o.s.name+' '+o.s.code:'Knovo workspace',ref:cur.ref||null,topic:null,extra:''};}
  conv.ctx=ctxFor();
  function persist(){if(!conv.turns.length)return;cur.turns=conv.turns.slice(-40);cur.t=Date.now();if(cur.title==='New chat'){var f=conv.turns[0].content;cur.title=f.slice(0,48)+(f.length>48?'…':'');}
    if(ST.chats.indexOf(cur)<0)ST.chats.unshift(cur);ST.chatCur=cur.id;if(ST.chats.length>30)ST.chats=ST.chats.slice(0,30);EV.save();paintList();}
  conv.onDone=function(){persist();paintAllow();};
  conv.onBusy=function(b){$('#kStop').hidden=!b;$('#kSend').disabled=b;};
  function paintLog(){log.innerHTML='';
    if(!conv.turns.length){EV.kBubble(log,'a','<p><b>Hi'+(ST.profile?' '+esc(ST.profile.name):'')+'!</b> '+({chat:'Ask me anything about your syllabus.',mark:'Paste the question (with marks) and your answer. I\'ll mark it point by point.',scan:'Attach a photo of a question with 📷 and I\'ll solve it step by step.',lesson:'Name a topic and I\'ll teach it in three short parts, checking you understood each one.'}[conv.mode])+'</p>');
      var s=document.createElement('div');s.className='chips';s.style.alignSelf='flex-start';s.innerHTML=STARTERS[conv.mode].map(function(x){return '<button type="button" data-start-q="'+esc(x)+'">'+esc(x.split('\n')[0].slice(0,70))+'</button>';}).join('');log.appendChild(s);}
    else conv.turns.forEach(function(t){if(t.role==='user')EV.kBubble(log,'u','',t.content);else EV.kBubble(log,'a',EV.md(t.content));});}
  function paintList(){$('#kList').innerHTML=ST.chats.length?ST.chats.map(function(c){return '<div class="s'+(c.id===cur.id?' on':'')+'"><button class="o" type="button" data-open="'+c.id+'" title="'+esc(c.title)+'">'+esc(c.title)+'</button><button class="x" type="button" data-del="'+c.id+'" aria-label="Delete chat">×</button></div>';}).join(''):'<p class="small muted" style="padding:6px">Your chats will be saved here.</p>';}
  function paintKnow(){var o=cur.ref?EV.BYREF[cur.ref]:null,acc=o?EV.accuracy(o.ref):null;$('#kKnow').innerHTML=o?'<div><span>Subject</span><b>'+esc(o.s.name)+'</b></div><div><span>Code</span><b class="code">'+esc(o.s.code)+'</b></div><div><span>Notes it reads</span><b>'+EV.notesOf(o).length+' sections</b></div><div><span>Your accuracy</span><b>'+(acc?acc.pct+'%':'—')+'</b></div>':'<p class="small muted">Choose a subject so Knovo reads its notes and paper pattern.</p>';}
  function paintAllow(){var a=EV.allowance();$('#kAllow').innerHTML='<div><span>Messages (3 h)</span><b>'+a.m+' / '+a.mMax+'</b></div><div class="bar t"><i style="width:'+Math.round(100*a.m/a.mMax)+'%"></i></div><div><span>Photo scans (3 h)</span><b>'+a.s+' / '+a.sMax+'</b></div><button class="btn sm ghost" type="button" data-reset-allow2 style="justify-self:start">Reset allowance (test build)</button>';}
  function paintDeck(){var d=ST.kdeck;$('#kDeck').innerHTML=d.length?'<div class="mini"><small>'+d.length+' cards</small><b>'+esc(d[d.length-1].q)+'</b><span class="muted">'+esc(d[d.length-1].a)+'</span></div><button class="btn sm" type="button" id="kPlay" style="justify-self:start">Practise deck</button>':'<p class="small muted">Press "Make flashcards" under any answer to save cards here.</p>';var p=$('#kPlay');if(p)p.addEventListener('click',function(){playDeck();});}
  function paintAi(){$('#kAi').innerHTML=EV.K.sample?'Knovo is answering with Claude in this test build. On your live site it uses your own Knovo service.':(EV.K.checked?'Live AI is off in this view, so Knovo answers from the EduVerse notes. Open this page inside Claude for full AI replies.':'Connecting to Knovo…');}
  function playDeck(){var host=document.createElement('div');log.innerHTML='';log.appendChild(host);EV.deck(host,ST.kdeck.map(function(c,i){return {q:c.q,a:c.a,key:'kn:'+c.t+'#'+i}}),'Knovo deck');var back=document.createElement('button');back.className='btn sm';back.type='button';back.textContent='← Back to chat';back.style.alignSelf='center';back.addEventListener('click',paintLog);log.appendChild(back);}
  EV.onDeckChange=paintDeck;EV.onKnovoReady=paintAi;
  paintLog();paintList();paintKnow();paintAllow();paintDeck();paintAi();
  var img=null;
  $('#kAtt').addEventListener('click',function(){$('#kFile').click();});
  $('#kFile').addEventListener('change',function(){var f=this.files&&this.files[0];if(!f)return;img=f;var pv=$('#kPv');pv.hidden=false;pv.innerHTML='<img alt="Attached photo" src="'+URL.createObjectURL(f)+'"><span class="grow">'+esc(f.name)+'</span><button class="btn sm ghost" type="button" id="kRm">Remove</button>';$('#kRm').addEventListener('click',function(){img=null;pv.hidden=true;pv.innerHTML='';$('#kFile').value='';});
    if(conv.mode!=='scan'){conv.mode='scan';cur.mode='scan';$$('#kModes button').forEach(function(b){b.classList.toggle('on',b.dataset.mode==='scan')});}
    if(!EV.K.images&&EV.K.sample)EV.kBubble(log,'sys','Photo scanning needs image access, which this view does not have. Type the question instead.');});
  var ta=$('#kq');
  ta.addEventListener('input',function(){EV.autoGrow(ta)});
  ta.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#kform').requestSubmit();}});
  $('#kform').addEventListener('submit',function(e){e.preventDefault();if(!conv.turns.length)log.innerHTML='';var send=img&&EV.K.images?img:null;EV.kSend(conv,ta.value,send);ta.value='';EV.autoGrow(ta);img=null;var pv=$('#kPv');pv.hidden=true;pv.innerHTML='';$('#kFile').value='';});
  $('#kStop').addEventListener('click',function(){if(conv.ctl)conv.ctl.abort();});
  $('#kModes').addEventListener('click',function(e){var b=e.target.closest('[data-mode]');if(!b)return;conv.mode=cur.mode=b.dataset.mode;$$('#kModes button').forEach(function(x){x.classList.toggle('on',x===b)});if(!conv.turns.length)paintLog();ta.placeholder={chat:'Ask anything about your syllabus…',mark:'Paste the question, marks and your answer…',scan:'Add a note about the photo (optional)…',lesson:'Name a topic to learn…'}[conv.mode];});
  $('#kSub').addEventListener('change',function(){cur.ref=this.value;EV.prevRef=this.value;conv.ctx=ctxFor();paintKnow();EV.toast(this.value?'Knovo is now reading '+EV.BYREF[this.value].s.name+' notes':'No subject selected');});
  $('#kNew').addEventListener('click',function(){ST.chatCur='';EV.save();EV.render();});
  $('.kside').addEventListener('click',function(e){var o=e.target.closest('[data-open]'),d=e.target.closest('[data-del]');
    if(o){ST.chatCur=o.dataset.open;EV.save();EV.render();}
    if(d){ST.chats=ST.chats.filter(function(c){return c.id!==d.dataset.del});if(ST.chatCur===d.dataset.del)ST.chatCur='';EV.save();EV.render();}});
  log.addEventListener('click',function(e){var s=e.target.closest('[data-start-q]');if(!s)return;if(conv.mode==='scan'){$('#kAtt').click();return;}log.innerHTML='';EV.kSend(conv,s.dataset.startQ);});
  el.addEventListener('click',function(e){if(e.target.closest('[data-reset-allow2]')){EV.resetAllowance();paintAllow();EV.toast('Allowance reset');}});
  EV.cleanup=function(){EV.wsConv=null;EV.onDeckChange=null;EV.onKnovoReady=null;if(conv.ctl&&conv.busy)conv.ctl.abort();};
};

/* =================== ABOUT =================== */
V.about=function(el){
  var P=[['Clarity before complexity','Focused explanations and structured notes help students find the point before they dive deeper. A difficult topic should become easier to navigate, not more intimidating.'],['Practice with a purpose','Questions, flashcards and mock exams should reveal what needs work, not simply fill a study session. Every attempt is another piece of useful feedback.'],['Honesty over hype','Original practice material is labelled clearly. Knovo\'s limitations are stated openly, and official syllabus documents and teacher guidance remain important final references.']];
  var L=[['Choose','Start with the right course.','Choose O Level, IGCSE, International AS & A Level or Pearson Edexcel IAL, then open your subject with its paper codes and structures.','#qualifications'],['Understand','Learn it. Recall it. Explain it.','Use focused notes, study books and flashcards. Move beyond rereading by checking whether you can retrieve the idea without looking.','#qualifications'],['Practise','Make the next step a little harder.','Use question practice and original timed mocks to test recall, method and exam rhythm.','#mock'],['Review','Let your mistakes choose the next topic.','Return to missed ideas, check your progress and use XP as encouragement rather than pressure.','#dashboard']];
  el.innerHTML='<div class="in page"><div class="pageHead"><span class="eyebrow"><b>EduVerse</b> · about us · independent · student-first</span><h1>Study with direction.<br>Revise with purpose.</h1><p class="sub">Revision should feel like a way forward, not a wall. EduVerse brings clear explanations, deliberate practice and honest guidance into one study space, so you always know what to do next.</p></div>'+
  '<section class="sect" style="padding-top:20px"><span class="eyebrow">Our purpose</span><h2>One connected place to learn, practise and improve.</h2><p class="sub">Students often move between separate notes, question banks, flashcards, mock papers and chat tools. EduVerse brings those steps together. The goal is not to make students stare at more material; it is to help them understand a topic, test what stayed, discover what needs attention and return with a clearer plan.</p><div class="grid g3" style="margin-top:20px">'+P.map(function(p){return '<div class="card stack"><h3>'+p[0]+'</h3><p class="small muted">'+p[1]+'</p></div>';}).join('')+'</div></section>'+
  '<section class="sect"><span class="eyebrow">The EduVerse study loop</span><h2>From "where do I start?" to "I know my next step."</h2><div class="steps4" style="margin-top:20px">'+L.map(function(l,i){return '<a class="step" href="'+l[3]+'"><small>'+String(i+1).padStart(2,'0')+' · '+l[0]+'</small><b>'+l[1]+'</b><span>'+l[2]+'</span></a>';}).join('')+'</div></section>'+
  '<section class="sect"><div class="kshow" style="grid-template-columns:auto minmax(0,1fr)"><img src="assets/knovo-logo.png" alt="Knovo logo" style="width:120px;height:120px"><div class="stack"><span class="eyebrow"><b class="k">Knovo</b> · EduVerse\'s study tutor</span><h2 class="h2" style="margin:0">A place to ask the follow-up question.</h2><p class="muted">Knovo helps students work through explanations, follow-ups, practice and revision planning without leaving EduVerse. What we will not pretend: Knovo does not have complete knowledge and can make mistakes. It is a study aid, not a replacement for your teacher, official syllabus or exam-board guidance.</p><a class="btn teal" href="#knovo" style="justify-self:start">Open Knovo →</a></div></div></section>'+
  '<section class="sect"><span class="eyebrow">What students can expect</span><h2>Clear labels. Original practice. No exaggerated promises.</h2><div class="grid g3" style="margin-top:20px"><div class="card stack"><h3>Free core, clearly separated access</h3><p class="small muted">Core revision remains available. Paper folders show planned one-time USD prices in Papers, while Knovo plans stay inside Knovo. Sales have not opened.</p></div><div class="card stack"><h3>Original practice material</h3><p class="small muted">EduVerse mock papers and question banks are original practice resources, not official Cambridge or Pearson papers.</p></div><div class="card stack"><h3>Independent by design</h3><p class="small muted">EduVerse is not affiliated with or endorsed by Cambridge International Education or Pearson.</p></div></div></section>'+
  '<section class="sect"><span class="eyebrow">Contact us</span><h2>Get in touch</h2><div class="grid g2" style="margin-top:20px"><div class="card stack"><h3>Email</h3><p class="code" style="font-size:.95rem;user-select:all">educationalverse2027@gmail.com</p><p class="small muted">Support, partnership ideas, resource reports and subject requests.</p></div><div class="card stack"><h3>Instagram</h3><p class="code" style="font-size:.95rem;user-select:all">@eduverse.27</p><p class="small muted">Study tips, new resources and behind-the-scenes updates.</p></div></div></section></div>';
};

/* =================== SIGN IN =================== */
V.signin=function(el){
  if(ST.profile){el.innerHTML='<div class="in page"><div class="card stack" style="max-width:520px;margin:30px auto;text-align:center;justify-items:center"><div class="avatar" style="width:64px;height:64px;font-size:1.6rem">'+esc(ST.profile.name.charAt(0).toUpperCase())+'</div><h2 class="h2" style="margin:0">Signed in as '+esc(ST.profile.name)+'</h2><p class="small muted">Test-build profile saved on this device. Your real site signs students in with your Supabase project.</p><div class="row" style="justify-content:center"><a class="btn gold" href="#dashboard">My dashboard</a><button class="btn" type="button" id="out">Sign out</button></div></div></div>';$('#out').addEventListener('click',function(){ST.profile=null;EV.save();EV.paintProfile();EV.toast('Signed out');EV.render();});return;}
  el.innerHTML='<div class="in page"><div class="grid g2" style="align-items:center;gap:40px;margin-top:20px"><div class="stack"><span class="eyebrow"><b>EduVerse</b> · student account</span><h1 style="font-size:clamp(2.2rem,5vw,3.6rem);font-weight:800;line-height:1;letter-spacing:-.035em">Sign in to save your progress everywhere.</h1><p class="muted">Members unlock Knovo, timed mocks and genuine rankings. Core notes, study books, flashcards and practice stay open without an account.</p></div>'+
  '<div class="card stack" style="gap:14px"><h3>Sign in</h3><form id="realForm" class="stack" style="gap:12px"><label class="field" for="em">Email<input id="em" type="email" placeholder="you@example.com" autocomplete="email"></label><label class="field" for="pw">Password<input id="pw" type="password" placeholder="••••••••" autocomplete="current-password"></label><button class="btn gold" type="submit">Sign in</button><p class="small muted" id="realNote">On the live site this connects to your Supabase project. This test build cannot reach it.</p></form>'+
  '<div style="border-top:1px solid var(--rim);padding-top:14px" class="stack"><b>Test as a student</b><form id="guestForm" class="row"><label for="gn" class="sr">Display name</label><input class="inp grow" id="gn" placeholder="Display name, e.g. Ayesha" maxlength="30" required><button class="btn teal" type="submit">Continue</button></form><p class="small muted">Creates a local test profile so you can try members-only pages.</p></div></div></div></div>';
  $('#realForm').addEventListener('submit',function(e){e.preventDefault();$('#realNote').textContent='Real sign-in is not connected in this test build. Use "Test as a student" below.';$('#realNote').style.color='var(--warn)';});
  $('#guestForm').addEventListener('submit',function(e){e.preventDefault();var n=$('#gn').value.trim();if(!n)return;ST.profile={name:n};EV.save();EV.paintProfile();EV.toast('Welcome, '+n+'!');EV.go('dashboard');});
};

/* =================== WHAT TO ADD =================== */
var IDEAS=[
  ['quick','Exam countdown everywhere','Students set their first paper date once and see days left on the home page and each subject.','#home'],
  ['quick','Flip-card daily quiz','Questions flip like flashcards, with "got it" and "missed it" feeding the Mistakes notebook.','#home'],
  ['quick','Focus timer','A 25/5 study timer on the home page. Could award XP for completed sessions.','#home'],
  ['quick','Knovo preview when signed out','A blurred sample chat instead of a padlock, so visitors see what Knovo does before signing up.','#knovo'],
  ['mid','Syllabus star map','Each subject\'s notes sections as a constellation that lights up as students learn them.','#overview-olevelphys5054'],
  ['mid','Grade target calculator','Uses each paper\'s real weighting to show the average needed on the remaining papers.','#tools-olevelphys5054'],
  ['mid','Spaced-repetition flashcards','Cards come back just before students would forget them, using the level each card is on.',''],
  ['mid','Examiner-report tips per topic','Short "where students lost marks" notes on each topic, written in your own words from public examiner reports.',''],
  ['big','Study rooms and duels','Two friends answer the same 10 questions live, and the winner gets XP. Builds on your leaderboard.',''],
  ['big','Automatic revision planner','Students enter exam dates and weak topics, and EduVerse builds a week-by-week plan that adjusts to their progress.',''],
  ['big','Parent and teacher view','A read-only weekly progress link. Schools could use it with a whole class.',''],
  ['big','Topic engines for every subject','Extend the full Maths 4024 engine (objectives, examples, mark schemes) to the sciences next.','#topics-olevelmath4024'],
  ['knovo','Companion side panel','Knovo opens beside any page and already knows the subject. Try the "Ask Knovo" button.','#notes-olevelchem5070'],
  ['knovo','Answer marking','Paste an answer and get point-by-point marks. Try "Mark my answer" in Knovo.','#knovo'],
  ['knovo','Ctrl K / ⌘K shortcut','Open Knovo from anywhere with the keyboard. Press Ctrl K now.',''],
  ['knovo','Voice mode in Urdu and English','Students ask out loud and Knovo explains in the language they think in.','']
];
var ITAG={quick:['Quick win','ok'],mid:['Medium','gold'],big:['Big bet',''],knovo:['Knovo','teal']};
V.ideas=function(el){
  var f=EV.ideaF||'all';
  el.innerHTML='<div class="in page"><div class="pageHead"><span class="eyebrow">Roadmap ideas</span><h1>What you can add to EduVerse</h1><p class="sub">Features ranked by effort. The ones marked "In this test build" already work here, so you can try them.</p></div><div class="row" id="iF">'+[['all','All'],['quick','Quick wins'],['mid','Medium'],['big','Big bets'],['knovo','Knovo']].map(function(x){return '<button class="btn sm'+(f===x[0]?' gold':'')+'" type="button" data-if="'+x[0]+'">'+x[1]+'</button>';}).join('')+'</div><div class="ideas">'+
  IDEAS.filter(function(d){return f==='all'||d[0]===f}).map(function(d){var t=ITAG[d[0]];return '<article class="idea"><div class="row"><span class="pill '+t[1]+'">'+t[0]+'</span>'+(d[3]?'<span class="pill">In this test build</span>':'')+'</div><h3>'+esc(d[1])+'</h3><p>'+esc(d[2])+'</p>'+(d[3]?'<a href="'+d[3]+'">Try it →</a>':'')+'</article>';}).join('')+'</div></div>';
  $('#iF').addEventListener('click',function(e){var b=e.target.closest('[data-if]');if(!b)return;EV.ideaF=b.dataset.if;EV.render();});
};

/* Gate the side sheet like the live site: Knovo is for signed-in students */
var openSheet=EV.openSheet;
EV.openSheet=EV.askKnovo=function(q,extra){
  if(!ST.profile){openSheet();var log=$('#slog');log.innerHTML='';EV.kBubble(log,'sys','<b>Knovo is members-only.</b> Sign in with a free account to chat, mark answers and scan questions.<div class="row" style="justify-content:center;margin-top:8px"><a class="btn sm gold" href="#signin" data-close-sheet>Sign in</a></div>');EV.SHEET.ctx=null;return;}
  if(EV.route&&EV.route.name==='mock'&&EV.mockRunning){EV.toast('Knovo is switched off during a mock');return;}
  openSheet(q,extra);
};
EV.boot();
})();
