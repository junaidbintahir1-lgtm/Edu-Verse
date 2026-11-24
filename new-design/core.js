/* EduVerse test build — core: data, saved progress, XP, router, Knovo AI engine, 3D hero.
   Everything a student does is saved in this browser only (localStorage key "evtest1"). */
(function(){
"use strict";
var EV=window.EV={};
var $=EV.$=function(s,r){return (r||document).querySelector(s)};
var $$=EV.$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var reduce=EV.reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
EV.fine=window.matchMedia('(pointer: fine)').matches;
var esc=EV.esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
EV.strip=function(h){var d=document.createElement('div');d.innerHTML=String(h||'');return d.textContent||'';};

/* ---------------- PDFs live in the public GitHub repo (read-only links) ---------------- */
var REPO='junaidbintahir1-lgtm/Edu-Verse';
function encPath(p){return p.split('/').map(encodeURIComponent).join('/');}
EV.pdfView=function(p){return 'https://github.com/'+REPO+'/blob/main/'+encPath(p);};
EV.pdfRaw=function(p){return 'https://raw.githubusercontent.com/'+REPO+'/main/'+encPath(p);};

/* ---------------- Saved progress ---------------- */
var KEY='evtest1';
var DEF=function(){return {v:1,xp:0,xpLog:[],streak:{last:'',count:0,days:[]},today:{d:'',q:0},goal:10,
  attempts:[],mistakes:[],cards:{},cardsSeen:[],topicsDone:[],mocks:[],lastTest:null,favs:[],recent:[],exam:{},
  chats:[],chatCur:'',kdeck:[],kn:{msgs:[],scans:[]},profile:null,notesSeen:[]};};
var ST;
try{ST=JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){ST=null;}
if(!ST||ST.v!==1)ST=DEF();
var d0=DEF();Object.keys(d0).forEach(function(k){if(ST[k]===undefined)ST[k]=d0[k];});
EV.ST=ST;
var saveT=null;
EV.save=function(){clearTimeout(saveT);saveT=setTimeout(function(){try{localStorage.setItem(KEY,JSON.stringify(ST));}catch(e){}},120);};
EV.resetAll=function(){var n=DEF();Object.keys(ST).forEach(function(k){delete ST[k];});Object.assign(ST,n);try{localStorage.removeItem(KEY);}catch(e){}EV.toast('Progress reset on this device');EV.render();};

function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
EV.today=today;
function dayDiff(a,b){return Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5);}

/* ---------------- XP (same rules as the live site) ---------------- */
var XPR=EV.XPR={topic:50,question:10,correct:5,card:3,streak:20,mock:100};
EV.addXP=function(amt,why){if(!amt)return;ST.xp+=amt;ST.xpLog.push({a:amt,w:why,t:Date.now()});if(ST.xpLog.length>400)ST.xpLog=ST.xpLog.slice(-400);EV.save();EV.paintXP();};
EV.level=function(xp){return Math.floor(Math.sqrt(xp/60))+1;};
EV.levelProgress=function(xp){var l=EV.level(xp),cur=60*Math.pow(l-1,2),nxt=60*Math.pow(l,2);return {l:l,pct:Math.min(100,Math.round(100*(xp-cur)/Math.max(1,nxt-cur))),next:nxt};};
EV.weekXP=function(){var wk=Date.now()-7*864e5;return ST.xpLog.filter(function(x){return x.t>=wk}).reduce(function(s,x){return s+x.a},0);};
EV.paintXP=function(){var n=$('#xpNum');if(n)n.textContent=ST.xp+' XP · Lv '+EV.level(ST.xp);};
function touchStreak(){
  var t=today();if(ST.streak.last===t)return;
  if(ST.streak.last&&dayDiff(ST.streak.last,t)===1)ST.streak.count++;else ST.streak.count=1;
  ST.streak.last=t;ST.streak.days.push(t);if(ST.streak.days.length>60)ST.streak.days=ST.streak.days.slice(-60);
  EV.addXP(XPR.streak,'streak');
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
  EV.addXP(XPR.question+(ok?XPR.correct:0),'question');
  var ex=ST.mistakes.find(function(m){return m.id===q.id});
  if(!ok){
    if(ex){ex.resolved=false;ex.misses=(ex.misses||1)+1;ex.t=Date.now();}
    else ST.mistakes.unshift({id:q.id,ref:q.ref,q:q.q,a:q.a||'',steps:q.steps||[],src:q.src||'Practice',t:Date.now(),resolved:false,misses:1});
  }else if(ex&&!ex.resolved){ex.resolved=true;ex.rt=Date.now();}
  EV.save();
  EV.toast(ok?(ex&&ex.resolved&&!first?'Mistake resolved · ':'Correct · ')+'+'+(XPR.question+XPR.correct)+' XP':'Saved to your Mistakes notebook · +'+XPR.question+' XP');
};
EV.lastResult=function(id){for(var i=ST.attempts.length-1;i>=0;i--)if(ST.attempts[i].id===id)return ST.attempts[i].ok;return null;};
EV.accuracy=function(ref){var a=ST.attempts.filter(function(x){return !ref||x.ref===ref});if(!a.length)return null;return {n:a.length,pct:Math.round(100*a.filter(function(x){return x.ok}).length/a.length)};};
EV.completeTopic=function(key,ref){if(ST.topicsDone.indexOf(key)>=0){ST.topicsDone=ST.topicsDone.filter(function(k){return k!==key});EV.save();EV.toast('Marked as not learned (XP stays earned)');return false;}
  ST.topicsDone.push(key);EV.addXP(XPR.topic,'topic');EV.toast('Topic complete · +'+XPR.topic+' XP');return true;};
EV.reviewCard=function(key,ok){var c=ST.cards[key]||{lv:0,n:0};c.n++;c.lv=ok?Math.min(4,c.lv+1):0;c.t=Date.now();ST.cards[key]=c;if(ST.cardsSeen.indexOf(key)<0)ST.cardsSeen.push(key);EV.addXP(XPR.card,'card');};
EV.touchRecent=function(ref){ST.recent=[ref].concat(ST.recent.filter(function(r){return r!==ref})).slice(0,8);EV.save();};
EV.toggleFav=function(ref){var i=ST.favs.indexOf(ref);if(i>=0)ST.favs.splice(i,1);else ST.favs.push(ref);EV.save();return i<0;};

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
EV.load=function(){
  var names=['hub','deep','resources','db','extra'];
  return Promise.all(names.map(function(n){return fetch('data/'+n+'.json').then(function(r){if(!r.ok)throw new Error(n);return r.json();});})).then(function(a){
    names.forEach(function(n,i){EV.D[n]=a[i];});
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
    var m=EV.D.db.subjects.find(function(x){return x.id==='olm4024'});
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
EV.render=function(){
  var r=EV.parse();EV.route=r;
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
var K=EV.K={sample:null,checked:false,images:false};
EV.kReady=(window.claude&&window.claude.use?window.claude.use('sample'):Promise.resolve(null)).then(function(s){
  K.sample=s;K.checked=true;
  if(s&&s.limits)return s.limits().then(function(l){K.images=!!(l&&l.images);K.imgTypes=l&&l.images&&l.images.mediaTypes||[];}).catch(function(){});
}).catch(function(){K.checked=true;}).then(function(){if(EV.onKnovoReady)EV.onKnovoReady();});

function notesText(o,max){
  if(!o)return '';var out='';
  EV.notesOf(o).forEach(function(n){out+='## '+EV.strip(n.t)+'\n'+EV.strip(n.b)+'\n\n';});
  if(o.s.fmt)out+='## How the questions come\n'+EV.strip(o.s.fmt)+'\n';
  return out.slice(0,max||9000);
}
EV.knovoRules=function(c,mode){
  var o=c.ref?EV.BYREF[c.ref]:null;
  var r='You are Knovo, the study tutor inside EduVerse, a revision site for Cambridge O Level, IGCSE, International AS & A Level and Pearson Edexcel International A Level students (many in Pakistan). '+
  'Be warm, clear and exam-focused. Use the syllabus\'s own terms and command words. For calculations show formula, substitution, then the answer with units. '+
  'Keep answers short enough to read on a phone unless the student asks for depth. Use simple Markdown: short paragraphs, **bold** key terms, bullet or numbered lists, and `code` for equations if useful. '+
  'Never claim to be an official examiner; marks you give are study guidance. If you are unsure of a syllabus detail, say so.\n\n';
  r+='The student is currently on: '+c.label+'.\n';
  if(o)r+='Subject: '+o.s.name+' '+o.s.code+' ('+o.s.board+'). Paper pattern: '+(o.s.papers||[]).map(function(p){return p.p+' '+(p.n||'')+' ('+(p.t||'')+', '+(p.m||'')+')';}).join('; ')+'.\n';
  if(c.topic){var t=c.topic;r+='Topic: '+t.name+'. Objectives: '+(t.obj||[]).join('; ')+'. Summary: '+(t.summary||[]).join('; ')+'.\n';}
  if(c.extra)r+='What is on screen: '+c.extra+'\n';
  if(o)r+='\nEduVerse short notes for this subject (use them as your main reference):\n'+notesText(o,8000)+'\n';
  var M={
    mark:'MODE: Mark my answer. The student will give a question (with marks if known) and their answer. Mark it point by point like a Cambridge/Edexcel mark scheme: list each creditworthy point with ✓ or ✗, give a total like "4/6", then show the single change that would gain the most marks, and finish with a model answer.',
    scan:'MODE: Scan a question. The student sends a photo of an exam question. First write out the question as you read it, then solve it step by step with method marks shown, then give the final answer.',
    lesson:'MODE: Live Lesson. Teach the requested topic as a short guided lesson: give part 1 (a short explanation with one example), then ask ONE quick check question and stop. When the student answers, tell them if they are right, explain briefly, then continue with the next part. Three parts in total, then a 3-bullet recap.',
    plan:'MODE: Recovery and revision planning. Build a clear, realistic plan with days or weeks, specific topics and actions, and short reasons.'
  };
  if(M[mode])r+='\n'+M[mode]+'\n';
  return r;
};
/* turns: [{role,content}] ending with user. Returns promise of text. */
EV.knovoAsk=function(turns,opts){
  opts=opts||{};
  var c=opts.ctx||EV.ctx();
  var rules=EV.knovoRules(c,opts.mode);
  var input=turns.map(function(t,i){return {role:t.role,content:i===0?rules+'\n---\nStudent: '+t.content:t.content};});
  if(!K.sample)return Promise.resolve({text:EV.offlineAnswer(turns[turns.length-1].content,c),offline:true});
  var o={cache:false,onText:opts.onText,signal:opts.signal};
  if(opts.images&&opts.images.length)o.images=opts.images;
  return K.sample(input,o).then(function(r){return {text:r.text,truncated:r.truncated};});
};
EV.knovoErr=function(e){
  var c=e&&e.code;
  return {not_granted:'Knovo needs your permission to use Claude in this page. Allow it when asked, or turn it on from the page\'s permissions.',
    rate_limited:'Knovo is getting a lot of questions right now. Wait a few seconds and try again.',
    prompt_too_large:'That message is too long. Try a shorter question.',
    images_unavailable:'Photo scanning is not available in this view.',
    image_rejected:'That image could not be read. Try a clearer, smaller photo.',
    refused:'Knovo can\'t help with that request. Try asking about your syllabus.',
    session_expired:'Your Claude session expired. Reload the page and try again.'}[c]||'Knovo could not answer just now. Try again in a moment.';
};
/* Offline fallback: search the subject's notes for the best section */
EV.offlineAnswer=function(q,c){
  var words=String(q).toLowerCase().match(/[a-z]{4,}/g)||[];
  var pool=c.ref?[EV.BYREF[c.ref]]:EV.SUBJ.filter(function(o){return !o.soon});
  var best=null,bs=0;
  pool.forEach(function(o){EV.notesOf(o).forEach(function(n){var txt=(EV.strip(n.t)+' '+EV.strip(n.b)).toLowerCase(),s=0;words.forEach(function(w){if(txt.indexOf(w)>=0)s++;});if(s>bs){bs=s;best={o:o,n:n};}});});
  var head='**Knovo\'s live AI turns on when this test build is opened inside Claude.** Your real site uses your own Knovo service.\n\n';
  if(best&&bs>0){var body=EV.strip(best.n.b);return head+'Here is the closest section from the EduVerse notes for **'+best.o.s.name+' '+best.o.s.code+'**:\n\n**'+EV.strip(best.n.t)+'**\n\n'+body.slice(0,900)+(body.length>900?'…':'');}
  return head+'I could not find a matching section in the notes. Try naming the topic, for example "electrolysis" or "SUVAT".';
};
/* Free allowance: 20 messages + 5 photo scans per 3 hours (same as the live plan copy) */
EV.allowance=function(){var w=Date.now()-3*36e5;ST.kn.msgs=ST.kn.msgs.filter(function(t){return t>w});ST.kn.scans=ST.kn.scans.filter(function(t){return t>w});return {m:ST.kn.msgs.length,s:ST.kn.scans.length,mMax:20,sMax:5};};
EV.useAllowance=function(scan){var a=EV.allowance();if(a.m>=a.mMax||(scan&&a.s>=a.sMax))return false;ST.kn.msgs.push(Date.now());if(scan)ST.kn.scans.push(Date.now());EV.save();return true;};
EV.resetAllowance=function(){ST.kn={msgs:[],scans:[]};EV.save();};

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
/* Send one message in a conversation.
   conv: {turns:[], log:Element, mode?, onDone?}  text: string  img: Blob? */
EV.kSend=function(conv,text,img){
  text=String(text||'').trim();if(!text&&!img)return Promise.resolve();
  if(conv.busy)return Promise.resolve();
  if(!EV.useAllowance(!!img)){
    var a=EV.allowance();
    var b=EV.kBubble(conv.log,'sys','<b>Free allowance used.</b> Knovo Free includes 20 messages and 5 photo scans every 3 hours ('+a.m+'/20 messages, '+a.s+'/5 scans used). <div class="row" style="justify-content:center;margin-top:8px"><button class="btn sm teal" type="button" data-plans>See Knovo Pro</button><button class="btn sm" type="button" data-reset-allow>Reset allowance (test build)</button></div>');
    return Promise.resolve();
  }
  var u=EV.kBubble(conv.log,'u','',text||'(photo)');
  if(img){var im=document.createElement('img');im.alt='Your photo';im.src=URL.createObjectURL(img);u.insertBefore(im,u.firstChild);}
  conv.turns.push({role:'user',content:text||'Please read and solve the question in this photo.'});
  var a=EV.kBubble(conv.log,'a','<span class="typing"><i></i><i></i><i></i></span> <span class="small muted">Thinking…</span>');
  var md=a.querySelector('.md');
  conv.busy=true;conv.ctl=new AbortController();if(conv.onBusy)conv.onBusy(true);
  return EV.knovoAsk(conv.turns,{mode:conv.mode,ctx:conv.ctx,images:img?[img]:null,signal:conv.ctl.signal,onText:function(e){md.innerHTML=EV.md(e.text);conv.log.scrollTop=conv.log.scrollHeight;}})
  .then(function(r){md.innerHTML=EV.md(r.text);conv.turns.push({role:'assistant',content:r.text});
    var acts=document.createElement('div');acts.className='acts';
    acts.innerHTML='<button type="button" data-k="Give me an exam-style answer to that, worth full marks.">Exam answer</button><button type="button" data-k="Test me with one quick question on this.">Test me</button><button type="button" data-kflash>Make flashcards</button>';
    a.appendChild(acts);
    if(r.truncated)EV.kBubble(conv.log,'sys','That answer was cut short. Ask Knovo to continue.');
  })
  .catch(function(e){conv.turns.pop();if(e&&e.code==='cancelled'){md.innerHTML=e.text?EV.md(e.text):'<span class="muted small">Stopped.</span>';return;}
    md.innerHTML=(e&&e.text?EV.md(e.text):'')+'<p class="muted small">'+esc(EV.knovoErr(e))+'</p>';})
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
  if(!K.sample){var body=last.split('\n').filter(function(l){return l.trim()&&!/live AI|closest section|could not find/i.test(l)}),title=(body.shift()||'').replace(/\*/g,'');var parts=EV.strip(EV.md(body.join(' '))).split(/(?<=[.!?])\s+|\.(?=[A-Z])/).map(function(x){return x.trim()}).filter(function(x){return x.length>25}).slice(0,4);done(parts.map(function(p){var cut=p.split(/[:—=]/);return cut.length>1&&cut[0].length<60?{q:(title?title+': ':'')+cut[0].trim()+'?',a:cut.slice(1).join(':').trim()}:{q:'Complete this point'+(title?' from '+title:'')+': '+p.split(' ').slice(0,5).join(' ')+'…',a:p};}));return;}
  K.sample.json('Turn this tutor explanation into 3 to 5 exam flashcards. Return ONLY a JSON array of objects with "q" (a short question) and "a" (a short answer).\n\nExplanation:\n'+last,{modelTier:'quick',cache:false})
   .then(function(v){done(Array.isArray(v)?v:(v&&v.cards)||[]);})
   .catch(function(e){b.textContent=EV.knovoErr(e);});
};
/* Delegated clicks for Knovo actions anywhere on the page */
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-plans]');if(t){e.preventDefault();EV.openPlans();return;}
  t=e.target.closest('[data-reset-allow]');if(t){EV.resetAllowance();EV.toast('Allowance reset');t.closest('.m').remove();return;}
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

/* ---------------- 3D hero (Three.js): the EduVerse "knowledge planet" ----------------
   A navy planet covered in real formulas, wearing the EduVerse graduation cap.
   Gold orbit = O Level & IGCSE (with orbiting study books), teal orbit = A Level & Edexcel (with Knovo's star). */
EV.mountHero=function(scene){
  if(typeof THREE==='undefined')return null;
  var test=document.createElement('canvas');
  if(!(test.getContext('webgl')||test.getContext('experimental-webgl')))return null;
  try{
  var R=new THREE.WebGLRenderer({antialias:true,alpha:true});
  R.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  scene.appendChild(R.domElement);scene.classList.add('gl');
  var S=new THREE.Scene(),cam=new THREE.PerspectiveCamera(40,1,.1,100);cam.position.set(0,0,8.2);
  var world=new THREE.Group();world.position.y=-.2;S.add(world);
  var GOLD=0xf0b429,TEAL=0x2fe0cd,PR=1.38;

  /* lights */
  S.add(new THREE.AmbientLight(0x8fa6d6,.55));
  var key=new THREE.DirectionalLight(0xffffff,.75);key.position.set(3,5,5);S.add(key);
  var rim=new THREE.PointLight(TEAL,.6,14);rim.position.set(-4,-1.5,2.5);S.add(rim);
  var warm=new THREE.PointLight(GOLD,.7,12);warm.position.set(4,2.5,-1);S.add(warm);

  /* planet core: lit navy sphere (EduVerse disc colour) */
  var planet=new THREE.Group();world.add(planet);
  planet.add(new THREE.Mesh(new THREE.SphereGeometry(PR,64,64),new THREE.MeshStandardMaterial({color:0x0c2a63,emissive:0x030a1e,roughness:.8,metalness:.15})));

  /* surface: a canvas of real formulas, symbols and a lat/long grid */
  var tc=document.createElement('canvas');tc.width=2048;tc.height=1024;var tx=tc.getContext('2d');
  tx.strokeStyle='rgba(47,224,205,.22)';tx.lineWidth=2;
  for(var la=1;la<8;la++){tx.beginPath();tx.moveTo(0,la*128);tx.lineTo(2048,la*128);tx.stroke();}
  for(var lo=0;lo<16;lo++){tx.beginPath();tx.moveTo(lo*128,0);tx.lineTo(lo*128,1024);tx.stroke();}
  var F=['F = ma','E = mc²','v = u + at','P = IV','V = IR','Q = mcΔθ','p = mv','W = Fd','λ = v/f','n = m/M','pH = −log[H⁺]','Cu²⁺ + 2e⁻ → Cu','H₂O','NaCl','CO₂','C₆H₁₂O₆','ATP','DNA','6CO₂ + 6H₂O','y = mx + c','a² + b² = c²','πr²','sin θ','∫ f(x) dx','dy/dx','Σ','√2','x = (−b ± √Δ)/2a','log₂','P(A∩B)','GDP','PED','Assets = Capital + Liabilities','PV = nRT','10ⁿ','HCF · LCM','IF … THEN','01001','≈','∞','Δ','θ','μ','Ω'];
  var seed=11;function rnd(){seed=(seed*9301+49297)%233280;return seed/233280;}
  /* formulas laid out in tidy latitude bands so they never overlap */
  var fi=0,bands=[250,345,440,535,630,725,815];
  bands.forEach(function(y,bi){var sz=(bi===0||bi===bands.length-1)?22:27;tx.font='600 '+sz+'px "JetBrains Mono", ui-monospace, monospace';
    var x=20+(bi%2)*110;
    while(true){var f=F[fi%F.length],w=tx.measureText(f).width;if(x+w>2028)break;fi++;
      var c=(fi*7)%10;tx.fillStyle=c<4?'rgba(255,196,64,.88)':c<8?'rgba(127,245,232,.72)':'rgba(236,238,232,.6)';
      tx.fillText(f,x,y);x+=w+90+rnd()*70;}});
  var tex=new THREE.CanvasTexture(tc);tex.anisotropy=4;
  planet.add(new THREE.Mesh(new THREE.SphereGeometry(PR+.012,64,64),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false})));
  /* fine atmosphere dots */
  var N=1400,pos=new Float32Array(N*3);
  for(var i=0;i<N;i++){var yy=1-(i/(N-1))*2,rr=Math.sqrt(1-yy*yy),th=i*2.399963,ra=PR+.07;pos[i*3]=Math.cos(th)*rr*ra;pos[i*3+1]=yy*ra;pos[i*3+2]=Math.sin(th)*rr*ra;}
  var ag=new THREE.BufferGeometry();ag.setAttribute('position',new THREE.BufferAttribute(pos,3));
  planet.add(new THREE.Points(ag,new THREE.PointsMaterial({size:.022,color:0x7fd8ff,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending})));
  /* glow halo */
  var gc=document.createElement('canvas');gc.width=gc.height=256;var gx=gc.getContext('2d'),grd=gx.createRadialGradient(128,128,50,128,128,128);
  grd.addColorStop(0,'rgba(60,140,255,.5)');grd.addColorStop(.55,'rgba(47,224,205,.12)');grd.addColorStop(1,'rgba(0,0,0,0)');gx.fillStyle=grd;gx.fillRect(0,0,256,256);
  var glow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(gc),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));glow.scale.set(5.4,5.4,1);glow.position.y=world.position.y;S.add(glow);

  /* the EduVerse graduation cap sitting on the planet */
  var cap=new THREE.Group();
  var white=new THREE.MeshStandardMaterial({color:0xf3f1ea,roughness:.55});
  var shade=new THREE.MeshStandardMaterial({color:0xd9d6cc,roughness:.7});
  var goldM=new THREE.MeshStandardMaterial({color:GOLD,emissive:0x6b4a00,roughness:.35,metalness:.6});
  var board=new THREE.Mesh(new THREE.BoxGeometry(1.55,.07,1.55),white);board.rotation.y=Math.PI/4;board.position.y=.2;cap.add(board);
  var skull=new THREE.Mesh(new THREE.CylinderGeometry(.5,.58,.42,40,1,true),shade);skull.material.side=THREE.DoubleSide;cap.add(skull);
  var band=new THREE.Mesh(new THREE.CylinderGeometry(.585,.6,.07,40,1,true),new THREE.MeshStandardMaterial({color:0x123e86,roughness:.6,side:THREE.DoubleSide}));band.position.y=-.17;cap.add(band);
  var btn=new THREE.Mesh(new THREE.SphereGeometry(.06,16,16),goldM);btn.position.y=.26;cap.add(btn);
  var tcurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,.26,0),new THREE.Vector3(.55,.25,0),new THREE.Vector3(1.04,.22,0),new THREE.Vector3(1.1,.0,0),new THREE.Vector3(1.1,-.42,0)]);
  cap.add(new THREE.Mesh(new THREE.TubeGeometry(tcurve,40,.018,8,false),goldM));
  var tuft=new THREE.Mesh(new THREE.CylinderGeometry(.04,.1,.26,16),goldM);tuft.position.set(1.1,-.55,0);cap.add(tuft);
  cap.scale.setScalar(.92);cap.position.set(0,PR+.1,0);cap.rotation.set(.12,.5,-.16);world.add(cap);

  /* orbits */
  function ring(rad,color,op,tiltX,tiltZ){
    var pts=[];for(var q=0;q<=180;q++){var a=q/180*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*rad,0,Math.sin(a)*rad));}
    var grp=new THREE.Group();grp.rotation.x=tiltX;grp.rotation.z=tiltZ;
    grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:color,transparent:true,opacity:op})));
    var spin=new THREE.Group();grp.add(spin);world.add(grp);return {spin:spin,rad:rad};
  }
  var r1=ring(2.05,GOLD,.6,.3,-.16),r2=ring(2.5,TEAL,.4,-.2,.26);

  /* study books orbiting on the gold (O Level / IGCSE) ring */
  var books=[];
  [[0x1d5fd0,.9],[0xf0b429,2.5],[0x16a394,4.1],[0xc2553f,5.5]].forEach(function(b){
    var g=new THREE.Group();
    var cover=new THREE.Mesh(new THREE.BoxGeometry(.3,.4,.085),new THREE.MeshStandardMaterial({color:b[0],roughness:.5}));g.add(cover);
    var pages=new THREE.Mesh(new THREE.BoxGeometry(.27,.37,.07),new THREE.MeshStandardMaterial({color:0xf6f3ea,roughness:.9}));pages.position.x=.025;g.add(pages);
    var spine=new THREE.Mesh(new THREE.BoxGeometry(.02,.41,.09),goldM);spine.position.x=-.15;g.add(spine);
    g.position.set(Math.cos(b[1])*r1.rad,0,Math.sin(b[1])*r1.rad);g.rotation.set(.3,b[1],.2);r1.spin.add(g);books.push(g);});

  /* Knovo's gold four-point star on the teal (A Level / Edexcel) ring */
  var sh=new THREE.Shape();for(var s=0;s<8;s++){var ang=s/8*Math.PI*2-Math.PI/2,rad=s%2?.075:.24;var px=Math.cos(ang)*rad,py=Math.sin(ang)*rad;if(s)sh.lineTo(px,py);else sh.moveTo(px,py);}sh.closePath();
  var star=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.05,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:2}),new THREE.MeshStandardMaterial({color:0xffc83d,emissive:0x8a5e00,roughness:.3,metalness:.5}));
  star.position.set(Math.cos(1.6)*r2.rad,0,Math.sin(1.6)*r2.rad);r2.spin.add(star);
  var sg2=new THREE.Sprite(new THREE.SpriteMaterial({map:glow.material.map,color:0xffd36b,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.8}));sg2.scale.set(.9,.9,1);star.add(sg2);

  /* subject label anchors: gold tags ride the gold ring, teal tags the teal ring */
  var tags=$$('.tagSub',scene),anchors=[];
  tags.forEach(function(t){var isT=t.classList.contains('t'),rg=isT?r2:r1,list=tags.filter(function(x){return x.classList.contains('t')===isT}),idx=list.indexOf(t),a=idx/list.length*Math.PI*2+(isT?2.6:.1);
    var o=new THREE.Object3D();o.position.set(Math.cos(a)*rg.rad,0,Math.sin(a)*rg.rad);rg.spin.add(o);anchors.push(o);});

  /* drifting formula fragments + stars in the background */
  var drift=new THREE.Group();S.add(drift);
  ['E = mc²','F = ma','πr²','DNA','Cu²⁺','dy/dx','Σ','pH 7'].forEach(function(f,j){
    var c2=document.createElement('canvas');c2.width=256;c2.height=64;var x2=c2.getContext('2d');x2.font='600 30px "JetBrains Mono", monospace';x2.fillStyle=j%2?'rgba(240,180,41,.9)':'rgba(127,245,232,.9)';x2.textAlign='center';x2.fillText(f,128,42);
    var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c2),transparent:true,depthWrite:false,opacity:.28}));
    var a=j/8*Math.PI*2,rad=3.6+(j%3)*.5;sp.position.set(Math.cos(a)*rad,(j%2?1:-1)*(.8+(j%3)*.6),Math.sin(a)*rad-1.5);sp.scale.set(1.1,.28,1);drift.add(sp);});
  var SN=700,stp=new Float32Array(SN*3);for(var j=0;j<SN;j++){var v=new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(14+Math.random()*16);stp[j*3]=v.x;stp[j*3+1]=v.y;stp[j*3+2]=v.z;}
  var stg=new THREE.BufferGeometry();stg.setAttribute('position',new THREE.BufferAttribute(stp,3));
  var stars=new THREE.Points(stg,new THREE.PointsMaterial({size:.06,color:0x9fb3d1,transparent:true,opacity:.7,depthWrite:false}));S.add(stars);

  var W=0,H=0,alive=true;
  function resize(){var rc=R.domElement.getBoundingClientRect();W=rc.width;H=rc.height;if(!W||!H)return;R.setSize(W,H,false);cam.aspect=W/H;cam.updateProjectionMatrix();var sc=W<520?.84:1;world.scale.set(sc,sc,sc);}
  window.addEventListener('resize',resize);resize();
  var mx=0,my=0;function mm(e){mx=e.clientX/window.innerWidth-.5;my=e.clientY/window.innerHeight-.5;}
  if(EV.fine)window.addEventListener('mousemove',mm);
  var visible=true,io=null;
  if('IntersectionObserver' in window){io=new IntersectionObserver(function(es){visible=es[0].isIntersecting;});io.observe(scene);}
  var v3=new THREE.Vector3(),wp=new THREE.Vector3(),cen=new THREE.Vector3();
  /* labels: nearest first; a label that would overlap a nearer one (or sits behind the planet) fades out */
  var sizes=null;
  function placeTags(){
    planet.getWorldPosition(cen);
    if(!sizes||!sizes[0].w)sizes=tags.map(function(t){return {w:t.offsetWidth,h:t.offsetHeight};});
    var L=[];
    for(var i=0;i<tags.length;i++){
      anchors[i].getWorldPosition(wp);v3.copy(wp).project(cam);
      var x=(v3.x*.5+.5)*W-40,y=(-v3.y*.5+.5)*H-40;
      var depth=(wp.z-cen.z+2.9)/5.8,sc=.84+depth*.24,w=sizes[i].w*sc,h=sizes[i].h*sc;
      var behind=wp.z<cen.z-.15&&Math.hypot(wp.x-cen.x,wp.y-cen.y)<PR*world.scale.x*1.1;
      L.push({i:i,x:x,y:y,w:w,h:h,d:depth,sc:sc,behind:behind});
    }
    L.sort(function(a,b){return b.d-a.d});
    var placed=[];
    L.forEach(function(o){
      var t=tags[o.i],hit=o.behind||o.x-o.w/2<-30||o.x+o.w/2>W-50;
      if(!hit)for(var k=0;k<placed.length;k++){var p=placed[k];if(Math.abs(o.x-p.x)<(o.w+p.w)/2+8&&Math.abs(o.y-p.y)<(o.h+p.h)/2+6){hit=true;break;}}
      if(!hit)placed.push(o);
      t.style.transform='translate('+(o.x-sizes[o.i].w/2).toFixed(1)+'px,'+(o.y-sizes[o.i].h/2).toFixed(1)+'px) scale('+o.sc.toFixed(3)+')';
      t.style.opacity=hit?'0':String(Math.min(1,.55+o.d*.6).toFixed(2));
      t.style.pointerEvents=hit?'none':'auto';
      t.style.zIndex=String(Math.round(o.d*10)+3);
    });
  }
  var t0=performance.now();
  function frame(now){
    if(!alive)return;
    var t=(now-t0)/1000;
    if(visible){
      planet.rotation.y=t*.07;
      r1.spin.rotation.y=t*.12;r2.spin.rotation.y=-t*.08;
      books.forEach(function(b,i){b.rotation.y+=.012;b.rotation.x=.3+Math.sin(t+i)*.15;});
      star.rotation.z=t*1.2;star.rotation.y=Math.sin(t*.8)*.6;
      cap.position.y=PR+.1+Math.sin(t*1.4)*.035;cap.rotation.z=-.16+Math.sin(t*.9)*.04;
      drift.rotation.y=-t*.02;stars.rotation.y=t*.004;
      world.rotation.x+=((my*.22)-world.rotation.x)*.04;world.rotation.y+=((mx*.4)-world.rotation.y)*.04;
      R.render(S,cam);placeTags();}
    if(!reduce)requestAnimationFrame(frame);
  }
  if(reduce){r1.spin.rotation.y=.5;r2.spin.rotation.y=-.4;R.render(S,cam);placeTags();}else requestAnimationFrame(frame);
  return function(){alive=false;window.removeEventListener('resize',resize);window.removeEventListener('mousemove',mm);if(io)io.disconnect();R.dispose();};
  }catch(err){if(window.console)console.error(err);scene.classList.remove('gl');return null;}
};

/* ---------------- Boot ---------------- */
touchStreak();EV.paintXP();
EV.boot=function(){
  EV.load().then(function(){
    var sp=$('#subjPick');
    EV.LEVELS.forEach(function(L){var g=document.createElement('optgroup');g.label=L.title.replace(/<[^>]+>/g,'');L.subjects.filter(function(o){return !o.soon}).forEach(function(o){var op=document.createElement('option');op.value=o.ref;op.textContent=o.s.icon+' '+o.s.name+' '+o.s.code;g.appendChild(op);});if(g.children.length)sp.appendChild(g);});
    sp.addEventListener('change',function(){var o=EV.BYREF[this.value];if(o)EV.go('overview-'+o.slug);});
    EV.paintProfile();EV.render();if(EV.paintBell)EV.paintBell();
  }).catch(function(err){$('#view').innerHTML='<div class="in page"><div class="empty"><b>The study library could not load.</b><span>Reload the page to try again.</span></div></div>';});
};
EV.paintProfile=function(){var b=$('#signBtn');if(!b)return;if(ST.profile){b.className='avatar';b.textContent=(ST.profile.name||'S').trim().charAt(0).toUpperCase();b.title='Signed in as '+ST.profile.name+' (test build)';}else{b.className='btn gold sm';b.textContent='Sign in';b.removeAttribute('title');}};
})();
