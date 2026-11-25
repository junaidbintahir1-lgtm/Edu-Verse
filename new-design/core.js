/* EduVerse new design — core: data, saved progress, XP, router, Knovo AI engine, 3D hero.
   Real connections (sign-in, Knovo, XP, the live site's saved progress) come from live.js (window.EVLive).
   Design-only settings are saved under "ev_design_v1"; shared progress is kept in step with the
   live site's "ev_state_v1" so students keep their streaks, XP and mistakes on both designs. */
(function(){
"use strict";
var EV=window.EV={};
var $=EV.$=function(s,r){return (r||document).querySelector(s)};
var $$=EV.$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var reduce=EV.reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
EV.fine=window.matchMedia('(pointer: fine)').matches;
var esc=EV.esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
EV.strip=function(h){var d=document.createElement('div');d.innerHTML=String(h||'');return d.textContent||'';};

/* ---------------- Where the live site lives ----------------
   This design sits in /new-design, so the live site's files are one folder up.
   When the design moves to the site root, set window.EV_SITE_ROOT='' before core.js loads. */
EV.SITE=(typeof window.EV_SITE_ROOT==='string')?window.EV_SITE_ROOT:'../';
/* PDFs open from the same site with relative paths (resources/..., notes/...) */
function encPath(p){return String(p).split('/').map(encodeURIComponent).join('/');}
EV.pdfView=function(p){return EV.SITE+encPath(p);};
EV.pdfRaw=EV.pdfView;

/* ---------------- Saved progress ---------------- */
var KEY='ev_design_v1';var LV=window.EVLive;
var DEF=function(){return {v:1,xp:0,xpLog:[],streak:{last:'',count:0,days:[]},today:{d:'',q:0},goal:10,
  attempts:[],mistakes:[],cards:{},cardsSeen:[],topicsDone:[],mocks:[],lastTest:null,favs:[],recent:[],exam:{},
  chats:[],chatCur:'',kdeck:[],kn:{msgs:[],scans:[]},profile:null,notesSeen:[]};};
var ST;
try{ST=JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){ST=null;}
if(!ST||ST.v!==1)ST=DEF();
var d0=DEF();Object.keys(d0).forEach(function(k){if(ST[k]===undefined)ST[k]=d0[k];});
EV.ST=ST;
var saveT=null;
EV.save=function(){clearTimeout(saveT);saveT=setTimeout(function(){try{localStorage.setItem(KEY,JSON.stringify(ST));}catch(e){}if(EV.ready)EV.syncToLive();},120);};
EV.resetAll=function(){var n=DEF();Object.keys(ST).forEach(function(k){delete ST[k];});Object.assign(ST,n);try{localStorage.removeItem(KEY);}catch(e){}EV.syncFromLive();EV.toast('Design settings reset. Your study progress is kept.');EV.render();};

function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
EV.today=today;
function dayDiff(a,b){return Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5);}

/* ---------------- XP: earned only through real knowledge and effort ----------------
   XP comes ONLY from: a question answered correctly (once per question, never for a wrong answer,
   and not faster than one every 15 seconds), mastering a Maths topic (every question in it right),
   and finishing a timed mock seriously (at least half the time used and 40%+ scored, once per paper
   per week). Opening or ticking chapters, flipping flashcards and daily visits earn no XP.
   The database update in new-design/database-update.sql makes the server enforce the same rules.
   Every achievement is one ledger event with a unique key (topic:…, question:…, card:…, streak:<date>,
   mock:<time>), stored in the live site's ev_state_v1 and synced to the real leaderboard.
   The same achievement can never be counted twice, even across the old and new design. */
var XPR=EV.XPR={topic:50,question:10,correct:5,card:3,streak:20,mock:100};
EV.earn=function(action,key,correct){var got=LV.xpRecord(action,key,correct);ST.xp=LV.xpTotal();if(got){ST.xpLog.push({a:got,w:action,t:Date.now()});if(ST.xpLog.length>400)ST.xpLog=ST.xpLog.slice(-400);}EV.save();EV.addXP();return got;};
EV.addXP=function(){ST.xp=LV.xpTotal();EV.paintXP();}; /* kept for other modules; XP itself only comes from EV.earn */
EV.level=function(xp){return Math.floor(Math.sqrt(xp/60))+1;};
EV.levelProgress=function(xp){var l=EV.level(xp),cur=60*Math.pow(l-1,2),nxt=60*Math.pow(l,2);return {l:l,pct:Math.min(100,Math.round(100*(xp-cur)/Math.max(1,nxt-cur))),next:nxt};};
EV.weekXP=function(){return LV.xpWeek();};
/* shown XP: this device's ledger, or the account total from the server when that is higher (e.g. a new device) */
EV.shownXP=function(){var X=LV.XP,srv=X&&X.status==='ready'&&X.me?Number(X.me.total_xp)||0:0;return Math.max(ST.xp,srv);};
EV.paintXP=function(){var n=$('#xpNum'),x=EV.shownXP();if(n)n.textContent=x+' XP · Lv '+EV.level(x);};
function touchStreak(){
  var t=today();if(ST.streak.last===t)return;
  if(ST.streak.last&&dayDiff(ST.streak.last,t)===1)ST.streak.count++;else ST.streak.count=1;
  ST.streak.last=t;ST.streak.days.push(t);if(ST.streak.days.length>60)ST.streak.days=ST.streak.days.slice(-60);
  EV.save(); /* streaks are tracked for motivation; visiting alone earns no XP */
}
EV.badges=function(){
  var b=[],sN=ST.streak.count||0;
  function add(ok,ic,t,d){b.push({ok:ok,ic:ic,t:t,d:d});}
  add(ST.topicsDone.length>=1,'🎯','First Steps','Complete your first topic');
  add(ST.topicsDone.length>=10,'📚','Bookworm','Complete 10 topics');
  add(ST.topicsDone.length>=25,'🏆','Scholar','Complete 25 topics');
  add(ST.attempts.length>=10,'✍️','Getting Serious','Attempt 10 questions');
  add(ST.attempts.length>=50,'💪','Grinder','Attempt 50 questions');
  add(ST.attempts.length>=100,'🧠','Centurion','Attempt 100 questions');
  add(sN>=3,'🔥','On Fire','3-day study streak');
  add(sN>=7,'⚡','Unstoppable','7-day study streak');
  add(ST.cardsSeen.length>=25,'🃏','Card Shark','Review 25 flashcards');
  add(ST.mocks.length>=1,'⏱','Exam Ready','Sit a timed mock exam');
  add(!!ST.lastTest,'📝','Tested','Finish a full-syllabus test');
  return b;
};
EV.grade=function(p){return p>=85?'A*':p>=75?'A':p>=65?'B':p>=55?'C':p>=45?'D':p>=35?'E':'U';};

/* Record a question attempt. q = {id, ref, q, a, steps?, topic?} */
EV.attempt=function(q,ok){
  var first=!ST.attempts.some(function(x){return x.id===q.id});
  ST.attempts.push({id:q.id,ref:q.ref,ok:!!ok,t:Date.now()});
  if(ST.attempts.length>2000)ST.attempts=ST.attempts.slice(-2000);
  var t=today();if(ST.today.d!==t){ST.today={d:t,q:0};}ST.today.q++;
  var got=0;
  if(ok&&Date.now()-(EV.lastQXP||0)>=15000){got=EV.earn('question','q:'+EV.toLiveId(q.id),true);if(got)EV.lastQXP=Date.now();}
  var mastered=ok?EV.checkMastery(q):0;
  var ex=ST.mistakes.find(function(m){return m.id===q.id});
  if(!ok){
    if(ex){ex.resolved=false;ex.misses=(ex.misses||1)+1;ex.t=Date.now();}
    else ST.mistakes.unshift({id:q.id,ref:q.ref,q:q.q,a:q.a||'',steps:q.steps||[],src:q.src||'Practice',t:Date.now(),resolved:false,misses:1});
  }else if(ex&&!ex.resolved){ex.resolved=true;ex.rt=Date.now();}
  EV.save();
  EV.toast(ok?(ex&&ex.resolved&&!first?'Mistake resolved':'Correct')+(got?' · +'+got+' XP':'')+(mastered?' · Topic mastered +'+mastered+' XP':''):'Saved to your Mistakes notebook');
};
EV.lastResult=function(id){for(var i=ST.attempts.length-1;i>=0;i--)if(ST.attempts[i].id===id)return ST.attempts[i].ok;return null;};
EV.accuracy=function(ref){var a=ST.attempts.filter(function(x){return !ref||x.ref===ref});if(!a.length)return null;return {n:a.length,pct:Math.round(100*a.filter(function(x){return x.ok}).length/a.length)};};
EV.completeTopic=function(key,ref){if(ST.topicsDone.indexOf(key)>=0){ST.topicsDone=ST.topicsDone.filter(function(k){return k!==key});EV.save();EV.toast('Marked as not learned (XP stays earned)');return false;}
  ST.topicsDone.push(key);EV.save();EV.toast('Marked as learned. Answer its questions correctly to earn XP.');return true;};
/* A Maths topic is mastered when every one of its questions has been answered correctly. +50 XP once. */
EV.checkMastery=function(q){
  var m=/^db:([^#]+)#\d+$/.exec(String(q.id||''));if(!m)return 0;
  var T=EV.DBTOPIC[slugify(m[1])];if(!T||!(T.t.questions||[]).length)return 0;
  var all=T.t.questions.every(function(_,i){var id='db:'+T.t.id+'#'+i;return ST.attempts.some(function(a){return a.id===id&&a.ok;});});
  return all?EV.earn('topic','mastery:'+EV.toLiveId('db:'+T.t.id),false):0;
};
EV.reviewCard=function(key,ok){var c=ST.cards[key]||{lv:0,n:0};c.n++;c.lv=ok?Math.min(4,c.lv+1):0;c.t=Date.now();ST.cards[key]=c;if(ST.cardsSeen.indexOf(key)<0)ST.cardsSeen.push(key);EV.save();}; /* flashcards build memory; they earn no XP */
EV.touchRecent=function(ref){ST.recent=[ref].concat(ST.recent.filter(function(r){return r!==ref})).slice(0,8);EV.save();};
EV.toggleFav=function(ref){var i=ST.favs.indexOf(ref);if(i>=0)ST.favs.splice(i,1);else ST.favs.push(ref);EV.save();return i<0;};

/* ---------------- Bridge to the live site's saved progress (ev_state_v1) ----------------
   Maths topic-engine items use the live site's own ids (chapter/topic[/n]) so the same topic, card
   or question is recognised on both designs. Everything else keeps the design's own keys. */
function liveIdParts(key){var m=/^db:([^#]+)(?:#(c?)(\d+))?$/.exec(String(key));if(!m)return null;var T=EV.DBTOPIC[slugify(m[1])];return T?{T:T,n:m[3]}:null;}
EV.toLiveId=function(key){var p=liveIdParts(key);return p?p.T.c.id+'/'+p.T.t.id+(p.n!=null?'/'+p.n:''):String(key);};
EV.fromLiveId=function(id,kind){var q=String(id).split('/');if(q.length<2||q.length>3)return String(id);var T=EV.DBTOPIC[slugify(q[1])];if(!T||T.c.id!==q[0])return String(id);return q.length===2?'db:'+T.t.id:'db:'+T.t.id+'#'+(kind==='card'?'c':'')+q[2];};
function uniq(a){var seen={};return a.filter(function(x){if(seen[x])return false;seen[x]=1;return true;});}
EV.syncFromLive=function(){
  LV.ensureLedger();
  var LS=LV.liveState();
  if(LS.streak.last&&(!ST.streak.last||LS.streak.last>ST.streak.last||(LS.streak.last===ST.streak.last&&(LS.streak.count||0)>ST.streak.count))){
    ST.streak.last=LS.streak.last;ST.streak.count=LS.streak.count||0;if(ST.streak.days.indexOf(LS.streak.last)<0)ST.streak.days.push(LS.streak.last);}
  if(LS.dayCount.date&&(ST.today.d!==LS.dayCount.date||LS.dayCount.n>ST.today.q)&&(!ST.today.d||LS.dayCount.date>=ST.today.d))ST.today={d:LS.dayCount.date,q:Math.max(LS.dayCount.n||0,ST.today.d===LS.dayCount.date?ST.today.q:0)};
  if(LS.dailyGoal)ST.goal=Number(LS.dailyGoal)||ST.goal;
  ST.topicsDone=uniq(ST.topicsDone.concat(LS.topicsDone.map(function(i){return EV.fromLiveId(i);})));
  ST.cardsSeen=uniq(ST.cardsSeen.concat(LS.cardsSeen.map(function(i){return EV.fromLiveId(i,'card');})));
  var have={};ST.attempts.forEach(function(a){have[a.id+'|'+a.t]=1;});
  LS.attempts.forEach(function(a){var id=EV.fromLiveId(a.qid||'');if(have[id+'|'+a.t])return;have[id+'|'+a.t]=1;ST.attempts.push({id:id,ref:/^db:/.test(id)?'olevel/math4024':null,ok:!!a.ok,t:a.t||0,live:1});});
  ST.attempts.sort(function(a,b){return (a.t||0)-(b.t||0);});
  LS.mistakes.forEach(function(m){
    var mine=ST.mistakes.find(function(x){return x.id===m.ref;})||ST.mistakes.find(function(x){return x.id==='live:'+m.ref;});
    if(mine){if((m.ts||0)>(mine.t||0)){mine.resolved=!!m.resolved;mine.t=m.ts;}return;}
    ST.mistakes.push({id:'live:'+m.ref,ref:EV.BYREF[m.ref]?m.ref:null,q:EV.strip(m.question||''),a:EV.strip(m.correctAnswer||''),steps:[],src:m.subject||'EduVerse',t:m.ts||0,resolved:!!m.resolved,misses:1,live:1});
  });
  ST.mistakes.sort(function(a,b){return (b.t||0)-(a.t||0);});
  var mts={};ST.mocks.forEach(function(m){if(m.ts)mts[m.ts]=1;});
  LS.mocks.forEach(function(m){if(m.ts&&!mts[m.ts])ST.mocks.push({subject:m.subject,paper:m.paper,score:m.score,total:m.total,pct:m.pct,grade:m.grade,date:m.date,ts:m.ts,live:1});});
  ST.favs=uniq(ST.favs.concat(LS.favs.filter(function(r){return typeof r==='string';})));
  if(LS.cardState)Object.keys(LS.cardState).forEach(function(uid){var k=EV.fromLiveId(uid,'card');if(!ST.cards[k])ST.cards[k]={lv:Math.max(0,Math.min(4,(LS.cardState[uid].box||1)-1)),n:1,t:LS.cardState[uid].due||0};});
  ST.xp=LV.xpTotal();
};
EV.syncToLive=function(){
  var LS=LV.liveState();
  LS.streak={last:ST.streak.last,count:ST.streak.count};
  if(ST.today.d)LS.dayCount={date:ST.today.d,n:ST.today.q};
  LS.dailyGoal=ST.goal;
  LS.topicsDone=uniq(ST.topicsDone.map(EV.toLiveId));
  LS.cardsSeen=uniq(ST.cardsSeen.map(EV.toLiveId));
  ST.attempts.forEach(function(a){if(a.live||a.exp)return;var p=liveIdParts(a.id);LS.attempts.push({qid:EV.toLiveId(a.id),chap:p?p.T.c.id:'',ok:!!a.ok,t:a.t});a.exp=1;});
  if(LS.attempts.length>3000)LS.attempts=LS.attempts.slice(-3000);
  ST.mistakes.forEach(function(m){
    var ref=/^live:/.test(m.id)?m.id.slice(5):m.id,ex=LS.mistakes.find(function(x){return x.ref===ref;});
    if(ex){ex.resolved=!!m.resolved;ex.ts=Math.max(ex.ts||0,m.t||0);}
    else if(!m.live)LS.mistakes.push({ref:ref,subject:m.src||'EduVerse',question:m.q,yourAnswer:'',correctAnswer:m.a||'',ts:m.t||Date.now(),resolved:!!m.resolved});
  });
  while(LS.mistakes.length>200)LS.mistakes.shift();
  ST.mocks.forEach(function(m){if(m.live||m.exp||!m.ts)return;LS.mocks.push({subject:m.subject,paper:m.paper,score:m.score,total:m.total,pct:m.pct,grade:m.grade,date:m.date,ts:m.ts});m.exp=1;});
  LS.mocks=LS.mocks.slice(-20);
  LS.favs=ST.favs.slice();
  if(ST.profile&&ST.profile.name)LS.profileName=ST.profile.name;
  LV.saveLiveState(LS);
};

/* ---------------- Who is signed in (real Supabase session from live.js) ---------------- */
EV.syncProfile=function(){var u=LV.user();if(!u){ST.profile=null;return;}var LS=LV.liveState();ST.profile={name:(ST.profile&&ST.profile.email===u.email&&ST.profile.name)||u.name||LS.profileName||u.email.split('@')[0]||'Student',email:u.email};};
EV.planLabel=function(){return LV.isOwner()?'👑 Owner · unlimited':LV.isPro()?'⭐ Pro · early access':LV.isKnovoPro()?'✦ Knovo Pro':'🌱 Free plan';};
EV.signOut=function(){LV.signOut();ST.profile=null;EV.save();EV.paintProfile();EV.toast('Signed out. Your study progress stays saved on this device.');EV.render();};

/* ---------------- Toast ---------------- */
var tT;EV.toast=function(msg){if(!msg)return;var t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(tT);tT=setTimeout(function(){t.classList.remove('on')},2400);};

/* ---------------- Data ---------------- */
EV.D={};EV.SUBJ=[];EV.BYREF={};EV.BYSLUG={};EV.LEVELS=[];EV.DBTOPIC={};
var LEVEL_META={
  olevel:{short:'O Level / IGCSE',pill:'Cambridge',c1:'#3b7fe6',c2:'#123e86',ring:'rgba(240,180,41,.35)'},
  alevel:{short:'A Level · AS & A2',pill:'Cambridge',c1:'#e8b23a',c2:'#7a4b08',ring:'rgba(47,224,205,.3)'},
  alevel_edx:{short:'Edexcel IAL',pill:'Pearson',c1:'#39e3d0',c2:'#0b5d66',ring:'rgba(240,180,41,.3)'},
  ielts:{short:'IELTS',pill:'English proficiency',c1:'#8b7cf0',c2:'#2b2266',ring:'rgba(255,255,255,.15)'},
  act:{short:'ACT',pill:'US admissions',c1:'#6ad08a',c2:'#174d2a',ring:'rgba(255,255,255,.15)'},
  sat:{short:'SAT',pill:'US admissions',c1:'#f07c6a',c2:'#5a1f17',ring:'rgba(255,255,255,.15)'}
};
EV.LEVEL_META=LEVEL_META;
function slugify(s){return String(s).toLowerCase().replace(/[^a-z0-9]/g,'');}
/* Live data: the live index.html is the single source of truth. Its subject data
   (EV_DB, EV_HUB, EV_HUB_DEEP and EV_RESOURCES) is written inside index.html itself, so we read
   index.html and run ONLY those data blocks — none of the old site's app code runs here. */
function loadScript(src){return new Promise(function(ok,no){var el=document.createElement('script');el.src=src;el.onload=ok;el.onerror=function(){no(new Error('Could not load '+src));};document.head.appendChild(el);});}
EV.loadLive=function(){
  var papers=window.EV_PASTPAPERS?Promise.resolve():loadScript(EV.SITE+'pastpapers.js').catch(function(){window.EV_PASTPAPERS=[];});
  var page=fetch(EV.SITE+'index.html',{cache:'no-cache'}).then(function(r){if(!r.ok)throw new Error('index.html '+r.status);return r.text();});
  return Promise.all([page,papers]).then(function(a){
    var html=a[0],scripts=[],re=/<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi,m;
    while((m=re.exec(html))){if(m[1]&&/\bsrc\s*=/.test(m[1]))continue;scripts.push(m[2]);}
    var first=-1,last=-1;
    scripts.forEach(function(t,i){if(first<0&&t.indexOf('==== DATA 1 (embedded)')>=0)first=i;if(t.indexOf('==== DEEP NOTES (embedded)')>=0)last=i;});
    var app=scripts.find(function(t){return t.indexOf('window.EV_RESOURCES = {')>=0;})||'';
    var rs=app.indexOf('window.EV_RESOURCES = {'),re2=app.indexOf('function resFor(',rs);
    if(first<0||last<first||rs<0||re2<0)throw new Error('The live index.html data blocks were not found');
    (new Function(scripts.slice(first,last+1).join('\n;\n')+'\n;\n'+app.slice(rs,re2)))();
    if(!window.EV_HUB||!window.EV_DB)throw new Error('Live data did not load');
  });
};
EV.load=function(){
  /* A standalone copy ships its data in data/snapshot.js (window.EV_SNAPSHOT), so it also opens with a double-click */
  var snap=window.EV_SNAPSHOT;
  if(snap){['EV_DB','EV_HUB','EV_HUB_DEEP','EV_RESOURCES','EV_PASTPAPERS'].forEach(function(k){if(snap[k])window[k]=snap[k];});}
  return Promise.all([snap?Promise.resolve():EV.loadLive(),snap&&snap.extra?Promise.resolve(snap.extra):fetch('data/extra.json').then(function(r){if(!r.ok)throw new Error('extra');return r.json();})]).then(function(a){
    EV.D={hub:window.EV_HUB,deep:window.EV_HUB_DEEP||{},resources:window.EV_RESOURCES||{},db:window.EV_DB,papers:window.EV_PASTPAPERS||[],extra:a[1]};
    Object.keys(EV.D.hub).forEach(function(lk){
      var L=EV.D.hub[lk];var lv={lk:lk,slug:slugify(lk),title:L.title,sub:L.sub,meta:LEVEL_META[lk]||{},subjects:[]};
      L.subjects.forEach(function(s){
        var ref=lk+'/'+s.id,slug=slugify(lk)+slugify(s.id);
        var o={ref:ref,slug:slug,lk:lk,s:s,level:lv,soon:!!s.comingSoon};
        o.deep=EV.D.deep[ref]||null;
        o.res=EV.D.resources[ref]||null;
        EV.SUBJ.push(o);EV.BYREF[ref]=o;EV.BYSLUG[slug]=o;lv.subjects.push(o);
      });
      EV.LEVELS.push(lv);
    });
    /* Maths 4024 deep engine (EV_DB) is attached to the shared O Level Maths folder */
    var m=(EV.D.db.subjects||[]).find(function(x){return x.id==='olm4024'});
    if(m&&EV.BYREF['olevel/math4024']){EV.BYREF['olevel/math4024'].db=m;
      m.chapters.forEach(function(c){c.topics.forEach(function(t){EV.DBTOPIC[slugify(t.id)]={c:c,t:t,ref:'olevel/math4024',key:'db:'+t.id};});});}
  });
};
EV.notesOf=function(o){return (o.deep&&o.deep.length)?o.deep:(o.s.notes||[]);};
EV.pdfCount=function(o){var n=0;if(o.res)Object.keys(o.res).forEach(function(k){n+=o.res[k].length;});return n;};
EV.allQuestions=function(o){
  var out=[],s=o.s;
  (s.solved||[]).forEach(function(x,i){out.push({id:o.ref+'#s'+i,ref:o.ref,kind:'Solved',t:x.t,q:x.q,steps:x.steps||[],a:x.a,src:'Solved questions'});});
  (s.practice||[]).forEach(function(x,i){out.push({id:o.ref+'#p'+i,ref:o.ref,kind:'Practice',q:x.q,a:x.a,steps:[],src:'Practice questions'});});
  if(o.db)o.db.chapters.forEach(function(c){c.topics.forEach(function(t){(t.questions||[]).forEach(function(x,i){out.push({id:'db:'+t.id+'#'+i,ref:o.ref,kind:'Topic',t:t.name,q:x.q,steps:x.steps||[],a:x.ans||'',ms:x.ms||[],marks:x.marks,diff:x.diff,src:t.name});});});});
  return out;
};

/* ---------------- Router ---------------- */
EV.TABS=['overview','notes','topics','questions','cards','technique','library','tools'];
EV.route={name:'home'};
EV.parse=function(){
  var h=(location.hash||'').slice(1)||'home';
  var i=h.indexOf('-');
  if(i>0){var pre=h.slice(0,i),rest=h.slice(i+1);
    if(pre==='level')return {name:'level',lk:rest};
    if(pre==='papers'&&EV.BYSLUG[rest])return {name:'paperSubj',o:EV.BYSLUG[rest]};
    if(pre==='topic'&&EV.DBTOPIC[rest])return {name:'topic',id:rest};
    if(EV.TABS.indexOf(pre)>=0&&EV.BYSLUG[rest])return {name:'subject',tab:pre,o:EV.BYSLUG[rest]};
  }
  return {name:h};
};
EV.views={};
/* Members only: every page needs a signed-in EduVerse account. Signed-out visitors see the
   sign-in / create-account page, and return to the page they asked for after signing in. */
EV.OPEN_ROUTES={signin:1};
EV.render=function(){
  var r=EV.parse();
  if(!ST.profile&&!EV.OPEN_ROUTES[r.name]){if(r.name!=='home'||location.hash)EV.afterSignin=(location.hash||'#home').slice(1);r={name:'signin',gated:true};}
  EV.route=r;
  document.body.classList.toggle('signedOut',!ST.profile);
  var fn=EV.views[r.name]||EV.views.home;
  if(EV.cleanup){try{EV.cleanup();}catch(e){}EV.cleanup=null;}
  var v=$('#view');v.classList.remove('enter');void v.offsetWidth;v.classList.add('enter');
  fn(v,r);
  var navKey=r.name==='paperSubj'?'papers':r.name;
  $$('#nav a').forEach(function(a){a.classList.toggle('on',a.dataset.n===navKey)});
  document.body.classList.toggle('inKnovo',r.name==='knovo');
  document.body.classList.toggle('inMock',r.name==='mock'&&EV.mockRunning);
  EV.paintCtx();
  var sp=$('#subjPick');if(sp)sp.value=(r.o&&r.o.ref)||(r.name==='topic'?'olevel/math4024':'');
};
EV.go=function(h){if(location.hash==='#'+h)EV.render();else location.hash=h;};
window.addEventListener('hashchange',function(){var q=location.hash==='#qualifications';EV.render();if(!q)window.scrollTo(0,0);});

/* ---------------- Knovo context ---------------- */
EV.ctx=function(){
  var r=EV.route,c={label:'Home',ref:null,topic:null,extra:''};
  if(r.name==='subject'){c.ref=r.o.ref;c.label=r.o.s.name+' '+r.o.s.code+' · '+r.tab;}
  else if(r.name==='topic'){var T=EV.DBTOPIC[r.id];c.ref=T.ref;c.topic=T.t;c.label='Mathematics 4024 · '+T.t.name;}
  else if(r.name==='level'){var L=EV.LEVELS.find(function(x){return x.slug===r.lk});c.label=L?L.title:'Subjects';}
  else c.label={dashboard:'My dashboard',technique:'Exam technique',mistakes:'Mistakes notebook',mock:'Mock exam',papers:'Past papers',ranks:'Ranks',knovo:'Knovo',subjects:'All subjects',about:'About',ideas:'What to add',signin:'Sign in'}[r.name]||'Home';
  if(EV.ctxExtra)c.extra=EV.ctxExtra;
  return c;
};
EV.paintCtx=function(){var c=EV.ctx(),el=$('#ctxChip');if(el)el.textContent='Studying: '+c.label;};

/* ---------------- Knovo AI engine ---------------- */
/* Knovo answers through EduVerse's own Supabase Knovo edge function (live.js → EVLive.askKnovo). */

function notesText(o,max){
  if(!o)return '';var out='';
  EV.notesOf(o).forEach(function(n){out+='## '+EV.strip(n.t)+'\n'+EV.strip(n.b)+'\n\n';});
  if(o.s.fmt)out+='## How the questions come\n'+EV.strip(o.s.fmt)+'\n';
  return out.slice(0,max||9000);
}
EV.knovoRules=function(c,mode,split){
  var o=c.ref?EV.BYREF[c.ref]:null;
  var r='You are Knovo, the study tutor inside EduVerse, a revision site for Cambridge O Level, IGCSE, International AS & A Level and Pearson Edexcel International A Level students (many in Pakistan). '+
  'Be warm, clear and exam-focused. Use the syllabus\'s own terms and command words. For calculations show formula, substitution, then the answer with units. '+
  'Keep answers short enough to read on a phone unless the student asks for depth. Use simple Markdown: short paragraphs, **bold** key terms, bullet or numbered lists, and `code` for equations if useful. '+
  'Never claim to be an official examiner; marks you give are study guidance. If you are unsure of a syllabus detail, say so.\n\n';
  r+='The student is currently on: '+c.label+'.\n';
  if(o)r+='Subject: '+o.s.name+' '+o.s.code+' ('+o.s.board+'). Paper pattern: '+(o.s.papers||[]).map(function(p){return p.p+' '+(p.n||'')+' ('+(p.t||'')+', '+(p.m||'')+')';}).join('; ')+'.\n';
  if(c.topic){var t=c.topic;r+='Topic: '+t.name+'. Objectives: '+(t.obj||[]).join('; ')+'. Summary: '+(t.summary||[]).join('; ')+'.\n';}
  if(c.extra)r+='What is on screen: '+String(c.extra).slice(0,600)+'\n';
  var notes=o?'\nEduVerse short notes for this subject (use them as your main reference):\n'+notesText(o,8000)+'\n':'';
  var M={
    mark:'MODE: Mark my answer. The student will give a question (with marks if known) and their answer. Mark it point by point like a Cambridge/Edexcel mark scheme: list each creditworthy point with ✓ or ✗, give a total like "4/6", then show the single change that would gain the most marks, and finish with a model answer.',
    scan:'MODE: Scan a question. The student sends a photo of an exam question. First write out the question as you read it, then solve it step by step with method marks shown, then give the final answer.',
    lesson:'MODE: Live Lesson. Teach the requested topic as a short guided lesson: give part 1 (a short explanation with one example), then ask ONE quick check question and stop. When the student answers, tell them if they are right, explain briefly, then continue with the next part. Three parts in total, then a 3-bullet recap.',
    plan:'MODE: Recovery and revision planning. Build a clear, realistic plan with days or weeks, specific topics and actions, and short reasons.'
  };
  if(M[mode])r+='\n'+M[mode]+'\n';
  return split?{system:r,notes:notes}:r+notes;
};
/* turns: [{role:"user"|"assistant", content}] ending with a user turn. Resolves {text}.
   The edge function keeps its own rules first and adds ours underneath (up to 3,000 characters), so the
   rules go in systemInstruction and the subject's notes ride in the first student message. */
EV.knovoAsk=function(turns,opts){
  opts=opts||{};
  var c=opts.ctx||EV.ctx(),rules=EV.knovoRules(c,opts.mode,true);
  var notes=rules.notes?rules.notes.slice(0,6000):'';
  var list=turns.slice(-24),total=0;
  /* stay inside the server's limits: newest turns first, about 30,000 characters in all */
  for(var i=list.length-1;i>=0;i--){total+=String(list[i].content).length;if(total>30000-notes.length){list=list.slice(i+1);break;}}
  while(list.length&&list[0].role!=='user')list.shift();
  var contents=list.map(function(t,i){var txt=String(t.content).slice(0,7000);if(i===0&&notes)txt=notes+'\n---\nStudent: '+txt;return {role:t.role==='assistant'?'model':'user',parts:[{text:txt.slice(0,7900)}]};});
  return LV.askKnovo({system:rules.system,contents:contents,signal:opts.signal,mode:opts.edgeMode||'chat'}).then(function(r){
    if(opts.onText)try{opts.onText({text:r.text});}catch(e){}
    if(EV.onKnovoUsage)try{EV.onKnovoUsage(r.usage);}catch(e){}
    return {text:r.text};
  });
};
EV.knovoErr=function(e){
  var c=e&&e.code;
  if(c==='limit')return 'Free Knovo limit reached. Knovo unlocks again in '+LV.fmtWait(e.msLeft||0)+'. Knovo Pro removes this wait.';
  return {auth:'Please sign in again to keep using Knovo.',
    network:'Knovo could not be reached. Check your internet connection and try again.',
    timeout:'Knovo took too long to answer. Please try again.',
    server:'Knovo is very busy right now. Please try again in a minute.',
    empty:'Knovo returned an empty answer. Please try again.',
    scanner:'The photo scanner could not load. Check your connection, or type the question instead.'}[c]||'Knovo could not answer just now. Try again in a moment.';
};
/* Free allowance is enforced by the server (429 LIMIT_REACHED). This only reads what the server last told us. */
EV.allowance=function(){var u=LV.lastUsage||{},unl=LV.isKnovoPro()||u.remaining==='unlimited';return {unlimited:unl,left:unl?null:(typeof u.remaining==='number'?u.remaining:null),blockedFor:LV.chatBlockedFor(),plan:u.plan||null};};

/* Safe Markdown → HTML for AI answers */
EV.md=function(src){
  var s=esc(src||'');
  var blocks=[];
  s=s.replace(/```[a-z]*\n?([\s\S]*?)```/g,function(_,c){blocks.push('<pre>'+c.replace(/\n$/,'')+'</pre>');return '\u0000'+(blocks.length-1)+'\u0000';});
  var lines=s.split('\n'),out=[],list=null;
  function close(){if(list){out.push('</'+list+'>');list=null;}}
  lines.forEach(function(l){
    var m;
    if(/^\s*\u0000\d+\u0000\s*$/.test(l)){close();out.push(l.trim());return;}
    if((m=l.match(/^\s*#{1,6}\s+(.*)$/))){close();out.push('<h4>'+m[1]+'</h4>');return;}
    if((m=l.match(/^\s*[-*•]\s+(.*)$/))){if(list!=='ul'){close();out.push('<ul>');list='ul';}out.push('<li>'+m[1]+'</li>');return;}
    if((m=l.match(/^\s*\d+[.)]\s+(.*)$/))){if(list!=='ol'){close();out.push('<ol>');list='ol';}out.push('<li>'+m[1]+'</li>');return;}
    if(!l.trim()){close();out.push('');return;}
    close();out.push('<p>'+l+'</p>');
  });
  close();
  var h=out.join('\n');
  h=h.replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<i>$2</i>').replace(/`([^`]+)`/g,'<code>$1</code>');
  h=h.replace(/\u0000(\d+)\u0000/g,function(_,i){return blocks[+i];});
  return h;
};

/* ---------------- Knovo chat widget (used by the side sheet and the workspace) ---------------- */
EV.kBubble=function(log,role,html,raw){
  var d=document.createElement('div');d.className='m '+role;
  if(role==='a')d.innerHTML='<div class="who"><img src="assets/knovo-logo.png" alt="">Knovo</div><div class="md">'+html+'</div>';
  else if(role==='sys')d.innerHTML=html;
  else{d.textContent=raw||'';}
  log.appendChild(d);log.scrollTop=log.scrollHeight;return d;
};
function limitBubble(log,ms){EV.kBubble(log,'sys','<b>Free Knovo limit reached.</b> Knovo unlocks again in <b>'+esc(LV.fmtWait(ms))+'</b>. Knovo Pro removes this wait. <div class="row" style="justify-content:center;margin-top:8px"><button class="btn sm teal" type="button" data-plans>See Knovo Pro</button></div>');}
/* Send one message in a conversation.
   conv: {turns:[], log:Element, mode?, onDone?}  text: string  img: File/Blob? (read with the in-browser scanner) */
EV.kSend=function(conv,text,img){
  text=String(text||'').trim();if(!text&&!img)return Promise.resolve();
  if(conv.busy)return Promise.resolve();
  if(!ST.profile){EV.kBubble(conv.log,'sys','<b>Sign in to use Knovo.</b> Knovo is free for signed-in students. <div class="row" style="justify-content:center;margin-top:8px"><a class="btn sm gold" href="#signin" data-close-sheet>Sign in</a></div>');return Promise.resolve();}
  var wait=LV.chatBlockedFor();if(wait){limitBubble(conv.log,wait);return Promise.resolve();}
  var u=EV.kBubble(conv.log,'u','',text||'(photo)');
  if(img){var im=document.createElement('img');im.alt='Your photo';im.src=URL.createObjectURL(img);u.insertBefore(im,u.firstChild);}
  var a=EV.kBubble(conv.log,'a','<span class="typing"><i></i><i></i><i></i></span> <span class="small muted">'+(img?'Reading your photo…':'Thinking…')+'</span>');
  var md=a.querySelector('.md');
  conv.busy=true;conv.ctl=new AbortController();if(conv.onBusy)conv.onBusy(true);
  var prep=img?LV.ocr(img,function(p){var sm=md.querySelector('.small');if(sm)sm.textContent='Reading your photo… '+p+'%';}).then(function(t){
      if(!t){var e=new Error('nothing read');e.code='noText';throw e;}
      md.innerHTML='<span class="typing"><i></i><i></i><i></i></span> <span class="small muted">Thinking…</span>';
      return (text?text+'\n\n':'')+'Question text read from my photo (the scanner can misread a few characters):\n'+t;
    },function(e){if(e&&e.code)throw e;var x=new Error('scanner');x.code='scanner';throw x;}):Promise.resolve(text);
  var asked=false;
  return prep.then(function(content){
    conv.turns.push({role:'user',content:content});asked=true;
    return EV.knovoAsk(conv.turns,{mode:conv.mode,ctx:conv.ctx,signal:conv.ctl.signal,onText:function(e){md.innerHTML=EV.md(e.text);conv.log.scrollTop=conv.log.scrollHeight;}});
  }).then(function(r){md.innerHTML=EV.md(r.text);conv.turns.push({role:'assistant',content:r.text});
    var acts=document.createElement('div');acts.className='acts';
    acts.innerHTML='<button type="button" data-k="Give me an exam-style answer to that, worth full marks.">Exam answer</button><button type="button" data-k="Test me with one quick question on this.">Test me</button><button type="button" data-kflash>Make flashcards</button>';
    a.appendChild(acts);
  }).catch(function(e){
    if(asked)conv.turns.pop();
    if(e&&e.code==='cancelled'){md.innerHTML='<span class="muted small">Stopped.</span>';return;}
    if(e&&e.code==='noText'){md.innerHTML='<p class="muted small">No clear printed text was found in that photo. Try a sharper, well-lit photo of printed text, or type the question.</p>';return;}
    if(e&&e.code==='limit'){a.remove();limitBubble(conv.log,e.msLeft||0);return;}
    if(e&&e.code==='auth'){EV.syncProfile();EV.paintProfile();md.innerHTML='<p class="muted small">Your session has expired. <a href="#signin" data-close-sheet>Sign in again</a> to keep using Knovo.</p>';return;}
    md.innerHTML='<p class="muted small">'+esc(EV.knovoErr(e))+'</p>';})
  .then(function(){conv.busy=false;if(conv.onBusy)conv.onBusy(false);if(conv.onDone)conv.onDone();conv.log.scrollTop=conv.log.scrollHeight;});
};
/* Turn the last Knovo answer into flashcards saved to the Knovo deck */
EV.kFlash=function(conv){
  var last=null;for(var i=conv.turns.length-1;i>=0;i--)if(conv.turns[i].role==='assistant'){last=conv.turns[i].content;break;}
  if(!last){EV.toast('Ask Knovo something first');return;}
  var b=EV.kBubble(conv.log,'sys','Making flashcards…');
  var ref=(conv.ctx||EV.ctx()).ref;
  var done=function(cards){
    cards=(cards||[]).filter(function(c){return c&&c.q&&c.a}).slice(0,6);
    cards.forEach(function(c){ST.kdeck.push({q:String(c.q),a:String(c.a),ref:ref,t:Date.now()});});EV.save();
    b.innerHTML='<b>'+cards.length+' flashcards saved</b> to your Knovo deck.<div class="row" style="justify-content:center;margin-top:6px"><a class="btn sm teal" href="#knovo" data-close-sheet>Open the deck</a></div>';
    if(EV.onDeckChange)EV.onDeckChange();
  };
  LV.askKnovo({system:'You turn a tutor explanation into exam flashcards for EduVerse students. Reply with JSON only.',
    contents:[{role:'user',parts:[{text:('Turn this tutor explanation into 3 to 5 exam flashcards. Return ONLY a JSON array of objects with "q" (a short question) and "a" (a short answer). No other text.\n\nExplanation:\n'+last).slice(0,7800)}]}]})
   .then(function(r){var t=String(r.text).replace(/```(?:json)?/gi,''),i=t.indexOf('['),j=t.lastIndexOf(']'),v=[];try{v=JSON.parse(i>=0&&j>i?t.slice(i,j+1):t);}catch(e){}
     if(!Array.isArray(v))v=(v&&v.cards)||[];if(!v.length){b.textContent='Knovo could not make flashcards from that answer. Try again.';return;}done(v);})
   .catch(function(e){b.textContent=EV.knovoErr(e);});
};
/* Delegated clicks for Knovo actions anywhere on the page */
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-plans]');if(t){e.preventDefault();EV.openPlans();return;}
  t=e.target.closest('[data-close]');if(t&&t.closest('.modal')){t.closest('.modal').hidden=true;return;}
  t=e.target.closest('[data-close-sheet]');if(t){EV.closeSheet();return;}
  t=e.target.closest('[data-ask]');if(t){e.preventDefault();EV.askKnovo(t.dataset.ask,t.dataset.askExtra);return;}
  t=e.target.closest('[data-k]');if(t){var conv=t.closest('#sheet')?SHEET:(EV.wsConv||SHEET);EV.kSend(conv,t.dataset.k);return;}
  t=e.target.closest('[data-kflash]');if(t){var conv2=t.closest('#sheet')?SHEET:(EV.wsConv||SHEET);EV.kFlash(conv2);return;}
});
EV.openPlans=function(){var m=$('#plans');m.hidden=false;var x=m.querySelector('.x');if(x)x.focus();};
$('#plans').addEventListener('click',function(e){if(e.target.id==='plans')e.currentTarget.hidden=true;});

/* Side sheet */
var SHEET={turns:[],log:null,ctx:null};
EV.SHEET=SHEET;
function sheetInit(){SHEET.log=$('#slog');SHEET.log.innerHTML='';EV.kBubble(SHEET.log,'a','<p>Hi! I can see what you\'re studying. Ask me anything about it.</p>');}
EV.openSheet=function(q,extra){
  if(EV.route.name==='knovo'&&EV.wsConv){if(q)EV.kSend(EV.wsConv,q);return;}
  var c=EV.ctx();if(extra)c.extra=extra;
  if(!SHEET.ctx||SHEET.ctx.label!==c.label){SHEET.turns=[];sheetInit();}
  SHEET.ctx=c;EV.paintCtx();
  var sh=$('#sheet');sh.classList.add('open');$('#scrim').classList.add('on');sh.setAttribute('aria-hidden','false');$('#dock').setAttribute('aria-expanded','true');
  if(q)EV.kSend(SHEET,q);
  setTimeout(function(){$('#sq').focus({preventScroll:true});},350);
};
EV.closeSheet=function(){var sh=$('#sheet');sh.classList.remove('open');$('#scrim').classList.remove('on');sh.setAttribute('aria-hidden','true');$('#dock').setAttribute('aria-expanded','false');};
EV.askKnovo=function(q,extra){EV.openSheet(q,extra);};
$('#dock').addEventListener('click',function(){EV.openSheet();});
$('#scrim').addEventListener('click',EV.closeSheet);
$('#sheetX').addEventListener('click',EV.closeSheet);
function autoGrow(ta){ta.style.height='auto';ta.style.height=Math.min(160,ta.scrollHeight)+'px';}
EV.autoGrow=autoGrow;
$('#sq').addEventListener('input',function(){autoGrow(this);});
$('#sq').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#sform').requestSubmit();}});
$('#sform').addEventListener('submit',function(e){e.preventDefault();var i=$('#sq');EV.kSend(SHEET,i.value);i.value='';autoGrow(i);});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){EV.closeSheet();$('#plans').hidden=true;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();EV.openSheet();}
});
sheetInit();

/* The home hero (Earth, slideshow, floating cards) lives in hero.js, which defines EV.mountHero. */

/* ---------------- Boot ---------------- */
EV.syncProfile();EV.paintXP();
EV.boot=function(){
  EV.load().then(function(){
    EV.syncFromLive();touchStreak();EV.ready=true;EV.syncToLive();EV.paintXP();
    /* confirm the session with Supabase (renewing it if needed), then check owner / Pro */
    LV.getSession().then(function(sess){
      if(!sess){if(ST.profile){ST.profile=null;EV.paintProfile();EV.render();}return;}
      LV.checkOwner().then(function(){EV.paintProfile();if(EV.route.name==='subject'||EV.route.name==='knovo')EV.render();});
    });
    var sp=$('#subjPick');
    EV.LEVELS.forEach(function(L){var g=document.createElement('optgroup');g.label=L.title.replace(/<[^>]+>/g,'');L.subjects.filter(function(o){return !o.soon}).forEach(function(o){var op=document.createElement('option');op.value=o.ref;op.textContent=o.s.icon+' '+o.s.name+' '+o.s.code;g.appendChild(op);});if(g.children.length)sp.appendChild(g);});
    sp.addEventListener('change',function(){var o=EV.BYREF[this.value];if(o)EV.go('overview-'+o.slug);});
    EV.paintProfile();EV.render();if(EV.paintBell)EV.paintBell();
  }).catch(function(err){if(window.console)console.error(err);$('#view').innerHTML='<div class="in page"><div class="empty"><b>The study library could not load.</b><span>Check your connection and reload the page.</span></div></div>';});
};
EV.paintProfile=function(){var b=$('#signBtn');if(!b)return;if(ST.profile){b.className='avatar';b.textContent=(ST.profile.name||'S').trim().charAt(0).toUpperCase();b.title='Signed in as '+ST.profile.name+(ST.profile.email?' ('+ST.profile.email+')':'');}else{b.className='btn gold sm';b.textContent='Sign in';b.removeAttribute('title');}};
/* keep in step with the old site open in another tab */
window.addEventListener('storage',function(e){
  if(!EV.ready)return;
  if(e.key==='ev_state_v1'){EV.syncFromLive();EV.paintXP();if(EV.paintBell)EV.paintBell();}
  if(e.key==='ev_auth_token'||e.key==='ev_auth_user'){EV.syncProfile();EV.paintProfile();EV.render();}
});
LV.onXP=function(){EV.paintXP();if(EV.route&&EV.route.name==='ranks')EV.render();};
})();
