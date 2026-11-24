/* EduVerse lifetime XP and genuine signed-in student leaderboard.
   No sample students, generated scores or direct client-side score updates. */
(function(){
"use strict";

var XP_API="https://yazzyldmohngmotiozlj.supabase.co";
var XP_KEY="sb_publishable_1p58DjFzc2m-VsPOO1thuA_gjemaUpq";
var XP_PENDING={},XP_TIMER=null,XP_INFLIGHT=null,XP_RANGE="all";
var XP_SERVER={status:hasRealSession()?"idle":"guest",leaders:[],me:null,message:"",updated:0};

function xpValue(action,correct){
  if(action==="topic")return 50;
  if(action==="question")return correct?15:10;
  if(action==="card")return 3;
  if(action==="streak")return 20;
  if(action==="mock")return 100;
  return 0;
}
function xpCleanKey(key){return String(key||"").replace(/[^a-zA-Z0-9_:\/.@-]/g,"_").slice(0,160);}
function xpWeekStart(){
  var d=new Date(),day=d.getUTCDay(),diff=(day+6)%7;
  return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())-diff*86400000;
}
function xpEnsureLedger(){
  if(Array.isArray(ST.xpLedger))return ST.xpLedger;
  var events=[],seen={};
  function add(action,key,correct,ts){
    key=xpCleanKey(key);if(!key||seen[key])return;seen[key]=true;
    events.push({action:action,event_key:key,correct:!!correct,ts:Number(ts)||0});
  }
  (ST.topicsDone||[]).forEach(function(id){add("topic","topic:"+id,false,0);});
  (ST.attempts||[]).forEach(function(a,i){add("question","question:"+(a.qid||"unknown")+":"+(a.t||("legacy-"+i)),!!a.ok,a.t||0);});
  (ST.cardsSeen||[]).forEach(function(uid){add("card","card:"+uid,false,0);});
  var streakN=(ST.streak&&ST.streak.count)||0;
  for(var i=1;i<=streakN;i++)add("streak","streak:legacy-"+i,false,0);
  (ST.mocks||[]).forEach(function(m,i){add("mock","mock:"+(m.ts||("legacy-"+i)),false,m.ts||0);});
  ST.xpLedger=events;
  try{save();}catch(e){}
  return events;
}
function xpLedgerTotal(){return xpEnsureLedger().reduce(function(n,e){return n+xpValue(e.action,e.correct);},0);}
function xpLocalWeekly(){var start=xpWeekStart();return xpEnsureLedger().reduce(function(n,e){return n+(e.ts>=start?xpValue(e.action,e.correct):0);},0);}
window.xpTotal=xpLedgerTotal;

function xpShowGain(amount){
  var old=document.querySelector(".xpGain");if(old)old.remove();
  var el=document.createElement("div");el.className="xpGain";el.textContent="+"+amount+" XP · genuine study progress";
  document.body.appendChild(el);setTimeout(function(){if(el.parentNode)el.remove();},1600);
}
function xpScheduleSync(){
  if(!hasRealSession()||XP_SERVER.status==="setup"||XP_SERVER.status==="auth")return;
  clearTimeout(XP_TIMER);XP_TIMER=setTimeout(function(){XP_TIMER=null;xpSyncAll(false);},850);
}
window.xpRecord=function(action,key,correct){
  var events=xpEnsureLedger();key=xpCleanKey(key);
  if(!key||!xpValue(action,correct)||events.some(function(e){return e.event_key===key;}))return false;
  var event={action:action,event_key:key,correct:!!correct,ts:Date.now()};
  events.push(event);XP_PENDING[key]=event;
  try{save();}catch(e){}
  xpShowGain(xpValue(action,correct));xpScheduleSync();
  return true;
};

function xpError(status,code,message){var e=new Error(message||"XP request failed");e.status=status||0;e.code=code||"";return e;}
async function xpRpc(name,body){
  if(!hasRealSession())throw xpError(401,"AUTH","Sign in to use the shared leaderboard.");
  /* always send a fresh, unexpired token — silently renewed via the stored refresh token */
  var token=localStorage.getItem("ev_auth_token"),response,data=null;
  if(window.knovoGetSession){
    var s=null;try{s=await window.knovoGetSession();}catch(e){}
    if(s&&s.access_token)token=s.access_token;
    else throw xpError(401,"AUTH","Your session has expired. Please sign in again.");
  }
  try{
    response=await fetch(XP_API+"/rest/v1/rpc/"+name,{method:"POST",headers:{apikey:XP_KEY,Authorization:"Bearer "+token,"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(body||{})});
  }catch(e){throw xpError(0,"NETWORK","Could not connect to the leaderboard.");}
  try{data=await response.json();}catch(e){}
  if(!response.ok){
    var msg=data&&(data.message||data.error||data.hint)||("Request failed ("+response.status+")");
    throw xpError(response.status,data&&data.code,msg);
  }
  return data;
}
function xpPayload(events){
  return events.map(function(e){
    /* Undated historical progress counts toward lifetime XP, not this week. */
    var reliable=e.ts&&e.ts>=946684800000;
    return{action:e.action,event_key:e.event_key,correct:!!e.correct,occurred_at:reliable?new Date(e.ts).toISOString():"2000-01-01T00:00:00.000Z"};
  });
}
function xpOne(row){return Array.isArray(row)?(row[0]||null):row;}
function xpSetStatus(status,message){
  XP_SERVER.status=status;XP_SERVER.message=message||"";
  if(VIEW.name==="leaderboard")render();
}
async function xpSyncAll(force){
  if(!hasRealSession()){xpSetStatus("guest","");return;}
  if(XP_INFLIGHT)return XP_INFLIGHT;
  if(XP_SERVER.status==="setup"&&!force)return;
  XP_INFLIGHT=(async function(){
    var initial=force||XP_SERVER.status!=="ready";
    var pending=initial?xpEnsureLedger().slice():Object.keys(XP_PENDING).map(function(k){return XP_PENDING[k];});
    XP_SERVER.status="loading";XP_SERVER.message="";if(VIEW.name==="leaderboard")render();
    try{
      var me=null;
      for(var i=0;i<pending.length;i+=100){
        var chunk=pending.slice(i,i+100);if(!chunk.length)continue;
        var result=await xpRpc("eduverse_sync_xp",{events:xpPayload(chunk)});me=xpOne(result)||me;
        if(!hasRealSession()){xpSetStatus("guest","");return;}
        chunk.forEach(function(e){delete XP_PENDING[e.event_key];});
      }
      var results=await Promise.all([xpRpc("eduverse_leaderboard",{}),xpRpc("eduverse_my_xp",{})]);
      if(!hasRealSession()){xpSetStatus("guest","");return;}
      XP_SERVER.leaders=Array.isArray(results[0])?results[0]:[];
      XP_SERVER.me=xpOne(results[1])||me||{total_xp:0,weekly_xp:0,today_xp:0};
      XP_SERVER.status="ready";XP_SERVER.message="";XP_SERVER.updated=Date.now();
      if(VIEW.name==="leaderboard")render();
      if(Object.keys(XP_PENDING).length)xpScheduleSync();
    }catch(e){
      var missing=e.status===404||e.code==="PGRST202"||/could not find|schema cache|function.*not/i.test(e.message);
      var status=missing?"setup":e.status===401?"auth":"error";
      XP_SERVER.status=status;XP_SERVER.message=missing?"The shared leaderboard database has not been connected yet.":e.message;
      if(VIEW.name==="leaderboard")render();
    }
  })();
  try{return await XP_INFLIGHT;}finally{XP_INFLIGHT=null;}
}
window.xpRefresh=function(){return xpSyncAll(true);};
window.xpResetSession=function(){
  clearTimeout(XP_TIMER);XP_PENDING={};XP_SERVER={status:"guest",leaders:[],me:null,message:"",updated:0};
  if(VIEW.name==="leaderboard")render();
};
window.xpLeaderboardRange=function(range){XP_RANGE=range==="week"?"week":"all";render();};

function xpFmt(n){return Number(n||0).toLocaleString("en-US");}
function xpBoardRows(){
  var key=XP_RANGE==="week"?"weekly_xp":"total_xp";
  return XP_SERVER.leaders.filter(function(r){return Number(r[key])>0;}).slice().sort(function(a,b){
    return Number(b[key])-Number(a[key])||String(a.display_name).localeCompare(String(b.display_name));
  }).map(function(r,i){return Object.assign({},r,{shown_rank:i+1,shown_xp:Number(r[key])||0});});
}
function xpPodium(row,rank){
  var medal=rank===1?"1":rank===2?"2":"3",place=rank===1?"first":rank===3?"third":"second";
  return `<article class="lbPod ${place}"><span class="lbMedal">${medal}</span><b class="lbPodName">${escH(row.display_name)}</b><strong class="lbPodXP">${xpFmt(row.shown_xp)}</strong><small>XP · rank ${rank}</small>${row.is_me?'<span class="lbYouTag">YOU</span>':""}</article>`;
}
function xpRow(row){
  return `<div class="lbRow${row.is_me?" me":""}"><span class="lbRank">${row.shown_rank}</span><div class="lbIdentity"><b>${escH(row.display_name)} ${row.is_me?'<span class="lbYouTag">YOU</span>':""}</b><span>Signed-in student · genuine study XP</span></div><div class="lbPoints"><b>${xpFmt(row.shown_xp)}</b><span>XP</span></div></div>`;
}
function xpEmpty(title,text,button){
  return `<div class="lbEmpty"><span class="lbEmptyMark">◇</span><h2>${escH(title)}</h2><p>${escH(text)}</p>${button||""}</div>`;
}
function xpSide(){
  return `<aside class="lbSide"><section class="lbPanel"><h2>How XP is earned</h2><p>Lifetime XP stays earned. Unchecking a topic does not take it away, and the same achievement cannot be counted twice.</p>
    <div class="lbRule"><span>Complete a topic</span><b>+50 XP</b></div><div class="lbRule"><span>Attempt a question</span><b>+10 XP</b></div><div class="lbRule"><span>Correct-answer bonus</span><b>+5 XP</b></div><div class="lbRule"><span>Review a flashcard</span><b>+3 XP</b></div><div class="lbRule"><span>New study-streak day</span><b>+20 XP</b></div><div class="lbRule"><span>Finish a timed mock</span><b>+100 XP</b></div></section>
    <section class="lbPanel lbTrust"><h2>No bots. No invented scores.</h2><p>Only signed-in accounts with the student role can appear. EduVerse adds no sample names, bot accounts or generated scores. Display names are shown; email addresses are never published.</p><p>Fixed server rules award XP. Students cannot directly type in or edit a ranking score.</p></section>
    <section class="lbPanel"><h2>Weekly rankings</h2><p>The weekly race starts each Monday at 00:00 UTC. All-time XP remains safely accumulated.</p><button class="btn sm" onclick="goPick('dashboard')">Earn XP from my dashboard →</button></section></aside>`;
}
function vLeaderboard(){
  CUR={t:"xp"};xpEnsureLedger();
  var authed=hasRealSession(),ready=authed&&XP_SERVER.status==="ready",usingServer=ready&&XP_SERVER.me;
  var total=usingServer?Number(XP_SERVER.me.total_xp):xpLedgerTotal();
  var weekly=usingServer?Number(XP_SERVER.me.weekly_xp):xpLocalWeekly();
  var level=xpLevel(total),rows=ready?xpBoardRows():[];
  var rank=usingServer?(XP_RANGE==="week"?XP_SERVER.me.week_rank:XP_SERVER.me.all_rank):null;
  var state=authed?XP_SERVER.status:"guest";
  var statusText=state==="ready"?"Account XP synced":state==="loading"?"Syncing genuine study activity…":state==="guest"?"XP on this device":"Local XP safe · shared rankings unavailable";
  var h=`<section class="lbShell"><header class="lbHead"><div><span class="lbEyebrow">EDUVERSE · GENUINE STUDENT PROGRESS</span><h1>Study <span>ranks.</span></h1><p>Turn consistent revision into XP. Compare weekly or all-time progress with real signed-in students—never bots, demonstration accounts or invented scores.</p></div>${authed?`<button class="btn lbRefresh" onclick="xpRefresh()" ${state==="loading"?"disabled":""}>${state==="loading"?"Syncing…":"↻ Sync & refresh"}</button>`:'<a class="btn pri lbRefresh" href="signin.html">Sign in to join</a>'}</header>
    <div class="lbStatbar"><div class="lbStat"><b class="gold">${xpFmt(total)}</b><span>${ready?"Your account XP":"Your XP · this device"}</span></div><div class="lbStat"><b>${level}</b><span>Your level</span></div><div class="lbStat"><b>${xpFmt(weekly)}</b><span>This week</span></div><div class="lbStat"><b>${rank?("#"+rank):"—"}</b><span>${XP_RANGE==="week"?"Weekly":"All-time"} rank</span></div></div>`;
  if(state==="setup")h+=`<div class="lbNotice"><b>Owner setup needed:</b> shared rankings are not connected yet. Your local XP is safe, and no substitute students are shown. <a href="leaderboard-database-setup.txt" target="_blank" rel="noopener" style="color:var(--gold)">Open the one-time database setup guide</a>.</div>`;
  else if(state==="error")h+=`<div class="lbNotice"><b>Could not sync:</b> ${escH(XP_SERVER.message||"Check your connection and try again.")} Your new XP remains saved on this device.</div>`;
  else if(state==="auth")h+=`<div class="lbNotice"><b>Please sign in again.</b> Your session has expired. Local XP remains safe and can sync after you return.</div>`;
  h+=`<div class="lbGrid"><main class="lbMain"><div class="lbToolbar"><div class="lbTabs" role="tablist" aria-label="Leaderboard period"><button class="lbTab ${XP_RANGE==="all"?"on":""}" role="tab" aria-selected="${XP_RANGE==="all"}" onclick="xpLeaderboardRange('all')">All time</button><button class="lbTab ${XP_RANGE==="week"?"on":""}" role="tab" aria-selected="${XP_RANGE==="week"}" onclick="xpLeaderboardRange('week')">This week</button></div><span class="lbUpdated">${escH(statusText)}${XP_SERVER.updated?" · "+new Date(XP_SERVER.updated).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}):""}</span></div>`;
  if(state==="guest")h+=xpEmpty("Sign in to see genuine student rankings","You can keep earning XP now. After signing in, your study events can sync to your student account without exposing your email address.",'<a class="btn pri" href="signin.html">Sign in or create a student account</a>');
  else if(state==="loading")h+=xpEmpty("Loading genuine student scores","Syncing study activity and reading account rankings. No sample rows are shown while you wait.","");
  else if(state!=="ready")h+=xpEmpty("No rankings to show yet","The shared leaderboard is unavailable. Your own XP above is still genuine and saved on this device.","");
  else if(!rows.length)h+=xpEmpty(XP_RANGE==="week"?"No weekly XP has been ranked yet":"The leaderboard is waiting for its first student",XP_RANGE==="week"?"Complete a topic, attempt a question, review a flashcard or finish a mock to begin this week’s genuine ranking.":"Earn XP while signed in to become the first genuine student on the leaderboard. No bots will fill the empty places.",'<button class="btn pri" onclick="goPick(\'dashboard\')">Start earning XP</button>');
  else{
    var top=rows.slice(0,3),podium=[];
    if(top[1])podium.push(xpPodium(top[1],2));if(top[0])podium.push(xpPodium(top[0],1));if(top[2])podium.push(xpPodium(top[2],3));
    h+=`<div class="lbPodium">${podium.join("")}</div><div class="lbRows">${rows.slice(3).map(xpRow).join("")}</div>`;
  }
  h+=`</main>${xpSide()}</div></section>`;
  app.innerHTML=h;
  if(authed&&(XP_SERVER.status==="idle"||XP_SERVER.status==="ready")&&!XP_INFLIGHT&&!XP_TIMER&&XP_SERVER.status==="idle")setTimeout(function(){xpSyncAll(false);},0);
}
window.vLeaderboard=vLeaderboard;
window.__xpLedgerTotal=xpLedgerTotal;

/* ---------------- live connection: sync on load, on focus, and every minute ---------------- */
setTimeout(function(){ if(hasRealSession()&&!XP_INFLIGHT)xpSyncAll(false); },1500);
setInterval(function(){
  if(hasRealSession()&&!XP_INFLIGHT&&XP_SERVER.status!=="setup")xpSyncAll(false);
},60000);
document.addEventListener("visibilitychange",function(){
  if(!document.hidden&&hasRealSession()&&!XP_INFLIGHT&&XP_SERVER.status!=="setup")xpSyncAll(false);
});
window.addEventListener("focus",function(){
  if(hasRealSession()&&!XP_INFLIGHT&&XP_SERVER.status!=="setup")xpSyncAll(false);
});
})();
