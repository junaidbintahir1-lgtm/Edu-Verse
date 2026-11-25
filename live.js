/* EduVerse new design — connections to the REAL EduVerse backend.
   Loaded before core.js. Everything that talks to Supabase, Knovo or the live site's saved
   progress lives here, so the design files stay about design.

   - Sign-in: the same Supabase project and the same localStorage keys as signin.html
     (ev_auth_token / ev_auth_refresh / ev_auth_expires / ev_auth_user), so a student who is
     signed in on the old site is signed in here too, and the other way round.
   - Knovo: the same Edge Function call as index.html's askEdge (Bearer token, systemInstruction,
     contents, 429 LIMIT_REACHED with msLeft).
   - XP: the same XP ledger (ev_state_v1.xpLedger) and the same server functions as
     xp-leaderboard.js (eduverse_sync_xp, eduverse_leaderboard, eduverse_my_xp), so XP earned
     on either design is counted once and ranks are genuine.
   - Progress: reads and writes the live site's saved progress (localStorage "ev_state_v1"). */
(function(){
"use strict";
var SUPA_URL="https://yazzyldmohngmotiozlj.supabase.co";
var SUPA_KEY="sb_publishable_1p58DjFzc2m-VsPOO1thuA_gjemaUpq"; /* publishable key: safe to ship, same as index.html */
var EDGE=SUPA_URL+"/functions/v1/Knovo";
var L=window.EVLive={SUPA_URL:SUPA_URL,SUPA_KEY:SUPA_KEY,EDGE:EDGE};

function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function lsDel(k){try{localStorage.removeItem(k);}catch(e){}}
function jsonGet(k,def){try{var v=JSON.parse(lsGet(k)||"null");return v==null?def:v;}catch(e){return def;}}

/* =============================== sign-in =============================== */
function stored(){return {access:lsGet("ev_auth_token")||"",refresh:lsGet("ev_auth_refresh")||"",expires:Number(lsGet("ev_auth_expires")||"0")};}
function jwtExp(t){try{var p=JSON.parse(atob(String(t).split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));return (Number(p.exp)||0)*1000;}catch(e){return 0;}}
function clearAuth(){["ev_auth_token","ev_auth_refresh","ev_auth_expires","ev_auth_user"].forEach(lsDel);OWNER=null;}
function storeSession(d,email){
  if(d.access_token)lsSet("ev_auth_token",d.access_token);
  if(d.refresh_token)lsSet("ev_auth_refresh",d.refresh_token);
  if(d.access_token)lsSet("ev_auth_expires",String(Date.now()+(Number(d.expires_in)||3600)*1000));
  if(d.user||email){
    var meta=(d.user&&d.user.user_metadata)||{},old=jsonGet("ev_auth_user",{})||{};
    lsSet("ev_auth_user",JSON.stringify({email:email||(d.user&&d.user.email)||old.email||"",full_name:meta.full_name||meta.name||old.full_name||"",user_role:meta.user_role||old.user_role||""}));
  }
}
L.clearAuth=clearAuth;
L.hasSession=function(){return !!lsGet("ev_auth_token");};
L.user=function(){if(!L.hasSession())return null;var u=jsonGet("ev_auth_user",{})||{};return {email:u.email||"",name:u.full_name||"",role:u.user_role||""};};
var refreshing=null;
function refresh(){
  if(refreshing)return refreshing;
  var a=stored();if(!a.refresh)return Promise.resolve(null);
  refreshing=fetch(SUPA_URL+"/auth/v1/token?grant_type=refresh_token",{method:"POST",headers:{apikey:SUPA_KEY,Authorization:"Bearer "+SUPA_KEY,"Content-Type":"application/json"},body:JSON.stringify({refresh_token:a.refresh})})
    .then(function(r){return r.json().catch(function(){return null;}).then(function(d){if(r.ok&&d&&d.access_token){storeSession(d);return {access_token:d.access_token};}return null;});})
    .catch(function(){return null;})
    .then(function(v){refreshing=null;return v;});
  return refreshing;
}
L.refresh=refresh;
/* A fresh, unexpired access token, renewed silently with the stored refresh token. null = signed out. */
L.getSession=function(){
  var a=stored();if(!a.access)return Promise.resolve(null);
  var exp=jwtExp(a.access)||a.expires;
  if(!exp||exp-Date.now()<60000){
    return refresh().then(function(rs){
      if(rs)return rs;
      /* a network failure keeps the student signed in; only a refused refresh signs them out */
      return navigator.onLine===false?{access_token:a.access}:(clearAuth(),null);
    });
  }
  return Promise.resolve({access_token:a.access});
};
function friendlyAuth(raw){
  var m=String(raw||"").toLowerCase();
  if(m.indexOf("email not confirmed")>=0)return "Please confirm your email first. Open the link we sent you, then sign in.";
  if(m.indexOf("invalid login credentials")>=0)return "That email and password don't match an account. Check both, or reset your password.";
  if(m.indexOf("too many requests")>=0||m.indexOf("rate limit")>=0)return "Too many attempts. Please wait a minute and try again.";
  if(m.indexOf("invalid email")>=0||m.indexOf("unable to validate email")>=0)return "That email address doesn't look valid.";
  if(m.indexOf("failed to fetch")>=0||m.indexOf("network")>=0||m.indexOf("abort")>=0)return "Connection problem. Check your internet and try again.";
  return raw||"Please try again.";
}
function authPost(path,body){
  var ctrl=new AbortController(),t=setTimeout(function(){ctrl.abort();},20000);
  return fetch(SUPA_URL+path,{method:"POST",signal:ctrl.signal,headers:{apikey:SUPA_KEY,Authorization:"Bearer "+SUPA_KEY,"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(body)})
    .then(function(r){return r.json().catch(function(){return null;}).then(function(d){return {ok:r.ok,status:r.status,d:d};});})
    .catch(function(e){return {ok:false,status:0,d:{msg:e&&e.name==="AbortError"?"abort":"failed to fetch"}};})
    .then(function(x){clearTimeout(t);return x;});
}
L.signIn=function(email,password){
  email=String(email||"").trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return Promise.resolve({ok:false,error:"Please sign in with your email address."});
  return authPost("/auth/v1/token?grant_type=password",{email:email,password:String(password||"")}).then(function(x){
    if(x.ok&&x.d&&x.d.access_token){storeSession(x.d,email);OWNER=null;XP.status="idle";return {ok:true,user:L.user()};}
    return {ok:false,error:friendlyAuth(x.d&&(x.d.error_description||x.d.msg||x.d.message))};
  });
};
/* Create an account: the same Supabase sign-up and the same rules as signin.html */
var BANNED=["admin","administrator","eduverse","official","support","moderator","mod","staff","owner","cambridge","edx","hitler","nazi","isis","terror","fuck","shit","bitch","cunt","pussy","whore","slut","nigger","nigga","faggot","rape","rapist","porn","xxx","bastard","bloody","motherfucker","asshole","vagina","penis","boobs","retard","kike","chink","pedo","molest","incest","suicide","kys","jizz","wanker","twat","prick","dildo","clit","nude","nudes","hentai","nsfw","pedophile"];
var RISKY=["ass","hoe","gay","lesbian","homo","sex","cum","dick","cock","anal","paki"];
L.usernameOk=function(u){
  if(!/^[A-Za-z0-9_]{3,20}$/.test(u))return "3–20 characters: letters, numbers and underscores only.";
  var leet=u.toLowerCase().replace(/0/g,"o").replace(/1/g,"i").replace(/3/g,"e").replace(/4/g,"a").replace(/5/g,"s").replace(/7/g,"t").replace(/@/g,"a").replace(/\$/g,"s");
  var norm=leet.replace(/[^a-z]/g,""),tokens=leet.split(/[^a-z]+/).filter(Boolean);
  if(BANNED.some(function(b){return norm.indexOf(b)!==-1;})||RISKY.some(function(b){return tokens.indexOf(b)>=0;}))return "That username isn't allowed. Please pick a respectful one.";
  return "";
};
L.signUp=function(f){
  return authPost("/auth/v1/signup",{email:f.email,password:f.password,data:{full_name:f.name,user_role:f.role||"student",name:f.name,username:f.username,board:f.board,qualification:f.qualification}}).then(function(x){
    if(x.ok&&x.d&&x.d.access_token){storeSession(x.d,f.email);OWNER=null;XP.status="idle";return {ok:true,user:L.user()};}
    if(x.ok)return {ok:true,needsConfirm:true};
    var raw=x.d&&(x.d.error_description||x.d.msg||x.d.message)||"";
    if(/already (been )?registered/i.test(raw))return {ok:false,error:"An account with this email already exists. Try signing in, or reset your password."};
    if(/password should be at least/i.test(raw))return {ok:false,error:"Please choose a longer password."};
    return {ok:false,error:friendlyAuth(raw)};
  });
};
L.recover=function(email){
  return authPost("/auth/v1/recover",{email:String(email||"").trim()}).then(function(x){return x.ok?{ok:true}:{ok:false,error:friendlyAuth(x.d&&(x.d.error_description||x.d.msg))};});
};
L.signOut=function(){
  var a=stored();
  var p=a.access?fetch(SUPA_URL+"/auth/v1/logout",{method:"POST",headers:{apikey:SUPA_KEY,Authorization:"Bearer "+a.access}}).catch(function(){}):Promise.resolve();
  clearAuth();lsDel("ev_plan");XP.status="guest";XP.leaders=[];XP.me=null;XP.pending={};
  return p;
};

/* owner / co-owner, checked on the server like the live site */
var OWNER=null;
L.checkOwner=function(){
  if(OWNER!==null)return Promise.resolve(OWNER);
  return L.getSession().then(function(s){
    if(!s){OWNER=false;return false;}
    return fetch(SUPA_URL+"/rest/v1/rpc/eduverse_is_admin",{method:"POST",headers:{"Content-Type":"application/json",apikey:SUPA_KEY,Authorization:"Bearer "+s.access_token},body:"{}"})
      .then(function(r){return r.ok?r.json():false;}).then(function(v){OWNER=v===true;return OWNER;}).catch(function(){OWNER=false;return false;});
  });
};
L.isOwner=function(){return OWNER===true;};
/* Pro = owner, early-access Pro plan, or an active Knovo plan (same rules as index.html isPro / isKnovoPro) */
/* Pro = the owner, an early-access Pro plan saved on this device, or Pro on the account (bought later, or gifted by the owner) */
function planCache(){var p=jsonGet("ev_plan",null),u=L.user();if(!p||p.plan!=="pro"||!u||p.email!==u.email)return null;return (p.until&&p.until<Date.now())?null:p;}
L.isPro=function(){var s=L.liveState();return L.isOwner()||!!(s.plan&&s.plan.tier==="pro")||!!planCache();};
L.proUntil=function(){var p=planCache();return p?p.until:0;};
/* ask the server for this account's plan (also ends a gift whose time is up). gained = Pro is new on this device */
L.loadPlan=function(){
  var had=!!planCache();
  return rpc("eduverse_my_plan",{}).then(function(r){
    r=one(r)||{};var u=L.user()||{},p={plan:r.my_plan||"free",until:r.my_pro_until?Date.parse(r.my_pro_until):0,email:u.email||""};
    lsSet("ev_plan",JSON.stringify(p));return {plan:p.plan,until:p.until,gained:p.plan==="pro"&&!had};
  }).catch(function(){return {plan:had?"pro":"free",until:0,gained:false,unknown:true};});
};
L.isKnovoPro=function(){var s=L.liveState();return L.isPro()||!!(s.knovoPlan&&s.knovoPlan.status==="active");};

/* ======================= the live site's saved progress ======================= */
var LIVE_KEY="ev_state_v1";
L.liveState=function(){
  var s=jsonGet(LIVE_KEY,{})||{};
  if(!s||typeof s!=="object"||Array.isArray(s))s={};
  ["topicsDone","cardsSeen","attempts","mistakes","mocks","favs"].forEach(function(k){if(!Array.isArray(s[k]))s[k]=[];});
  if(!s.streak||typeof s.streak!=="object")s.streak={last:"",count:0};
  if(!s.dayCount||typeof s.dayCount!=="object")s.dayCount={date:"",n:0};
  if(!s.cardState||typeof s.cardState!=="object")s.cardState={};
  return s;
};
L.saveLiveState=function(s){lsSet(LIVE_KEY,JSON.stringify(s));};

/* ================================ XP ================================ */
function xpValue(a,ok){return a==="topic"?50:a==="question"?(ok?15:10):a==="card"?3:a==="streak"?20:a==="mock"?100:0;}
function cleanKey(k){return String(k||"").replace(/[^a-zA-Z0-9_:\/.@-]/g,"_").slice(0,160);}
function weekStart(){var d=new Date(),day=d.getUTCDay(),diff=(day+6)%7;return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())-diff*864e5;}
/* the same ledger xp-leaderboard.js builds: one event per achievement, never counted twice */
function ledger(s){
  /* XP comes only from real effort in this design: a correct answer (q:), a mastered topic (mastery:)
     and a passed timed mock (exam:). Nothing is given for old visits, streaks, ticked topics or cards,
     so a new account always starts at 0. Older entries of those kinds are dropped. */
  if(!Array.isArray(s.xpLedger))s.xpLedger=[];
  if(s.xpLedger.some(function(e){return !/^(q|mastery|exam):/.test(String(e&&e.event_key||""));}))s.xpLedger=s.xpLedger.filter(function(e){return /^(q|mastery|exam):/.test(String(e&&e.event_key||""));});
  return s.xpLedger;
}
/* Turn the classic site's past progress into its XP ledger once, exactly as xp-leaderboard.js does,
   BEFORE this design changes anything (otherwise today's streak would be counted as old XP). */
L.ensureLedger=function(){var s=L.liveState();if(!Array.isArray(s.xpLedger)){ledger(s);L.saveLiveState(s);}};
L.xpTotal=function(){var s=L.liveState();return ledger(s).reduce(function(n,e){return n+xpValue(e.action,e.correct);},0);};
L.xpWeek=function(){var s=L.liveState(),w=weekStart();return ledger(s).reduce(function(n,e){return n+(e.ts>=w?xpValue(e.action,e.correct):0);},0);};
L.xpValue=xpValue;
/* Record one achievement. Returns the XP earned (0 if it was already counted). */
L.xpRecord=function(action,key,correct){
  var s=L.liveState(),ev=ledger(s);key=cleanKey(key);
  var v=xpValue(action,correct);
  if(!key||!v||ev.some(function(e){return e.event_key===key;})){L.saveLiveState(s);return 0;}
  var e={action:action,event_key:key,correct:!!correct,ts:Date.now()};
  ev.push(e);L.saveLiveState(s);XP.pending[key]=e;scheduleSync();
  return v;
};

/* ---- Leaderboard choice: students decide whether they appear on the ranks ----
   Saved on this device and, after the database update, on the server (eduverse_set_leaderboard_visibility).
   Choosing "off" also stops XP syncing, so the student never appears even before the update is run. */
L.lbOptIn=function(){return lsGet("ev_lb_optin")!=="0";};
L.setLbOptIn=function(on){
  lsSet("ev_lb_optin",on?"1":"0");
  if(on){XP.status="idle";scheduleSync();}else{XP.status="hidden";xpChanged();}
  return L.rpc("eduverse_set_leaderboard_visibility",{p_show:!!on}).catch(function(){});
};
/* ---- XP sync + genuine leaderboard (same server functions as xp-leaderboard.js) ---- */
var XP=L.XP={status:L.hasSession()?"idle":"guest",leaders:[],me:null,message:"",updated:0,pending:{}};
var xpTimer=null,xpInflight=null;
L.onXP=null; /* called whenever the leaderboard state changes */
function xpChanged(){if(L.onXP)try{L.onXP();}catch(e){}}
function scheduleSync(){if(!L.hasSession()||!L.lbOptIn()||XP.status==="setup"||XP.status==="auth")return;clearTimeout(xpTimer);xpTimer=setTimeout(function(){xpTimer=null;L.xpSync(false);},850);}
function rpc(name,body){
  return L.getSession().then(function(s){
    if(!s){var e=new Error("Your session has expired. Please sign in again.");e.status=401;throw e;}
    return fetch(SUPA_URL+"/rest/v1/rpc/"+name,{method:"POST",headers:{apikey:SUPA_KEY,Authorization:"Bearer "+s.access_token,"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(body||{})})
      .catch(function(){var e=new Error("Could not connect to the leaderboard.");e.status=0;throw e;})
      .then(function(r){return r.json().catch(function(){return null;}).then(function(d){
        if(!r.ok){var e=new Error(d&&(d.message||d.error||d.hint)||("Request failed ("+r.status+")"));e.status=r.status;e.code=d&&d.code;throw e;}
        return d;});});
  });
}
L.rpc=rpc;
function payload(evs){return evs.map(function(e){var ok=e.ts&&e.ts>=946684800000;return {action:e.action,event_key:e.event_key,correct:!!e.correct,occurred_at:ok?new Date(e.ts).toISOString():"2000-01-01T00:00:00.000Z"};});}
function one(r){return Array.isArray(r)?(r[0]||null):r;}
L.xpSync=function(force){
  if(!L.hasSession()){XP.status="guest";xpChanged();return Promise.resolve();}
  if(!L.lbOptIn()){XP.status="hidden";xpChanged();return Promise.resolve();}
  if(xpInflight)return xpInflight;
  if(XP.status==="setup"&&!force)return Promise.resolve();
  var initial=force||XP.status!=="ready";
  var pending=initial?ledger(L.liveState()).slice():Object.keys(XP.pending).map(function(k){return XP.pending[k];});
  XP.status="loading";XP.message="";xpChanged();
  var me=null,chain=Promise.resolve();
  for(var i=0;i<pending.length;i+=100)(function(chunk){chain=chain.then(function(){return rpc("eduverse_sync_xp",{events:payload(chunk)}).then(function(r){me=one(r)||me;chunk.forEach(function(e){delete XP.pending[e.event_key];});});});})(pending.slice(i,i+100));
  xpInflight=chain.then(function(){return Promise.all([rpc("eduverse_leaderboard",{}),rpc("eduverse_my_xp",{})]);}).then(function(r){
    XP.leaders=Array.isArray(r[0])?r[0]:[];XP.me=one(r[1])||me||{total_xp:0,weekly_xp:0,today_xp:0};
    XP.status="ready";XP.message="";XP.updated=Date.now();xpChanged();
    if(Object.keys(XP.pending).length)scheduleSync();
  }).catch(function(e){
    var missing=e.status===404||e.code==="PGRST202"||/could not find|schema cache|function.*not/i.test(e.message);
    XP.status=missing?"setup":e.status===401?"auth":"error";
    XP.message=missing?"The shared leaderboard database has not been connected yet.":e.message;xpChanged();
  }).then(function(){xpInflight=null;});
  return xpInflight;
};
function canSync(){return L.hasSession()&&L.lbOptIn()&&!xpInflight&&XP.status!=="setup";}
setTimeout(function(){if(canSync())L.xpSync(false);},1500);
setInterval(function(){if(canSync())L.xpSync(false);},60000);
document.addEventListener("visibilitychange",function(){if(!document.hidden&&canSync())L.xpSync(false);});

/* ---- Seasons: every 6 months (January–June, July–December, UTC); the top 3 pick a mystery reward ----
   Server functions come from database-update.sql. Until it is run, these report "setup". */
L.FIRST_SEASON=Date.UTC(2027,0,1); /* EduVerse launches in January 2027 */
L.seasonOf=function(t){var d=new Date(t),y=d.getUTCFullYear(),h=d.getUTCMonth()<6?1:2;return {id:y+"-H"+h,start:Date.UTC(y,h===1?0:6,1),end:Date.UTC(h===1?y:y+1,h===1?6:0,1),label:(h===1?"January – June ":"July – December ")+y};};
function setupAware(p){return p.catch(function(e){var missing=e.status===404||e.code==="PGRST202"||/could not find|schema cache|function.*not/i.test(e.message||"");var x=new Error(missing?"setup":(e.message||"error"));x.setup=missing;x.status=e.status;throw x;});}
L.seasonBoard=function(){return setupAware(rpc("eduverse_season_board",{}));};
L.mySeasonReward=function(){return setupAware(rpc("eduverse_my_season_reward",{})).then(one);};
L.claimSeasonReward=function(slot){return setupAware(rpc("eduverse_claim_season_reward",{p_slot:slot})).then(one);};
/* owner tools (each server function checks the role AND the entry password itself) */
L.adminSeasonRewards=function(){return setupAware(rpc("eduverse_admin_season_rewards",{}));};
L.adminSetRewardOption=function(season,slot,title,details){return setupAware(rpc("eduverse_admin_set_reward_option",{p_season:season,p_slot:slot,p_title:title,p_details:details}));};
L.adminMarkDelivered=function(id,done){return setupAware(rpc("eduverse_admin_mark_reward_delivered",{p_id:id,p_delivered:!!done}));};
/* gift Pro: by email, or straight to a season winner; days 0 = until the owner removes it */
L.adminGiftPro=function(email,days){return setupAware(rpc("eduverse_admin_gift_pro",{p_email:email,p_days:days||0}));};
/* plan: "monthly" | "season" | "annual"; days 0 = the plan's usual length (30 / 120 / 365) */
L.adminGiftPlan=function(email,plan,days){return setupAware(rpc("eduverse_admin_gift_plan",{p_email:email,p_plan:plan,p_days:days||0}));};
L.adminGiftTopup=function(email){return setupAware(rpc("eduverse_admin_gift_topup",{p_email:email,p_credits:300}));};
L.adminGiftWinner=function(rewardId,days){return setupAware(rpc("eduverse_admin_gift_pro_to_winner",{p_reward_id:rewardId,p_days:days||0}));};
L.adminRemovePro=function(userId){return setupAware(rpc("eduverse_admin_remove_pro",{p_user_id:userId}));};
L.adminProList=function(){return setupAware(rpc("eduverse_admin_pro_list",{}));};
/* Owner entry password: a second password typed after sign-in. Checked only on the server.
   entryState(): "open" | "locked" | "unset" (owner must create it) | "wait" (co-owner, owner has not
   created it yet) | "setup" (database setup not run yet, nothing to check against) */
L.entryState=function(){return rpc("eduverse_admin_entry_state",{}).then(function(r){return String(Array.isArray(r)?r[0]:r);}).catch(function(e){if(e.status===404||e.code==="PGRST202"||/could not find|schema cache/i.test(e.message||""))return "setup";throw e;});};
L.entryUnlock=function(pw){return rpc("eduverse_admin_unlock",{p_password:pw}).then(function(r){return r===true;});};
L.entrySet=function(pw){return rpc("eduverse_admin_set_entry_password",{p_password:pw});};
L.adminMakeCoowner=function(email){return setupAware(rpc("eduverse_admin_make_coowner",{p_email:email}));};
/* students: list, wipe XP, co-owner role */
L.adminStudents=function(){return setupAware(rpc("eduverse_admin_students_list",{}));};
L.adminResetXp=function(userId){return setupAware(rpc("eduverse_admin_student_reset_xp",{p_user_id:userId}));};
L.adminSetRole=function(userId,role){return setupAware(rpc("eduverse_admin_student_role",{p_user_id:userId,p_role:role}));};
L.sqlEditorUrl="https://supabase.com/dashboard/project/"+SUPA_URL.replace(/^https:\/\//,"").split(".")[0]+"/sql/new";

/* =============================== Knovo =============================== */
function setChatBlocked(ms){lsSet("knovo_chat_blocked_until",String(Date.now()+Math.max(60000,ms||0)));}
L.chatBlockedFor=function(){if(L.isOwner())return 0;return Math.max(0,Number(lsGet("knovo_chat_blocked_until")||"0")-Date.now());};
/* Knovo credits. 1 credit = 1 normal message. The server keeps the real count; these numbers are for display.
   Free: DAILY_CREDITS a day. Paid plans: a pool (PLAN_POOL) with no daily cap. Top-up credits are used last.
   L.lastUsage = {plan, remaining, credits:{plan:"free"|"monthly"|"season"|"annual", left, daily, cost, resetMs,
                  poolLeft, poolSize, poolResetsAt, topupLeft}} from the server's last reply or from loadCredits(). */
L.lastUsage=null;
L.CREDIT_COSTS={chat:1,lesson_qa:1,whiteboard:10,image:3};
L.DAILY_CREDITS=20;
L.PLAN_POOL={monthly:1500,annual:1500,season:5000};
L.PLAN_NAMES={monthly:"Knovo Plus Monthly",season:"Exam Season Pass",annual:"Knovo Plus Annual"};
/* the balance before the first message of a visit (needs the eduverse_my_credits server function) */
L.loadCredits=function(){
  if(!L.hasSession()||L.isOwner())return Promise.resolve(null);
  return rpc("eduverse_my_credits",{}).then(function(r){r=Array.isArray(r)?r[0]:r;if(!r||typeof r.my_plan!=="string"||r.daily_left==null)return null;
    var paid=r.my_plan&&r.my_plan!=="free",left=paid?Number(r.pool_left)||0:Number(r.daily_left)||0,top=Number(r.topup_left)||0;
    var resetMs=paid?(r.pool_resets_at?Math.max(0,Date.parse(r.pool_resets_at)-Date.now()):0):(r.daily_resets_at?Math.max(0,Date.parse(r.daily_resets_at)-Date.now()):0);
    L.lastUsage={plan:paid?"pro":"free",remaining:left+top,credits:{plan:r.my_plan||"free",left:left,daily:Number(r.daily_size)||L.DAILY_CREDITS,cost:0,resetMs:resetMs,
      poolLeft:paid?left:null,poolSize:paid?Number(r.pool_size)||0:null,poolResetsAt:paid?(r.pool_resets_at||null):null,topupLeft:top}};
    if(left+top>0)lsDel("knovo_chat_blocked_until");
    return L.lastUsage;}).catch(function(){return null;});
};
function kErr(code,extra){var e=new Error(code);e.code=code;if(extra)for(var k in extra)e[k]=extra[k];return e;}
function replyText(d){
  var parts=(d&&d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts)||[];
  return parts.filter(function(p){return p&&typeof p.text==="string"&&!p.thought;}).map(function(p){return p.text;}).join("").trim();
}
/* opts: {system, contents:[{role:"user"|"model", parts:[{text}]}], mode?, signal?, timeout?}
   Resolves {text, usage}. Rejects with e.code: auth | limit (e.msLeft) | blocked | cancelled | network | server | empty */
L.askKnovo=function(opts){
  var blocked=L.chatBlockedFor();
  if(blocked)return Promise.reject(kErr("limit",{msLeft:blocked}));
  return L.getSession().then(function(s){
    if(!s)throw kErr("auth");
    var ctrl=new AbortController(),timer=setTimeout(function(){ctrl.abort();},opts.timeout||90000);
    if(opts.signal){if(opts.signal.aborted)ctrl.abort();else opts.signal.addEventListener("abort",function(){ctrl.abort();});}
    var body=JSON.stringify({mode:opts.mode||"chat",systemInstruction:{parts:[{text:opts.system||""}]},contents:opts.contents});
    var H=function(t){return {"Content-Type":"application/json",apikey:SUPA_KEY,Authorization:"Bearer "+t};};
    return fetch(EDGE,{method:"POST",headers:H(s.access_token),body:body,signal:ctrl.signal}).then(function(r){
      if(r.status!==401)return r;
      return refresh().then(function(rs){return rs?fetch(EDGE,{method:"POST",headers:H(rs.access_token),body:body,signal:ctrl.signal}):r;});
    }).then(function(r){
      clearTimeout(timer);
      return r.json().catch(function(){return null;}).then(function(d){
        if(r.status===401||r.status===403){clearAuth();throw kErr("auth");}
        if(r.status===429&&d&&d.error==="LIMIT_REACHED"){var ms=Number(d.msLeft)||0,cr=d.credits||null;
          /* credits: a big action (a Live Lesson) can be refused while small ones still fit */
          if(cr){var paid=cr.plan&&cr.plan!=="free",top=Number(cr.topupLeft)||0,own=Math.max(0,(Number(cr.left)||0)-top);
            L.lastUsage={plan:paid?"pro":"free",remaining:cr.left,credits:{plan:cr.plan||"free",left:own,daily:cr.daily||L.DAILY_CREDITS,cost:0,resetMs:ms,poolLeft:paid?own:null,poolSize:paid?(cr.poolSize||null):null,poolResetsAt:cr.poolResetsAt||null,topupLeft:top}};
            if(cr.left<1)setChatBlocked(ms);}else setChatBlocked(ms);
          throw kErr("limit",{msLeft:ms,credits:cr});}
        if(!r.ok)throw kErr("server",{detail:(d&&d.error&&(d.error.message||d.error))||("HTTP "+r.status)});
        if(d&&d.usage)L.lastUsage=d.usage;
        var txt=replyText(d);if(!txt)throw kErr("empty");
        return {text:txt,usage:d&&d.usage||null};
      });
    },function(e){
      clearTimeout(timer);
      if(e&&e.code)throw e;
      if(opts.signal&&opts.signal.aborted)throw kErr("cancelled");
      throw kErr(e&&e.name==="AbortError"?"timeout":"network");
    });
  });
};
L.fmtWait=function(ms){var h=Math.floor(ms/36e5),m=Math.ceil((ms%36e5)/6e4);return h>0?h+"h "+m+"m":Math.max(1,m)+"m";};

/* photo scan: the same in-browser text reader (Tesseract) as the live site */
var tessLoading=null;
L.ocr=function(file,onProgress){
  if(!tessLoading)tessLoading=window.Tesseract?Promise.resolve():new Promise(function(ok,no){var sc=document.createElement("script");sc.src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";sc.onload=ok;sc.onerror=function(){tessLoading=null;no(new Error("scanner"));};document.head.appendChild(sc);});
  return tessLoading.then(function(){
    return window.Tesseract.recognize(file,"eng",{logger:function(m){if(onProgress&&m&&m.status==="recognizing text")onProgress(Math.round((m.progress||0)*100));}});
  }).then(function(r){return String(r&&r.data&&r.data.text||"").replace(/\n{3,}/g,"\n\n").trim();});
};

/* anonymous usage count for the owner dashboard, as the live site does */
L.logUsage=function(kind){L.getSession().then(function(s){if(!s)return;fetch(SUPA_URL+"/rest/v1/rpc/eduverse_log_usage",{method:"POST",headers:{"Content-Type":"application/json",apikey:SUPA_KEY,Authorization:"Bearer "+s.access_token},body:JSON.stringify({p_kind:kind})}).catch(function(){});});};
})();
