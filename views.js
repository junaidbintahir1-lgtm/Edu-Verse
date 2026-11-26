/* EduVerse new design — views part 1: home, subjects, level, subject hub (all tabs), topic engine */
(function(){
"use strict";
var EV=window.EV,$=EV.$,$$=EV.$$,esc=EV.esc,ST=EV.ST,V=EV.views;
var QREG=EV.QREG={};

/* ---------- shared components ---------- */
function plainTitle(s){return String(s||'').replace(/<[^>]+>/g,'');}
EV.subjCard=function(o,extra){
  var s=o.s,fav=ST.favs.indexOf(o.ref)>=0;
  if(o.soon)return '<a class="subj" href="#level-'+o.level.slug+'"><span class="ic">'+s.icon+'</span><b>'+esc(s.name)+'</b><span>'+esc(s.fullName||'')+'</span><span class="pill">Coming soon</span></a>';
  var acc=EV.accuracy(o.ref);
  return '<a class="subj" href="#overview-'+o.slug+'"><button class="fav'+(fav?' on':'')+'" type="button" data-fav="'+o.ref+'" aria-label="'+(fav?'Remove from':'Add to')+' favourites" aria-pressed="'+fav+'">'+(fav?'♥':'♡')+'</button><span class="ic">'+s.icon+'</span><b>'+esc(s.name)+' <span class="code muted">'+esc(s.code)+'</span></b><span>'+esc(s.board)+(acc?' · '+acc.pct+'% accuracy':'')+'</span>'+(extra?'<p>'+esc(extra)+'</p>':'')+'</a>';
};
function pdfLabel(f){var m=String(f).match(/^resources\/[A-Za-z]+_(OLevel|IGCSE|Shared)(?:_(\d{4}))?\//);if(!m)return '';return m[1]==='Shared'?'Shared folder':(m[1]==='OLevel'?'O Level':'IGCSE')+(m[2]?' '+m[2]:'');}
/* A paid file shown to someone without a plan: the name and what it is, but no way to open it. */
EV.pdfLockRow=function(it,photo){
  return '<div class="pdf lock"><div class="ico'+(photo?' ph':'')+'" aria-hidden="true">'+(photo?'<img src="'+esc(photo)+'" alt="" loading="lazy">':'🔒')+'</div><div><b>'+esc(it.t)+'</b><span>'+esc(it.d||'')+'</span></div><div class="acts"><span class="pill gold">Plan holders</span></div></div>';
};
EV.pdfRow=function(it){var lb=pdfLabel(it.f);
  return '<div class="pdf"><div class="ico">PDF</div><div><b>'+esc(it.t)+(lb?' <span class="pill" style="vertical-align:middle">'+esc(lb)+'</span>':'')+'</b><span>'+esc(it.d||'')+'</span></div><div class="acts">'+(EVLive.isPaidPath(it.f)?'<button class="btn sm gold" type="button" data-paid="'+esc(it.f)+'">Open</button><button class="btn sm" type="button" data-paid="'+esc(it.f)+'" data-dl="1">Download</button>':'<a class="btn sm gold" href="'+EV.pdfView(it.f)+'" target="_blank" rel="noopener">Open</a><a class="btn sm" href="'+EV.pdfRaw(it.f)+'" target="_blank" rel="noopener">Download</a>')+'</div></div>';
};
var DIFF={0:'Easy',1:'Medium',2:'Hard'};
EV.qCard=function(q,n){
  QREG[q.id]=q;
  var last=EV.lastResult(q.id);
  var h='<article class="q'+(last===true?' got':last===false?' miss':'')+'" data-q="'+esc(q.id)+'"><div class="qh">';
  h+='<span class="pill gold">'+esc(q.kind||'Question')+(n?' '+n:'')+'</span>';
  if(q.marks)h+='<span class="pill">'+q.marks+' marks</span>';
  if(q.diff!=null&&DIFF[q.diff])h+='<span class="pill">'+DIFF[q.diff]+'</span>';
  if(q.t)h+='<span class="small muted">'+esc(q.t)+'</span>';
  if(last!==null)h+='<span class="pill '+(last?'ok':'bad')+'" style="margin-left:auto">'+(last?'Got it last time':'Missed last time')+'</span>';
  h+='</div><div class="qt">'+esc(q.q)+'</div>';
  h+='<div class="reveal" hidden>';
  if(q.steps&&q.steps.length)h+='<ol class="steps">'+q.steps.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ol>';
  if(q.a)h+='<div class="ans"><b>Answer:</b> '+esc(q.a)+'</div>';
  if(q.ms&&q.ms.length)h+='<ul class="ms"><b>Mark scheme</b>'+q.ms.map(function(m){return '<li>'+esc(m)+'</li>';}).join('')+'</ul>';
  h+='</div><div class="row"><button class="btn sm" type="button" data-reveal>'+(q.steps&&q.steps.length?'Show worked solution':'Show answer')+'</button><button class="btn sm ok" type="button" data-got>✓ I got it</button><button class="btn sm bad" type="button" data-miss>✗ I missed it</button><button class="btn sm teal" type="button" data-qask>Ask Knovo</button></div></article>';
  return h;
};
/* Flashcard deck. cards: [{q,a,key}] */
EV.deck=function(host,cards,title){
  if(!cards.length){host.innerHTML='<div class="empty"><b>No flashcards here yet</b><span>Cards for this subject are being prepared.</span></div>';return;}
  var order=cards.map(function(_,i){return i}),i=0,res={};
  function draw(){
    var c=cards[order[i]];var lv=(ST.cards[c.key]||{}).lv||0;
    host.innerHTML='<div class="deckWrap"><div class="row" style="justify-content:space-between;width:min(560px,100%)"><span class="pill gold">'+esc(title||'Flashcards')+'</span><span class="small muted">Card '+(i+1)+' of '+cards.length+' · level '+lv+'/4</span></div>'+
    '<div class="fcard" tabindex="0" role="button" aria-label="Flashcard. Press to flip"><div class="inr"><div class="side front"><small>Question</small><p>'+esc(c.q)+'</p><small style="margin-top:8px">Tap to flip</small></div><div class="side back"><small>Answer</small><p>'+esc(c.a)+'</p></div></div></div>'+
    '<div class="deckCtl"><button class="btn sm" type="button" data-d="prev" '+(i?'':'disabled')+'>← Back</button><button class="btn bad" type="button" data-d="again">Again</button><button class="btn ok" type="button" data-d="good">Got it</button><button class="btn sm" type="button" data-d="shuffle">Shuffle</button></div>'+
    '<div class="dots">'+order.slice(0,80).map(function(k,j){return '<i class="'+(j===i?'cur':res[k]==='ok'?'ok':res[k]==='ag'?'ag':'')+'"></i>';}).join('')+'</div></div>';
    var fc=host.querySelector('.fcard');
    fc.addEventListener('click',function(){fc.classList.toggle('on')});
    fc.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();fc.classList.toggle('on');}});
  }
  host.onclick=function(e){var b=e.target.closest('[data-d]');if(!b)return;var d=b.dataset.d,c=cards[order[i]];
    if(d==='prev'&&i>0){i--;draw();return;}
    if(d==='shuffle'){order.sort(function(){return Math.random()-.5});i=0;res={};draw();EV.toast('Deck shuffled');return;}
    if(d==='again'||d==='good'){EV.reviewCard(c.key,d==='good');res[order[i]]=d==='good'?'ok':'ag';if(i<cards.length-1)i++;else{EV.toast('Deck finished · '+Object.keys(res).filter(function(k){return res[k]==='ok'}).length+' of '+cards.length+' known');i=0;}draw();}
  };
  draw();
};
/* question interactions (delegated on #view and the topic view) */
document.addEventListener('click',function(e){
  var card=e.target.closest('article.q');if(!card)return;var q=QREG[card.dataset.q];if(!q)return;
  if(e.target.closest('[data-reveal]')){var r=card.querySelector('.reveal');r.hidden=!r.hidden;e.target.closest('[data-reveal]').textContent=r.hidden?(q.steps&&q.steps.length?'Show worked solution':'Show answer'):'Hide solution';return;}
  if(e.target.closest('[data-got]')||e.target.closest('[data-miss]')){var ok=!!e.target.closest('[data-got]');EV.attempt(q,ok);card.classList.remove('got','miss');card.classList.add(ok?'got':'miss');card.querySelector('.reveal').hidden=false;return;}
  if(e.target.closest('[data-qask]')){EV.askKnovo('Help me with this question. Explain the method step by step, then check my understanding:\n\n'+q.q,'Question: '+q.q+(q.a?' | Model answer: '+q.a:''));}
});
document.addEventListener('click',function(e){var f=e.target.closest('[data-fav]');if(!f)return;e.preventDefault();e.stopPropagation();var on=EV.toggleFav(f.dataset.fav);f.classList.toggle('on',on);f.textContent=on?'♥':'♡';f.setAttribute('aria-pressed',on);EV.toast(on?'❤️ Liked. Find it in the ☰ menu':'Removed from liked subjects');},true);

EV.greeting=function(){return greeting();};
function greeting(){var h=new Date().getHours();return h<12?'Good morning':h<17?'Good afternoon':'Good evening';}
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}

/* ---------- daily quiz: 3 questions from 2 different subjects, same set all day ---------- */
EV.dailyQuiz=function(){
  var subs=EV.SUBJ.filter(function(o){return !o.soon&&((o.s.solved||[]).length+(o.s.practice||[]).length)>0});
  var seed=hash(EV.today());
  var a=subs[seed%subs.length],b=subs[(seed>>>8)%subs.length];if(a===b)b=subs[(subs.indexOf(a)+7)%subs.length];
  function pick(o,k,salt){var qs=EV.allQuestions(o).filter(function(q){return q.kind!=='Topic'});var out=[];for(var j=0;j<k&&qs.length;j++){out.push(qs.splice((seed>>>salt)%qs.length,1)[0]);salt+=3;}return out;}
  return pick(a,2,3).concat(pick(b,1,11));
};

/* =================== HOME =================== */
V.home=function(el){
  var subjN=EV.SUBJ.filter(function(o){return !o.soon}).length,pdfN=0,cardN=0;
  EV.SUBJ.forEach(function(o){pdfN+=EV.pdfCount(o);cardN+=(o.s.flash||[]).length;});
  if(EV.BYREF['olevel/math4024'].db)EV.BYREF['olevel/math4024'].db.chapters.forEach(function(c){c.topics.forEach(function(t){cardN+=(t.cards||[]).length;});});
  var qN=0,notesN=0;EV.SUBJ.forEach(function(o){if(o.soon)return;qN+=EV.allQuestions(o).length;notesN+=EV.notesOf(o).length;});
  var st={subjN:subjN,pdfN:pdfN,cardN:cardN,notesN:notesN,qN:qN};
  var h=EV.heroHTML(st)+EV.tickerHTML(st)+EV.statsHTML(st);

  h+='<div class="in"><section class="sect"><span class="eyebrow">Step 1 · <b>Choose your qualification</b></span><h2>Pick your qualification, then your subject.</h2><p class="sub">Each shelf holds the subjects for that qualification, with their paper patterns, notes and PDF libraries. Cambridge and Edexcel are ready now; IELTS, SAT and ACT are coming soon.</p><div class="quals" id="worlds">';
  EV.LEVELS.forEach(function(L){h+=EV.qualCard(L);});
  h+='</div></section>';

  var quiz=EV.dailyQuiz();
  h+='<section class="sect"><span class="eyebrow">Step 2 · <b>Today</b></span><h2>Ten minutes a day keeps the syllabus small.</h2><div class="bento">'+
    '<div class="cell quizCell"><div class="hd"><h3>Daily quiz</h3><span class="pill gold" id="qCount">1 of '+quiz.length+'</span></div><p class="small muted" style="margin-top:-8px">3 questions from 2 different subjects, drawn from every subject on EduVerse.</p><div class="qstack" id="qstack">'+
    quiz.map(function(q,i){var o=EV.BYREF[q.ref];QREG[q.id]=q;return '<div class="qc" data-pos="'+Math.min(i,2)+'" data-qi="'+i+'" tabindex="'+(i?-1:0)+'" role="button" aria-label="Question '+(i+1)+'. Press to flip"><div class="fc"><span class="pill gold" style="width:max-content">'+o.s.icon+' '+esc(o.s.name)+' <span class="code">'+esc(o.s.code)+'</span></span><p>'+esc(q.q)+'</p><div class="foot"><span>Tap to flip</span><span>'+esc(q.kind)+'</span></div></div><div class="bc"><span class="pill gold" style="width:max-content">Answer</span>'+(q.steps.length?'<ol class="small" style="margin:0;padding-left:18px">'+q.steps.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ol>':'')+'<p><b>'+esc(q.a)+'</b></p></div></div>';}).join('')+
    '</div><div class="quizCtl"><button type="button" id="qGot">✓ I got it</button><button type="button" id="qMiss">✗ Missed it</button><button type="button" class="k" id="qWhy">Ask Knovo why</button></div></div>'+
    '<div class="cell"><div class="hd"><h3>Streak</h3><span class="pill gold">streaks keep you going</span></div><div class="big">'+ST.streak.count+' <small>day'+(ST.streak.count===1?'':'s')+'</small></div><div class="week" id="week"></div></div>'+
    '<div class="cell"><div class="hd"><h3>Daily goal</h3><a class="small muted" href="#dashboard">Change</a></div><div class="big">'+Math.min(ST.today.d===EV.today()?ST.today.q:0,999)+'<small> / '+ST.goal+' questions</small></div><div class="bar"><i style="width:'+Math.min(100,Math.round(100*(ST.today.d===EV.today()?ST.today.q:0)/ST.goal))+'%"></i></div></div>'+
    '<div class="cell"><div class="hd"><h3>Exam countdown</h3></div><div class="count"><div><b id="cD">0</b><span>days</span></div><div><b id="cH">0</b><span>hours</span></div><div><b id="cM">0</b><span>mins</span></div></div><label class="field" for="exDate">Your first paper<input type="date" id="exDate" value="'+esc(ST.exam._global||'')+'"></label></div>'+
    '<div class="cell"><div class="hd"><h3>Focus session</h3><span class="tag">New idea</span></div><div class="timer"><div class="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="#12171d" stroke-width="8"/><circle id="tArc" cx="50" cy="50" r="44" fill="none" stroke="#f0b429" stroke-width="8" stroke-linecap="round" stroke-dasharray="276.5" stroke-dashoffset="0"/></svg><b id="tTxt">25:00</b></div><div class="btns"><button class="btn gold sm" type="button" id="tGo">Start focus</button><button class="btn sm" type="button" id="tReset">Reset</button></div></div></div>'+
    '</div></section>';


  h+='<section class="sect"><span class="eyebrow">Meet <b class="k">Knovo</b></span><div class="kshow"><div class="orbWrap" aria-hidden="true"><div class="orbit3d"><span class="o2"></span><span class="o1"></span><img src="assets/knovo-logo-sm.png" alt=""></div></div><div>'+
    '<h2 class="h2" style="margin-top:0">A tutor that knows <em>which page you\'re on.</em></h2><p class="sub">Open Knovo from any note, question or mock. It already knows the subject and topic and reads the EduVerse notes for it, so you can just ask "why?"</p>'+
    '<div class="kfeat"><div><b>Mark my answer</b><span>Paste an answer and get marks point by point against mark-scheme style criteria.</span></div><div><b>Scan a question</b><span>Photograph a question and get a worked solution.</span></div><div><b>Live Lessons</b><span>A guided lesson that checks you understood each part.</span></div><div><b>Chat to flashcards</b><span>Turn any explanation into a flashcard deck in one tap.</span></div></div>'+
    '<div class="row" style="margin-top:20px"><a class="btn teal" href="#knovo">Open the Knovo workspace →</a><button class="btn ghost" type="button" data-plans>See Knovo plans</button></div></div></div></section>';

  h+='<section class="sect"><span class="eyebrow">Questions students ask</span><h2>Frequently asked questions</h2><div class="faq">'+EV.D.extra.faq.map(function(f){return '<details><summary>'+esc(f.q)+'</summary><p>'+esc(f.a)+'</p></details>';}).join('')+'</div></section>';

  /* Contact EduVerse: messages go to the fixed EduVerse inbox through formsubmit.co */
  var me=ST.profile||{};
  h+='<section class="sect" id="contact"><span class="eyebrow">Contact us</span><h2>Contact EduVerse</h2><p class="sub">A short note is enough. Support, partnership ideas, resource reports and subject requests all land in the same inbox.</p>'+
  '<div class="contactWrap"><div class="cCards">'+
    '<div class="cCard"><span class="ci">✉️</span><div><b>Direct email</b><p>educationalverse2027@gmail.com</p><a href="mailto:educationalverse2027@gmail.com?subject=EduVerse%20website%20enquiry">Write to us →</a></div></div>'+
    '<div class="cCard"><span class="ci">📸</span><div><b>Instagram</b><p>Sneak peeks, study tips, new resources and behind-the-scenes updates.</p><a href="https://www.instagram.com/eduverse.27" target="_blank" rel="noopener">Follow @eduverse.27 →</a></div></div>'+
    '<div class="cCard"><span class="ci">?</span><div><b>Check the FAQ first</b><p>Pricing, boards and syllabus years are answered above.</p><button class="lnk" type="button" id="toFaq">Read the FAQ →</button></div></div>'+
  '</div>'+
  '<form class="cForm" id="cForm" novalidate><div class="cHead"><span class="ci">✦</span><div><b style="font-size:1.15rem">Send a quick message</b><div class="small muted">Usually takes less than a minute.</div></div></div>'+
    '<input type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">'+
    '<div class="grid g2" style="gap:12px"><label class="field" for="cName">Your name<input class="inp" id="cName" name="Name" maxlength="60" autocomplete="name" required placeholder="How should we address you?" value="'+esc(me.name||'')+'"></label>'+
    '<label class="field" for="cEmail">Your email<input class="inp" id="cEmail" name="Email" type="email" maxlength="120" autocomplete="email" required placeholder="So we can reply" value="'+esc(me.email||'')+'"></label></div>'+
    '<label class="field" for="cType">What is this about?<select class="inp" id="cType" name="Enquiry type"><option>General support</option><option>Partnership or author enquiry</option><option>Report a resource or website problem</option><option>Suggest a subject or resource</option></select></label>'+
    '<label class="field" for="cMsg">Message<textarea class="inp" id="cMsg" name="Message" maxlength="700" required placeholder="For a report, include the subject and what needs fixing. For a partnership, tell us what you would like to offer."></textarea></label>'+
    '<div class="cFixed"><span>Sends to <b>educationalverse2027@gmail.com</b></span><span>🔒 Recipient fixed</span></div>'+
    '<button class="btn gold" type="submit" id="cSend">Send to EduVerse Support →</button><p class="small" id="cStatus" role="status" aria-live="polite" style="margin:0"></p>'+
    '<a class="small muted" id="cMail" href="mailto:educationalverse2027@gmail.com?subject=EduVerse%20website%20enquiry">Or open your email app</a></form></div></section></div>';
  el.innerHTML=h;

  /* contact form */
  $('#toFaq').addEventListener('click',function(){var f=$('.faq');if(f)f.scrollIntoView({behavior:EV.reduce?'auto':'smooth',block:'start'});});
  $('#cForm').addEventListener('submit',function(e){e.preventDefault();
    var f=e.currentTarget,st=$('#cStatus'),btn=$('#cSend');
    var name=$('#cName').value.trim(),email=$('#cEmail').value.trim(),type=$('#cType').value,msg=$('#cMsg').value.trim();
    if(f._honey.value)return;
    if(!name||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!msg){st.textContent='Please fill in your name, a valid email and your message.';st.style.color='var(--warn)';return;}
    $('#cMail').href='mailto:educationalverse2027@gmail.com?subject='+encodeURIComponent('EduVerse · '+type)+'&body='+encodeURIComponent('Name: '+name+'\nEmail: '+email+'\nType: '+type+'\n\n'+msg);
    var data=new FormData();data.append('Name',name);data.append('Email',email);data.append('Enquiry type',type);data.append('Message',msg);
    data.append('_subject','EduVerse · '+type+' · '+name);data.append('_template','table');data.append('_captcha','false');data.append('Page',location.href);
    btn.disabled=true;btn.textContent='Sending…';st.style.color='';st.textContent='Sending securely to EduVerse Support…';
    var ctrl=new AbortController(),tm=setTimeout(function(){ctrl.abort();},15000);
    fetch('https://formsubmit.co/ajax/educationalverse2027@gmail.com',{method:'POST',body:data,headers:{Accept:'application/json'},signal:ctrl.signal})
      .then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok)throw new Error(j.message||'failed');return j;});})
      .then(function(){st.style.color='var(--teal)';st.textContent='Thanks! Your message has been sent to EduVerse Support.';$('#cMsg').value='';})
      .catch(function(){st.style.color='var(--warn)';st.textContent='We could not send this automatically. Use "Or open your email app" below; your message is ready there.';})
      .then(function(){clearTimeout(tm);btn.disabled=false;btn.textContent='Send to EduVerse Support →';});
  });

  /* hero */
  var stop=EV.mountHero($('#hero2'),st);
  $('#heroAsk').addEventListener('submit',function(e){e.preventDefault();var i=$('#heroQ');EV.askKnovo(i.value||i.placeholder.replace('Ask Knovo: ',''));i.value='';});
  if(EV.fine&&!EV.reduce)$$('.qual').forEach(function(c){c.addEventListener('mousemove',function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform='rotateY('+(x*6)+'deg) rotateX('+(-y*5)+'deg) translateY(-3px)';});c.addEventListener('mouseleave',function(){c.style.transform='';});});
  /* week dots */
  var wk=$('#week'),days=['S','M','T','W','T','F','S'],now=new Date();var wh='';
  for(var k=6;k>=0;k--){var d=new Date(now);d.setDate(now.getDate()-k);var ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');wh+='<span class="'+(ST.streak.days.indexOf(ds)>=0?'on':'')+'">'+days[d.getDay()]+'</span>';}
  wk.innerHTML=wh;
  /* quiz */
  var cards=$$('.qc'),qi=0;
  function layout(){cards.forEach(function(c,i){var p=i-qi;c.dataset.pos=p<0?'gone':String(Math.min(p,2));c.tabIndex=p===0?0:-1;});$('#qCount').textContent=Math.min(qi+1,cards.length)+' of '+cards.length;}
  cards.forEach(function(c,i){function f(){if(i===qi)c.classList.toggle('flipped');}c.addEventListener('click',f);c.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();f();}});});
  function mark(ok){var q=quiz[qi];if(!q)return;EV.attempt(q,ok);if(qi<cards.length-1){qi++;layout();}else{qi=0;cards.forEach(function(c){c.classList.remove('flipped')});layout();EV.toast('Daily quiz done. Come back tomorrow for a new set.');}}
  $('#qGot').addEventListener('click',function(){mark(true)});$('#qMiss').addEventListener('click',function(){mark(false)});
  $('#qWhy').addEventListener('click',function(){var q=quiz[qi];var o=EV.BYREF[q.ref];EV.askKnovo('Explain how to answer this '+o.s.name+' question and why the answer is correct:\n\n'+q.q,'Question: '+q.q+' | Model answer: '+q.a);});
  layout();
  /* countdown */
  function tick(){var v=$('#exDate');if(!v)return;var t=v.value?new Date(v.value+'T09:00:00'):null,df=t?t-new Date():0;if(df<0)df=0;$('#cD').textContent=Math.floor(df/864e5);$('#cH').textContent=Math.floor(df/36e5)%24;$('#cM').textContent=Math.floor(df/6e4)%60;}
  $('#exDate').addEventListener('change',function(){ST.exam._global=this.value;EV.save();tick();EV.toast('Exam date saved');});
  tick();var ci=setInterval(tick,30000);
  /* focus timer */
  var T=1500,left=T,run=null,C=276.5;
  function draw(){var m=Math.floor(left/60),s=left%60;$('#tTxt').textContent=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;$('#tArc').style.strokeDashoffset=String(C*(1-left/T));}
  $('#tGo').addEventListener('click',function(){if(run){clearInterval(run);run=null;this.textContent='Resume';return;}this.textContent='Pause';run=setInterval(function(){left--;if(left<=0){left=0;clearInterval(run);run=null;$('#tGo').textContent='Session done';EV.toast('Focus session complete. Take a 5-minute break.');}draw();},1000);});
  $('#tReset').addEventListener('click',function(){clearInterval(run);run=null;left=T;$('#tGo').textContent='Start focus';draw();});
  draw();
  EV.cleanup=function(){if(stop)stop();clearInterval(ci);clearInterval(run);};
};

/* Qualification card: a shelf of real syllabus codes instead of a decorative planet */
var SPINE={olevel:['#1d5fd0','#2f7ae5','#123e86','#3b8cf0','#1a4fa8','#5aa0ff','#0f3170'],alevel:['#c98a12','#f0b429','#a8700c','#e0a020','#ffc847','#8a5a06','#d99a1c'],alevel_edx:['#0f8f98','#2fe0cd','#0b6f77','#20b8aa','#5ef0de','#0a5960','#18a59a'],ielts:['#4a3f8f','#6a5cc0','#3a3070'],act:['#2c6b45','#3f8f5e','#245a3a'],sat:['#7a3328','#a3473a','#5e2a22']};
var QDESC={olevel:'Cambridge O Level and IGCSE. Shared folders cover both syllabus codes.',alevel:'Cambridge International AS & A Level, staged or linear routes.',alevel_edx:'Pearson Edexcel International A Level, unit by unit.'};
EV.qualCard=function(L){
  var m=L.meta,soon=L.subjects.every(function(o){return o.soon}),cols=SPINE[L.lk]||SPINE.olevel;
  var subs=L.subjects.filter(function(o){return !o.soon});
  var pdf=0,cards=0,notes=0;subs.forEach(function(o){pdf+=EV.pdfCount(o);cards+=(o.s.flash||[]).length;notes+=EV.notesOf(o).length;});
  var spines=soon?[0,1,2].map(function(k){return {code:'SOON',h:[78,94,70][k],c:cols[k%cols.length]};}):subs.slice(0,7).map(function(o,k){return {code:o.s.code.split(' / ').pop(),h:[92,108,84,116,98,88,104][k%7],c:cols[k%cols.length]};});
  var shelf='<div class="shelf" aria-hidden="true">'+spines.map(function(s,k){return '<span class="spine" style="--h:'+s.h+'px;--c:'+s.c+';--k:'+k+'"><b>'+esc(s.code)+'</b></span>';}).join('')+'</div>';
  var h='<a class="qual'+(soon?' soon':'')+'" href="#level-'+L.slug+'"><div class="qTop"><span class="pill gold">'+esc(m.pill)+'</span><span class="pill '+(soon?'':'ok')+'">'+(soon?'Coming soon':'Ready')+'</span></div>'+
    '<div class="qBody"><div class="qText"><h3>'+esc(m.short||plainTitle(L.title))+'</h3><p>'+esc(soon?(L.subjects[0].s.fullName||''):QDESC[L.lk]||'')+'</p></div>'+shelf+'</div>';
  if(soon)h+='<div class="qStats"><span>Resources in preparation</span></div><span class="go">Preview →</span>';
  else h+='<div class="qStats"><span><b>'+subs.length+'</b> subjects</span>'+(pdf?'<span><b>'+pdf+'</b> PDFs</span>':'<span><b>'+notes+'</b> notes sections</span>')+'<span><b>'+cards+'</b> flashcards</span></div><div class="qIcons" aria-hidden="true">'+subs.slice(0,8).map(function(o){return '<span title="'+esc(o.s.name)+'">'+o.s.icon+'</span>';}).join('')+(subs.length>8?'<span class="more">+'+(subs.length-8)+'</span>':'')+'</div><span class="go">Open subjects →</span>';
  return h+'</a>';
};
V.qualifications=function(el,r){V.home(el,r);setTimeout(function(){var w=$('#worlds');if(w)w=w.closest('section');if(w)w.scrollIntoView({behavior:EV.reduce?'auto':'smooth',block:'start'});},80);};

/* =================== ALL SUBJECTS =================== */
V.subjects=function(el){
  var h='<div class="in page"><div class="lvHead"><div class="pageHead" style="padding:0"><span class="eyebrow">All subjects</span><h1>Choose your subject</h1><p class="sub">Every subject has its paper pattern with codes, notes, flashcards, solved questions and practice with answers.</p></div><label class="search"><span aria-hidden="true">⌕</span><span class="sr">Search subjects</span><input id="sSearch" placeholder="Search by name, code or board"></label></div><div id="sList"></div></div>';
  el.innerHTML=h;
  function paint(q){q=(q||'').toLowerCase();var out='';
    EV.LEVELS.forEach(function(L){var list=L.subjects.filter(function(o){return !q||(o.s.name+' '+o.s.code+' '+o.s.board+' '+plainTitle(L.title)).toLowerCase().indexOf(q)>=0;});if(!list.length)return;
      out+='<section class="sect" style="padding-top:36px"><div class="hd"><h2 class="h2" style="font-size:1.5rem;margin:0">'+esc(L.meta.short||plainTitle(L.title))+'</h2><a class="small muted" href="#level-'+L.slug+'">Open '+esc(L.meta.short||'level')+' →</a></div><div class="subjGrid">'+list.map(function(o){return EV.subjCard(o,o.s.tag)}).join('')+'</div></section>';});
    $('#sList').innerHTML=out||'<div class="empty" style="margin-top:24px"><b>No subjects match "'+esc(q)+'"</b><span>Try a syllabus code such as 5054 or 9709.</span></div>';}
  $('#sSearch').addEventListener('input',function(){paint(this.value)});paint('');
};

/* =================== LEVEL =================== */
V.level=function(el,r){
  var L=EV.LEVELS.find(function(x){return x.slug===r.lk});if(!L){EV.go('subjects');return;}
  var soon=L.subjects.every(function(o){return o.soon});
  var h='<div class="in page"><a class="crumb" href="#qualifications">← Choose qualification</a><div class="lvHead" style="margin-top:12px"><div class="pageHead" style="padding:0"><span class="eyebrow"><b>'+esc(L.meta.pill)+'</b> · '+(soon?'Coming soon':L.subjects.length+' subjects')+'</span><h1>'+esc(L.meta.short||plainTitle(L.title))+'</h1><p class="sub">'+esc(plainTitle(L.sub))+'</p></div>'+(soon?'':'<label class="search"><span aria-hidden="true">⌕</span><span class="sr">Search</span><input id="lSearch" placeholder="Search '+esc(L.meta.short)+' subjects"></label>')+'</div>';
  if(soon){var s=L.subjects[0].s;h+='<div class="soonBox"><span class="pill">Coming soon</span><h2>'+esc(s.comingTitle||'Coming soon')+'</h2><p class="muted">'+esc(s.comingMessage||s.tag||'')+'</p><div class="row"><a class="btn gold" href="#qualifications">Explore ready subjects</a><button class="btn" type="button" id="notify">Notify me</button></div></div>';}
  else h+='<div class="subjGrid" id="lGrid"></div>';
  h+='</div>';el.innerHTML=h;
  if(soon){$('#notify').addEventListener('click',function(){EV.toast('Saved. In the live site this would join the waiting list.')});return;}
  function paint(q){q=(q||'').toLowerCase();var list=L.subjects.filter(function(o){return !q||(o.s.name+' '+o.s.code).toLowerCase().indexOf(q)>=0});$('#lGrid').innerHTML=list.map(function(o){return EV.subjCard(o,o.s.tag)}).join('')||'<div class="empty"><b>No match</b></div>';}
  $('#lSearch').addEventListener('input',function(){paint(this.value)});paint('');
};

/* =================== SUBJECT HUB =================== */
var TABNAME={overview:'Overview',notes:'Notes',topics:'Topics',questions:'Questions',cards:'Flashcards',technique:'Exam technique',library:'PDF library',tools:'Study tools',classroom:'Classroom'};
var RESCAT=[['detailed','Study books · detailed notes'],['premium','Premium notes'],['quickref','Quick reference sheets'],['topical','Topical question banks'],['compiled','Compiled topical papers'],['tests','Topic tests'],['mixed','Mixed-topic tests'],['yearly','Yearly practice papers'],['assess','Full-syllabus assessment'],['mocks','Challenge mocks + marking guides']];
V.subject=function(el,r){
  var o=r.o,s=o.s,tab=r.tab;
  if(o.soon){EV.go('level-'+o.level.slug);return;}
  if(tab==='topics'&&!o.db)tab='overview';
  if(tab==='classroom'&&!EV.classOf(o))tab='overview';
  EV.touchRecent(o.ref);
  var fav=ST.favs.indexOf(o.ref)>=0;
  var tabs=EV.TABS.filter(function(t){return t==='topics'?o.db:t==='classroom'?EV.classOf(o):true});
  var h='<div class="sHead"><div class="in"><a class="crumb" href="#level-'+o.level.slug+'">← '+esc(o.level.meta.short)+'</a>'+
    '<h1><span aria-hidden="true">'+s.icon+'</span>'+esc(s.name)+'<span class="code">'+esc(s.code)+'</span></h1>'+
    '<p class="tagline">'+esc(s.board)+' · '+esc(s.tag||'')+'</p>'+
    '<div class="row"><button class="btn sm'+(fav?' gold':'')+'" type="button" id="favBtn" aria-pressed="'+fav+'">'+(fav?'♥ Liked':'♡ Like this subject')+'</button><button class="btn sm" type="button" id="copyLink">Copy subject link</button><button class="btn sm teal" type="button" data-ask="Give me a quick overview of this subject: what each paper tests and where students usually lose marks.">Ask Knovo about '+esc(s.name)+'</button></div>'+
    '<nav class="tabs" aria-label="Subject sections">'+tabs.map(function(t){return '<a href="#'+t+'-'+o.slug+'" class="'+(t===tab?'on':'')+'"'+(t===tab?' aria-current="page"':'')+'>'+TABNAME[t]+'</a>';}).join('')+'</nav></div></div><div class="in page" id="tabBody"></div>';
  el.innerHTML=h;
  $('#favBtn').addEventListener('click',function(){var on=EV.toggleFav(o.ref);this.classList.toggle('gold',on);this.textContent=on?'♥ Liked':'♡ Like this subject';this.setAttribute('aria-pressed',on);EV.toast(on?'❤️ Liked. Find it in the ☰ menu':'Removed from liked subjects');});
  $('#copyLink').addEventListener('click',function(){var url=location.href;try{navigator.clipboard.writeText(url).then(function(){EV.toast('Link copied')},function(){EV.toast(url)});}catch(e){EV.toast(url);}});
  EV.ctxExtra='';
  TAB[tab](o,$('#tabBody'));
};
var TAB={};
TAB.overview=function(o,b){
  var s=o.s,notes=EV.notesOf(o),acc=EV.accuracy(o.ref),flashN=(s.flash||[]).length,qN=EV.allQuestions(o).length;
  if(o.db)o.db.chapters.forEach(function(c){c.topics.forEach(function(t){flashN+=(t.cards||[]).length;});});
  var h='<div class="stats">'+
    [[s.papers.length,'Exam papers'],[notes.length,'Notes sections'+(o.deep?' · expanded':'')],[flashN,'Flashcards'],[qN,'Questions with answers'],[EV.pdfCount(o),'PDF resources'],[acc?acc.pct+'%':'—',acc?'Your accuracy ('+acc.n+')':'Your accuracy']].map(function(x){return '<div class="stat"><b>'+x[0]+'</b><span>'+x[1]+'</span></div>';}).join('')+'</div>';
  h+='<section class="sect" style="padding-top:36px"><span class="eyebrow">Your study path</span><div class="steps4" style="margin-top:14px">'+
    '<a class="step" href="#notes-'+o.slug+'"><small>1 · Learn</small><b>Notes &amp; study book</b><span>'+notes.length+' sections'+(o.res&&o.res.detailed?' + PDF study book':'')+'</span></a>'+
    '<a class="step" href="#cards-'+o.slug+'"><small>2 · Recall</small><b>Flashcards</b><span>'+flashN+' cards with levels</span></a>'+
    '<a class="step" href="#questions-'+o.slug+'"><small>3 · Practise</small><b>Questions</b><span>'+qN+' with worked answers</span></a>'+
    '<a class="step" href="#mock"><small>4 · Test</small><b>Timed mock</b><span>Real paper timings</span></a></div></section>';
  h+='<section class="sect" style="padding-top:36px"><div class="twoCol"><div class="stack"><div class="hd"><h3 style="font-size:1.2rem">Syllabus map</h3><span class="small muted">Tick sections as learned in Notes</span></div><div class="sky" id="sky"><div class="skyIn" id="skyIn"></div><div class="skyLegend"><span class="d"><i></i>Learned</span><span class="s"><i></i>Opened</span><span><i></i>Not started</span></div></div></div>'+
    '<div class="stack"><h3 style="font-size:1.2rem">Paper pattern</h3>'+s.papers.map(function(p){return '<div class="paper"><span class="pn">'+esc(p.p)+'</span><div><b>'+esc(p.n||'')+'</b><div class="meta">'+[p.t,p.m,p.w].filter(function(x){return x&&x!=='—'}).map(function(x){return '<span class="pill">'+esc(x)+'</span>';}).join('')+'</div><p>'+esc(p.d||'')+'</p></div></div>';}).join('')+'<p class="small muted">Paper patterns follow the latest syllabuses. Confirm against the official syllabus PDF for your exam year.</p></div></div></section>';
  b.innerHTML=h;
  /* constellation of notes sections */
  var n=notes.length,pts=[],sky=$('#skyIn');
  /* Two arcs: the first half of the sections runs down the left, the rest down the right.
     Every section gets its own row, so labels can never sit on top of each other. */
  var nL=Math.ceil(n/2),nR=n-nL,rows=Math.max(nL,nR,1),skyH=Math.max(400,rows*36+110);
  $('#sky').style.height=skyH+'px';
  var top=34/skyH*100,bot=(skyH-70)/skyH*100;
  for(var i=0;i<n;i++){var L=i<nL,k=L?i:i-nL,m=L?nL:nR,t=m>1?k/(m-1):.5,bulge=Math.sin(Math.PI*t)*7;
    /* the right-hand rows sit half a step lower than the left, so two labels never meet in the middle */
    pts.push({x:L?13-bulge:87+bulge,y:top+(bot-top)*(k/rows)+(L?0:(bot-top)/(2*rows)),side:L?'l':'r'});}
  function arc(a){return a.length>1?'<polyline points="'+a.map(function(p){return p.x.toFixed(1)+','+p.y.toFixed(1)}).join(' ')+'" fill="none" stroke="rgba(240,180,41,.28)" stroke-width=".35"/>':'';}
  var svg='<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+arc(pts.slice(0,nL))+arc(pts.slice(nL))+'</svg>';
  sky.innerHTML=svg+notes.map(function(nt,i){var k=o.ref+'#n'+i,st=ST.topicsDone.indexOf(k)>=0?'done':ST.notesSeen.indexOf(k)>=0?'seen':'';var p=pts[i];return '<a class="star '+p.side+' '+st+'" href="#notes-'+o.slug+'" data-open="'+i+'" style="--x:'+p.x+'%;--y:'+p.y+'%" title="'+esc(EV.strip(nt.t))+'"><i></i><span>'+esc(EV.strip(nt.t).replace(/^\d+\.\s*/,''))+'</span></a>';}).join('');
  sky.addEventListener('click',function(e){var a=e.target.closest('[data-open]');if(a)EV.openNote=+a.dataset.open;});
  var skyB=$('#sky');if(EV.fine&&!EV.reduce){skyB.addEventListener('mousemove',function(e){var r=skyB.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;sky.style.transform='rotateY('+(x*8)+'deg) rotateX('+(-y*6)+'deg)';});skyB.addEventListener('mouseleave',function(){sky.style.transform='';});}
};
TAB.notes=function(o,b){
  var notes=EV.notesOf(o),openI=EV.openNote!=null?EV.openNote:0;EV.openNote=null;
  var h='<div class="hd"><div><h2 class="h2" style="margin:0;font-size:1.7rem">'+esc(o.s.name)+' notes</h2><p class="sub" style="margin-top:6px">'+(o.deep?'Expanded edition: '+notes.length+' detailed sections.':notes.length+' short-note sections covering the syllabus.')+' Mark a section as learned when you could teach it back from memory.</p></div><span class="pill ok">Free</span></div>';
  if(o.res&&o.res.detailed)h+='<div class="libGroup" style="margin-top:18px"><h3>📚 Full study book <span class="pill ok">Free</span></h3>'+o.res.detailed.map(EV.pdfRow).join('')+'</div>';
  /* Premium notes sit directly under the free study book. Shown only when a subject has some. */
  var prem=o.res&&o.res.premium&&o.res.premium.length?o.res.premium:null;
  if(prem){var pro=EVLive.isPro();
    h+='<div class="libGroup premBox" id="premNotes" style="margin-top:18px"><h3>⭐ Premium notes <span class="pill">'+prem.length+'</span></h3>'+
      (pro?'':'<p class="premSay">These are for plan holders. Plans are not on sale yet, so nothing can be bought here. Everything above and below stays free.</p>')+
      prem.map(function(it){return pro?EV.pdfRow(it):EV.pdfLockRow(it);}).join('')+
      (pro?'':'<div class="row"><button class="btn sm" type="button" data-plans>See the plans</button></div>')+'</div>';}
  h+='<div class="stack" style="margin-top:20px">'+notes.map(function(nt,i){var k=o.ref+'#n'+i,dn=ST.topicsDone.indexOf(k)>=0;return '<details class="note'+(dn?' done':'')+'" data-n="'+i+'"'+(i===openI?' open':'')+'><summary><span class="nn">'+String(i+1).padStart(2,'0')+'</span><b>'+esc(EV.strip(nt.t))+'</b>'+(dn?'<span class="pill ok">Learned</span>':'')+'<span class="chev" aria-hidden="true">›</span></summary><div class="nb"><div class="rich">'+nt.b+'</div><div class="row"><button class="btn sm '+(dn?'ok':'gold')+'" type="button" data-learn="'+i+'">'+(dn?'✓ Learned':'Mark as learned')+'</button><button class="btn sm teal" type="button" data-nask="'+i+'">Ask Knovo about this section</button></div></div></details>';}).join('')+'</div>';
  b.innerHTML=h;
  function seen(i){var k=o.ref+'#n'+i;if(ST.notesSeen.indexOf(k)<0){ST.notesSeen.push(k);EV.save();}}
  seen(openI);
  $$('.note',b).forEach(function(d){d.addEventListener('toggle',function(){if(d.open){seen(+d.dataset.n);EV.ctxExtra='Reading notes section: '+EV.strip(notes[+d.dataset.n].t);}});});
  if(openI>0){var t=$('.note[data-n="'+openI+'"]',b);if(t)setTimeout(function(){t.scrollIntoView({behavior:'smooth',block:'start'})},60);}
  b.addEventListener('click',function(e){
    var l=e.target.closest('[data-learn]');if(l){var i=+l.dataset.learn,on=EV.completeTopic(o.ref+'#n'+i,o.ref);l.className='btn sm '+(on?'ok':'gold');l.textContent=on?'✓ Learned':'Mark as learned';l.closest('.note').classList.toggle('done',on);return;}
    var a=e.target.closest('[data-nask]');if(a){var nt=notes[+a.dataset.nask];EV.askKnovo('Explain the key ideas in "'+EV.strip(nt.t)+'" simply, then give me one exam-style question to check I understood.','Notes section: '+EV.strip(nt.t));}
  });
};
TAB.questions=function(o,b){
  var all=EV.allQuestions(o),kinds=['All'];['Solved','Practice','Topic'].forEach(function(k){if(all.some(function(q){return q.kind===k}))kinds.push(k);});
  var h='<div class="hd"><div><h2 class="h2" style="margin:0;font-size:1.7rem">Questions &amp; mark schemes</h2><p class="sub" style="margin-top:6px">Attempt each on paper first, then reveal the worked solution and mark yourself. Anything you miss goes to your Mistakes notebook.</p></div></div>';
  var pdfs=[].concat(o.res&&o.res.topical||[],o.res&&o.res.compiled||[]);
  if(pdfs.length)h+='<div class="libGroup" style="margin-top:18px"><h3>📘 Topical question bank PDFs <span class="pill gold">Pro</span></h3>'+(EVLive.isPro()?pdfs.map(EV.pdfRow).join(''):'<p class="small muted" style="margin:0">🔒 '+pdfs.length+' topical PDF'+(pdfs.length>1?'s are':' is')+' part of EduVerse Pro. The questions below are free.</p>')+'</div>';
  h+='<div class="row" style="margin-top:22px" id="qf">'+kinds.map(function(k,i){return '<button class="btn sm'+(i?'':' gold')+'" type="button" data-f="'+k+'">'+k+' ('+(k==='All'?all.length:all.filter(function(q){return q.kind===k}).length)+')</button>';}).join('')+'</div><div class="stack" id="qList" style="margin-top:16px"></div>';
  b.innerHTML=h;
  function paint(k){$('#qList').innerHTML=all.filter(function(q){return k==='All'||q.kind===k}).map(function(q,i){return EV.qCard(q,i+1)}).join('');}
  $('#qf').addEventListener('click',function(e){var f=e.target.closest('[data-f]');if(!f)return;$$('#qf button').forEach(function(x){x.classList.toggle('gold',x===f)});paint(f.dataset.f);});
  paint('All');
};
TAB.cards=function(o,b){
  var subj=(o.s.flash||[]).map(function(c,i){return {q:c.q,a:c.a,key:o.ref+'#f'+i}}),topic=[];
  if(o.db)o.db.chapters.forEach(function(c){c.topics.forEach(function(t){(t.cards||[]).forEach(function(x,i){topic.push({q:x.q,a:x.a,key:'db:'+t.id+'#c'+i});});});});
  var kn=ST.kdeck.filter(function(c){return c.ref===o.ref}).map(function(c,i){return {q:c.q,a:c.a,key:'kn:'+c.t+'#'+i}});
  var decks=[['Subject cards',subj]];if(topic.length)decks.push(['All topic cards',topic]);if(kn.length)decks.push(['From Knovo chats',kn]);
  var h='<div class="hd"><div><h2 class="h2" style="margin:0;font-size:1.7rem">Flashcards</h2><p class="sub" style="margin-top:6px">Flip, then be honest. "Again" sends a card back to level 0; "Got it" moves it up a level.</p></div></div>';
  if(decks.length>1)h+='<div class="row" id="dk" style="margin-top:16px">'+decks.map(function(d,i){return '<button class="btn sm'+(i?'':' gold')+'" type="button" data-dk="'+i+'">'+d[0]+' ('+d[1].length+')</button>';}).join('')+'</div>';
  h+='<div id="deckHost" style="margin-top:12px"></div>';
  b.innerHTML=h;
  EV.deck($('#deckHost'),decks[0][1],decks[0][0]);
  var dk=$('#dk');if(dk)dk.addEventListener('click',function(e){var x=e.target.closest('[data-dk]');if(!x)return;$$('#dk button').forEach(function(y){y.classList.toggle('gold',y===x)});var d=decks[+x.dataset.dk];EV.deck($('#deckHost'),d[1],d[0]);});
};
EV.ladder=[['✗ Weak answer (1–2 / 8)','"Inflation is bad because prices go up."','No definition, no mechanism, no development.','bad'],
 ['🙂 Good answer (4–5 / 8)','"Inflation is a sustained rise in the general price level. It erodes purchasing power, so households can buy less with the same income."','Definition ✓ one mechanism ✓ but no chain and no evidence.',''],
 ['✓ A-grade answer (6–7 / 8)','"Inflation, a sustained rise in the general price level, reduces real purchasing power: as prices rise faster than wages, households\' real income falls, consumption shifts toward essentials, and saving becomes unattractive — in Pakistan\'s 2023 episode, food inflation above 40% pushed low-income families below the poverty line."','Definition → mechanism chain → because/therefore → evidence. Missing only evaluation.','gold'],
 ['★ A*-grade answer (8 / 8)','Same as A-grade, plus judgement: "However, moderate inflation (2–3%) signals healthy demand, so the harm depends on its rate and on whether incomes are indexed — policy should target expectations, not zero inflation."','Balanced evaluation with a committed verdict. That final sentence separates A from A*.','ok']];
EV.commandsTable=function(){return '<div class="scrollx"><table class="tbl"><thead><tr><th>Command word</th><th>What the examiner wants</th><th>How to answer</th></tr></thead><tbody>'+EV.D.extra.commands.map(function(r){return '<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td><td>'+esc(r[2])+'</td></tr>';}).join('')+'</tbody></table></div>';};
EV.ladderHTML=function(){return '<div class="grid g2">'+EV.ladder.map(function(l){return '<div class="card" style="display:grid;gap:8px;border-color:'+(l[3]==='bad'?'rgba(255,107,107,.3)':l[3]==='gold'?'var(--goldline)':l[3]==='ok'?'rgba(94,227,154,.3)':'var(--rim)')+'"><b>'+esc(l[0])+'</b><p style="font-size:.9rem">'+esc(l[1])+'</p><p class="small muted">'+esc(l[2])+'</p></div>';}).join('')+'</div>';};
TAB.technique=function(o,b){
  var s=o.s,t=s.technique||{};
  var h='<h2 class="h2" style="margin:0;font-size:1.7rem">'+esc(s.name)+' exam technique</h2><p class="sub">How '+esc(s.code)+' questions are built, worded and marked. Read this before your first timed attempt.</p>';
  if(s.fmt)h+='<section class="sect" style="padding-top:26px"><h3 style="font-size:1.15rem">🧭 How the questions come</h3><div class="card rich" style="margin-top:12px">'+s.fmt+'</div></section>';
  if(t.commandWords&&t.commandWords.length)h+='<section class="sect" style="padding-top:26px"><h3>Command words for '+esc(s.name)+'</h3><table class="tbl" style="margin-top:12px">'+t.commandWords.map(function(c){return '<tr><td>'+esc(c.w)+'</td><td>'+esc(c.meaning)+'</td></tr>';}).join('')+'</table></section>';
  if(t.commonMistakes&&t.commonMistakes.length)h+='<section class="sect" style="padding-top:26px"><h3>⚠️ Common mistakes</h3><div class="warn" style="margin-top:12px"><ul class="tlist">'+t.commonMistakes.map(function(m){return '<li>'+esc(m)+'</li>';}).join('')+'</ul></div></section>';
  if(t.examinerTips&&t.examinerTips.length)h+='<section class="sect" style="padding-top:26px"><h3>🏆 Examiner tips</h3><div class="okb" style="margin-top:12px"><ul class="tlist">'+t.examinerTips.map(function(m){return '<li>'+esc(m)+'</li>';}).join('')+'</ul></div></section>';
  h+='<section class="sect" style="padding-top:26px"><h3 style="font-size:1.15rem">🗣 Command words: the universal contract</h3><div style="margin-top:12px">'+EV.commandsTable()+'</div></section>';
  h+='<section class="sect" style="padding-top:26px"><h3 style="font-size:1.15rem">📈 Answer-style ladder</h3><p class="sub">How the same 8-mark question climbs from weak to A*.</p><div style="margin-top:12px">'+EV.ladderHTML()+'</div></section>';
  b.innerHTML=h;
};
/* A teacher's classroom: their notes and recorded lessons together. Free first, plan holders' below. */
TAB.classroom=function(o,b){
  var vd=EV.classOf(o),t=vd.teacher||{},free=vd.free||[],paid=vd.paid||[],pro=EVLive.isPro();
  function row(it,locked){
    if(locked)return EV.pdfLockRow(it,t.photo);
    return '<div class="pdf"><div class="ico'+(t.photo?' ph':'')+'" aria-hidden="true">'+(t.photo?'<img src="'+esc(t.photo)+'" alt="" loading="lazy">':'▶')+'</div><div><b>'+esc(it.t)+'</b><span>'+esc(it.d||'')+'</span></div><div class="acts">'+
      (it.url?'<a class="btn sm gold" href="'+esc(it.url)+'" target="_blank" rel="noopener">Open</a>':'<span class="pill">Being added</span>')+'</div></div>';
  }
  var h='<h2 class="h2" style="margin:0;font-size:1.7rem">'+esc(o.s.name)+' classroom</h2><p class="sub">Notes and recorded lessons from your teacher for '+esc(o.s.name)+' '+esc(o.s.code)+'.</p>';
  if(t.name)h+='<div class="teach"><img src="'+esc(t.photo||'')+'" alt="'+esc(t.name)+'" width="72" height="72"><div><small>Your teacher</small><b>'+esc(t.name)+'</b><span>'+esc(t.line||'')+'</span></div></div>';
  if(free.length)h+='<div class="libGroup" style="margin-top:18px"><h3>🎓 Free notes and lessons <span class="pill ok">Free</span></h3>'+free.map(function(it){return row(it,false);}).join('')+'</div>';
  if(paid.length)h+='<div class="libGroup premBox" id="paidClass" style="margin-top:18px"><h3>⭐ Full course: notes and recordings <span class="pill">'+paid.length+'</span></h3>'+
    (pro?'':'<p class="premSay">These are for plan holders. Plans are not on sale yet, so nothing can be bought here.</p>')+
    paid.map(function(it){return row(it,!pro);}).join('')+(pro?'':'<div class="row"><button class="btn sm" type="button" data-plans>See the plans</button></div>')+'</div>';
  b.innerHTML=h;
};
TAB.library=function(o,b){
  var h='<h2 class="h2" style="margin:0;font-size:1.7rem">PDF library</h2><p class="sub">Original EduVerse practice resources for '+esc(o.s.name)+' '+esc(o.s.code)+'. PDFs open in a new tab.</p>';
  if(!o.res){h+='<div class="empty" style="margin-top:20px"><b>PDFs for this subject are being prepared</b><span>Notes, flashcards and questions are ready now.</span><a class="btn gold sm" href="#notes-'+o.slug+'">Open notes</a></div>';b.innerHTML=h;return;}
  var cats=RESCAT.filter(function(c){return o.res[c[0]]&&o.res[c[0]].length});
  Object.keys(o.res).forEach(function(k){if(!RESCAT.some(function(c){return c[0]===k}))cats.push([k,k]);});
  /* Only the topical material is Pro. Mock-style papers (yearly, mixed, full-syllabus, challenge mocks) are free. */
  var pro=EVLive.isPro(),PRO_CATS={premium:1,topical:1,compiled:1,tests:1},FREE_CATS={detailed:1,quickref:1,yearly:1,mixed:1,assess:1,mocks:1};
  h+='<div class="stack" style="margin-top:20px;gap:26px">'+cats.map(function(c){var locked=PRO_CATS[c[0]]&&!pro;return '<div class="libGroup"><h3>'+esc(c[1])+' <span class="pill">'+o.res[c[0]].length+'</span>'+(PRO_CATS[c[0]]?' <span class="pill gold">Pro</span>':FREE_CATS[c[0]]?' <span class="pill ok">Free</span>':'')+'</h3>'+(locked?'<div class="empty" style="padding:18px"><b>🔒 Part of EduVerse Pro</b><span>Topical question banks, topical past papers and topic tests are part of EduVerse Pro. Pro is not on sale yet and nothing can be bought on this site. Mock papers are free.</span>'+(ST.profile?'':'<a class="btn gold sm" href="#signin">Sign in</a>')+'</div>':o.res[c[0]].map(EV.pdfRow).join(''))+'</div>';}).join('')+'</div>';
  b.innerHTML=h;
};
TAB.tools=function(o,b){
  var acc=EV.accuracy(o.ref),ex=ST.exam[o.ref]||'';
  var papers=o.s.papers.map(function(p){var w=parseFloat(String(p.w||'').replace('%',''));return {p:p.p,n:p.n,w:isNaN(w)?null:w};});
  var h='<h2 class="h2" style="margin:0;font-size:1.7rem">'+esc(o.s.name)+' study tools</h2><p class="sub">Keep your exam date, performance and grade plan for this subject in one place. Saved on this device.</p>'+
  '<div class="grid g3" style="margin-top:20px">'+
  '<div class="card stack"><span class="eyebrow">Exam planning</span><h3>Exam countdown</h3><div class="count"><div><b id="tD">—</b><span>days</span></div><div><b id="tW">—</b><span>weeks</span></div><div><b id="tS">—</b><span>study days*</span></div></div><label class="field" for="tEx">Exam date<input type="date" id="tEx" value="'+esc(ex)+'"></label><p class="small muted">*Assumes 6 study days a week.</p></div>'+
  '<div class="card stack"><span class="eyebrow">Real attempts</span><h3>Your accuracy</h3><div class="big">'+(acc?acc.pct+'<small>%</small>':'—')+'</div><div class="bar"><i style="width:'+(acc?acc.pct:0)+'%"></i></div><p class="small muted">'+(acc?acc.n+' questions attempted · indicative grade '+EV.grade(acc.pct):'Answer questions to set your baseline. Only your real attempts are used.')+'</p><a class="btn sm" href="#questions-'+o.slug+'">Practise questions →</a></div>'+
  '<div class="card stack"><span class="eyebrow">Learning</span><h3>Notes learned</h3>'+(function(){var n=EV.notesOf(o).length,d=0;for(var i=0;i<n;i++)if(ST.topicsDone.indexOf(o.ref+'#n'+i)>=0)d++;return '<div class="big">'+d+'<small> / '+n+'</small></div><div class="bar"><i style="width:'+Math.round(100*d/Math.max(1,n))+'%"></i></div>';})()+'<a class="btn sm" href="#notes-'+o.slug+'">Open notes →</a></div></div>'+
  '<section class="sect" style="padding-top:30px"><div class="card stack"><span class="eyebrow">Grade planning</span><h3>Grade target calculator</h3><p class="small muted">Enter the percentages you scored on papers you have done. Leave future papers blank, choose a target, and see the average you need on the rest. '+(papers.some(function(p){return p.w===null})?'Papers without a published weighting count equally.':'')+'</p>'+
  '<p class="small muted">Untick papers you are not sitting. Shared folders list both syllabuses\' papers, and some papers are alternatives (for example Paper 5 or Paper 6).</p><div class="grid g3" id="gcIn">'+papers.map(function(p,i){return '<div class="field"><label class="row" style="gap:6px;color:var(--ivory)" for="gs'+i+'"><input type="checkbox" id="gs'+i+'" checked> '+esc(p.p)+(p.w!==null?' · '+p.w+'%':'')+'</label><span class="small muted" style="min-height:2.4em">'+esc(p.n||'')+'</span><label class="sr" for="gc'+i+'">Score for '+esc(p.p)+'</label><input type="number" min="0" max="100" id="gc'+i+'" placeholder="Score % (blank = not sat yet)"></div>';}).join('')+'</div>'+
  '<div class="row"><label class="field" for="gcT" style="min-width:160px">Target grade<select id="gcT"><option value="85">A* (about 85%)</option><option value="75" selected>A (about 75%)</option><option value="65">B (about 65%)</option><option value="55">C (about 55%)</option></select></label><div class="grow" id="gcOut" style="font-size:.95rem"></div></div><p class="small muted">Boundaries are typical, not official. Real grade thresholds change every series.</p></div></section>';
  b.innerHTML=h;
  function cd(){var v=$('#tEx').value;if(!v){['tD','tW','tS'].forEach(function(i){$('#'+i).textContent='—'});return;}var d=Math.max(0,Math.ceil((new Date(v+'T09:00:00')-new Date())/864e5));$('#tD').textContent=d;$('#tW').textContent=Math.floor(d/7);$('#tS').textContent=Math.round(d*6/7);}
  $('#tEx').addEventListener('change',function(){ST.exam[o.ref]=this.value;EV.save();cd();EV.toast('Exam date saved');});cd();
  function gc(){var tw=0,done=0,rem=0;var on=papers.filter(function(_,i){return $('#gs'+i).checked});papers.forEach(function(p,i){var sit=$('#gs'+i).checked;$('#gc'+i).disabled=!sit;if(!sit)return;var w=p.w!==null?p.w:100/Math.max(1,on.length);tw+=w;var v=$('#gc'+i).value;if(v!==''){done+=w*Math.min(100,Math.max(0,+v))/100;}else rem+=w;});
    var target=+$('#gcT').value*tw/100,need=rem?Math.ceil(100*(target-done)/rem):null,out=$('#gcOut');
    if(rem===tw){out.innerHTML='<span class="muted">Enter at least one paper score.</span>';return;}
    if(need===null){var pct=Math.round(100*done/tw);out.innerHTML='All papers entered: about <b>'+pct+'%</b> overall, indicative grade <b style="color:var(--gold)">'+EV.grade(pct)+'</b>.';return;}
    out.innerHTML=need<=0?'<b style="color:var(--ok)">You have already reached this target</b> on the papers so far.':need>100?'<b style="color:var(--bad)">Out of reach</b> with the remaining papers. Try the next grade down.':'You need an average of <b style="color:var(--gold)">'+need+'%</b> on the remaining papers.';}
  $('#gcIn').addEventListener('input',gc);$('#gcIn').addEventListener('change',gc);$('#gcT').addEventListener('change',gc);gc();
};
TAB.topics=function(o,b){
  var m=o.db;
  var h='<div class="hd"><div><h2 class="h2" style="margin:0;font-size:1.7rem">Mathematics 4024 topic engine</h2><p class="sub" style="margin-top:6px">'+esc(m.statusNote||'')+'</p></div><span class="pill ok">Full reference subject</span></div>';
  var tot=0,dn=0;m.chapters.forEach(function(c){c.topics.forEach(function(t){tot++;if(ST.topicsDone.indexOf('db:'+t.id)>=0)dn++;});});
  h+='<div class="card" style="margin-top:16px;display:grid;gap:8px"><div class="hd"><b>Overall progress</b><span>'+dn+' / '+tot+' topics complete</span></div><div class="bar"><i style="width:'+Math.round(100*dn/tot)+'%"></i></div></div>';
  h+='<div class="grid g3" style="margin-top:18px">'+m.chapters.map(function(c){return '<div class="card stack" style="gap:8px"><h3>'+esc(c.name)+'</h3>'+c.topics.map(function(t){var d=ST.topicsDone.indexOf('db:'+t.id)>=0;return '<a class="row" href="#topic-'+t.id.toLowerCase().replace(/[^a-z0-9]/g,'')+'" style="text-decoration:none;gap:8px;font-size:.86rem;padding:6px 0;border-top:1px solid var(--rim)"><span style="color:'+(d?'var(--ok)':'var(--faint)')+'">'+(d?'●':'○')+'</span><span class="grow">'+esc(t.name)+'</span><span class="small muted">'+(t.questions||[]).length+' Q</span></a>';}).join('')+'</div>';}).join('')+'</div>';
  h+='<section class="sect" style="padding-top:30px"><div class="grid g2"><div class="card stack"><h3>🧮 Formula bank</h3><p class="small muted">Every formula from every topic, with when to use it and the common mistake.</p><button class="btn sm" type="button" id="showF">Show formula bank</button><div id="fBank" hidden></div></div><div class="card stack"><h3>📕 Definitions bank</h3><label class="search"><span aria-hidden="true">⌕</span><span class="sr">Search definitions</span><input id="defQ" placeholder="Search definitions"></label><div id="defList" class="defs" style="max-height:360px;overflow:auto"></div></div></div></section>';
  b.innerHTML=h;
  var F=[],DF=[];m.chapters.forEach(function(c){c.topics.forEach(function(t){(t.formulas||[]).forEach(function(f){F.push(f)});(t.defs||[]).forEach(function(d){DF.push({d:d,t:t.name})});});});
  $('#showF').addEventListener('click',function(){var fb=$('#fBank');fb.hidden=!fb.hidden;this.textContent=fb.hidden?'Show formula bank':'Hide formula bank';if(!fb.innerHTML)fb.innerHTML='<div class="scrollx"><table class="tbl"><thead><tr><th>Formula</th><th>Meaning</th><th>When to use</th><th>Example</th><th>Common mistake</th></tr></thead><tbody>'+F.map(function(f){return '<tr><td class="code">'+esc(f[0])+'</td><td>'+esc(f[1])+'</td><td>'+esc(f[3])+'</td><td>'+esc(f[4])+'</td><td>'+esc(f[5])+'</td></tr>';}).join('')+'</tbody></table></div>';});
  function pd(q){q=(q||'').toLowerCase();$('#defList').innerHTML=DF.filter(function(x){return !q||(x.d[0]+' '+x.d[1]).toLowerCase().indexOf(q)>=0}).map(function(x){return '<div><b>'+esc(x.d[0])+'</b> — '+esc(x.d[1])+'<br><span class="small muted">'+esc(x.t)+'</span></div>';}).join('')||'<span class="muted small">No match.</span>';}
  $('#defQ').addEventListener('input',function(){pd(this.value)});pd('');
};

/* =================== TOPIC (Maths 4024 engine) =================== */
V.topic=function(el,r){
  var T=EV.DBTOPIC[r.id],t=T.t,c=T.c,o=EV.BYREF[T.ref],m=o.db,key=T.key,done=ST.topicsDone.indexOf(key)>=0;
  EV.ctxExtra='';EV.touchRecent(o.ref);
  var side='<nav class="tside" aria-label="Topics">'+m.chapters.map(function(cc){return '<h4>'+esc(cc.name)+'</h4>'+cc.topics.map(function(tt){var id=tt.id.toLowerCase().replace(/[^a-z0-9]/g,'');return '<a href="#topic-'+id+'" class="'+(tt===t?'on ':'')+(ST.topicsDone.indexOf('db:'+tt.id)>=0?'dn':'')+'"><i></i>'+esc(tt.name)+'</a>';}).join('');}).join('')+'</nav>';
  var h='<div class="in page"><a class="crumb" href="#topics-'+o.slug+'">← Mathematics 4024 topics</a><div class="topicLayout" style="margin-top:14px">'+side+'<div class="stack" style="gap:26px">';
  h+='<div class="pageHead" style="padding:0"><span class="eyebrow"><b>'+esc(c.name)+'</b> · topic learning page</span><h1 style="font-size:clamp(1.8rem,4vw,2.8rem)">'+esc(t.name)+'</h1><div class="row"><button class="btn '+(done?'ok':'gold')+'" type="button" id="tDone">'+(done?'✓ Topic complete':'Mark topic complete')+'</button><button class="btn teal" type="button" data-ask="Teach me this topic step by step, then quiz me.">Ask Knovo to teach this</button></div></div>';
  if(t.obj)h+='<section class="tsec"><h3>🎯 Learning objectives</h3><ul class="tlist">'+t.obj.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></section>';
  if(t.simple)h+='<section class="tsec"><h3>💡 The simple version</h3><div class="simple">'+esc(t.simple)+'</div></section>';
  if(t.detail)h+='<section class="tsec"><h3>📖 In detail</h3><div class="card rich">'+t.detail+'</div></section>';
  if(t.defs&&t.defs.length)h+='<section class="tsec"><h3>📕 Key definitions</h3><div class="defs">'+t.defs.map(function(d){return '<div><b>'+esc(d[0])+'</b> — '+esc(d[1])+'</div>';}).join('')+'</div></section>';
  if(t.rules&&t.rules.length)h+='<section class="tsec"><h3>📏 Rules</h3><ul class="tlist">'+t.rules.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></section>';
  if(t.formulas&&t.formulas.length)h+='<section class="tsec"><h3>🧮 Formulas</h3><div class="scrollx"><table class="tbl"><thead><tr><th>Formula</th><th>Meaning</th><th>When to use</th><th>Example</th></tr></thead><tbody>'+t.formulas.map(function(f){return '<tr><td class="code">'+esc(f[0])+'</td><td>'+esc(f[1])+'</td><td>'+esc(f[3])+'</td><td>'+esc(f[4])+'</td></tr>';}).join('')+'</tbody></table></div></section>';
  if(t.method&&t.method.length)h+='<section class="tsec"><h3>🪜 Method</h3><ol class="tlist">'+t.method.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ol></section>';
  if(t.examples&&t.examples.length)h+='<section class="tsec"><h3>✍️ Worked examples</h3>'+t.examples.map(function(x,i){return '<div class="q"><div class="qh"><span class="pill gold">Example '+(i+1)+'</span></div><div class="qt">'+esc(x.q)+'</div><ol class="steps">'+(x.steps||[]).map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ol>'+(x.why?'<p class="small muted"><b>Why it works:</b> '+esc(x.why)+'</p>':'')+'</div>';}).join('')+'</section>';
  if(t.mistakes&&t.mistakes.length)h+='<section class="tsec"><h3>⚠️ Common mistakes</h3><div class="warn"><ul class="tlist">'+t.mistakes.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div></section>';
  if(t.tips&&t.tips.length)h+='<section class="tsec"><h3>🏆 Exam tips</h3><div class="okb"><ul class="tlist">'+t.tips.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div></section>';
  if(t.summary&&t.summary.length)h+='<section class="tsec"><h3>🧾 Summary</h3><ul class="tlist">'+t.summary.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></section>';
  if(t.cards&&t.cards.length)h+='<section class="tsec"><h3>🃏 Flashcards ('+t.cards.length+')</h3><div id="tDeck"></div></section>';
  if(t.questions&&t.questions.length)h+='<section class="tsec"><h3>📝 Exam questions ('+t.questions.length+')</h3>'+t.questions.map(function(x,i){return EV.qCard({id:'db:'+t.id+'#'+i,ref:o.ref,kind:'Question',q:x.q,steps:x.steps||[],a:x.ans||'',ms:x.ms||[],marks:x.marks,diff:x.diff,src:t.name},i+1);}).join('')+'</section>';
  h+='</div></div></div>';
  el.innerHTML=h;
  if(t.cards&&t.cards.length)EV.deck($('#tDeck'),t.cards.map(function(x,i){return {q:x.q,a:x.a,key:'db:'+t.id+'#c'+i}}),t.name);
  $('#tDone').addEventListener('click',function(){var on=EV.completeTopic(key,o.ref);this.className='btn '+(on?'ok':'gold');this.textContent=on?'✓ Topic complete':'Mark topic complete';var a=$('.tside a.on');if(a)a.classList.toggle('dn',on);});
};
})();
