/* EduVerse new design — views part 2: dashboard, technique, mistakes, mock, papers, ranks, knovo, about, sign in, ideas */
(function(){
"use strict";
var EV=window.EV,$=EV.$,$$=EV.$$,esc=EV.esc,ST=EV.ST,V=EV.views;

/* Members-only pages show what they do before asking for sign-in */
function lockPage(el,title,text,preview){
  EV.afterSignin=(location.hash||'#home').slice(1); /* come back here after signing in */
  el.innerHTML='<div class="in page"><div style="position:relative;border-radius:24px;overflow:hidden;border:1px solid var(--rim);margin-top:10px"><div style="filter:blur(4px);opacity:.5;pointer-events:none;padding:24px" aria-hidden="true">'+preview+'</div><div style="position:absolute;inset:0;display:grid;place-items:center;align-content:center;gap:12px;text-align:center;padding:24px;background:linear-gradient(180deg,rgba(3,4,5,.2),rgba(3,4,5,.88))"><span class="eyebrow">Members only · free account</span><h2 class="h2" style="margin:0">'+esc(title)+'</h2><p class="muted" style="max-width:52ch">'+esc(text)+'</p><div class="row" style="justify-content:center"><a class="btn gold" href="#signin">Sign in to unlock</a><a class="btn" href="#signin">Create free account</a></div></div></div></div>';
}

/* =================== DASHBOARD =================== */
V.dashboard=function(el){
  var lp=EV.levelProgress(EV.shownXP()),b=EV.badges(),earned=b.filter(function(x){return x.ok}).length;
  var tq=ST.today.d===EV.today()?ST.today.q:0,open=ST.mistakes.filter(function(m){return !m.resolved}).length;
  var STARTERS=['olevel/phys5054','olevel/chem5070','olevel/math4024','olevel/bio5090','alevel/m9709','olevel/eng1123'].map(function(r){return EV.BYREF[r]}).filter(Boolean);
  var h='<div class="in page"><div class="pageHead"><span class="eyebrow">My study dashboard'+(ST.profile?' · '+esc(ST.profile.name):'')+'</span><h1>Your progress</h1><p class="sub">Streaks, XP, mistakes and a quick way back into every subject. Everything here comes from what you actually do.</p></div>';
  h+='<div class="dashTop">'+
    '<div class="cell"><span class="eyebrow">Daily streak</span><div class="big">🔥 '+ST.streak.count+'<small> day'+(ST.streak.count===1?'':'s')+'</small></div></div>'+
    '<div class="cell"><span class="eyebrow">Today</span><div class="big">'+tq+'<small> / '+ST.goal+'</small></div><label class="field" for="goal">Daily goal<select id="goal">'+[5,10,15,20,30].map(function(g){return '<option value="'+g+'"'+(g===ST.goal?' selected':'')+'>'+g+' questions</option>';}).join('')+'</select></label></div>'+
    '<div class="cell"><span class="eyebrow">Questions attempted</span><div class="big">'+ST.attempts.length+'</div><span class="small muted">across all subjects</span></div>'+
    '<a class="cell" href="#mistakes" style="text-decoration:none"><span class="eyebrow">Mistakes to review</span><div class="big" style="color:'+(open?'var(--bad)':'inherit')+'">'+open+'</div><span class="small muted">in your notebook →</span></a></div>';
  h+='<section class="sect" style="padding-top:28px"><div class="card stack"><div class="hd"><h3 style="font-size:1.3rem">⭐ Level '+lp.l+' · '+EV.shownXP()+' XP</h3><span class="pill gold">'+earned+' / '+b.length+' badges</span></div><div class="bar"><i style="width:'+lp.pct+'%"></i></div><p class="small muted">'+lp.pct+'% of the way to Level '+(lp.l+1)+' · XP comes from correct answers (+15 each, once per question), mastering a Maths topic (+50) and serious timed mocks (+100)</p>'+
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
    '<div class="watch"><div class="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="#191f27" stroke-width="8"/><circle cx="50" cy="50" r="42" fill="none" stroke="#f0b429" stroke-width="8" stroke-linecap="round" stroke-dasharray="263.9" stroke-dashoffset="198"/></svg><b>0:00</b></div><div class="stack" style="gap:6px"><span class="small">Sit a paper with a real countdown, then mark it against the solutions.</span><div class="row" style="gap:6px"><span class="pill gold">Up to +100 XP</span><span class="pill">⏱ Exam Ready badge</span></div></div></div>')+'<a class="btn sm gold" href="#mock">Sit a timed mock →</a></div>';
  h+='<section class="sect" style="padding-top:28px"><div class="twoCol">'+read+'<div class="stack">'+recH+mockH+'</div></div></section>';
  h+='<section class="sect" style="padding-top:28px"><div class="dataCard"><div class="ico">💾</div><div class="stack"><div><h3 style="font-size:1.15rem">Your study progress</h3><p class="small muted" style="margin-top:4px">Your streak, topics, mistakes and XP are shared with the EduVerse site on this device'+(ST.profile?', and your XP syncs to your account for genuine rankings.':'. Sign in to sync your XP to your account.')+'</p></div>'+
    '<div class="dataChips"><span><b>'+EV.shownXP()+'</b>XP</span><span><b>'+ST.attempts.length+'</b>attempts</span><span><b>'+ST.mistakes.length+'</b>mistakes</span><span><b>'+ST.topicsDone.length+'</b>topics learned</span><span><b>'+ST.chats.length+'</b>Knovo chats</span><span><b>'+ST.mocks.length+'</b>mocks</span></div>'+
    '<div class="row" id="resetRow"><button class="btn sm" type="button" id="resetA">Clear saved Knovo chats</button></div></div></div></section></div>';
  el.innerHTML=h;
  $('#goal').addEventListener('change',function(){ST.goal=+this.value;EV.save();EV.toast('Daily goal set to '+ST.goal);EV.render();});
  $('#resetA').addEventListener('click',function(){$('#resetRow').innerHTML='<span class="small">This deletes your saved Knovo chats on this device. Your study progress and XP are kept.</span><button class="btn sm bad" type="button" id="resetY">Yes, clear chats</button><button class="btn sm" type="button" id="resetN">Cancel</button>';$('#resetY').addEventListener('click',function(){ST.chats=[];ST.chatCur='';EV.save();EV.toast('Knovo chats cleared');EV.render();});$('#resetN').addEventListener('click',function(){EV.render()});});
};

/* =================== TECHNIQUE (general) =================== */
V.technique=function(el){
  var withFmt=EV.SUBJ.filter(function(o){return !o.soon&&o.s.fmt});
  function card(n,t,d){return '<div class="card stack" style="gap:8px"><span class="eyebrow">'+n+'</span><h3 style="margin:0">'+t+'</h3><p class="small muted" style="margin:0">'+d+'</p></div>';}
  function list(items){return '<ul class="small muted" style="margin:0;padding-left:18px;display:grid;gap:7px">'+items.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>';}
  el.innerHTML='<div class="in page"><div class="pageHead"><span class="eyebrow">Exam technique</span><h1>How marks are earned</h1><p class="sub">Knowing the content is half of the exam. The other half is giving the examiner exactly what the question asks for, in the time available. This guide applies to every subject.</p></div>'+
  '<div class="row" style="gap:8px;margin-bottom:22px"><a class="btn sm" href="#tq-principles">Principles</a><a class="btn sm" href="#tq-commands">Command words</a><a class="btn sm" href="#tq-ladder">Answer quality</a><a class="btn sm" href="#tq-time">Timing</a><a class="btn sm" href="#tq-check">Checklist</a><a class="btn sm" href="#tq-subjects">By subject</a></div>'+
  '<section id="tq-principles"><h2 class="h2" style="font-size:1.5rem;margin:0">Three principles</h2><div class="grid g3" style="margin-top:14px">'+
    card('01','Answer the command word','"State", "explain" and "evaluate" ask for three different answers. Identify the command word before you write anything.')+
    card('02','Match the marks','The mark allocation shows how much is expected. As a guide, plan one distinct, creditworthy point for each mark.')+
    card('03','Make it easy to credit','Show your working, give units, use the subject\'s own terms and refer to the data or case study in the question.')+
  '</div></section>'+
  '<section class="sect" id="tq-commands" style="padding-top:36px"><h2 class="h2" style="font-size:1.5rem;margin:0">Command words</h2><p class="sub">Each command word sets what a complete answer must contain.</p>'+EV.commandsTable()+'</section>'+
  '<section class="sect" id="tq-ladder" style="padding-top:36px"><h2 class="h2" style="font-size:1.5rem;margin:0">From a weak answer to a top-band answer</h2><p class="sub">The same question, answered at four levels. Use it for any extended "explain", "discuss" or "evaluate" question.</p><div style="margin-top:14px">'+EV.ladderHTML()+'</div></section>'+
  '<section class="sect" id="tq-time" style="padding-top:36px"><h2 class="h2" style="font-size:1.5rem;margin:0">Timing</h2><div class="grid g2" style="margin-top:14px"><div class="card stack"><h3 style="margin:0">Work out your pace</h3>'+list(['Divide the minutes on the paper by its total marks. That is your time per mark.','Multiply by the marks for each question to set a limit for it.','Keep the last five to ten minutes for checking.'])+'</div><div class="card stack"><h3 style="margin:0">When you are stuck</h3>'+list(['Write what you do know: method and working can earn marks without a final answer.','Mark the question, move on, and return at the end.','Never leave a multiple-choice question blank.'])+'</div></div></section>'+
  '<section class="sect" id="tq-check" style="padding-top:36px"><h2 class="h2" style="font-size:1.5rem;margin:0">Checklist</h2><div class="grid g3" style="margin-top:14px"><div class="card stack"><h3 style="margin:0">Before you write</h3>'+list(['Read the whole question, including any data.','Underline the command word and the marks.','Note the units and the form of answer required.'])+'</div><div class="card stack"><h3 style="margin:0">While you write</h3>'+list(['One point per sentence, in the subject\'s terms.','Show every step of a calculation.','Refer to the context you were given.'])+'</div><div class="card stack"><h3 style="margin:0">Before you hand in</h3>'+list(['Every question attempted.','Units, significant figures and labels checked.','For "evaluate": a justified conclusion is written.'])+'</div></div></section>'+
  '<section class="sect" id="tq-subjects" style="padding-top:36px"><h2 class="h2" style="font-size:1.5rem;margin:0">Technique by subject</h2><p class="sub">Paper format and specific advice for each subject.</p><div class="subjGrid">'+withFmt.map(function(o){return '<a class="subj" href="#technique-'+o.slug+'"><span class="ic">'+o.s.icon+'</span><b>'+esc(o.s.name)+' <span class="code muted">'+esc(o.s.code)+'</span></b><p>'+esc(EV.strip(o.s.fmt)).slice(0,140)+'…</p></a>';}).join('')+'</div></section></div>';
  $$('a[href^="#tq-"]',el).forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var t=document.getElementById(a.getAttribute('href').slice(1));if(t)t.scrollIntoView({behavior:'smooth',block:'start'});});});
};


/* =================== MISTAKES =================== */
V.mistakes=function(el){
  var act=ST.mistakes.filter(function(m){return !m.resolved}),res=ST.mistakes.filter(function(m){return m.resolved});
  var rate=ST.mistakes.length?Math.round(100*res.length/ST.mistakes.length):0;
  var cnt={};act.forEach(function(m){if(m.ref&&EV.BYREF[m.ref])cnt[m.ref]=(cnt[m.ref]||0)+1;});var pri=Object.keys(cnt).sort(function(a,b){return cnt[b]-cnt[a]})[0];
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
/* Mock papers are FREE for every member: challenge mocks, full yearly practice papers, mixed-topic tests and
   full-syllabus assessments. Only the topical material (Papers section, topical banks, topic tests) is Pro. */
var MOCK_CATS=[['mocks','📝 Challenge mock papers + marking guides'],['yearly','🗓 Full-length practice papers + marking schemes'],['mixed','🔀 Mixed-topic tests + marking schemes'],['assess','🎓 Full-syllabus assessment + marking guide']];
function mockPdfN(o){var n=0;if(o.res)MOCK_CATS.forEach(function(c){n+=(o.res[c[0]]||[]).length;});return n;}
function mockSubs(){return EV.SUBJ.filter(function(o){return !o.soon&&(EV.allQuestions(o).length||mockPdfN(o))});}
V.mock=function(el){
  if(!ST.profile){lockPage(el,'Timed mock exams','Full timed mock exams with a real countdown and mark schemes are member material. Sign in to sit a paper under exam conditions.','<div class="grid g3">'+mockSubs().slice(0,6).map(function(o){return '<div class="card"><b>'+o.s.icon+' '+esc(o.s.name)+'</b><p class="small muted">'+o.s.papers.length+' papers</p></div>';}).join('')+'</div>');return;}
  clearInterval(mockTimer);
  var st=MOCK?MOCK.stage:'subject';
  if(st==='paper')return mockPapers(el);
  if(st==='run')return mockRun(el);
  if(st==='mark')return mockMark(el);
  if(st==='result')return mockResult(el);
  var h='<div class="in page"><div class="pageHead"><span class="eyebrow">Timed mock exam</span><h1>Sit a paper under exam conditions</h1><p class="sub">Pick a subject, then a paper. A real countdown runs while you work; at zero the paper submits itself. Then mark each answer against the worked solution. <b>Mock papers are free</b> with your account.</p></div><div class="subjGrid">'+
    mockSubs().map(function(o){return '<button class="subj" type="button" data-pick="'+o.ref+'" style="text-align:left;border:1px solid var(--rim);font:inherit;color:inherit;cursor:pointer"><span class="ic">'+o.s.icon+'</span><b>'+esc(o.s.name)+' <span class="code muted">'+esc(o.s.code)+'</span></b><span>'+o.s.papers.length+' papers · '+EV.allQuestions(o).length+' questions in pool'+(mockPdfN(o)?' · '+mockPdfN(o)+' free mock PDF'+(mockPdfN(o)>1?'s':''):'')+'</span></button>';}).join('')+'</div>';
  if(ST.mocks.length)h+='<section class="sect" style="padding-top:36px"><h2 class="h2" style="font-size:1.4rem;margin:0">Past mocks ('+ST.mocks.length+')</h2><div class="stack" style="margin-top:14px">'+ST.mocks.slice().reverse().map(function(m){return '<div class="card row" style="padding:14px 18px"><span class="grow"><b>'+esc(m.subject)+'</b> · '+esc(m.paper)+' <span class="small muted">'+esc(m.date)+'</span></span><span class="pill">'+m.score+'/'+m.total+' · '+m.pct+'%</span><span class="pill ok">Grade '+esc(m.grade)+'</span></div>';}).join('')+'</div></section>';
  el.innerHTML=h+'</div>';
  $$('[data-pick]',el).forEach(function(b){b.addEventListener('click',function(){MOCK={stage:'paper',ref:b.dataset.pick};EV.render();window.scrollTo(0,0);});});
};
function mockPapers(el){
  var o=EV.BYREF[MOCK.ref];
  var h='<div class="in page"><button class="crumb" type="button" id="mBack" style="border:0;background:none;padding:0">← All subjects</button><div class="pageHead" style="margin-top:10px"><span class="eyebrow">'+esc(o.s.board)+'</span><h1>'+o.s.icon+' '+esc(o.s.name)+' · choose your paper</h1></div>';
  if(mockPdfN(o))h+='<div class="stack" style="gap:22px">'+MOCK_CATS.filter(function(c){return o.res[c[0]]&&o.res[c[0]].length}).map(function(c){return '<div class="libGroup"><h3>'+c[1]+' <span class="pill ok">Free</span></h3>'+o.res[c[0]].map(EV.pdfRow).join('')+'</div>';}).join('')+'</div>';
  if(EV.allQuestions(o).length)h+='<section class="sect" style="padding-top:28px"><h2 class="h2" style="font-size:1.4rem;margin:0">Interactive timed papers</h2><p class="sub">The timer follows the paper\'s stated duration. Questions are drawn from this subject\'s question pool.</p><label class="field" for="mLen" style="max-width:260px;margin-top:12px">Timer<select id="mLen"><option value="real">Real paper duration</option><option value="15">15-minute practice run</option><option value="1">1-minute test of auto-submit</option></select></label><div class="stack" style="margin-top:14px">'+
    o.s.papers.map(function(p,i){return '<div class="card row"><span class="grow"><b>'+esc(p.p)+'</b> — '+esc(p.n||'')+'<br><span class="small muted">'+[p.t,p.m,p.w].filter(Boolean).map(esc).join(' · ')+'</span></span><button class="btn gold" type="button" data-start="'+i+'">Start mock →</button></div>';}).join('')+'</div></section>';
  h+='</div>';
  el.innerHTML=h;
  $('#mBack').addEventListener('click',function(){MOCK=null;EV.render();});
  $$('[data-start]',el).forEach(function(b){b.addEventListener('click',function(){
    var p=o.s.papers[+b.dataset.start],len=$('#mLen').value,mins=len==='real'?parseDur(p.t):+len;
    var qs=EV.allQuestions(o).sort(function(){return Math.random()-.5}).slice(0,15);
    MOCK={stage:'run',ref:o.ref,paper:p,qs:qs,i:0,flags:{},ans:{},marks:{},startAt:Date.now(),mins:mins,endAt:Date.now()+mins*60000};
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
    var mts=Date.now();ST.mocks.push({ref:o.ref,subject:o.s.name+' '+o.s.code,paper:MOCK.paper.p,score:score,total:total,pct:pct,grade:EV.grade(pct),date:new Date().toLocaleDateString(),ts:mts});
    /* XP only for a serious attempt: half the time used, 40%+ scored, once per paper each week */
    var used=(Date.now()-(MOCK.startAt||Date.now()))/60000,wk=Math.floor((Date.now()/864e5+3)/7);
    MOCK.result.xp=(used>=(MOCK.mins||60)/2&&pct>=40)?EV.earn('mock','exam:'+o.ref+':'+MOCK.paper.p+':w'+wk,false):0;
    MOCK.result.xpWhy=MOCK.result.xp?'':(used<(MOCK.mins||60)/2?'Mock XP needs at least half the paper time.':pct<40?'Mock XP needs a score of 40% or more.':'Mock XP for this paper was already earned this week.');
    EV.save();MOCK.stage='result';EV.render();window.scrollTo(0,0);});
}
function mockResult(el){
  var o=EV.BYREF[MOCK.ref],R=MOCK.result;
  el.innerHTML='<div class="in page"><div class="card" style="display:grid;gap:16px;justify-items:center;text-align:center;padding:44px 24px;margin-top:20px;background:radial-gradient(500px 260px at 50% 0%,rgba(240,180,41,.15),transparent 70%),var(--deck)"><span class="eyebrow">'+esc(o.s.name+' '+o.s.code)+' · '+esc(MOCK.paper.p)+'</span><div class="gradeBig">'+esc(R.grade)+'</div><div class="big">'+R.score+'<small> / '+R.total+' · '+R.pct+'%</small></div><p class="muted" style="max-width:52ch">Indicative grade from typical boundaries. '+(R.xp?'+'+R.xp+' XP earned. ':esc(R.xpWhy||'')+' ')+'Questions where you scored under half went to your Mistakes notebook.</p><div class="row" style="justify-content:center"><a class="btn gold" href="#mistakes">Review mistakes</a><button class="btn" type="button" id="mAgain">Sit another mock</button><button class="btn teal" type="button" data-ask="I just scored '+R.pct+'% on a '+esc(o.s.name)+' mock. Give me 3 specific things to fix before my next attempt.">Ask Knovo what to fix</button></div></div></div>';
  $('#mAgain').addEventListener('click',function(){MOCK=null;EV.render();});
}

/* =================== PAPERS =================== */
/* Papers: same structure as the live site (search → O Level / A Level groups → subject paper page) */
function ppLevel(o){return o.lk.indexOf('alevel')===0?'A Level':'O Level';}
function topicalN(o){return o.res&&o.res.compiled?o.res.compiled.length:0;}
EV.ppQ='';
/* The Papers section (topical past papers) is a Pro area: only the owner and Pro accounts can open it.
   Nothing is on sale: Pro can only be given by the owner (Admin → Gift EduVerse Pro). */
function papersLocked(el){
  if(EVLive.isPro())return false;
  el.innerHTML='<div class="in page"><div class="pageHead"><span class="eyebrow">📄 Past papers · <b>EduVerse Pro</b></span><h1>Past papers</h1><p class="sub">Topical past papers for every subject, organised topic by topic.</p></div>'+
  '<div class="empty" style="margin-top:10px;padding:48px 24px"><div style="font-size:2.6rem" aria-hidden="true">🔒</div><b>Topical past papers are part of EduVerse Pro</b><span style="max-width:56ch">EduVerse Pro is not on sale yet and nothing can be bought on this site, so this section is locked for now. Mock papers, timed mocks, notes, study books, flashcards, question practice and Knovo all stay free with your account.</span><div class="row" style="justify-content:center"><a class="btn gold" href="#mock">Open the free mock papers</a><a class="btn" href="#qualifications">Keep studying</a></div></div></div>';
  return true;
}
V.papers=function(el){
  if(papersLocked(el))return;
  var subs=EV.SUBJ.filter(function(o){return !o.soon});
  el.innerHTML='<div class="in page"><div class="pageHead"><span class="eyebrow">📄 Past papers</span><h1>Past papers</h1><p class="sub">Find your subject and open its topical past papers, organised topic by topic. Full mock papers are free in the <a href="#mock">Mock area</a>.</p></div>'+
    '<form class="ppSearch" role="search" id="ppF"><label class="field" for="ppQ">Find a subject<input id="ppQ" type="search" autocomplete="off" placeholder="Search Mathematics, 0580, Cambridge, O Level…" value="'+esc(EV.ppQ)+'"></label><button class="btn gold" type="submit">Search</button><button class="btn" type="button" id="ppClear">Clear</button></form>'+
    '<div class="ppMeta" id="ppMeta" aria-live="polite"></div>'+
    '<div class="ppIntro"><b>⭐ EduVerse Pro area</b><span>Only you (the owner) and accounts you have given Pro can open this section. Nothing is on sale and the site takes no payments.</span></div><div id="ppRes"></div></div>';
  function match(o,q){return !q||(o.s.name+' '+o.s.code+' '+o.s.board+' '+ppLevel(o)+' '+(o.lk==='alevel_edx'?'pearson edexcel':'cambridge')).toLowerCase().indexOf(q)>=0;}
  function card(o){var n=topicalN(o);return '<a class="ppCard" href="#papers-'+o.slug+'"><div class="row" style="gap:6px"><span class="pill">'+esc(o.s.board)+'</span><span class="pill gold code">'+esc(o.s.code)+'</span></div><div class="t"><span>'+o.s.icon+'</span><b>'+esc(o.s.name)+'</b></div><div class="foot"><span>'+(n?n+' topical paper'+(n>1?'s':'')+' available':'Topical papers being prepared')+'</span><span>→</span></div></a>';}
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
  if(papersLocked(el))return;
  var o=r.o,s=o.s,res=o.res||{},pay='';
  var h='<div class="in page"><a class="crumb" href="#papers">← All subjects</a><div class="pageHead" style="margin-top:10px"><span class="eyebrow">📄 Past papers · '+esc(s.board)+'</span><h1 style="font-size:clamp(1.9rem,4.4vw,3rem)">'+s.icon+' '+esc(s.name)+' <span class="code" style="font-size:.45em;color:var(--gold)">'+esc(s.code)+'</span></h1><p class="sub">Topical past papers, topic by topic. Attempt first, then check the mark scheme and self-mark honestly.</p></div>'+pay+
    '<div class="noteBox">🎯 <b>Mark schemes are deliberately kept one step away.</b> Practice only works when you commit to an answer first. Attempt each question honestly, then reveal the worked solution and marking guidance afterwards.</div>';
  var hasPdf=!!(res.compiled&&res.compiled.length),freeN=mockPdfN(o);
  if(res.compiled&&res.compiled.length)h+='<section class="sect" style="padding-top:28px"><div class="libGroup"><h3>📑 Compiled topical papers (PDF) <span class="pill">Topic by topic</span></h3>'+res.compiled.map(EV.pdfRow).join('')+'</div></section>';
  if(hasPdf)h+='<div class="noteBox" style="margin-top:22px"><b>'+(freeN?freeN+' full mock paper PDF'+(freeN>1?'s':'')+' for this subject '+(freeN>1?'are':'is')+' free in the Mock area.':'Want a full paper under exam conditions?')+'</b><br>The topical papers above are ready to use now.<div class="row" style="margin-top:12px"><a class="btn gold sm" href="#mock">⏱ Open the Mock area</a><a class="btn sm" href="#overview-'+o.slug+'">📖 Open the '+esc(s.name)+' hub</a></div></div>';
  else h+='<div class="empty" style="margin-top:28px"><span style="font-size:2.4rem">📄</span><b>No topical past papers added yet for this subject. They will be added soon.</b><span>'+(freeN?freeN+' full mock paper PDF'+(freeN>1?'s are':' is')+' ready now, free, in the Mock area.':'Topical papers for '+esc(s.name)+' ('+esc(s.code)+') will appear here once they are added.')+'</span><div class="row" style="justify-content:center"><a class="btn gold sm" href="#mock">⏱ Sit a timed mock instead</a><a class="btn sm" href="#overview-'+o.slug+'">📖 Open the '+esc(s.name)+' hub</a></div></div>';
  h+='<div style="margin-top:22px"><a class="btn" href="#papers">← All subjects</a></div></div>';
  el.innerHTML=h;
};

/* =================== RANKS =================== */
V.ranks=function(el){
  var X=EVLive.XP,mode=EV.rankMode||'all',authed=!!ST.profile&&EVLive.hasSession();
  if(authed&&X.status==='guest')X.status='idle';
  var ready=authed&&X.status==='ready'&&X.me;
  var total=ready?Number(X.me.total_xp)||0:ST.xp,lp=EV.levelProgress(total);
  var rank=ready?X.me.all_rank:null;
  var key='total_xp';var SEA=EVLive.seasonOf(Math.max(Date.now(),EVLive.FIRST_SEASON));
  var rows=ready?X.leaders.filter(function(r){return Number(r[key])>0;}).slice().sort(function(a,b){return Number(b[key])-Number(a[key])||String(a.display_name).localeCompare(String(b.display_name));}):[];
  var state=authed?X.status:'guest';
  var status=state==='ready'?'Account XP synced'+(X.updated?' · '+new Date(X.updated).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):''):state==='loading'?'Syncing your study activity…':state==='guest'?'XP on this device':'Your XP is safe on this device';
  var body;
  if(authed&&!EVLive.lbOptIn())body='<div class="empty" style="padding:28px"><b>You are hidden from the leaderboard</b><span>You chose not to appear on the rankings, so your XP is not synced. Your XP still counts for you on this device.</span><button class="btn gold sm" type="button" id="rkShow">Show me on the leaderboard</button></div>';
  else if(state==='guest')body='<div class="empty" style="padding:28px"><b>Sign in to see genuine student rankings</b><span>You can keep earning XP now. After you sign in, your study events sync to your student account. Your email address is never shown.</span><a class="btn gold sm" href="#signin">Sign in or create a student account</a></div>';
  else if(state==='loading'||state==='idle')body='<div class="empty" style="padding:28px"><b>Loading genuine student scores…</b><span>No sample rows are shown while you wait.</span></div>';
  else if(state==='setup')body='<div class="empty" style="padding:28px"><b>Shared rankings are not connected yet</b><span>The leaderboard database still needs its one-time setup. Your own XP above is safe, and no substitute students are shown.</span></div>';
  else if(state==='auth')body='<div class="empty" style="padding:28px"><b>Please sign in again</b><span>Your session has expired. Your XP is safe on this device and will sync after you sign in.</span><a class="btn gold sm" href="#signin">Sign in</a></div>';
  else if(state==='error')body='<div class="empty" style="padding:28px"><b>Could not load the rankings</b><span>'+esc(X.message||'Check your connection and try again.')+' Your new XP is saved on this device.</span></div>';
  else if(!rows.length)body='<div class="empty" style="padding:28px"><b>The leaderboard is waiting for its first student</b><span>Answer a question correctly or pass a timed mock to start the ranking.</span><a class="btn gold sm" href="#dashboard">Start earning XP</a></div>';
  else body='<div class="scrollx"><table class="tbl"><thead><tr><th>Rank</th><th>Student</th><th>Level</th><th style="text-align:right">XP</th></tr></thead><tbody>'+rows.map(function(r,i){var xp=Number(r[key])||0,me=!!r.is_me;return '<tr'+(me?' style="background:var(--goldsoft)"':'')+'><td>'+(i<3?['🥇','🥈','🥉'][i]:i+1)+'</td><td>'+esc(r.display_name||'Student')+(me?' <span class="pill gold">You</span>':'')+'</td><td>'+EV.level(Number(r.total_xp)||0)+'</td><td style="text-align:right;font-variant-numeric:tabular-nums">'+xp.toLocaleString('en-US')+'</td></tr>';}).join('')+'</tbody></table></div>';
  el.innerHTML='<div class="in page"><div class="pageHead"><span class="eyebrow"><b>EduVerse</b> · genuine student progress</span><h1>Study ranks</h1><p class="sub">XP rewards real revision. See where you stand among EduVerse students, and compete in six-month seasons where the top three choose a reward.</p></div>'+
  '<div class="lbHero"><div class="cell"><span class="eyebrow">'+(ready?'Your account XP':'Your XP · this device')+'</span><div class="big">'+total.toLocaleString('en-US')+'</div></div><div class="cell"><span class="eyebrow">Your level</span><div class="big">'+lp.l+'</div></div><div class="cell"><span class="eyebrow">Current season</span><div class="big" style="font-size:1.25rem;line-height:1.3">'+esc(SEA.label)+'</div></div><div class="cell"><span class="eyebrow">Your rank</span><div class="big">'+(rank?'#'+rank:'—')+'</div></div></div>'+
  '<section class="sect" style="padding-top:22px"><div id="seasonHost"></div></section>'+
  '<section class="sect" style="padding-top:28px"><div class="card stack"><div class="hd"><h3 style="margin:0">Leaderboard</h3><span class="small muted">'+esc(status)+'</span>'+(authed?'<button class="btn sm" type="button" id="rkSync"'+(state==='loading'?' disabled':'')+'>↻ Sync &amp; refresh</button>':'')+'</div>'+body+'</div></section>'+
  '<section class="sect" style="padding-top:28px"><div class="grid g2"><div class="card stack"><h3>How XP is earned</h3><p class="small muted">XP is awarded for demonstrated knowledge only. Each achievement counts once, and incorrect answers earn nothing.</p><table class="tbl">'+[['Correct answer to a question','+15 XP'],['Topic completed with every question correct','+50 XP'],['Timed mock paper passed (40% or more, with at least half the time used)','+100 XP'],['Browsing, ticking topics or reviewing flashcards','No XP']].map(function(r){return '<tr><td>'+r[0]+'</td><td style="text-align:right;color:var(--gold);white-space:nowrap">'+r[1]+'</td></tr>';}).join('')+'</table></div>'+
  '<div class="card stack" style="align-content:start"><h3>Fair rankings</h3><p class="small muted">Only real student accounts appear on the leaderboard. Display names are shown; email addresses are never published. XP is awarded by the server under fixed rules, so scores cannot be edited.</p><p class="small muted">Rankings run in two seasons a year: January to June and July to December. When a season ends, the top three students each choose a reward.</p></div></div></section></div>';
  $$('[data-rm]',el).forEach(function(b){b.addEventListener('click',function(){EV.rankMode=b.dataset.rm;EV.render();});});
  var sy=$('#rkSync');if(sy)sy.addEventListener('click',function(){EVLive.xpSync(true);});
  var sh=$('#rkShow');if(sh)sh.addEventListener('click',function(){EVLive.setLbOptIn(true);EVLive.xpSync(true);EV.render();});
  EV.seasonCard($('#seasonHost'));
  if(authed&&EVLive.lbOptIn()&&(X.status==='idle'||X.status==='hidden'))setTimeout(function(){EVLive.xpSync(false);},0);
};

/* =================== SEASONS (every 6 months, top 3 pick a mystery reward) =================== */
function fmtLeft(ms){ms=Math.max(0,ms);var d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5);return d>0?d+' day'+(d===1?'':'s')+' '+h+' h':Math.max(1,Math.ceil(ms/6e4))+' min';}
EV.seasonCard=function(host){
  var now=Date.now(),LVx=EVLive;
  if(now<LVx.FIRST_SEASON){
    host.innerHTML='<div class="season"><span class="eyebrow"><b>Seasons</b> · every 6 months</span><h3 style="margin:0;font-size:1.35rem">Season 1 starts on 1 January 2027, when EduVerse launches.</h3><div class="clock">Starts in '+fmtLeft(LVx.FIRST_SEASON-now)+'</div><p class="small muted" style="margin:0">Each season runs January–June or July–December. When a season ends, the top 3 students by season XP each choose one of three mystery rewards. Only XP from real effort counts.</p></div>';
    return;
  }
  var S=LVx.seasonOf(now);
  host.innerHTML='<div class="season"><span class="eyebrow"><b>Season '+esc(S.id)+'</b> · '+esc(S.label)+'</span><div class="row" style="justify-content:space-between"><h3 style="margin:0;font-size:1.35rem">Top 3 this season pick a mystery reward</h3><div class="clock">Ends in '+fmtLeft(S.end-now)+'</div></div><div id="seasonBody"><p class="small muted">Loading season standings…</p></div><div id="rewardBody"></div></div>';
  if(!LVx.hasSession())return;
  LVx.seasonBoard().then(function(rows){
    rows=(rows||[]).filter(function(r){return Number(r.season_xp)>0;});
    var b=$('#seasonBody');if(!b)return;
    b.innerHTML=rows.length?'<div class="scrollx"><table class="tbl"><thead><tr><th>Rank</th><th>Student</th><th style="text-align:right">Season XP</th></tr></thead><tbody>'+rows.slice(0,10).map(function(r,i){return '<tr'+(r.is_me?' style="background:var(--goldsoft)"':'')+'><td>'+(i<3?['🥇','🥈','🥉'][i]:i+1)+'</td><td>'+esc(r.display_name||'Student')+(r.is_me?' <span class="pill gold">You</span>':'')+'</td><td style="text-align:right">'+Number(r.season_xp).toLocaleString('en-US')+'</td></tr>';}).join('')+'</tbody></table></div>':'<p class="small muted">No season XP yet. Answer questions correctly and finish timed mocks to climb.</p>';
  }).catch(function(e){var b=$('#seasonBody');if(b)b.innerHTML='<p class="small muted">'+(e.setup?'Season standings switch on after the owner runs the EduVerse database update.':'Season standings could not load right now.')+'</p>';});
  LVx.mySeasonReward().then(function(r){
    var b=$('#rewardBody');if(!b||!r||!r.season)return;
    if(r.claimed_slot){b.innerHTML='<div class="mystery">'+[1,2,3].map(function(k){return '<button class="mbox'+(k===r.claimed_slot?' won':'')+'" type="button" disabled><span class="q">'+(k===r.claimed_slot?'🎁':'❔')+'</span>'+(k===r.claimed_slot?'<b>'+esc(r.reward_title||'Your reward')+'</b><span class="small muted">'+esc(r.reward_details||'')+'</span>':'<span class="small muted">Mystery '+k+'</span>')+'</button>';}).join('')+'</div><p class="small muted">You finished #'+r.rank+' in season '+esc(r.season)+'. The EduVerse team will contact you at your account email about your reward.</p>';return;}
    if(!r.claimable)return;
    b.innerHTML='<p style="margin:0"><b>🏆 You finished #'+r.rank+' in season '+esc(r.season)+'!</b> Choose one mystery reward. Your choice is final.</p><div class="mystery">'+[1,2,3].map(function(k){return '<button class="mbox" type="button" data-slot="'+k+'"><span class="q">❔</span><b>Mystery '+k+'</b><span class="small muted">Tap to choose</span></button>';}).join('')+'</div>';
    $$('[data-slot]',b).forEach(function(btn){btn.addEventListener('click',function(){
      if(!confirm('Choose Mystery '+btn.dataset.slot+'? You can only choose once.'))return;
      $$('[data-slot]',b).forEach(function(x){x.disabled=true;});
      LVx.claimSeasonReward(+btn.dataset.slot).then(function(){EV.toast('Reward chosen!');EV.seasonCard(host);}).catch(function(e){EV.toast(e.message==='setup'?'Rewards are not set up yet.':e.message);$$('[data-slot]',b).forEach(function(x){x.disabled=false;});});
    });});
  }).catch(function(){});
};

/* =================== ADMIN (owner and co-owner only) =================== */
/* The owner's Admin is not part of this website. It lives on a separate private site. */
V.admin=function(el){el.innerHTML='<div class="in page"><div class="empty" style="margin-top:30px"><b>Page not found</b><span>This page does not exist.</span><a class="btn gold sm" href="#home">Back to home</a></div></div>';};

/* =================== KNOVO WORKSPACE =================== */
/* Live Lesson: the board studio in lesson.js. It opens on a start screen and begins only when the student taps Start. */
function openLesson(topic){if(window.knovoLiveLesson)window.knovoLiveLesson(String(topic||'').trim());else EV.toast('The Live Lesson board could not load. Reload the page.');}
EV.openLesson=openLesson;
var MODES=[['chat','Chat'],['mark','Mark my answer'],['scan','Scan a question'],['lesson','Live lesson']];
var STARTERS={chat:['Explain this topic simply, then test me','What do examiners look for in a 6-mark explain question?','Make me a 20-minute revision plan for tonight'],
  mark:['Question (6 marks): Explain how the structure of a leaf is adapted for photosynthesis.\nMy answer: Leaves are thin and have chlorophyll which absorbs light. They have stomata for gas exchange.'],
  scan:['Attach up to 5 photos of questions (or a zip) with the 📎 button, then press Send.'],
  lesson:['Teach me moments and the principle of moments','Teach me electrolysis of copper(II) sulfate','Teach me supply and demand diagrams']};
V.knovo=function(el){
  if(!ST.profile){lockPage(el,'Knovo is members-only','Sign in to chat with Knovo, mark your answers, scan questions and start Live Lessons. Your free allowance is waiting.',
    '<div class="stack" style="max-width:640px;margin:0 auto"><div class="m u" style="align-self:flex-end">Can you mark my 6-mark answer on photosynthesis?</div><div class="m a"><div class="who">Knovo</div>You scored 4/6. You named chlorophyll and light energy, but you missed the word equation and a limiting factor…</div><div class="m u" style="align-self:flex-end">Make me 5 flashcards from that</div><div class="m a"><div class="who">Knovo</div>1. What is the word equation for photosynthesis?…</div></div>');EV.wsConv=null;return;}
  var cur=ST.chats.find(function(c){return c.id===ST.chatCur});
  if(!cur){cur={id:'c'+Date.now(),title:'New chat',mode:'chat',ref:(EV.prevRef||''),turns:[],t:Date.now()};}
  var h='<div class="in"><div class="kw"><aside class="kside" aria-label="Saved chats"><button class="btn teal" type="button" id="kNew" style="margin-bottom:6px">+ New chat</button><h4>Saved on this device</h4><div id="kList"></div></aside>'+
    '<div class="kmain"><div class="khead"><img src="assets/knovo-logo-sm.png" alt=""><div><b>Knovo</b><span class="s">EduVerse study tutor</span></div><div class="modes" id="kModes">'+MODES.map(function(m){return '<button type="button" data-mode="'+m[0]+'" class="'+(cur.mode===m[0]?'on':'')+'">'+m[1]+'</button>';}).join('')+'</div></div>'+
    '<div class="log" id="klog" aria-live="polite"></div>'+
    '<div class="compose"><div class="kCred" id="kCred"></div><div class="pv" id="kPv" hidden></div><form id="kform" autocomplete="off"><button class="att" type="button" id="kAtt" title="Attach up to 5 photos, or a zip (10 MB at most)" aria-label="Attach photos or a zip">📎</button><input type="file" id="kFile" accept="image/*,.zip,.txt,.md,.csv" multiple hidden><label for="kq" class="sr">Message Knovo</label><textarea id="kq" rows="1" placeholder="Ask anything about your syllabus…"></textarea><button class="stop" type="button" id="kStop" hidden>Stop</button><button class="send" type="submit" id="kSend">Send</button></form></div></div>'+
    '<aside class="kctx" aria-label="Context"><div class="mini" style="margin-top:0"><small>Knovo Pro</small>No credit limit on messages, scans, images and Live Lessons. <button class="btn sm teal" type="button" data-plans style="justify-self:start">See plans</button></div><div id="kKnowWrap" hidden><h4>Knovo is reading</h4><div class="kv" id="kKnow"></div></div>'+
    '<h4>Your Knovo access</h4><div class="kv" id="kAllow"></div>'+
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
    if(!conv.turns.length){EV.kBubble(log,'a','<p><b>Hi'+(ST.profile?' '+esc(ST.profile.name):'')+'!</b> '+({chat:'Ask me anything about your syllabus.',mark:'Paste the question (with marks) and your answer. I\'ll mark it point by point.',scan:'Attach a photo of a question with 📷 and I\'ll solve it step by step.',lesson:'Name a topic and I\'ll teach it on the board. I write and speak step by step, and you can stop me with a question at any time.'}[conv.mode])+'</p>'+(conv.mode==='lesson'?'<div class="row"><button class="btn teal" type="button" data-open-lesson>✨ Open the Live Lesson board</button></div>':''));
      var s=document.createElement('div');s.className='chips';s.style.alignSelf='flex-start';s.innerHTML=STARTERS[conv.mode].map(function(x){return '<button type="button" data-start-q="'+esc(x)+'">'+esc(x.split('\n')[0].slice(0,70))+'</button>';}).join('');log.appendChild(s);}
    else conv.turns.forEach(function(t){if(t.role==='user')EV.kBubble(log,'u','',t.content);else EV.kBubble(log,'a',EV.md(t.content));});}
  function paintList(){$('#kList').innerHTML=ST.chats.length?ST.chats.map(function(c){return '<div class="s'+(c.id===cur.id?' on':'')+'"><button class="o" type="button" data-open="'+c.id+'" title="'+esc(c.title)+'">'+esc(c.title)+'</button><button class="x" type="button" data-del="'+c.id+'" aria-label="Delete chat">×</button></div>';}).join(''):'<p class="small muted" style="padding:6px">Your chats will be saved here.</p>';}
  function paintKnow(){var o=cur.ref?EV.BYREF[cur.ref]:null,acc=o?EV.accuracy(o.ref):null;$('#kKnow').innerHTML=o?'<div><span>Subject</span><b>'+esc(o.s.name)+'</b></div><div><span>Code</span><b class="code">'+esc(o.s.code)+'</b></div><div><span>Notes it reads</span><b>'+EV.notesOf(o).length+' sections</b></div><div><span>Your accuracy</span><b>'+(acc?acc.pct+'%':'—')+'</b></div>':'';$('#kKnowWrap').hidden=!o;}
  function paintAllow(){var a=EV.allowance();
    $('#kAllow').innerHTML='<div><span>Plan</span><b>'+esc(EV.planLabel())+'</b></div>'+
      (a.unlimited?'<div><span>Credits</span><b>Unlimited</b></div>':
       a.blockedFor?'<div><span>Credits</span><b style="color:var(--warn)">Refill in '+esc(EVLive.fmtWait(a.blockedFor))+'</b></div>':
       '<div><span>Credits today</span><b>'+(a.left==null?a.daily+' a day':a.left+' / '+a.daily)+'</b></div>')+
      (a.unlimited?'':'<div><span>Message</span><b>1 credit</b></div><div><span>Live Lesson</span><b>10 credits</b></div><div><span>Image</span><b>10 credits</b></div>')+
      '<p class="small muted" style="margin:0">'+(a.unlimited?'Your plan has no credit limit.':'Free accounts get '+a.daily+' Knovo credits every day. EduVerse\'s server keeps count, so it is the same on every device.')+'</p>';
    var cl=$('#kCred');if(cl)cl.textContent=a.unlimited?'':a.blockedFor?'Credits refill in '+EVLive.fmtWait(a.blockedFor):(a.left==null?a.daily+' credits a day':a.left+' of '+a.daily+' credits left today');}
  function paintDeck(){var d=ST.kdeck;$('#kDeck').innerHTML=d.length?'<div class="mini"><small>'+d.length+' cards</small><b>'+esc(d[d.length-1].q)+'</b><span class="muted">'+esc(d[d.length-1].a)+'</span></div><button class="btn sm" type="button" id="kPlay" style="justify-self:start">Practise deck</button>':'<p class="small muted">Press "Make flashcards" under any answer to save cards here.</p>';var p=$('#kPlay');if(p)p.addEventListener('click',function(){playDeck();});}
  function paintAi(){$('#kAi').innerHTML='Knovo is EduVerse\'s study tutor. It reads this subject\'s EduVerse notes and paper pattern, but it can make mistakes, so check important facts against your syllabus.';}
  function playDeck(){var host=document.createElement('div');log.innerHTML='';log.appendChild(host);EV.deck(host,ST.kdeck.map(function(c,i){return {q:c.q,a:c.a,key:'kn:'+c.t+'#'+i}}),'Knovo deck');var back=document.createElement('button');back.className='btn sm';back.type='button';back.textContent='← Back to chat';back.style.alignSelf='center';back.addEventListener('click',paintLog);log.appendChild(back);}
  EV.onDeckChange=paintDeck;EV.onKnovoUsage=function(){paintAllow();};
  paintLog();paintList();paintKnow();paintAllow();paintDeck();paintAi();
  var att=null;
  function paintAtt(notes){var pv=$('#kPv');if(!pv)return;var n=att?att.images.length+att.texts.length:0;
    if(!n&&!(notes&&notes.length)){pv.hidden=true;pv.innerHTML='';return;}
    pv.hidden=false;pv.innerHTML=(att?att.images.map(function(f){return '<img alt="Attached photo" src="'+URL.createObjectURL(f)+'">';}).join('')+att.texts.map(function(t){return '<span class="attChip">📄 '+esc(t.name)+'</span>';}).join(''):'')+
      '<span class="grow">'+(n?(att.images.length?att.images.length+' of 5 photos':'')+(att.images.length&&att.texts.length?' · ':'')+(att.texts.length?att.texts.length+' file'+(att.texts.length>1?'s':''):''):'')+(notes&&notes.length?'<br><span style="color:var(--warn)">'+notes.map(esc).join(' ')+'</span>':'')+'</span>'+(n?'<button class="btn sm ghost" type="button" id="kRm">Remove</button>':'');
    var rm=$('#kRm');if(rm)rm.addEventListener('click',function(){att=null;paintAtt();$('#kFile').value='';});}
  $('#kAtt').addEventListener('click',function(){$('#kFile').click();});
  $('#kFile').addEventListener('change',function(){var fs=this.files;if(!fs||!fs.length)return;var inp=this;
    EV.readAttachments(fs,att).then(function(r){att={images:r.images,texts:r.texts};paintAtt(r.notes);inp.value='';},function(e){paintAtt([e.message||'Those files could not be read.']);inp.value='';});
    if(conv.mode!=='scan'){conv.mode='scan';cur.mode='scan';$$('#kModes button').forEach(function(b){b.classList.toggle('on',b.dataset.mode==='scan')});}
  });
  var ta=$('#kq');
  if(window.innerWidth<480)ta.placeholder='Ask Knovo…';
  ta.addEventListener('input',function(){EV.autoGrow(ta)});
  ta.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#kform').requestSubmit();}});
  $('#kform').addEventListener('submit',function(e){e.preventDefault();if(conv.mode==='lesson'){openLesson(ta.value);ta.value='';EV.autoGrow(ta);return;}if(!conv.turns.length)log.innerHTML='';EV.kSend(conv,ta.value,att);ta.value='';EV.autoGrow(ta);att=null;paintAtt();$('#kFile').value='';});
  $('#kStop').addEventListener('click',function(){if(conv.ctl)conv.ctl.abort();});
  $('#kModes').addEventListener('click',function(e){var b=e.target.closest('[data-mode]');if(!b)return;conv.mode=cur.mode=b.dataset.mode;$$('#kModes button').forEach(function(x){x.classList.toggle('on',x===b)});if(!conv.turns.length)paintLog();ta.placeholder={chat:'Ask anything about your syllabus…',mark:'Paste the question, marks and your answer…',scan:'Add a note about the photo (optional)…',lesson:'Name a topic, then press Send to open the board…'}[conv.mode];});
  $('#kNew').addEventListener('click',function(){ST.chatCur='';EV.save();EV.render();});
  $('.kside').addEventListener('click',function(e){var o=e.target.closest('[data-open]'),d=e.target.closest('[data-del]');
    if(o){ST.chatCur=o.dataset.open;EV.save();EV.render();}
    if(d){ST.chats=ST.chats.filter(function(c){return c.id!==d.dataset.del});if(ST.chatCur===d.dataset.del)ST.chatCur='';EV.save();EV.render();}});
  log.addEventListener('click',function(e){if(e.target.closest('[data-open-lesson]')){openLesson(ta.value);return;}var s=e.target.closest('[data-start-q]');if(!s)return;if(conv.mode==='scan'){$('#kAtt').click();return;}if(conv.mode==='lesson'){openLesson(s.dataset.startQ.replace(/^Teach me /,''));return;}log.innerHTML='';EV.kSend(conv,s.dataset.startQ);});
  EV.cleanup=function(){EV.wsConv=null;EV.onDeckChange=null;EV.onKnovoUsage=null;if(conv.ctl&&conv.busy)conv.ctl.abort();};
};

/* =================== ABOUT =================== */
V.about=function(el){
  var P=[['Clarity before complexity','Focused explanations and structured notes help students find the point before they dive deeper. A difficult topic should become easier to navigate, not more intimidating.'],['Practice with a purpose','Questions, flashcards and mock exams should reveal what needs work, not simply fill a study session. Every attempt is another piece of useful feedback.'],['Honesty over hype','Original practice material is labelled clearly. Knovo\'s limitations are stated openly, and official syllabus documents and teacher guidance remain important final references.']];
  var L=[['Choose','Start with the right course.','Choose O Level, IGCSE, International AS & A Level or Pearson Edexcel IAL, then open your subject with its paper codes and structures.','#qualifications'],['Understand','Learn it. Recall it. Explain it.','Use focused notes, study books and flashcards. Move beyond rereading by checking whether you can retrieve the idea without looking.','#qualifications'],['Practise','Make the next step a little harder.','Use question practice and original timed mocks to test recall, method and exam rhythm.','#mock'],['Review','Let your mistakes choose the next topic.','Return to missed ideas, check your progress and use XP as encouragement rather than pressure.','#dashboard']];
  el.innerHTML='<div class="in page"><div class="pageHead"><span class="eyebrow"><b>EduVerse</b> · about us · independent · student-first</span><h1>Study with direction.<br>Revise with purpose.</h1><p class="sub">Revision should feel like a way forward, not a wall. EduVerse brings clear explanations, deliberate practice and honest guidance into one study space, so you always know what to do next.</p></div>'+
  '<section class="sect" style="padding-top:20px"><span class="eyebrow">Our purpose</span><h2>One connected place to learn, practise and improve.</h2><p class="sub">Students often move between separate notes, question banks, flashcards, mock papers and chat tools. EduVerse brings those steps together. The goal is not to make students stare at more material; it is to help them understand a topic, test what stayed, discover what needs attention and return with a clearer plan.</p><div class="grid g3" style="margin-top:20px">'+P.map(function(p){return '<div class="card stack"><h3>'+p[0]+'</h3><p class="small muted">'+p[1]+'</p></div>';}).join('')+'</div></section>'+
  '<section class="sect"><span class="eyebrow">The EduVerse study loop</span><h2>From "where do I start?" to "I know my next step."</h2><div class="steps4" style="margin-top:20px">'+L.map(function(l,i){return '<a class="step" href="'+l[3]+'"><small>'+String(i+1).padStart(2,'0')+' · '+l[0]+'</small><b>'+l[1]+'</b><span>'+l[2]+'</span></a>';}).join('')+'</div></section>'+
  '<section class="sect"><div class="kshow" style="grid-template-columns:auto minmax(0,1fr)"><img src="assets/knovo-logo-sm.png" alt="Knovo logo" style="width:120px;height:120px"><div class="stack"><span class="eyebrow"><b class="k">Knovo</b> · EduVerse\'s study tutor</span><h2 class="h2" style="margin:0">A place to ask the follow-up question.</h2><p class="muted">Knovo helps students work through explanations, follow-ups, practice and revision planning without leaving EduVerse. What we will not pretend: Knovo does not have complete knowledge and can make mistakes. It is a study aid, not a replacement for your teacher, official syllabus or exam-board guidance.</p><a class="btn teal" href="#knovo" style="justify-self:start">Open Knovo →</a></div></div></section>'+
  '<section class="sect"><span class="eyebrow">What students can expect</span><h2>Clear labels. Original practice. No exaggerated promises.</h2><div class="grid g3" style="margin-top:20px"><div class="card stack"><h3>Free core, clearly separated access</h3><p class="small muted">Notes, flashcards, question practice, timed mocks and mock papers are free with an account. Topical past papers are part of EduVerse Pro. Nothing is on sale yet, and the site takes no payments.</p></div><div class="card stack"><h3>Original practice material</h3><p class="small muted">EduVerse mock papers and question banks are original practice resources, not official Cambridge or Pearson papers.</p></div><div class="card stack"><h3>Independent by design</h3><p class="small muted">EduVerse is not affiliated with or endorsed by Cambridge International Education or Pearson.</p></div></div></section>'+
  '<section class="sect"><span class="eyebrow">Contact us</span><h2>Get in touch</h2><div class="grid g2" style="margin-top:20px"><div class="card stack"><h3>Email</h3><p class="code" style="font-size:.95rem;user-select:all">educationalverse2027@gmail.com</p><p class="small muted">Support, partnership ideas, resource reports and subject requests.</p></div><div class="card stack"><h3>Instagram</h3><p class="code" style="font-size:.95rem;user-select:all">@eduverse.27</p><p class="small muted">Study tips, new resources and behind-the-scenes updates.</p></div></div></section></div>';
};

/* =================== SIGN IN =================== */
/* "Take a look inside": a static preview for visitors. It reads one real note and one real flashcard from
   the data already on the page (with fixed text as a fallback) and makes no network request. */
function peekHTML(){
  var note={t:'Work, energy & power',b:'W = Fd; KE = ½mv²; PE = mgh; P = W/t = Fv. Energy conversions & efficiency = useful output ÷ input × 100%.'},
      card={q:'Half-life definition?',a:'Time for half the unstable nuclei (or activity) to decay — constant for each isotope.'},subj='Physics';
  try{var o=EV.SUBJ.filter(function(x){return x.lk==='olevel'&&/^Physics/.test(x.s.name);})[0];
    if(o){subj=o.s.name;if(o.s.notes&&o.s.notes[1]&&o.s.notes[1].b)note={t:String(o.s.notes[1].t).replace(/^\d+\.\s*/,''),b:EV.strip(o.s.notes[1].b)};
      if(o.s.flash&&o.s.flash[1]&&o.s.flash[1].a)card=o.s.flash[1];}}catch(e){}
  return '<section class="peek" aria-label="Take a look inside"><span class="eyebrow">Take a look inside</span>'+
    '<div class="peekGrid">'+
    '<div class="peekCard"><small>📖 Short note · '+esc(subj)+'</small><b>'+esc(note.t)+'</b><p class="peekFade">'+esc(note.b)+'</p></div>'+
    '<button class="peekCard peekFlip" type="button" id="peekFlip" aria-pressed="false"><small>🃏 Flashcard · tap to flip</small><b class="pq">'+esc(card.q)+'</b><span class="pa" hidden>'+esc(card.a)+'</span></button>'+
    '<div class="peekCard peekChat"><small><b class="k">✦ Knovo</b> · your study tutor</small><p class="pu">Why does a ship float but a steel nail sinks?</p><p class="pk">A ship is shaped to push aside a lot of water. It floats because the weight of water it displaces equals its own weight. A nail displaces very little water, so the upthrust is smaller than its weight.</p></div>'+
    '</div><button class="btn gold" type="button" id="peekJoin" style="justify-self:start">Create a free account to see everything</button></section>';
}
V.signin=function(el,r){
  if(ST.profile){el.innerHTML='<div class="in page"><div class="card stack" style="max-width:520px;margin:30px auto;text-align:center;justify-items:center"><div class="avatar" style="width:64px;height:64px;font-size:1.6rem">'+esc(ST.profile.name.charAt(0).toUpperCase())+'</div><h2 class="h2" style="margin:0">Signed in as '+esc(ST.profile.name)+'</h2><p class="small muted">'+esc(ST.profile.email||'')+' · '+esc(EV.planLabel())+'</p><p class="small muted">'+(EVLive.lbOptIn()?'You appear on the XP leaderboard with your display name.':'You chose not to appear on the XP leaderboard.')+' You can change this in the ☰ menu.</p><div class="row" style="justify-content:center"><a class="btn gold" href="#dashboard">My dashboard</a><button class="btn" type="button" id="out">Sign out</button></div></div></div>';$('#out').addEventListener('click',EV.signOut);return;}
  var tab=EV.signTab||'in';
  var lb=function(id){return '<label class="lbOpt"><input type="checkbox" id="'+id+'"'+(EVLive.lbOptIn()?' checked':'')+'><span><b>Show me on the XP leaderboard</b><small>Only your display name and XP are shown, never your email. You can change this any time in the ☰ menu.</small></span></label>';};
  var inForm='<form id="inForm" class="stack" style="gap:12px" novalidate><label class="field" for="em">Email<input id="em" type="email" placeholder="you@example.com" autocomplete="email" required></label><label class="field" for="pw">Password<input id="pw" type="password" placeholder="Your password" autocomplete="current-password" required></label>'+lb('lbOpt')+'<button class="btn gold" type="submit" id="siBtn">Sign in</button><p class="small" id="note" role="status" aria-live="polite"></p><button class="lnk small" type="button" id="forgot" style="justify-self:start">Forgot your password?</button></form>';
  var upForm='<form id="upForm" class="stack" style="gap:12px" novalidate><div class="grid g2" style="gap:12px"><label class="field" for="rName">Full name<input id="rName" autocomplete="name" maxlength="40" required></label><label class="field" for="rUser">Username<input id="rUser" autocomplete="username" maxlength="20" placeholder="letters, numbers, _" required></label></div><label class="field" for="rEmail">Email<input id="rEmail" type="email" autocomplete="email" required></label><div class="grid g2" style="gap:12px"><label class="field" for="rPw">Password<input id="rPw" type="password" autocomplete="new-password" placeholder="At least 8 characters" required></label><label class="field" for="rPw2">Repeat password<input id="rPw2" type="password" autocomplete="new-password" placeholder="Type it again" required></label></div><div class="grid g2" style="gap:12px"><label class="field" for="rBoard">Exam board<select id="rBoard"><option value="">Choose…</option><option value="cambridge">Cambridge International</option><option value="edexcel">Pearson Edexcel</option></select></label><label class="field" for="rQual">Qualification<select id="rQual"><option value="">Choose…</option><option>O Level</option><option>IGCSE</option><option>AS Level</option><option>A Level</option></select></label></div><label class="field" for="rRole">I am a<select id="rRole"><option value="student">Student</option><option value="teacher">Teacher</option></select></label>'+lb('lbOpt2')+'<button class="btn gold" type="submit" id="upBtn">Create my free account</button><p class="small" id="note" role="status" aria-live="polite"></p></form>';
  el.innerHTML='<div class="in page"><div class="grid g2 signGrid"><div class="stack signIntro"><span class="eyebrow"><b>EduVerse</b> · members only</span><h1 class="signH1">'+(r&&r.gated?'Sign in to open EduVerse.':'Your EduVerse account.')+'</h1><p class="muted">EduVerse is for signed-in students. One free account opens every subject, note, flashcard and practice question, plus Knovo, timed mocks and genuine rankings.</p><ul class="signPerks"><li>📚 Every O Level, IGCSE, A Level and Edexcel IAL subject</li><li>✦ Knovo, your study tutor</li><li>🏆 XP for real effort, and season rewards for the top 3</li></ul></div>'+
  '<div class="card stack signForm" style="gap:14px"><div class="seg" role="tablist"><button type="button" role="tab" data-st="in" class="'+(tab==='in'?'on':'')+'" aria-selected="'+(tab==='in')+'">Sign in</button><button type="button" role="tab" data-st="up" class="'+(tab==='up'?'on':'')+'" aria-selected="'+(tab==='up')+'">Create account</button></div>'+(tab==='in'?inForm:upForm)+
  '</div>'+peekHTML()+'</div></div>';
  $('#peekFlip').addEventListener('click',function(){var on=this.getAttribute('aria-pressed')!=='true';this.setAttribute('aria-pressed',on);this.querySelector('.pq').hidden=on;this.querySelector('.pa').hidden=!on;this.querySelector('small').textContent=on?'🃏 Answer · tap to flip back':'🃏 Flashcard · tap to flip';});
  $('#peekJoin').addEventListener('click',function(){EV.signTab='up';EV.render();var f=$('.signForm');if(f)f.scrollIntoView({behavior:'smooth',block:'start'});var n=$('#rName');if(n)n.focus({preventScroll:true});});
  $$('[data-st]',el).forEach(function(b){b.addEventListener('click',function(){EV.signTab=b.dataset.st;EV.render();});});
  var note=$('#note');function say(t,bad){note.textContent=t;note.style.color=bad?'var(--warn)':'var(--teal)';}
  function welcome(optIn){EV.syncProfile();EV.save();EV.paintProfile();EVLive.setLbOptIn(optIn);EV.toast('Welcome, '+ST.profile.name+'!');
    EVLive.checkOwner().then(function(){EV.paintProfile();if(EV.paintBell)EV.paintBell();EV.refreshPlan();});if(optIn)EVLive.xpSync(true);
    var back='';try{back=sessionStorage.getItem('ev_after_signin_url')||'';sessionStorage.removeItem('ev_after_signin_url');}catch(e){}
    if(/^[A-Za-z0-9._-]+\.html$/.test(back)){location.href=back;return;} /* e.g. back to the owner dashboard */
    var to=EV.afterSignin;EV.afterSignin=null;EV.go(to&&to!=='signin'?to:'home');}
  if(tab==='in'){
    $('#inForm').addEventListener('submit',function(e){e.preventDefault();
      var em=$('#em').value.trim(),pw=$('#pw').value,btn=$('#siBtn');
      if(!em||!pw){say('Enter your email and password.',true);return;}
      btn.disabled=true;btn.textContent='Signing in…';say('');
      EVLive.signIn(em,pw).then(function(x){btn.disabled=false;btn.textContent='Sign in';if(!x.ok){say(x.error,true);return;}welcome($('#lbOpt').checked);});
    });
    $('#forgot').addEventListener('click',function(){var em=$('#em').value.trim();if(!em){say('Type your email above first, then press "Forgot your password?" again.',true);$('#em').focus();return;}
      say('Sending a reset link…');EVLive.recover(em).then(function(x){say(x.ok?'If that email has an account, a password-reset link is on its way. Check your inbox.':x.error,!x.ok);});});
  }else{
    $('#upForm').addEventListener('submit',function(e){e.preventDefault();
      var f={name:$('#rName').value.trim(),username:$('#rUser').value.trim(),email:$('#rEmail').value.trim(),password:$('#rPw').value,board:$('#rBoard').value,qualification:$('#rQual').value,role:$('#rRole').value};
      var bad=f.name.length<2?'Please enter your full name.':!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)?'Please enter a valid email address.':EVLive.usernameOk(f.username)||((f.password.length<8||!/[A-Za-z]/.test(f.password)||!/\d/.test(f.password))?'Use a password of at least 8 characters with letters and numbers.':f.password!==$('#rPw2').value?'The two passwords do not match.':!f.board?'Please choose your exam board.':!f.qualification?'Please choose your qualification.':'');
      if(bad){say(bad,true);return;}
      var btn=$('#upBtn'),opt=$('#lbOpt2').checked;btn.disabled=true;btn.textContent='Creating your account…';say('');
      EVLive.signUp(f).then(function(x){btn.disabled=false;btn.textContent='Create my free account';$('#rPw').value='';$('#rPw2').value='';
        if(!x.ok){say(x.error,true);return;}
        if(x.needsConfirm){try{localStorage.setItem('ev_lb_optin',opt?'1':'0');}catch(_){}EV.signTab='in';EV.render();var n=$('#note');if(n){n.textContent='Account created. Check your inbox to confirm your email, then sign in here.';n.style.color='var(--teal)';}return;}
        welcome(opt);});
    });
  }
};

/* =================== WHAT TO ADD =================== */


/* Gate the side sheet like the live site: Knovo is for signed-in students */
var openSheet=EV.openSheet;
EV.openSheet=EV.askKnovo=function(q,extra){
  if(!ST.profile){openSheet();var log=$('#slog');log.innerHTML='';EV.kBubble(log,'sys','<b>Knovo is members-only.</b> Sign in with a free account to chat, mark answers and scan questions.<div class="row" style="justify-content:center;margin-top:8px"><a class="btn sm gold" href="#signin" data-close-sheet>Sign in</a></div>');EV.SHEET.ctx=null;return;}
  if(EV.route&&EV.route.name==='mock'&&EV.mockRunning){EV.toast('Knovo is switched off during a mock');return;}
  openSheet(q,extra);
};
/* EV.boot() is called from index.html once every script has loaded. */
})();
