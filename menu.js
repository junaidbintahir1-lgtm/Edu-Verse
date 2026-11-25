/* EduVerse new design — ☰ side menu, notifications bell, text size (matches the live site's menu and bell) */
(function(){
"use strict";
var EV=window.EV,$=EV.$,$$=EV.$$,esc=EV.esc,ST=EV.ST;
ST.notifsRead=ST.notifsRead||[];ST.notifsHidden=ST.notifsHidden||[];if(ST.futureNotify===undefined)ST.futureNotify=false;if(!ST.font)ST.font=1;

/* ---------- text size ---------- */
function applyFont(){document.documentElement.style.setProperty('--fs',String(ST.font));}
EV.fontStep=function(d){ST.font=d===0?1:Math.min(1.25,Math.max(.85,Math.round((ST.font+d*.05)*100)/100));applyFont();EV.save();EV.toast('Text size '+Math.round(ST.font*100)+'%');};
applyFont();

/* ---------- side menu ---------- */
var LINKS=[['📚','Choose qualification','#qualifications'],['📊','Dashboard','#dashboard'],['🎯','Exam technique','#technique'],['✎','Mistakes','#mistakes'],['✦','Knovo','#knovo'],['⏱','Mock exam','#mock'],['📄','Papers','#papers'],['🏆','Ranks','#ranks'],['ℹ️','About','#about']];
EV.renderDrawer=function(){
  var p=ST.profile,favs=ST.favs.map(function(r){return EV.BYREF[r]}).filter(Boolean),rec=ST.recent.map(function(r){return EV.BYREF[r]}).filter(function(o){return o&&favs.indexOf(o)<0}).slice(0,4);
  var h='<div class="dHead"><button class="dClose" type="button" data-dclose aria-label="Close menu">✕</button></div>'+
  '<section class="dSec"><h4>Profile</h4><div class="dProf"><div class="avatar dAv">'+esc((p?p.name:'G').charAt(0).toUpperCase())+'</div><div class="grow"><b>'+esc(p?p.name:'Guest student')+'</b><small>'+esc(p&&p.email?p.email:'Student · EduVerse learner')+'</small><small style="color:var(--gold)">⭐ Level '+EV.level(EV.shownXP())+' · '+EV.shownXP()+' XP</small><span class="pill'+(EVLive.isPro()||EVLive.isOwner()?' gold':'')+'" style="width:max-content;margin-top:4px">'+esc(p?EV.planLabel():'🌱 Free plan')+'</span></div></div>'+
    (p?'<div class="row" id="dEditRow"><button class="btn sm" type="button" id="dEdit">✦ Edit profile</button></div>':'<a class="btn gold sm" href="#signin" data-dclose>✦ Sign in / Join free</a>')+'</section>'+
  '<section class="dSec"><h4>❤️ Liked subjects</h4>'+(favs.length?'<div class="dList">'+favs.map(function(o){return '<div class="dItem"><a href="#overview-'+o.slug+'" data-dclose><span>'+o.s.icon+'</span><span class="grow">'+esc(o.s.name)+' <span class="code muted">'+esc(o.s.code)+'</span></span></a><button type="button" data-unfav="'+o.ref+'" aria-label="Remove '+esc(o.s.name)+' from liked subjects">✕</button></div>';}).join('')+'</div>':'<p class="dEmpty">Tap ♡ on any subject and it will be pinned here.</p>')+'</section>'+
  (rec.length?'<section class="dSec"><h4>🕘 Recently opened</h4><div class="dList">'+rec.map(function(o){return '<div class="dItem"><a href="#overview-'+o.slug+'" data-dclose><span>'+o.s.icon+'</span><span class="grow">'+esc(o.s.name)+' <span class="code muted">'+esc(o.s.code)+'</span></span></a></div>';}).join('')+'</div></section>':'')+
  '<section class="dSec"><h4>🧭 Everything on EduVerse</h4><div class="dGrid">'+LINKS.map(function(l){return '<a href="'+l[2]+'" data-dclose><span>'+l[0]+'</span>'+l[1]+'</a>';}).join('')+'</div>'+
    '<div class="dQuals">'+EV.LEVELS.map(function(L){var soon=L.subjects.every(function(o){return o.soon});return '<a href="#level-'+L.slug+'" data-dclose class="pill'+(soon?'':' gold')+'">'+esc(L.meta.short)+(soon?' · soon':'')+'</a>';}).join('')+'</div></section>'+
  '<section class="dSec"><h4>⚙️ Settings</h4><div class="dRow"><span>🔠 Text size</span><span class="row" style="gap:4px"><button class="btn sm" type="button" data-fs="-1" aria-label="Smaller text">A−</button><button class="btn sm" type="button" data-fs="0" aria-label="Default text size">A</button><button class="btn sm" type="button" data-fs="1" aria-label="Larger text">A+</button></span></div><div class="dRow"><span>🏆 Show me on the leaderboard</span><button class="btn sm'+(EVLive.lbOptIn()?' gold':'')+'" type="button" data-lb aria-pressed="'+EVLive.lbOptIn()+'">'+(EVLive.lbOptIn()?'✓ On':'Off')+'</button></div><div class="dRow"><span>🔔 Future-update alerts</span><button class="btn sm'+(ST.futureNotify?' teal':'')+'" type="button" data-notify>'+(ST.futureNotify?'✓ On':'Turn on')+'</button></div></section>'+
  '<section class="dSec"><h4>✦ Knovo AI</h4><a class="btn teal" href="#knovo" data-dclose>Open Knovo workspace</a><button class="btn" type="button" data-lesson="" data-dclose>✨ Start a Live Lesson</button><button class="btn ghost sm" type="button" data-plans>See Knovo plans</button></section>'+
  '<section class="dSec"><h4>🏆 XP leaderboard</h4><a class="btn" href="#ranks" data-dclose>View genuine student rankings</a></section>'+
  '<section class="dSec"><h4>✦ Get to know us</h4><a class="btn" href="#about" data-dclose>About EduVerse &amp; our mission</a></section>'+
  '<section class="dSec"><h4>🌐 Community</h4><a class="btn" href="https://www.instagram.com/eduverse.27" target="_blank" rel="noopener">📸 Sneak peeks on Instagram · @eduverse.27</a><p class="dEmpty">New features, study tips and behind-the-scenes previews land on Instagram first. Discord: <b>to be added</b></p></section>'+
  '<section class="dSec">'+(p?'<button class="btn" type="button" id="dOut">🚪 Log out</button>':'<a class="btn gold" href="#signin" data-dclose>✦ Sign in / Join</a>')+'</section>'+
  '<p class="dFoot">EDUVERSE · Study Platform</p>';
  $('#drawer').innerHTML=h;
  var e=$('#dEdit');if(e)e.addEventListener('click',function(){$('#dEditRow').innerHTML='<form class="row" id="dEditF" style="width:100%"><label class="sr" for="dName">Display name</label><input class="inp grow" id="dName" maxlength="30" value="'+esc(p.name)+'"><button class="btn sm gold" type="submit">Save</button></form>';var i=$('#dName');i.focus();i.select();$('#dEditF').addEventListener('submit',function(ev){ev.preventDefault();var n=i.value.trim();if(!n)return;ST.profile.name=n;EV.save();EV.paintProfile();EV.renderDrawer();EV.toast('Profile updated');});});
  var o=$('#dOut');if(o)o.addEventListener('click',function(){EV.closeDrawer();EV.signOut();});
};
EV.openDrawer=function(){EV.closeBell();EV.renderDrawer();var d=$('#drawer');d.classList.add('open');d.setAttribute('aria-hidden','false');$('#drawerScrim').classList.add('on');$('#menuBtn').setAttribute('aria-expanded','true');setTimeout(function(){var c=d.querySelector('.dClose');if(c)c.focus();},300);};
EV.closeDrawer=function(){var d=$('#drawer');d.classList.remove('open');d.setAttribute('aria-hidden','true');$('#drawerScrim').classList.remove('on');$('#menuBtn').setAttribute('aria-expanded','false');};
$('#menuBtn').addEventListener('click',EV.openDrawer);
$('#drawerScrim').addEventListener('click',EV.closeDrawer);
$('#drawer').addEventListener('click',function(e){
  if(e.target.closest('[data-dclose]')){EV.closeDrawer();return;}
  var u=e.target.closest('[data-unfav]');if(u){EV.toggleFav(u.dataset.unfav);EV.renderDrawer();EV.toast('Removed from liked subjects');if(EV.route.name==='subject'||EV.route.name==='subjects'||EV.route.name==='level')EV.render();return;}
  var f=e.target.closest('[data-fs]');if(f){EV.fontStep(+f.dataset.fs);return;}
  if(e.target.closest('[data-notify]')){EV.toggleNotify();EV.renderDrawer();}
  if(e.target.closest('[data-lb]')){var on=!EVLive.lbOptIn();EVLive.setLbOptIn(on);EV.renderDrawer();EV.toast(on?'You now appear on the XP leaderboard':'You are hidden from the XP leaderboard. Your XP still counts for you.');if(EV.route.name==='ranks')EV.render();}
});

/* ---------- notifications ---------- */
EV.buildNotifs=function(){
  var list=[],t=EV.today(),sN=ST.streak.count||0,tq=ST.today.d===t?ST.today.q:0;
  list.push({id:'future_updates',ic:'🔔',pin:true,notify:true,t:'Coming soon: new subject folders, more past-paper packs and Knovo Plus.',d:'Tap "Notify me" and we\'ll flag it here first.'});
  list.push({id:'quiz_'+t,ic:'❓',t:'Your daily quiz is ready: 3 questions from 2 different subjects.',d:'Today',go:'#home'});
  if(sN>0)list.push({id:'streak_'+t,ic:'🔥',t:sN+'-day streak! '+Math.max(0,ST.goal-tq)+' more question'+(ST.goal-tq===1?'':'s')+' to reach today\'s goal.',d:'Today',go:'#dashboard'});
  var open=ST.mistakes.filter(function(m){return !m.resolved}).length;
  if(open)list.push({id:'mist_'+t+'_'+open,ic:'✎',t:open+' mistake'+(open>1?'s':'')+' waiting in your notebook. Retry them to resolve.',d:'Today',go:'#mistakes'});
  list.push({id:'new_look',ic:'🪐',t:'New look: the black 3D EduVerse design is in testing. Every subject, note and PDF is inside.',d:'Announcement'});
  list.push({id:'edx_launch',ic:'🧭',t:'New: 9 Pearson Edexcel IAL subjects: Maths, Further Maths, Physics, Chemistry, Biology, Economics, Business, Accounting and English Language.',d:'Announcement',go:'#level-aleveledx'});
  list.push({id:'ai_buddy',ic:'✦',t:'Knovo has its own workspace: chat, mark your answers, scan a question and start Live Lessons. The floating button gives quick answers on any page.',d:'Announcement',go:'#knovo'});
  if(ST.favs.length)list.push({id:'favs_'+ST.favs.length,ic:'❤️',t:'You have '+ST.favs.length+' liked subject'+(ST.favs.length>1?'s':'')+' pinned in the ☰ menu.',d:'Account',menu:true});
  return list.filter(function(x){return x.pin||ST.notifsHidden.indexOf(x.id)<0;});
};
EV.paintBell=function(){var b=$('#bellBadge');if(!b)return;var n=EV.buildNotifs().filter(function(x){return ST.notifsRead.indexOf(x.id)<0}).length;b.hidden=!n;b.textContent=n>9?'9+':n;$('#bellBtn').setAttribute('aria-label','Notifications'+(n?', '+n+' unread':''));};
EV.toggleNotify=function(){ST.futureNotify=!ST.futureNotify;EV.save();EV.toast(ST.futureNotify?'Subscribed. Future releases will be flagged here first.':'Future-update notifications turned off');if(!$('#bellDrop').hidden)EV.renderBell();};
EV.renderBell=function(){
  var list=EV.buildNotifs(),d=$('#bellDrop');
  d.innerHTML='<div class="bdHead"><b>🔔 Notifications</b><button class="btn sm" type="button" data-bclear>Clear all</button><button class="btn sm ghost" type="button" data-bclose aria-label="Close notifications">✕</button></div>'+
    (list.length?list.map(function(x){var unread=ST.notifsRead.indexOf(x.id)<0;return '<div class="bItem'+(x.pin?' pin':'')+(unread?' new':'')+'"><span class="bi" aria-hidden="true">'+x.ic+'</span><div class="grow">'+esc(x.t)+'<small>'+esc(x.d)+'</small>'+(x.go?'<a href="'+x.go+'" data-bclose>Open →</a>':'')+(x.menu?'<button type="button" class="lnk" data-bmenu>Open ☰ menu →</button>':'')+'</div>'+(x.notify?'<button class="btn sm'+(ST.futureNotify?' teal':' gold')+'" type="button" data-bnotify>'+(ST.futureNotify?'✓ Subscribed':'🔔 Notify me')+'</button>':'')+'</div>';}).join(''):'<p class="dEmpty" style="text-align:center;padding:16px">You\'re all caught up ✨</p>');
};
EV.openBell=function(){EV.closeDrawer();EV.renderBell();var d=$('#bellDrop');d.hidden=false;$('#bellBtn').setAttribute('aria-expanded','true');ST.notifsRead=EV.buildNotifs().map(function(x){return x.id});EV.save();setTimeout(EV.paintBell,600);};
EV.closeBell=function(){var d=$('#bellDrop');if(!d||d.hidden)return;d.hidden=true;$('#bellBtn').setAttribute('aria-expanded','false');};
$('#bellBtn').addEventListener('click',function(e){e.stopPropagation();if($('#bellDrop').hidden)EV.openBell();else EV.closeBell();});
$('#bellDrop').addEventListener('click',function(e){
  if(e.target.closest('[data-bclose]')){EV.closeBell();return;}
  if(e.target.closest('[data-bnotify]')){EV.toggleNotify();return;}
  if(e.target.closest('[data-bmenu]')){EV.closeBell();EV.openDrawer();return;}
  if(e.target.closest('[data-bclear]')){ST.notifsHidden=ST.notifsHidden.concat(EV.buildNotifs().filter(function(x){return !x.pin}).map(function(x){return x.id}));EV.save();EV.renderBell();EV.paintBell();EV.toast('Notifications cleared ✨');}
});
document.addEventListener('click',function(e){var d=$('#bellDrop');if(d&&!d.hidden&&!d.contains(e.target)&&!e.target.closest('#bellBtn'))EV.closeBell();});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){EV.closeDrawer();EV.closeBell();}});

/* keep the bell and menu in step with what students do */
var addXP=EV.addXP;EV.addXP=function(a,w){addXP(a,w);EV.paintBell();};
var tf=EV.toggleFav;EV.toggleFav=function(ref){var on=tf(ref);EV.paintBell();if($('#drawer').classList.contains('open'))EV.renderDrawer();return on;};
})();
