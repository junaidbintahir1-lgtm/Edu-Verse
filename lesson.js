/* EduVerse — Live Lesson studio: Knovo teaches a topic on a board, speaking as it writes.
   - KV: sentence-by-sentence voice engine (pause/resume that never loses its place)
   - structured boards: tables and financial statements, working, graphs, flows, timelines, code, key points
   - raise-hand questions that remember the whole lesson
   Open it with window.knovoLiveLesson(topic): it shows a start screen and only begins when the student taps Start.
   Talks to the Knovo edge function with mode "whiteboard" (lesson) and "lesson_qa" (questions). */
(function(){
  "use strict";
  var EV=window.EV,LV=window.EVLive;
  var EDGE=LV.EDGE,SUPA_KEY=LV.SUPA_KEY;
  var getSession=LV.getSession,refreshStoredSession=LV.refresh,clearAuth=LV.clearAuth,fmtWait=LV.fmtWait;
  function openSignin(){EV.syncProfile();EV.paintProfile();EV.go('signin');}
  function isPro(){return LV.isKnovoPro();}
  function ownerUnlimited(){return LV.isOwner();}
  function liveRecord(){}   /* allowances are counted by the server */
  function updateBadge(){}
  function toast(m){EV.toast(m);}   /* the studio's messages use the site's toast */
  window.knovoLogUsage=function(kind){LV.logUsage(kind);};
  var LESSON_SYS="You are Knovo, a warm, expert human tutor giving a one-to-one LIVE whiteboard lesson for EduVerse (Cambridge O Level, IGCSE, A Level and any other syllabus). You speak while you write on the board. Return valid JSON only (no code fences, no commentary): {\"title\":\"Topic Title\",\"steps\":[{\"title\":\"Short step heading\",\"voice\":\"What you say aloud during this step.\",\"board\":{...}}]}. LESSON SHAPE: 6-8 steps that flow as one conversation. Step 1 greets briefly, poses the key question and says what the lesson covers. Middle steps build the idea one piece at a time, then work through at least one full worked example with real figures, every intermediate step, correct units and the exact detail Cambridge mark schemes reward, and point out one common mistake. The last step recaps the key takeaway and asks ONE quick check question for the student to type or say. title = 2-6 word step heading. voice = 3-5 short spoken sentences (40-75 words): conversational, first person, with contractions; refer to what you are writing (\"look at this row\", \"this curve here\"); link each step to the one before; never open two steps the same way; say symbols as words (x squared, divided by, H two O); no lists, markdown or emojis. BOARD: every step has EITHER board (a neat layout the app draws) OR svgElements (a freehand diagram) — never both. Prefer board whenever it fits. board kinds: table — {\"kind\":\"table\",\"title\":\"...\",\"columns\":[\"\",\"$\",\"$\"],\"rows\":[{\"cells\":[\"Non-current assets\"],\"style\":\"heading\"},{\"cells\":[\"Machinery\",\"\",\"40,000\"]},{\"cells\":[\"Total assets\",\"\",\"52,000\"],\"style\":\"grand\"}]} (style heading = section name, total = sub-total, grand = final figure; money in inner column, totals in outer column; also use tables for comparisons, truth tables, trace tables, results and data, max 18 rows); working — {\"kind\":\"working\",\"title\":\"...\",\"lines\":[\"v = u + at\",\"= 0 + 2 × 5\",\"= 10 m/s\"]} (formula, substitution, answer with units; last line is boxed; also balanced equations and mole calculations); graph — {\"kind\":\"graph\",\"title\":\"...\",\"x\":{\"label\":\"Quantity\",\"max\":10},\"y\":{\"label\":\"Price ($)\",\"max\":10},\"lines\":[{\"label\":\"D\",\"points\":[[1,9],[9,1]]},{\"label\":\"S\",\"points\":[[1,1],[9,9]]},{\"label\":\"S1\",\"points\":[[1,3],[7,9]],\"style\":\"dashed\"}],\"marks\":[{\"label\":\"E\",\"at\":[5,5],\"xLabel\":\"Q\",\"yLabel\":\"P\"}],\"arrows\":[{\"from\":[6,6],\"to\":[4,7]}]} (data coordinates, not pixels; \"curve\":true for smooth curves; \"ticks\":true on an axis to number it); flow — {\"kind\":\"flow\",\"title\":\"...\",\"items\":[\"cause\",\"effect\",\"result\"]} (2-6 short boxes joined by arrows: processes, chains of reasoning, algorithms); points — {\"kind\":\"points\",\"title\":\"...\",\"items\":[\"...\"]} (max 6 short points); timeline — {\"kind\":\"timeline\",\"title\":\"...\",\"events\":[{\"date\":\"622\",\"text\":\"Hijrah to Madinah\"}]} (max 7 events); code — {\"kind\":\"code\",\"title\":\"...\",\"lines\":[\"FOR i ← 1 TO 10\",\"    OUTPUT i\",\"NEXT i\"]} (Cambridge pseudocode or Python, indentation kept, max 16 lines). WHICH TO USE: Accounting — table with the exact Cambridge format and headings, working for ratios. Maths — working for every method; graph for lines, curves and gradients. Physics — working (formula, substitution, answer with unit); graph for motion and other graphs; svgElements for circuits, rays and forces. Chemistry — working for equations and moles (use subscripts like H₂O, CO₂); table for tests and observations; flow for processes; svgElements for apparatus. Biology — flow for processes; table for comparisons; svgElements for labelled diagrams. Economics — graph for demand and supply with shifts (label D, S, D1, S1, equilibrium E with P and Q); flow for chains of analysis. Business — points, flow and table (calculations as working). Computer Science — code for pseudocode or programs; table for trace and truth tables; flow for algorithms. English — points for techniques and plans, table for comparisons. History, Islamiyat and Pakistan Studies — timeline for dates, points for causes and significance, table for comparisons. A statement or table built over several steps: repeat the SAME title in each step and give ALL rows so far plus the new ones; the app writes only the new rows. svgElements (only for real diagrams) = one string of SVG elements (circle, ellipse, rect, line, path, polyline, polygon, text) with SINGLE quotes on attributes, at most 10 elements, every coordinate inside x 60-740 and y 60-440 of an 800x500 dark board; strokes #38bdf8, #f472b6, #fbbf24 or #34d399, stroke-width 3, fill none; text fill #f8fafc, font-family Caveat, font-size 26; each diagram needs real shapes AND short labels placed next to (not on top of) what they name. Never put double quotes or line breaks inside JSON string values except where escaped.";

  /* ================================================================
     LIVE LESSON v2
     - KV: sentence-by-sentence voice engine (no Chrome 15-second cut-off,
       pause/resume that never loses its place, stale callbacks ignored)
     - lesson playback state machine with a run token per navigation
     - raise-hand Q&A that remembers the whole lesson and earlier answers
     ================================================================ */
  var KV=(function(){
    var synth=("speechSynthesis" in window)?window.speechSynthesis:null;
    var prefs={voice:"",rate:1,muted:false};
    try{var p=JSON.parse(localStorage.getItem("knovo_live_voice_prefs")||"{}");if(p&&typeof p==="object"){prefs.voice=String(p.voice||"");prefs.rate=Math.max(.75,Math.min(1.35,Number(p.rate)||1));prefs.muted=!!p.muted;}}catch(e){}
    function save(){try{localStorage.setItem("knovo_live_voice_prefs",JSON.stringify(prefs));}catch(e){}}
    function voices(){try{return synth?synth.getVoices().filter(function(v){return /^en([-_]|$)/i.test(v.lang||"");}):[];}catch(e){return [];}}
    /* Most natural-sounding voices first: Edge/Windows neural, then Google, then Apple. */
    var RANK=[/(Natural|Neural)/i,/Google UK English Female/i,/Google US English/i,/(Samantha|Serena|Karen|Moira|Tessa|Daniel|Arthur|Martha)/i,/Microsoft (Aria|Jenny|Libby|Sonia|Guy|Ryan|Hazel|Susan)/i,/Google/i];
    function best(){
      var vs=voices();if(!vs.length)return null;
      if(prefs.voice){for(var k=0;k<vs.length;k++)if(vs[k].name===prefs.voice)return vs[k];}
      for(var i=0;i<RANK.length;i++){for(var j=0;j<vs.length;j++)if(RANK[i].test(vs[j].name))return vs[j];}
      for(var d=0;d<vs.length;d++)if(vs[d].default)return vs[d];
      return vs[0];
    }
    /* What the ear hears: symbols read as words, no markdown. Captions keep the original. */
    function clean(t){
      return String(t||"").replace(/\*\*|__|`|#{1,6}\s/g,"").replace(/<[^>]+>/g," ")
        .replace(/\s*(→|⇒|->)\s*/g," leads to ").replace(/\s*←\s*/g," comes from ").replace(/\s*×\s*/g," times ").replace(/\s*÷\s*/g," divided by ")
        .replace(/\s*≈\s*/g," is about ").replace(/\s*≠\s*/g," is not equal to ").replace(/\s*≤\s*/g," is less than or equal to ").replace(/\s*≥\s*/g," is greater than or equal to ")
        .replace(/[₀₁₂₃₄₅₆₇₈₉]/g,function(c){return String("₀₁₂₃₄₅₆₇₈₉".indexOf(c));})
        .replace(/[⁴⁵⁶⁷⁸⁹]/g,function(c){return " to the power "+(4+"⁴⁵⁶⁷⁸⁹".indexOf(c))+" ";}).replace(/⁻¹/g," to the minus one").replace(/\^(?!2\b|3\b)(-?\d+)/g," to the power $1")
        .replace(/\s*−\s*/g," minus ").replace(/\s=\s/g," equals ").replace(/√\s*/g," square root of ").replace(/π/g," pi ").replace(/Δ\s*/g," change in ").replace(/∴/g," therefore ")
        .replace(/Ω/g," ohms").replace(/μ/g," micro").replace(/λ/g," lambda ").replace(/θ/g," theta ").replace(/⇌/g," is in equilibrium with ")
        .replace(/(\d)\s*m\/s(²|\^2)/g,"$1 metres per second squared").replace(/(\d)\s*m\/s\b/g,"$1 metres per second").replace(/(\d)\s*km\/h\b/g,"$1 kilometres per hour")
        .replace(/(\d)\s*cm(³|\^3)/g,"$1 cubic centimetres").replace(/(\d)\s*dm(³|\^3)/g,"$1 cubic decimetres").replace(/(\d)\s*mol\b/g,"$1 moles").replace(/(\d)\s*kg\b/g,"$1 kilograms")
        .replace(/\^2\b|²/g," squared").replace(/\^3\b|³/g," cubed").replace(/°C\b/g," degrees Celsius").replace(/°/g," degrees").replace(/\s*±\s*/g," plus or minus ")
        .replace(/[✦✨✅⚠️👉🙂😊]/g,"").replace(/\s+/g," ").trim();
    }
    function sentences(t){
      t=String(t||"").replace(/\*\*/g,"").replace(/\s+/g," ").trim();if(!t)return [];
      var marked=t.replace(/\b(e\.g|i\.e|etc|vs|Mr|Mrs|Ms|Dr|approx|Fig|No)\./gi,function(m){return m.replace(/\./g,"\u0001");})
                  .replace(/([.!?…]+["'”’)\]]*)\s+(?=\S)/g,"$1\u0002");
      var raw=marked.split("\u0002").map(function(s){return s.replace(/\u0001/g,".").trim();}).filter(Boolean),out=[];
      raw.forEach(function(s){
        /* very long sentences are split at a comma/semicolon so no utterance runs too long */
        while(s.length>210){
          var cut=-1,mid=Math.floor(s.length/2);
          for(var d=0;d<mid;d++){var a=mid+d,b=mid-d;if(/[,;:]/.test(s[a])&&s[a+1]===" "){cut=a;break;}if(b>0&&/[,;:]/.test(s[b])&&s[b+1]===" "){cut=b;break;}}
          if(cut<0)break;out.push(s.slice(0,cut+1));s=s.slice(cut+2);
        }
        out.push(s);
      });
      /* merge tiny fragments ("Right.") into the next sentence for a smoother flow */
      var merged=[];
      out.forEach(function(s){if(merged.length&&merged[merged.length-1].length<16)merged[merged.length-1]+=" "+s;else merged.push(s);});
      return merged;
    }
    function gapAfter(s){var e=String(s).trim().slice(-1);return (e==="?"?430:e==="!"||e==="."?260:140)/prefs.rate;}
    var active=null,tokSeq=0,lastCancel=0,onTalk=function(){};
    function cancelEngine(){if(!synth)return;try{synth.cancel();lastCancel=Date.now();}catch(e){}}
    function run(h){
      if(h!==active||h.paused||h.done)return;
      if(h.i>=h.list.length){h.done=true;active=null;onTalk(false);if(h.o.onEnd)h.o.onEnd();return;}
      var idx=h.i,s=h.list[idx],tok=h.tok=++tokSeq,moved=false;
      if(h.o.onSentence)try{h.o.onSentence(idx,h.list);}catch(e){}
      onTalk(true);
      var words=String(s).split(/\s+/).length,est=words/2.6/prefs.rate*1000,t0=Date.now();
      function next(){
        if(moved||tok!==h.tok)return;moved=true;clearTimeout(h.wd);
        if(h!==active||h.paused||h.done)return;
        /* an engine that "finishes" instantly (failed synthesis) must not rush the captions */
        var spent=Date.now()-t0,hold=spent<est*.35?est*.9-spent:0;
        h.i=idx+1;h.gap=setTimeout(function(){run(h);},gapAfter(s)+hold);
      }
      if(!synth||prefs.muted){h.wd=setTimeout(next,Math.max(1200,est*1.08));return;} /* silent mode: reading pace */
      var go=function(){
        if(tok!==h.tok||h!==active||h.paused)return;
        try{
          var u=new SpeechSynthesisUtterance(clean(s)),v=best();
          if(v){u.voice=v;u.lang=v.lang;}else u.lang="en-GB";
          u.rate=prefs.rate;u.pitch=1;u.volume=1;
          var started=false;
          u.onstart=function(){started=true;};
          u.onend=next;
          u.onerror=function(ev){if(ev&&(ev.error==="interrupted"||ev.error==="canceled"))return;next();};
          h.u=u;synth.speak(u);
          try{if(synth.paused)synth.resume();}catch(e){}
          /* watchdog: if the engine never reports back, keep the lesson moving */
          h.wd=setTimeout(next,est*2+4500);
          /* engine silently blocked (no voices, autoplay rules): fall back to reading pace */
          setTimeout(function(){if(!started&&!moved&&tok===h.tok){clearTimeout(h.wd);h.wd=setTimeout(next,Math.max(0,est*1.08-3500));}},3500);
        }catch(e){h.wd=setTimeout(next,Math.max(1200,est));}
      };
      /* Chrome can drop an utterance queued in the same tick as cancel() */
      var since=Date.now()-lastCancel;if(since<140)setTimeout(go,140-since);else go();
    }
    function play(text,o){
      stop();
      var list=Array.isArray(text)?text.filter(Boolean):sentences(text);
      var h={list:list,i:Math.max(0,Math.min(list.length,(o&&o.from)||0)),o:o||{},paused:false,done:false,tok:0};
      active=h;run(h);return h;
    }
    function pause(){var h=active;if(!h||h.paused||h.done)return false;h.paused=true;h.tok=++tokSeq;clearTimeout(h.wd);clearTimeout(h.gap);cancelEngine();onTalk(false);return true;}
    function resume(){var h=active;if(!h||!h.paused)return false;h.paused=false;run(h);return true;} /* re-speaks the interrupted sentence */
    function stop(){var h=active;active=null;if(h){h.done=true;h.tok=++tokSeq;clearTimeout(h.wd);clearTimeout(h.gap);}cancelEngine();onTalk(false);}
    function unlock(){ /* iOS/Safari only allow speech that starts inside a tap */
      if(!synth)return;try{var u=new SpeechSynthesisUtterance(" ");u.volume=0;synth.speak(u);}catch(e){}
    }
    function warm(){if(synth)try{synth.getVoices();}catch(e){}}
    warm();if(synth){try{synth.addEventListener("voiceschanged",warm);}catch(e){}}
    return {play:play,pause:pause,resume:resume,stop:stop,unlock:unlock,sentences:sentences,clean:clean,voices:voices,best:best,prefs:prefs,save:save,
      hasActive:function(){return !!(active&&!active.done);},isPaused:function(){return !!(active&&active.paused);},
      onTalk:function(f){onTalk=f||function(){};},supported:!!synth};
  })();

  /* ---------------- Live Lesson studio ---------------- */
  var L=null; /* current session state */
  var TUTOR_SYS="You are Knovo, a warm, expert one-to-one tutor in the middle of a LIVE spoken whiteboard lesson for EduVerse. The student has just raised their hand. Reply with JSON only, no code fences: {\"say\":\"...\",\"board\":\"\",\"action\":\"wait\"}. "+
    "say = exactly what you say out loud: natural and conversational, first person, 2-5 short sentences (under 90 words), plain spoken English, no markdown, no bullet points, no emojis; write symbols as words when spoken. Answer the student's actual question directly first, then link it back to the step you were teaching. Remember everything already said in this lesson and refer back to it (for example 'like the arrow I drew earlier'). If the student is answering your check question, say clearly whether they are right and why, kindly correcting any mistake. If the question is off-topic, answer briefly and steer back to the lesson. Never say you cannot draw or that you are text-only. "+
    "board = an empty string unless the board genuinely helps. When it does, prefer a neat board object: table {\"kind\":\"table\",\"title\":\"...\",\"columns\":[\"\",\"$\",\"$\"],\"rows\":[{\"cells\":[\"Non-current assets\"],\"style\":\"heading\"},{\"cells\":[\"Machinery\",\"\",\"40,000\"]}]} for formats, statements and comparisons; working {\"kind\":\"working\",\"title\":\"...\",\"lines\":[\"formula\",\"= substitution\",\"= answer with unit\"]}; graph {\"kind\":\"graph\",\"title\":\"...\",\"x\":{\"label\":\"...\"},\"y\":{\"label\":\"...\"},\"lines\":[{\"label\":\"D\",\"points\":[[1,9],[9,1]]}],\"marks\":[{\"label\":\"E\",\"at\":[5,5]}]}; flow {\"kind\":\"flow\",\"items\":[...]}; points {\"kind\":\"points\",\"items\":[...]}; timeline {\"kind\":\"timeline\",\"events\":[{\"date\":\"...\",\"text\":\"...\"}]}; code {\"kind\":\"code\",\"lines\":[...]}. Only for a quick diagram give at most 6 SVG elements as a string (single-quoted attributes, stroke-width 3, fill none, colours #fbbf24 or #f472b6, text fill #f8fafc font-size 24, inside x 60-740 and y 60-440). "+
    "action = 'resume' only when the student says they understand or asks you to continue, 'repeat' when they ask to hear the step again, 'next' when they ask to skip ahead, 'back' when they ask to go back a step, otherwise 'wait'.";
  var LESSON_COMPACT="\n\nIMPORTANT: the previous attempt could not be read. Return a SHORTER lesson as compact valid JSON on a single line: exactly 5 steps, each voice 35-55 words, at most 6 SVG elements per step, single quotes inside svgElements, no double quotes or line breaks inside any string.";

  function closeLive(msg){
    if(!L)return;
    KV.stop();
    try{if(L.rec)L.rec.abort();}catch(e){}
    clearInterval(L.timerInt);clearInterval(L.clockInt);clearTimeout(L.advT);clearTimeout(L.autoT);
    L=null;
    var m=document.getElementById("knovoLiveModal");if(m)m.remove();
    document.removeEventListener("visibilitychange",liveVisibility);
    if(msg&&window.toast)toast(msg);
  }
  window.knovoCloseLive=closeLive;
  function liveVisibility(){ /* a hidden tab mutes speech in most browsers — pause instead of skipping ahead */
    if(document.hidden&&L&&L.state==="teaching")pauseLesson("paused while you were away — tap ▶ Play to continue");
  }

  /* what Knovo should tailor the lesson to: the subject chosen in the Knovo workspace or the page being studied */
  function liveChatContext(topic){
    try{
      var c=(EV.wsConv&&EV.wsConv.ctx)||EV.ctx(),o=c&&c.ref?EV.BYREF[c.ref]:null;
      if(!o)return "";
      return ("The student is studying "+o.s.name+" "+o.s.code+" ("+o.s.board+"). Use this syllabus's terms, paper style and level.").slice(0,700);
    }catch(e){}
    return "";
  }

  async function startLive(topic){
    /* The deployed server is authoritative for allowances; local counters are display-only. */
    /* topic is only a suggestion for the start screen — the lesson never starts until the student taps Start */
    topic=String(topic||"").replace(/\s+/g," ").trim().slice(0,300);
    if(/^(the topic we are discussing|general study skills)$/i.test(topic))topic="";
    closeLive();
    KV.unlock(); /* must run inside the tap, before any await */
    var s=await getSession();if(!s){openSignin();return;}
    closeLive();
    var modal=document.createElement("div");modal.id="knovoLiveModal";
    modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");modal.setAttribute("aria-label","Knovo Live Lesson");
    modal.innerHTML=
      "<div class='klHead'><div class='klTutor'><span class='klAvatar' id='klAvatar'>✦<i class='klWave'><b></b><b></b><b></b></i></span><span class='klWho'><b>Knovo · Live Tutor</b><i id='klStatus'>waiting for your topic</i></span></div><h3 id='klTitle'>✨ Live Lesson</h3><span class='klStepPill' id='klStepPill'>New lesson</span><span class='klBadge' id='klBadge'>"+(ownerUnlimited()?"👑 Owner · Unlimited":isPro()?"Knovo Pro ✨":"✨ Server-managed access")+"</span><span class='klTimer' id='klTimer'>60:00</span><button class='klIconBtn' id='klNewTopic' title='Start a lesson on a different topic' hidden>✎ New topic</button><button class='klIconBtn' id='klNotesBtn' title='Show or hide lesson notes' aria-pressed='true'>📝 Notes</button><button class='klIconBtn' id='klVoiceBtn' title='Voice and speed' aria-expanded='false'>🔊 Voice</button><button class='klClose' id='klClose'>✕ Close</button></div>"+
      "<div class='klVoicePanel' id='klVoicePanel' hidden><label>Voice <select id='klVoiceSel'></select></label><label>Speed <input type='range' id='klRate' min='0.75' max='1.35' step='0.05'><span id='klRateVal'></span></label><label class='klMute'><input type='checkbox' id='klMute'> Captions only (mute)</label><button id='klVoiceTest'>▶ Test voice</button></div>"+
      "<div class='klBoardbar'><span class='klBoardLabel'>Board tools</span><button id='klZoomOut' title='Zoom out'>−</button><button id='klZoomReset' title='Reset zoom'><span class='klZoomValue' id='klZoomValue'>100%</span></button><button id='klZoomIn' title='Zoom in'>+</button><button id='klEraser' title='Click board items to erase them'>Eraser: Off</button><button id='klClearBoard' title='Clear the current board'>Clear Board</button><button class='klClean' id='klCleanLayout'>Clean Layout</button><button id='klUndo'>↶ Undo</button><button id='klExport'>Export SVG</button></div>"+
      "<div class='klMain'><div class='klStage' id='klStage'><svg class='klCanvas' id='klSvg' viewBox='0 0 800 500' preserveAspectRatio='xMidYMid meet'><g id='klSteps'></g><g class='klPen' id='klPen' transform='translate(60,440)' style='opacity:0'><circle r='9' fill='#38bdf8' opacity='.35'/><circle r='4' fill='#7dd3fc'/><text x='6' y='-8' font-size='26'>✍️</text></g></svg><div class='klStart' id='klStart'><span class='klStartIcon'>✦</span><h4>What would you like to learn?</h4><p>Type a topic or question. Your lesson starts only when you tap <b>Start lesson</b>.</p><textarea id='klTopicIn' rows='3' maxlength='300' placeholder='e.g. Explain photosynthesis for O Level Biology, with a labelled diagram' aria-label='What would you like to learn?'></textarea><div class='klStartChips' id='klStartChips'><button>Photosynthesis step by step</button><button>Solving simultaneous equations</button><button>Supply and demand with a diagram</button><button>How to prepare a trial balance</button></div><button class='klStartBtn' id='klStartBtn'>✨ Start lesson</button><small class='klStartErr' id='klStartErr'></small></div><div class='klLoading' id='klLoading' style='display:none'><span class='klSpinner'></span><b>Knovo is planning your lesson…</b><small id='klLoadingTip'>Sketching the board and choosing a worked example.</small></div></div>"+
      "<aside class='klSide' id='klSide'><div class='klSideHead'>Lesson plan</div><ol class='klPlan' id='klPlan'><li class='klPlanGhost'>Your lesson plan appears here once you start.</li></ol><div class='klSideHead'>Questions &amp; answers</div><div class='klLog' id='klLog'><p class='klLogHint'>✋ Interrupt any time — Knovo pauses, answers, remembers what you asked, and carries on from the same spot.</p></div></aside></div>"+
      "<div class='klSub' id='klSub' aria-live='polite'><b>Knovo:</b> Hi! Tell me what you'd like to learn and I'll teach it on the board.</div>"+
      "<div class='klControls'><button id='klPrev' title='Previous step'>⏮</button><button id='klPlayPause' class='klPrimary'>⏸ Pause</button><button id='klNext' title='Next step'>⏭</button><button id='klReplay'>↺ Replay Step</button><button class='klRewind klBack5' id='klBack5' title='Rewind 5 seconds'>−5s</button><button class='klRewind' id='klBack10' title='Rewind 10 seconds'>−10s</button><div class='klReplayMeter'><input class='klReplayTrack' id='klReplayTrack' type='range' min='0' max='0' step='0.1' value='0' aria-label='Lesson replay position'><span class='klReplayTime' id='klReplayTime'>0:00 / 0:00</span></div>"+
      "<div class='klAsk'><input id='klQ' maxlength='500' autocomplete='off' placeholder='✋ Ask a question — Knovo pauses and answers' aria-label='Ask Knovo a question'><button id='klMic' class='klMicBtn' title='Ask with your voice'>🎤</button><button id='klAskBtn'>Ask</button></div><button class='klResume' id='klResume' style='display:none'>▶ Continue lesson</button></div>";
    document.body.appendChild(modal);
    L={step:0,steps:[],state:"setup",run:0,askSeq:0,sentence:0,stepSpoken:false,seconds:3600,groups:[],topic:topic,context:liveChatContext(topic),chat:[],
       timeline:[],totalTime:0,replayTime:0,needsResume:false,seekSentence:0,zoom:1,eraseMode:false,history:[],title:topic};
    KV.onTalk(tutorTalking);
    var $=function(id){return document.getElementById(id);};
    $("klClose").onclick=function(){closeLive("Live Lesson ended.");};
    $("klZoomOut").onclick=function(){setWhiteboardZoom(L.zoom-.25);};
    $("klZoomIn").onclick=function(){setWhiteboardZoom(L.zoom+.25);};
    $("klZoomReset").onclick=function(){setWhiteboardZoom(1);};
    $("klEraser").onclick=toggleWhiteboardEraser;
    $("klClearBoard").onclick=clearWhiteboard;
    $("klUndo").onclick=undoWhiteboard;
    $("klExport").onclick=exportWhiteboardSVG;
    $("klStage").addEventListener("wheel",function(e){if(!L||!e.ctrlKey)return; /* pinch / ctrl+wheel zooms; plain wheel still scrolls */e.preventDefault();setWhiteboardZoom(L.zoom+(e.deltaY<0?.1:-.1));},{passive:false});
    $("klPlayPause").onclick=togglePause;
    $("klPrev").onclick=function(){if(L&&L.steps.length)goStep(L.step-1);};
    $("klNext").onclick=function(){if(L&&L.steps.length)goStep(L.step+1);};
    $("klBack5").onclick=function(){rewindReplay(5);};
    $("klBack10").onclick=function(){rewindReplay(10);};
    $("klCleanLayout").onclick=cleanWhiteboardLayout;
    $("klReplayTrack").addEventListener("input",function(){seekReplay(Number(this.value)||0);});
    $("klReplay").onclick=replayStep;
    $("klAskBtn").onclick=function(){askQuestion();};
    $("klMic").onclick=micAsk;
    $("klQ").addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.isComposing){e.preventDefault();askQuestion();}});
    $("klResume").onclick=resumeLesson;
    $("klNotesBtn").onclick=function(){var m=$("knovoLiveModal");var off=m.classList.toggle("klNotesOff");this.setAttribute("aria-pressed",off?"false":"true");};
    if(window.innerWidth<900){modal.classList.add("klNotesOff");$("klNotesBtn").setAttribute("aria-pressed","false");}
    initVoicePanel();
    document.addEventListener("visibilitychange",liveVisibility);
    L.clockInt=setInterval(replayClock,200);
    $("klStartBtn").onclick=beginFromStart;
    $("klNewTopic").onclick=newTopic;
    $("klTopicIn").addEventListener("keydown",function(e){if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();beginFromStart();}});
    $("klTopicIn").addEventListener("input",function(){var er=$("klStartErr");if(er)er.textContent="";});
    Array.prototype.forEach.call(modal.querySelectorAll("#klStartChips button"),function(b){b.onclick=function(){var t=$("klTopicIn");t.value=b.textContent;t.focus();};});
    showStart(topic);
  }
  /* ---------------- start screen: the student chooses the topic ---------------- */
  function showStart(prefill){
    if(!L)return;
    L.state="setup";updateControls();setStatus("waiting for your topic");
    var st=document.getElementById("klStart"),inp=document.getElementById("klTopicIn"),ld=document.getElementById("klLoading");
    if(ld)ld.style.display="none";
    if(st)st.style.display="";
    var pen=document.getElementById("klPen");if(pen)pen.style.opacity="0";
    if(inp){if(prefill!=null)inp.value=prefill;setTimeout(function(){try{inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length);}catch(e){}},50);}
    var pill=document.getElementById("klStepPill");if(pill)pill.textContent="New lesson";
    var nt=document.getElementById("klNewTopic");if(nt)nt.hidden=true;
  }
  function beginFromStart(){
    if(!L||(L.state!=="setup"&&L.state!=="error"))return;
    var inp=document.getElementById("klTopicIn"),er=document.getElementById("klStartErr");
    var t=String(inp&&inp.value||"").replace(/\s+/g," ").trim().slice(0,300);
    if(t.length<3){if(er)er.textContent="Please type what you'd like to learn first.";if(inp)inp.focus();return;}
    KV.unlock(); /* inside the tap, so speech is allowed on iPhone/iPad */
    L.topic=t;L.title=t;L.context=liveChatContext(t);
    var st=document.getElementById("klStart");if(st)st.style.display="none";
    document.getElementById("klTitle").textContent="✨ "+t;
    if(!L.timerInt)L.timerInt=setInterval(tick,1000); /* the 60-minute clock starts with the lesson */
    var sub=document.getElementById("klSub");if(sub)sub.innerHTML="<b>Knovo:</b> setting up the board and sketching a plan for your lesson…";
    loadLesson();
  }
  function newTopic(){
    if(!L)return;
    haltForNav();
    var root=document.getElementById("klSteps");if(root)root.innerHTML="";
    L.steps=[];L.groups=[];L.history=[];L.chat=[];L.timeline=[];L.totalTime=0;L.replayTime=0;L.step=0;L.wasDone=false;updateReplayUI();
    var ol=document.getElementById("klPlan");if(ol)ol.innerHTML="<li class='klPlanGhost'>Your lesson plan appears here once you start.</li>";
    document.getElementById("klTitle").textContent="✨ Live Lesson";
    var sub=document.getElementById("klSub");if(sub)sub.innerHTML="<b>Knovo:</b> Sure — what would you like to learn next?";
    logLine("sys","Choosing a new topic…");
    showStart("");
  }
  window.knovoLiveLesson=startLive;

  /* ---------------- talking to the Edge Function ---------------- */
  function replyText(d){
    try{
      var parts=(d&&d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts)||[];
      /* join every text part and skip "thought" parts some models return first */
      return parts.filter(function(p){return p&&typeof p.text==="string"&&!p.thought;}).map(function(p){return p.text;}).join("").trim();
    }catch(e){return "";}
  }
  async function liveFetch(body,ms){
    var attempt=0;
    while(true){
      var s=await getSession();
      if(!s)return {auth:true};
      var ctrl=("AbortController" in window)?new AbortController():null,timer=ctrl?setTimeout(function(){ctrl.abort();},ms||60000):null;
      var H=function(t){return {"Content-Type":"application/json","apikey":SUPA_KEY,"Authorization":"Bearer "+t};};
      try{
        var r=await fetch(EDGE,{method:"POST",headers:H(s.access_token),body:JSON.stringify(body),signal:ctrl?ctrl.signal:undefined});
        if(r.status===401){
          var rs=await refreshStoredSession();
          if(rs)r=await fetch(EDGE,{method:"POST",headers:H(rs.access_token),body:JSON.stringify(body),signal:ctrl?ctrl.signal:undefined});
        }
        clearTimeout(timer);
        var d=null;try{d=await r.json();}catch(e){}
        if(r.status===401||r.status===403)return {auth:true,status:r.status};
        if(r.status===429)return {limit:true,status:429,msLeft:Number(d&&d.msLeft)||0,data:d};
        if(r.status>=500&&attempt<1&&!(d&&d.error&&d.error.code==="AI_UNAVAILABLE")){attempt++; /* the server already retried every model */await new Promise(function(ok){setTimeout(ok,1200);});continue;}
        if(!r.ok)return {error:(d&&d.error&&(d.error.message||d.error))||("HTTP "+r.status),status:r.status};
        var txt=replyText(d);
        if(!txt){if(attempt<1){attempt++;continue;}return {error:"empty reply"};}
        return {text:txt,status:r.status};
      }catch(e){
        clearTimeout(timer);
        if(attempt<1){attempt++;await new Promise(function(ok){setTimeout(ok,900);});continue;}
        return {error:e&&e.name==="AbortError"?"timed out":"network",network:true};
      }
    }
  }
  function sessionExpired(){
    closeLive();clearAuth();openSignin();
    if(window.toast)toast("Your session has expired — please sign in again to keep learning.");
  }

  async function loadLesson(){
    if(!L)return;
    var sub=document.getElementById("klSub"),tips=["Sketching the board and choosing a worked example.","Picking the clearest diagram for this idea.","Writing a check question for the end.","Lining up the exam tips."],ti=0;
    var loading=document.getElementById("klLoading");if(loading)loading.style.display="";
    var startEl=document.getElementById("klStart");if(startEl)startEl.style.display="none";
    var tipInt=setInterval(function(){var t=document.getElementById("klLoadingTip");if(!t)return clearInterval(tipInt);ti=(ti+1)%tips.length;t.textContent=tips[ti];},2600);
    L.state="loading";updateControls();setStatus("preparing your lesson…");
    var lesson=null,lastErr="";
    for(var attempt=0;attempt<2&&L&&!lesson;attempt++){
      if(attempt)setStatus("tidying up the board…");
      /* The deployed server owns the system prompt. Keep the structured lesson contract in user content. */
      var prompt="Create a visual lesson about: "+L.topic+"\n\n"+LESSON_SYS+(attempt?LESSON_COMPACT:"")+(L.context?"\n\nThe student was just discussing this in chat — tailor the lesson to it and build on it:\n"+L.context.slice(0,600):"");
      var res=await liveFetch({mode:"whiteboard",contents:[{role:"user",parts:[{text:prompt}]}]},140000);
      if(!L){clearInterval(tipInt);return;}
      if(res.auth){clearInterval(tipInt);sessionExpired();return;}
      if(res.limit){
        clearInterval(tipInt);if(loading)loading.style.display="none";L.state="error";updateControls();setStatus("allowance used");
        sub.innerHTML="<span class='klError'>⏳ "+(res.data&&res.data.credits?"A Live Lesson costs "+res.data.credits.need+" credits and you have "+res.data.credits.left+" left today. ":"Your Live Lesson allowance is used for now. ")+(res.msLeft?"Your credits refill in <b>"+fmtWait(res.msLeft)+"</b>.":"Please retry shortly.")+" Knovo Pro has no credit limit.</span>";return;
      }
      if(res.error){if(res.status&&window.console)console.warn("Knovo Live Lesson server error",res.status,res.error);lastErr=res.network?"net":res.status?"server":"garbled";L.serverDetail=res.status?String(res.error).slice(0,1500):"";if(res.network||res.status)break;continue;}
      try{lesson=parseLesson(res.text);}catch(e){lastErr="garbled";lesson=null;}
    }
    clearInterval(tipInt);
    if(!L)return;
    if(!lesson){
      if(loading)loading.style.display="none";
      L.state="error";updateControls();setStatus("couldn't start");
      var owner=ownerUnlimited(),msg=lastErr==="net"?"I couldn't reach the lesson server. Check your internet connection and try again."
        :lastErr==="server"?"Live Lessons are having a server problem right now. Please try again in a little while."
        :"The lesson came back in a form I couldn't read. Please try again.";
      if(owner&&lastErr==="server"&&L.serverDetail)msg+=" <br><small class='klOwnerDetail'>Owner detail: "+esc(L.serverDetail).replace(/ \| /g,"<br>")+"</small>";
      sub.innerHTML="<span class='klError'>⚠️ "+msg+"</span> <button class='klRetry' id='klRetry'>↻ Try again</button> <button class='klRetry' id='klChangeTopic'>✎ Change topic</button>";
      var ct=document.getElementById("klChangeTopic");if(ct)ct.onclick=function(){showStart(L.topic);};
      var rb=document.getElementById("klRetry");if(rb)rb.onclick=function(){sub.innerHTML="<b>Knovo:</b> let's try that again…";loadLesson();};
      return;
    }
    if(loading)loading.style.display="none";
    L.steps=lesson.steps;L.title=lesson.title;
    L.steps.forEach(function(st){st.__sent=KV.sentences(st.voice);});
    buildLessonTimeline();liveRecord();updateBadge();
    try{if(window.knovoLogUsage)window.knovoLogUsage("live_lesson");}catch(e){} /* owner analytics */
    document.getElementById("klTitle").textContent="✨ "+lesson.title;
    var ntb=document.getElementById("klNewTopic");if(ntb)ntb.hidden=false;
    renderPlan();
    logLine("sys","Lesson started: "+lesson.title+" · "+L.steps.length+" steps");
    playStep(0);
  }

  /* ---------------- tutor presence helpers ---------------- */
  function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
  function setStatus(t){var e=document.getElementById("klStatus");if(e)e.textContent=t;}
  function tutorTalking(on){var a=document.getElementById("klAvatar");if(a)a.classList.toggle("talking",!!on);}
  function stepLabel(st,i){
    var t=String(st.title||"").trim();
    if(!t){var f=(st.__sent&&st.__sent[0])||String(st.voice||"");t=f.split(/\s+/).slice(0,6).join(" ").replace(/[,.;:!?]+$/,"");}
    return t||("Step "+(i+1));
  }
  function renderPlan(){
    var ol=document.getElementById("klPlan");if(!ol||!L)return;
    ol.innerHTML=L.steps.map(function(st,i){return "<li><button data-step='"+i+"'><span class='klPlanNum'>"+(i+1)+"</span><span>"+esc(stepLabel(st,i))+"</span></button></li>";}).join("");
    Array.prototype.forEach.call(ol.querySelectorAll("button[data-step]"),function(b){b.onclick=function(){goStep(Number(b.getAttribute("data-step")));};});
    updatePlanUI();
  }
  function updatePlanUI(){
    if(!L)return;
    var ol=document.getElementById("klPlan");if(ol)Array.prototype.forEach.call(ol.querySelectorAll("li"),function(li,i){
      li.classList.toggle("now",i===L.step&&L.state!=="done");li.classList.toggle("done",i<L.step||L.state==="done");
    });
    var pill=document.getElementById("klStepPill");
    if(pill&&L.steps.length)pill.textContent=L.state==="done"?"✅ Complete":("Step "+(L.step+1)+" / "+L.steps.length);
  }
  function updateControls(){
    if(!L)return;
    var b=document.getElementById("klPlayPause"),ready=L.steps.length>0;
    if(b){
      b.textContent=L.state==="teaching"?"⏸ Pause":L.state==="done"?"↺ Restart":(L.state==="answering"||L.state==="waiting"||L.afterQ)?"▶ Continue":"▶ Play";
      b.disabled=!ready;
    }
    ["klPrev","klNext","klReplay","klBack5","klBack10","klReplayTrack"].forEach(function(id){var e=document.getElementById(id);if(e)e.disabled=!ready;});
    var p=document.getElementById("klPrev");if(p&&ready)p.disabled=L.step<=0;
    var n=document.getElementById("klNext");if(n&&ready)n.disabled=L.state==="done";
    var r=document.getElementById("klResume");if(r)r.style.display=(L.state==="waiting"||(L.state==="paused"&&L.afterQ))?"inline-block":"none";
    updatePlanUI();
  }
  function caption(list,k,who){
    var sub=document.getElementById("klSub");if(!sub)return;
    var prev=k>0?list[k-1]:"";
    sub.innerHTML="<b>"+(who||"Knovo")+":</b> "+(prev?"<span class='klCapPrev'>"+esc(prev)+"</span> ":"")+"<span class='klCapNow'>"+esc(list[k]||"")+"</span>";
  }
  function logLine(kind,text){
    var log=document.getElementById("klLog");if(!log)return null;
    var hint=log.querySelector(".klLogHint");if(hint&&kind!=="sys")hint.remove();
    var p=document.createElement("div");p.className="klLogItem "+kind;
    p.innerHTML=kind==="sys"?"<i>"+esc(text)+"</i>":"<b>"+(kind==="you"?"You":"Knovo")+"</b><span></span>";
    if(kind!=="sys")p.querySelector("span").textContent=text;
    log.appendChild(p);log.scrollTop=log.scrollHeight;return p;
  }

  /* ---------------- lesson parsing: tolerant of fences, stray quotes and cut-off replies ---------------- */
  function repairJSON(t){
    var out="",inStr=false,esc2=false,stack=[];
    for(var i=0;i<t.length;i++){
      var c=t[i];
      if(inStr){
        if(esc2){out+=c;esc2=false;continue;}
        if(c==="\\"){out+=c;esc2=true;continue;}
        if(c==="\""){
          var j=i+1;while(j<t.length&&/\s/.test(t[j]))j++;
          var nx=t[j];
          if(nx===undefined||nx===","||nx==="}"||nx==="]"||nx===":"){inStr=false;out+=c;}
          else out+="\\\""; /* a stray double quote inside a value (usually an SVG attribute) */
          continue;
        }
        if(c==="\n"){out+="\\n";continue;}
        if(c==="\r")continue;
        if(c==="\t"){out+="\\t";continue;}
        out+=c;continue;
      }
      if(c==="\""){inStr=true;out+=c;continue;}
      if(c==="{"||c==="["){stack.push(c==="{"?"}":"]");out+=c;continue;}
      if(c==="}"||c==="]"){out=out.replace(/,\s*$/,"");stack.pop();out+=c;if(!stack.length)break;continue;}
      out+=c;
    }
    var truncated=inStr||stack.length>0;
    if(inStr)out+="\"";
    out=out.replace(/,\s*$/,"").replace(/:\s*$/,":\"\"");
    while(stack.length){out=out.replace(/,\s*$/,"");out+=stack.pop();}
    return {text:out,truncated:truncated};
  }
  function parseLesson(txt){
    var t=String(txt||"").replace(/^﻿/,"").replace(/```(?:json|JSON)?/g,"").trim();
    var a=t.indexOf("{");if(a<0)throw new Error("no JSON");
    t=t.slice(a);
    var j=null,truncated=false;
    try{var b=t.lastIndexOf("}");j=JSON.parse(t.slice(0,b+1));}catch(e){j=null;}
    if(!j){var fx=repairJSON(t);truncated=fx.truncated;j=JSON.parse(fx.text);}
    var raw=(j&&(j.steps||j.lesson||j.slides))||[];
    if(!Array.isArray(raw))throw new Error("no steps");
    var steps=raw.map(function(s){
      if(!s||typeof s!=="object")return null;
      var board=normBoard(s.board||s.layout||s.table);
      var st={title:String(s.title||s.heading||"").replace(/\s+/g," ").trim().slice(0,70),
              voice:String(s.voice||s.say||s.narration||s.text||"").replace(/\s+/g," ").trim(),
              svgElements:board?renderBoard(board):sanitizeSVG(String(s.svgElements||s.svg||""))};
      if(board){st.__ordered=true;st.__meta={key:boardKey(board),rows:rowsSig(board)};}
      return st;
    }).filter(function(s){return s&&(s.voice||s.svgElements);});
    if(truncated&&steps.length>2)steps.pop(); /* the last step of a cut-off reply is incomplete */
    if(steps.length<2)throw new Error("The lesson came back empty");
    return {title:String((j&&j.title)||L&&L.topic||"Live Lesson").slice(0,90),steps:steps.slice(0,12)};
  }
  /* Only plain drawing primitives reach the board: no scripts, links, images or event handlers. */
  var KL_TAGS={g:1,circle:1,ellipse:1,rect:1,line:1,path:1,polyline:1,polygon:1,text:1,tspan:1};
  var KL_ATTRS={x:1,y:1,x1:1,y1:1,x2:1,y2:1,cx:1,cy:1,r:1,rx:1,ry:1,width:1,height:1,d:1,points:1,fill:1,stroke:1,"stroke-width":1,"stroke-dasharray":1,"stroke-linecap":1,"stroke-linejoin":1,opacity:1,"fill-opacity":1,"stroke-opacity":1,"font-size":1,"font-family":1,"font-weight":1,"font-style":1,"text-anchor":1,"dominant-baseline":1,transform:1,dx:1,dy:1};
  function darkColour(c){
    c=String(c||"").trim().toLowerCase();
    if(!c||c==="black"||c==="currentcolor")return true;
    var m=/^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(c);if(!m)return false;
    var h=m[1].length===3?m[1].replace(/./g,"$&$&"):m[1];
    var r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
    return (r*299+g*587+b*114)/1000<70;
  }
  function sanitizeSVG(str){
    if(!str||!/</.test(str))return "";
    try{
      var tpl=document.createElement("template");tpl.innerHTML="<svg xmlns='http://www.w3.org/2000/svg'>"+str+"</svg>";
      var svg=tpl.content.querySelector("svg");if(!svg)return "";
      (function walk(node){
        Array.prototype.slice.call(node.children).forEach(function(el){
          var tag=el.tagName.toLowerCase();
          if(!KL_TAGS[tag]){el.remove();return;}
          Array.prototype.slice.call(el.attributes).forEach(function(at){
            var n=at.name.toLowerCase();
            if(!KL_ATTRS[n]||/url\(|javascript:/i.test(at.value))el.removeAttribute(at.name);
          });
          if(tag==="text"||tag==="tspan"){
            if(tag==="text"&&darkColour(el.getAttribute("fill")))el.setAttribute("fill","#f8fafc");
            if(tag==="text"&&!el.getAttribute("font-size"))el.setAttribute("font-size","26");
          }else if(tag!=="g"){
            if(!el.hasAttribute("fill"))el.setAttribute("fill","none");
            if(!el.getAttribute("stroke")||darkColour(el.getAttribute("stroke")))el.setAttribute("stroke","#38bdf8");
            if(!el.getAttribute("stroke-width"))el.setAttribute("stroke-width","3");
          }
          walk(el);
        });
      })(svg);
      return Array.prototype.map.call(svg.children,function(el){return el.outerHTML;}).join("");
    }catch(e){return "";}
  }

  function tick(){
    if(!L)return;L.seconds--;
    var m=Math.floor(L.seconds/60),s=L.seconds%60;
    var el=document.getElementById("klTimer");if(el)el.textContent=(m<10?"0":"")+m+":"+(s<10?"0":"")+s;
    if(L.seconds<=0)closeLive("⏱ Your 1-hour Live Lesson has ended. Start another anytime!");
  }
  /* ---------------- undo history and portable board export ---------------- */
  function klSaveHistory(){
    if(!L)return;var root=document.getElementById("klSteps");if(!root)return;
    L.history=L.history||[];L.history.push(root.innerHTML);if(L.history.length>30)L.history.shift();
  }
  function klRestoreBoard(html){
    var root=document.getElementById("klSteps");root.innerHTML=html;
    /* Keep replay/resume references attached to the restored DOM, including after Clear Board. */
    L.groups=[];Array.prototype.forEach.call(root.children,function(g){var k=g.getAttribute("data-step");if(k!==null){L.groups[Number(k)]=g;g.__klDrawn=true;}});
    Array.prototype.forEach.call(root.children,function(g){Array.prototype.slice.call(g.children).forEach(function(el){
      if(!el.getBBox)return;el.__klFullText=el.textContent||"";
      var t=el.getAttribute("transform")||"";
      if(el.getAttribute("data-kl-offset")==="1"){
        var m=/^translate\(\s*([-+\d.eE]+)[ ,]+([-+\d.eE]+)\s*\)([\s\S]*)$/.exec(t);
        if(m){el.__klBaseTransform=(m[3]||"").trim();el.__klX=Number(m[1])||0;el.__klY=Number(m[2])||0;}
      }else{el.__klBaseTransform=t;el.__klX=0;el.__klY=0;}
      klEnableDrag(el);
    });});
  }
  function undoWhiteboard(){
    if(!L||!L.history||!L.history.length){setStatus("nothing to undo");return;}
    klRestoreBoard(L.history.pop());setStatus("last board edit undone");
  }
  function exportWhiteboardSVG(){
    var svg=document.getElementById("klSvg");if(!svg)return;
    var clone=svg.cloneNode(true),pen=clone.querySelector("#klPen");if(pen)pen.remove();
    clone.setAttribute("xmlns","http://www.w3.org/2000/svg");
    var vb=(clone.getAttribute("viewBox")||"0 0 800 500").split(/\s+/).map(Number),w=vb[2]||800,h=vb[3]||500;
    clone.setAttribute("width",w);clone.setAttribute("height",h);clone.removeAttribute("style");
    var bg=document.createElementNS("http://www.w3.org/2000/svg","rect");bg.setAttribute("width",w);bg.setAttribute("height",h);bg.setAttribute("fill","#0f172a");clone.insertBefore(bg,clone.firstChild);
    var blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:"image/svg+xml;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="Knovo-lesson-board.svg";document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);setStatus("board exported as an editable SVG");
  }

  document.addEventListener("keydown",function(e){
    if(!L||!document.getElementById("knovoLiveModal"))return;
    var t=e.target;if(t&&(/^(INPUT|TEXTAREA)$/.test(t.tagName)||t.isContentEditable))return;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="z"){e.preventDefault();undoWhiteboard();}
    else if(e.key==="+"||e.key==="="){e.preventDefault();setWhiteboardZoom(L.zoom+.25);}
    else if(e.key==="-"){e.preventDefault();setWhiteboardZoom(L.zoom-.25);}
  });

  /* ---------------- zoom, pan and erase tools ---------------- */
  function setWhiteboardZoom(z){
    if(!L)return;L.zoom=Math.max(.5,Math.min(3,Math.round(z*100)/100));
    var stage=document.getElementById("klStage"),svg=document.getElementById("klSvg"),label=document.getElementById("klZoomValue");
    if(label)label.textContent=Math.round(L.zoom*100)+"%";
    if(L.zoom===1){svg.style.width="";svg.style.maxWidth="";svg.style.maxHeight="";stage.style.placeItems="center";}
    else{
      var base=Math.max(280,stage.clientWidth-24);svg.style.width=Math.round(base*L.zoom)+"px";svg.style.maxWidth="none";svg.style.maxHeight=L.zoom>1?"none":"100%";
      stage.style.placeItems=L.zoom>1?"start":"center";
    }
  }
  function toggleWhiteboardEraser(){
    if(!L)return;L.eraseMode=!L.eraseMode;
    var b=document.getElementById("klEraser"),stage=document.getElementById("klStage");
    b.textContent=L.eraseMode?"Eraser: On":"Eraser: Off";b.classList.toggle("klActive",L.eraseMode);stage.classList.toggle("klEraseMode",L.eraseMode);
    setStatus(L.eraseMode?"eraser on — click any board item to remove it":"eraser off");
  }
  function clearWhiteboard(){
    if(!L)return;klSaveHistory();var root=document.getElementById("klSteps");if(root)root.innerHTML="";L.groups=[];
    if(L.eraseMode)toggleWhiteboardEraser();setStatus("board cleared — Replay Step or rewind to restore content");
  }

  /* ---------------- board geometry + dragging ---------------- */
  function klApplyOffset(el,x,y){
    if(!Object.prototype.hasOwnProperty.call(el,"__klBaseTransform"))el.__klBaseTransform=el.getAttribute("transform")||"";
    el.__klX=Number(x)||0;el.__klY=Number(y)||0;el.setAttribute("data-kl-offset","1");
    el.setAttribute("transform","translate("+el.__klX+" "+el.__klY+")"+(el.__klBaseTransform?" "+el.__klBaseTransform:""));
  }
  function klBox(el){
    try{
      var b=el.getBBox(),svg=document.getElementById("klSvg"),m=svg.getCTM().inverse().multiply(el.getCTM());
      var pts=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(function(p){
        var v=svg.createSVGPoint();v.x=p[0];v.y=p[1];return v.matrixTransform(m);
      });
      var xs=pts.map(function(p){return p.x;}),ys=pts.map(function(p){return p.y;});
      var x=Math.min.apply(Math,xs),y=Math.min.apply(Math,ys);
      return {x:x,y:y,width:Math.max.apply(Math,xs)-x,height:Math.max.apply(Math,ys)-y};
    }catch(e){
      var b2=el.getBBox?el.getBBox():{x:0,y:0,width:0,height:0};
      return {x:b2.x+(el.__klX||0),y:b2.y+(el.__klY||0),width:b2.width,height:b2.height};
    }
  }
  function klClientPoint(e){
    var svg=document.getElementById("klSvg"),p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  function klEnableDrag(el){
    if(el.__klDragBound)return;el.__klDragBound=true;el.classList.add("klDraggable");
    el.addEventListener("pointerdown",function(e){
      if(e.button!==undefined&&e.button!==0)return;
      e.preventDefault();e.stopPropagation();
      if(L&&L.eraseMode){klSaveHistory();el.remove();setStatus("item erased — Undo or replay can restore it");return;}
      klSaveHistory();var start=klClientPoint(e),ox=el.__klX||0,oy=el.__klY||0,id=e.pointerId;
      el.classList.add("klDragging");try{el.setPointerCapture(id);}catch(err){}
      function move(ev){if(ev.pointerId!==id)return;ev.preventDefault();var p=klClientPoint(ev);klApplyOffset(el,ox+p.x-start.x,oy+p.y-start.y);}
      function finish(ev){
        if(ev.pointerId!==id)return;el.classList.remove("klDragging");
        el.removeEventListener("pointermove",move);el.removeEventListener("pointerup",finish);el.removeEventListener("pointercancel",finish);
        try{el.releasePointerCapture(id);}catch(err){}
      }
      el.addEventListener("pointermove",move);el.addEventListener("pointerup",finish);el.addEventListener("pointercancel",finish);
    });
  }
  /* ---------------- neat structured boards ----------------
     The AI fills in a small object; Knovo lays it out cleanly instead of the AI
     placing loose text. Kinds: table (financial statements, data tables),
     working (line-by-line calculation), points (key points), flow (cause → effect). */
  var KL_NS="http://www.w3.org/2000/svg",KL_X=64,KL_W=672,KL_TOP=34;
  function klCell(c){return String(c==null?"":c).replace(/\s+/g," ").trim().slice(0,70);}
  function normBoard(b){
    if(!b||typeof b!=="object"||Array.isArray(b))return null;
    var kind=String(b.kind||b.type||"").toLowerCase(),title=klCell(b.title||b.heading).slice(0,80);
    /* graphs: supply & demand, distance-time, straight lines, curves */
    if(/^(graph|chart|plot|axes)$/.test(kind)||(Array.isArray(b.lines)&&b.lines[0]&&typeof b.lines[0]==="object"&&b.lines[0].points)){
      var ax=function(a,def){a=(a&&typeof a==="object")?a:{label:a};return {label:klCell(a.label||def).slice(0,40),min:Number(a.min),max:Number(a.max),ticks:!!a.ticks};};
      var X=ax(b.x||b.xAxis,"x"),Y=ax(b.y||b.yAxis,"y");
      var pt=function(p){p=Array.isArray(p)?p:(p&&typeof p==="object"?[p.x,p.y]:[]);return [Number(p[0]),Number(p[1])];};
      var ok=function(p){return isFinite(p[0])&&isFinite(p[1]);};
      var lines=(Array.isArray(b.lines)?b.lines:Array.isArray(b.curves)?b.curves:[]).slice(0,5).map(function(l){
        l=l||{};var st=String(l.style||"");
        return {label:klCell(l.label).slice(0,16),pts:(Array.isArray(l.points)?l.points:[]).map(pt).filter(ok).slice(0,40),dashed:/dash|dot/.test(st),curve:!!l.curve||/curve|smooth/.test(st)};
      }).filter(function(l){return l.pts.length>=2;});
      var marks=(Array.isArray(b.marks)?b.marks:[]).slice(0,6).map(function(m){m=m||{};return {label:klCell(m.label).slice(0,16),at:pt(m.at||m.point||m),guides:m.guides!==false,xl:klCell(m.xLabel||m.xlabel).slice(0,10),yl:klCell(m.yLabel||m.ylabel).slice(0,10)};}).filter(function(m){return ok(m.at);});
      var arrows=(Array.isArray(b.arrows)?b.arrows:[]).slice(0,4).map(function(a){a=a||{};return {from:pt(a.from),to:pt(a.to)};}).filter(function(a){return ok(a.from)&&ok(a.to);});
      if(!lines.length&&!marks.length)return null;
      var xs=[],ys=[];lines.forEach(function(l){l.pts.forEach(function(p){xs.push(p[0]);ys.push(p[1]);});});marks.forEach(function(m){xs.push(m.at[0]);ys.push(m.at[1]);});
      var xmin=isFinite(X.min)?X.min:Math.min(0,Math.min.apply(Math,xs)),xmax=isFinite(X.max)&&X.max>xmin?X.max:Math.max.apply(Math,xs)*1.08;
      var ymin=isFinite(Y.min)?Y.min:Math.min(0,Math.min.apply(Math,ys)),ymax=isFinite(Y.max)&&Y.max>ymin?Y.max:Math.max.apply(Math,ys)*1.08;
      if(!(xmax>xmin))xmax=xmin+1;if(!(ymax>ymin))ymax=ymin+1;
      return {kind:"graph",title:title,X:X,Y:Y,lines:lines,marks:marks,arrows:arrows,xmin:xmin,xmax:xmax,ymin:ymin,ymax:ymax};
    }
    /* pseudocode / program code: indentation is kept */
    if(/^(code|pseudocode|program|algorithm)$/.test(kind)){
      var src=Array.isArray(b.lines)?b.lines:String(b.code||"").split("\n");
      var code=src.slice(0,18).map(function(l){var raw=String(l==null?"":l).replace(/\t/g,"    ").replace(/\s+$/,"");var ind=(raw.match(/^ */)||[""])[0].length;return {ind:Math.min(16,ind),text:raw.trim().slice(0,70)};});
      while(code.length&&!code[code.length-1].text)code.pop();
      return code.length?{kind:"code",title:title,code:code}:null;
    }
    /* history, Islamiyat, Pakistan Studies: dated events */
    if(/^(timeline|dates|chronology)$/.test(kind)){
      var evs=(Array.isArray(b.events)?b.events:Array.isArray(b.items)?b.items:[]).slice(0,7).map(function(e){
        if(e&&typeof e==="object")return {date:klCell(e.date||e.year).slice(0,14),text:klCell(e.text||e.event||e.label).slice(0,90)};
        var m=/^\s*([^:–—-]{1,14})\s*[:–—-]\s*(.+)$/.exec(String(e||""));return m?{date:klCell(m[1]),text:klCell(m[2]).slice(0,90)}:{date:"",text:klCell(e).slice(0,90)};
      }).filter(function(e){return e.date||e.text;});
      return evs.length?{kind:"timeline",title:title,events:evs}:null;
    }
    if(kind==="table"||kind==="statement"||kind==="format"||kind==="comparison"||Array.isArray(b.rows)){
      var rows=(Array.isArray(b.rows)?b.rows:[]).slice(0,22).map(function(r){
        var cells,style="";
        if(Array.isArray(r))cells=r.map(klCell);
        else if(r&&typeof r==="object"){cells=(Array.isArray(r.cells)?r.cells:[r.label,r.amount,r.total]).map(klCell);style=String(r.style||r.type||"").toLowerCase();}
        else cells=[klCell(r)];
        while(cells.length>1&&!cells[cells.length-1])cells.pop();
        if(!style){ /* sensible defaults when the AI gives none */
          var rest=cells.slice(1).some(Boolean);
          if(!rest&&cells[0]&&!/\d/.test(cells[0]))style="heading";
          else if(/^(total|net |gross profit|profit for|loss for|capital employed|working capital|net assets|net current)/i.test(cells[0]||""))style="total";
        }
        if(!/^(heading|total|grand)$/.test(style))style="";
        return {cells:cells,style:style};
      }).filter(function(r){return r.cells.some(Boolean);});
      if(!rows.length)return null;
      var cols=(Array.isArray(b.columns)?b.columns:[]).map(klCell).slice(0,5);
      var n=Math.min(5,Math.max(cols.length,rows.reduce(function(m,r){return Math.max(m,r.cells.length);},1)));
      /* money/number columns (accounts, data) are right-aligned; word tables (comparisons, truth tables) get wrapped columns */
      var numeric=n>1;
      for(var c=1;c<n&&numeric;c++){var any=false;rows.forEach(function(r){var v=r.cells[c]||"";if(!v)return;any=true;if(!/^[\s(−\-+$£€₨]*\d[\d,.\s]*%?\)?\s*$/.test(v))numeric=false;});if(!any&&c===n-1)numeric=numeric&&true;}
      /* when the first column is numbers too (trace tables, data), it is a plain grid, not an account */
      if(numeric&&rows.filter(function(r){return r.cells[0];}).every(function(r){return /^[\s(−\-+]*\d[\d,.\s]*\)?$/.test(r.cells[0]);}))numeric=false;
      return {kind:"table",title:title,columns:cols,n:n,rows:rows,numeric:numeric};
    }
    var list=b.lines||b.items||b.points||b.steps||[];
    var items=(Array.isArray(list)?list:[]).map(function(x){return String(x==null?"":x).replace(/\s+/g," ").trim().slice(0,150);}).filter(Boolean).slice(0,10);
    if(!items.length)return null;
    if(/^(working|equation|calculation|calc|solution|formula|proof)$/.test(kind))return {kind:"working",title:title,items:items};
    if(/^(flow|process|chain|cycle|sequence|flowchart)$/.test(kind))return {kind:"flow",title:title,items:items.slice(0,6)};
    return {kind:"points",title:title,items:items};
  }
  function klMk(tag,attrs,text){var e=document.createElementNS(KL_NS,tag);for(var k in attrs)e.setAttribute(k,String(attrs[k]));if(text!=null)e.textContent=text;return e;}
  function klTxt(x,y,txt,fs,o){
    o=o||{};
    var a={x:Math.round(x),y:Math.round(y),"font-size":fs,fill:o.fill||"#f8fafc","class":o.cls||"klB","data-row":o.row==null?-1:o.row};
    if(o.anchor)a["text-anchor"]=o.anchor;if(o.bold)a["font-weight"]="700";
    var e=klMk("text",a,txt);
    if(o.max&&txt.length*fs*(o.cw||.47)>o.max){e.setAttribute("textLength",Math.round(o.max));e.setAttribute("lengthAdjust","spacingAndGlyphs");}
    return e;
  }
  function klLine(x1,y1,x2,y2,stroke,w,row,dash){
    var a={x1:Math.round(x1),y1:Math.round(y1),x2:Math.round(x2),y2:Math.round(y2),stroke:stroke,"stroke-width":w||2,"stroke-linecap":"round","data-row":row==null?-1:row};
    if(dash){a["stroke-dasharray"]=dash;a["data-dash"]=dash;}
    return klMk("line",a);
  }
  function klHead(x,y,ang,stroke){ /* small arrowhead pointing along angle ang (radians) */
    var a1=ang+Math.PI*0.82,a2=ang-Math.PI*0.82,l=10;
    return klMk("polyline",{points:Math.round(x+Math.cos(a1)*l)+","+Math.round(y+Math.sin(a1)*l)+" "+Math.round(x)+","+Math.round(y)+" "+Math.round(x+Math.cos(a2)*l)+","+Math.round(y+Math.sin(a2)*l),fill:"none",stroke:stroke,"stroke-width":2.5,"stroke-linejoin":"round","data-row":-1});
  }
  function klWrap(t,max){
    var words=String(t).split(" "),lines=[],cur="";
    words.forEach(function(w){
      while(w.length>max){if(cur){lines.push(cur);cur="";}lines.push(w.slice(0,max));w=w.slice(max);}
      if((cur+" "+w).trim().length>max&&cur){lines.push(cur);cur=w;}else cur=(cur+" "+w).trim();
    });
    if(cur)lines.push(cur);return lines;
  }
  function klTitle(out,b,y){
    if(!b.title)return y;
    out.push(klTxt(KL_X,y+26,b.title,28,{fill:"#fbbf24",max:KL_W}));
    out.push(klLine(KL_X,y+38,KL_X+Math.min(KL_W,b.title.length*13+20),y+38,"#fbbf24",2.5));
    return y+54;
  }
  function renderTable(b){return b.numeric?renderMoneyTable(b):renderTextTable(b);}
  function renderMoneyTable(b){
    var out=[],y=klTitle(out,b,KL_TOP),n=b.n,hasHead=b.columns.some(Boolean);
    var avail=470-y-(hasHead?32:0);
    var rh=Math.max(21,Math.min(32,Math.floor(avail/b.rows.length))),fs=rh>=30?24:rh>=26?22:rh>=23?20:18;
    var labelW=n<=1?KL_W:n===2?KL_W*.64:n===3?KL_W*.5:KL_W*.4,amtW=n>1?(KL_W-labelW)/(n-1):0;
    var right=function(c){return KL_X+labelW+amtW*c-6;};
    if(hasHead){
      for(var c=0;c<n;c++){var h=b.columns[c]||"";if(!h)continue;out.push(c===0?klTxt(KL_X,y+20,h,18,{fill:"#94a3b8",max:labelW-20}):klTxt(right(c),y+20,h,18,{fill:"#94a3b8",anchor:"end",max:amtW-12}));}
      out.push(klLine(KL_X,y+28,KL_X+KL_W,y+28,"#334155",1.5));y+=34;
    }
    b.rows.forEach(function(r,ri){
      var st=r.style,base=y+rh*.74,lab=r.cells[0]||"",hd=st==="heading",tot=st==="total"||st==="grand";
      if(lab)out.push(klTxt(KL_X+(hd||tot?0:20),base,lab,fs,{fill:hd?"#7dd3fc":st==="grand"?"#34d399":"#f8fafc",bold:hd||st==="grand",row:ri,max:labelW-(hd||tot?14:34)}));
      for(var c=1;c<n;c++){
        var v=r.cells[c]||"";if(!v)continue;
        var rx=right(c),lx=rx-Math.min(amtW-16,Math.max(60,v.length*fs*.5+10));
        if(tot)out.push(klLine(lx,y+3,rx,y+3,"#94a3b8",1.5,ri)); /* rule above a total, as accountants write it */
        out.push(klTxt(rx,base,v,fs,{fill:st==="grand"?"#34d399":"#f8fafc",anchor:"end",row:ri,max:amtW-14}));
        if(st==="grand"){out.push(klLine(lx,y+rh-1,rx,y+rh-1,"#34d399",1.5,ri));out.push(klLine(lx,y+rh+3,rx,y+rh+3,"#34d399",1.5,ri));}
      }
      y+=rh;
    });
    return out;
  }
  function renderTextTable(b){
    var out=[],top=klTitle(out,b,KL_TOP),n=b.n,hasHead=b.columns.some(Boolean);
    /* column widths follow how much each column has to say */
    var weight=[];for(var c=0;c<n;c++){var m=(b.columns[c]||"").length;b.rows.forEach(function(r){m=Math.max(m,(r.cells[c]||"").length);});weight.push(Math.max(6,Math.min(40,m)));}
    var sum=weight.reduce(function(a,v){return a+v;},0),widths=weight.map(function(v){return Math.max(80,KL_W*v/sum);});
    var scale=KL_W/widths.reduce(function(a,v){return a+v;},0);widths=widths.map(function(v){return v*scale;});
    var xs=[];widths.reduce(function(x,w,i){xs[i]=x;return x+w;},KL_X);
    function plan(fs){
      var lh=fs+5,h=hasHead?fs+16:0,rows=b.rows.map(function(r){
        if(r.style==="heading"){var hl=klWrap(r.cells.filter(Boolean).join(" "),Math.floor(KL_W/(fs*.47)));h+=hl.length*lh+10;return {heading:hl};}
        var cells=[],mx=1;for(var c=0;c<n;c++){var l=klWrap(r.cells[c]||"",Math.max(4,Math.floor((widths[c]-16)/(fs*.47))));cells.push(l);mx=Math.max(mx,l.length);}
        h+=mx*lh+10;return {cells:cells,lines:mx};
      });
      return {fs:fs,lh:lh,h:h,rows:rows};
    }
    var p=null;[22,20,18,16].some(function(fs){p=plan(fs);return top+p.h<=478;});
    var y=top,fs=p.fs,lh=p.lh;
    if(hasHead){
      for(var c=0;c<n;c++){if(b.columns[c])out.push(klTxt(xs[c]+6,y+fs,b.columns[c],fs,{fill:"#7dd3fc",bold:true,max:widths[c]-12}));}
      y+=fs+10;out.push(klLine(KL_X,y,KL_X+KL_W,y,"#38bdf8",1.8));y+=6;
    }
    p.rows.forEach(function(r,ri){
      if(r.heading){r.heading.forEach(function(ln,k){out.push(klTxt(KL_X+6,y+fs+k*lh,ln,fs,{fill:"#fbbf24",bold:true,row:ri}));});y+=r.heading.length*lh+10;return;}
      for(var c=0;c<n;c++)r.cells[c].forEach(function(ln,k){out.push(klTxt(xs[c]+6,y+fs+k*lh,ln,fs,{fill:c===0&&n>1?"#fde68a":"#f8fafc",row:ri}));});
      y+=r.lines*lh+10;
      if(ri<p.rows.length-1)out.push(klLine(KL_X,y-4,KL_X+KL_W,y-4,"#334155",1,ri));
    });
    return out;
  }
  function renderWorking(b){
    var out=[],y=klTitle(out,b,KL_TOP),fs=b.items.length>7?22:26,lh=fs+16,max=Math.floor(KL_W/(fs*.47));
    b.items.forEach(function(t,i){
      var cont=/^\s*[=≈]/.test(t),x=KL_X+(cont?44:0),last=i===b.items.length-1;
      var e=klTxt(x,y+fs,t,fs,{fill:last?"#34d399":"#f8fafc",row:i,max:KL_W-(cont?44:0)-(last?24:0)});out.push(e);
      if(last){var w=Math.min(KL_W-(cont?44:0),Math.min(t.length,max)*fs*.47+28);out.push(klMk("rect",{x:x-12,y:y+2,width:Math.round(w),height:fs+16,rx:8,fill:"none",stroke:"#34d399","stroke-width":2.5,"data-row":i}));}
      y+=lh;
    });
    return out;
  }
  function renderPoints(b){
    var out=[],y=klTitle(out,b,KL_TOP),fs=24,max=56;
    var total=b.items.reduce(function(m,t){return m+klWrap(t,max).length;},0);
    if(total*34+b.items.length*8>470-y){fs=20;max=66;}
    var lh=fs+10,colours=["#38bdf8","#f472b6","#fbbf24","#34d399"];
    b.items.forEach(function(t,i){
      var lines=klWrap(t,max).slice(0,3);
      out.push(klMk("circle",{cx:KL_X+9,cy:y+fs*.62,r:6,fill:"none",stroke:colours[i%4],"stroke-width":2.5,"data-row":i}));
      lines.forEach(function(ln,k){out.push(klTxt(KL_X+28,y+fs*.85+k*lh,ln,fs,{row:i,max:KL_W-28}));});
      y+=lines.length*lh+8;
    });
    return out;
  }
  function renderFlow(b){
    var out=[],y=klTitle(out,b,KL_TOP),n=b.items.length,colours=["#38bdf8","#f472b6","#fbbf24","#34d399","#38bdf8","#f472b6"];
    if(n<=4){
      var gap=46,bw=(KL_W-gap*(n-1))/n,bh=110,fs=n>=4?18:21,max=Math.max(8,Math.floor((bw-16)/(fs*.47)));
      y+=10;
      b.items.forEach(function(t,i){
        var x=KL_X+i*(bw+gap);
        out.push(klMk("rect",{x:Math.round(x),y:y,width:Math.round(bw),height:bh,rx:12,fill:"none",stroke:colours[i],"stroke-width":2.5,"data-row":i}));
        var lines=klWrap(t,max).slice(0,4),y0=y+bh/2-(lines.length-1)*(fs+4)/2+fs*.35;
        lines.forEach(function(ln,k){out.push(klTxt(x+bw/2,y0+k*(fs+4),ln,fs,{anchor:"middle",row:i,max:bw-14}));});
        if(i<n-1){var ax=x+bw+6,ay=y+bh/2;out.push(klLine(ax,ay,ax+gap-12,ay,"#e2e8f0",2.5,i));out.push(klHead(ax+gap-12,ay,0,"#e2e8f0"));}
      });
    }else{
      var bh2=44,gap2=Math.max(16,Math.min(26,Math.floor((470-y-n*bh2)/(n-1)))),bw2=520,x2=KL_X+(KL_W-bw2)/2;
      b.items.forEach(function(t,i){
        out.push(klMk("rect",{x:Math.round(x2),y:y,width:bw2,height:bh2,rx:10,fill:"none",stroke:colours[i],"stroke-width":2.5,"data-row":i}));
        out.push(klTxt(x2+bw2/2,y+bh2/2+7,t,20,{anchor:"middle",row:i,max:bw2-20}));
        if(i<n-1){var cx=x2+bw2/2,y1=y+bh2+3,y2=y+bh2+gap2-3;out.push(klLine(cx,y1,cx,y2,"#e2e8f0",2.5,i));out.push(klHead(cx,y2,Math.PI/2,"#e2e8f0"));}
        y+=bh2+gap2;
      });
    }
    return out;
  }
  function klNiceStep(range){var raw=range/5,p=Math.pow(10,Math.floor(Math.log(raw)/Math.LN10)),f=raw/p;return (f<1.5?1:f<3?2:f<7?5:10)*p;}
  function klFmt(v){var r=Math.round(v*100)/100;return String(r);}
  function renderGraph(b){
    var out=[],top=klTitle(out,b,KL_TOP)+18,L=KL_X+70,R=KL_X+KL_W-80,B=448,T=top;
    var sx=function(v){return L+(v-b.xmin)/(b.xmax-b.xmin)*(R-L);},sy=function(v){return B-(v-b.ymin)/(b.ymax-b.ymin)*(B-T);};
    var ox=sx(b.xmin<=0&&b.xmax>=0?0:b.xmin),oy=sy(b.ymin<=0&&b.ymax>=0?0:b.ymin);
    /* axes first, like a teacher: horizontal, vertical, then names */
    out.push(klLine(L-6,oy,R+22,oy,"#cbd5e1",2.5));out.push(klHead(R+22,oy,0,"#cbd5e1"));
    out.push(klLine(ox,B+6,ox,T-18,"#cbd5e1",2.5));out.push(klHead(ox,T-18,-Math.PI/2,"#cbd5e1"));
    out.push(klTxt(R+22,oy+30,b.X.label,20,{anchor:"end",fill:"#cbd5e1",max:240}));
    out.push(klTxt(ox+12,T-14,b.Y.label,20,{fill:"#cbd5e1",max:260}));
    if(b.X.ticks){var st=klNiceStep(b.xmax-b.xmin);for(var v=Math.ceil(b.xmin/st)*st;v<=b.xmax+1e-9;v+=st){if(Math.abs(v)<1e-9&&b.Y.ticks)continue;var px=sx(v);out.push(klLine(px,oy,px,oy+6,"#cbd5e1",1.5));out.push(klTxt(px,oy+22,klFmt(v),15,{anchor:"middle",fill:"#94a3b8"}));}}
    if(b.Y.ticks){var st2=klNiceStep(b.ymax-b.ymin);for(var w=Math.ceil(b.ymin/st2)*st2;w<=b.ymax+1e-9;w+=st2){var py=sy(w);out.push(klLine(ox-6,py,ox,py,"#cbd5e1",1.5));out.push(klTxt(ox-10,py+5,klFmt(w),15,{anchor:"end",fill:"#94a3b8"}));}}
    var colours=["#38bdf8","#f472b6","#34d399","#fbbf24","#a78bfa"];
    b.lines.forEach(function(l,i){
      var P=l.pts.map(function(p){return [sx(p[0]),sy(p[1])];}),d;
      if(l.curve&&P.length>2){ /* smooth curve through every point (Catmull-Rom) */
        d="M"+P[0][0].toFixed(1)+" "+P[0][1].toFixed(1);
        for(var k=0;k<P.length-1;k++){var p0=P[k-1]||P[k],p1=P[k],p2=P[k+1],p3=P[k+2]||p2;
          d+=" C"+(p1[0]+(p2[0]-p0[0])/6).toFixed(1)+" "+(p1[1]+(p2[1]-p0[1])/6).toFixed(1)+" "+(p2[0]-(p3[0]-p1[0])/6).toFixed(1)+" "+(p2[1]-(p3[1]-p1[1])/6).toFixed(1)+" "+p2[0].toFixed(1)+" "+p2[1].toFixed(1);}
      }else d="M"+P.map(function(p){return p[0].toFixed(1)+" "+p[1].toFixed(1);}).join(" L");
      var a={d:d,fill:"none",stroke:colours[i%5],"stroke-width":3,"stroke-linecap":"round","stroke-linejoin":"round","data-row":-1};
      if(l.dashed){a["stroke-dasharray"]="9 7";a["data-dash"]="9 7";}
      out.push(klMk("path",a));
      if(l.label){var e=P[P.length-1];out.push(klTxt(Math.min(e[0]+8,R+60),Math.max(T,e[1]-8),l.label,22,{fill:colours[i%5],bold:true}));}
    });
    b.arrows.forEach(function(a){var x1=sx(a.from[0]),y1=sy(a.from[1]),x2=sx(a.to[0]),y2=sy(a.to[1]);out.push(klLine(x1,y1,x2,y2,"#e2e8f0",2.5));out.push(klHead(x2,y2,Math.atan2(y2-y1,x2-x1),"#e2e8f0"));});
    b.marks.forEach(function(m){
      var px=sx(m.at[0]),py=sy(m.at[1]);
      if(m.guides){out.push(klLine(px,py,px,oy,"#94a3b8",1.5,-1,"4 5"));out.push(klLine(px,py,ox,py,"#94a3b8",1.5,-1,"4 5"));}
      out.push(klMk("circle",{cx:Math.round(px),cy:Math.round(py),r:5,fill:"#fbbf24",stroke:"#fbbf24","stroke-width":2,"data-row":-1}));
      if(m.label)out.push(klTxt(px+10,py-10,m.label,20,{fill:"#fde68a",bold:true}));
      if(m.xl)out.push(klTxt(px,oy+24,m.xl,17,{anchor:"middle",fill:"#fde68a"}));
      if(m.yl)out.push(klTxt(ox-10,py+6,m.yl,17,{anchor:"end",fill:"#fde68a"}));
    });
    return out;
  }
  function renderTimeline(b){
    var out=[],top=klTitle(out,b,KL_TOP),n=b.events.length,mid=Math.round(top+(476-top)/2),sp=KL_W/n;
    out.push(klLine(KL_X-4,mid,KL_X+KL_W+8,mid,"#cbd5e1",3));out.push(klHead(KL_X+KL_W+8,mid,0,"#cbd5e1"));
    var colours=["#38bdf8","#f472b6","#fbbf24","#34d399"],fs=n>5?16:18,max=Math.max(8,Math.floor((Math.min(2*sp,250)-14)/(fs*.47)));
    b.events.forEach(function(e,i){
      var x=KL_X+sp*(i+.5),up=i%2===0,lines=klWrap(e.text,max).slice(0,3),c=colours[i%4];
      out.push(klMk("circle",{cx:Math.round(x),cy:mid,r:7,fill:"none",stroke:c,"stroke-width":3,"data-row":i}));
      out.push(klLine(x,up?mid-9:mid+9,x,up?mid-30:mid+30,c,2,i));
      var dateY=up?mid-40-lines.length*(fs+4):mid+52;
      if(e.date)out.push(klTxt(x,dateY,e.date,fs+4,{anchor:"middle",fill:"#fbbf24",bold:true,row:i}));
      lines.forEach(function(ln,k){out.push(klTxt(x,dateY+(fs+4)*(k+1)+2,ln,fs,{anchor:"middle",row:i,max:Math.min(2*sp,250)-10}));});
    });
    return out;
  }
  function renderCode(b){
    var out=[],y=klTitle(out,b,KL_TOP),fs=b.code.length>12?17:20,lh=fs+9,cw=fs*.6,h=b.code.length*lh+18;
    out.push(klMk("rect",{x:KL_X,y:y,width:KL_W,height:Math.round(h),rx:10,fill:"none",stroke:"#334155","stroke-width":1.5,"data-row":-1}));
    var kw=/^(IF|ELSE|ELSEIF|ENDIF|FOR|NEXT|WHILE|ENDWHILE|REPEAT|UNTIL|CASE|ENDCASE|OTHERWISE|PROCEDURE|ENDPROCEDURE|FUNCTION|ENDFUNCTION|RETURN|DECLARE|CONSTANT|INPUT|OUTPUT|CALL|def|for|while|if|elif|else|return|print|input|function|var|let|const)\b/;
    b.code.forEach(function(l,i){
      var by=y+16+fs+i*lh;
      out.push(klTxt(KL_X+30,by,String(i+1),fs-3,{anchor:"end",fill:"#475569",cls:"klCode",row:i}));
      if(l.text)out.push(klTxt(KL_X+44+l.ind*cw,by,l.text,fs,{fill:/^(\/\/|#)/.test(l.text)?"#64748b":kw.test(l.text)?"#7dd3fc":"#e2e8f0",cls:"klCode",row:i,cw:.6,max:KL_W-56-l.ind*cw}));
    });
    return out;
  }
  function renderBoard(b){
    var f={table:renderTable,working:renderWorking,flow:renderFlow,graph:renderGraph,timeline:renderTimeline,code:renderCode}[b.kind]||renderPoints;
    return f(b).map(function(e){return e.outerHTML;}).join("");
  }
  function boardKey(b){return b&&b.kind==="table"&&b.title?b.title.toLowerCase().replace(/[^a-z0-9]+/g," ").trim():"";}
  function rowsSig(b){return b&&b.kind==="table"?b.rows.map(function(r){return JSON.stringify(r);}):[];}

  /* ---------------- board placement ----------------
     A step is moved as ONE block, so labels stay inside their boxes. It keeps the AI's
     position when that is free; otherwise it goes below what is already written; when
     the board is full, Knovo starts a fresh board (earlier boards come back on replay). */
  function klOverlap(a,b,pad){return a.x<b.x+b.width+pad&&a.x+a.width+pad>b.x&&a.y<b.y+b.height+pad&&a.y+a.height+pad>b.y;}
  function klVisibleGroups(except){
    var root=document.getElementById("klSteps");if(!root)return [];
    return Array.prototype.filter.call(root.children,function(x){return x!==except&&x.style.display!=="none";});
  }
  function klElementBoxes(groups){
    var out=[];groups.forEach(function(x){Array.prototype.forEach.call(x.children,function(el){var b=klBox(el);if(b&&(b.width||b.height))out.push(b);});});return out;
  }
  function klNewPage(keep){klVisibleGroups(keep).forEach(function(x){x.style.display="none";x.setAttribute("data-hidden","1");});}
  function placeGroup(g,meta){
    var others=klVisibleGroups(g);
    /* a statement/table built up over several steps is rewritten in place: only the new rows get written */
    var key=meta&&meta.key;
    if(key){
      g.setAttribute("data-board-key",key);g.setAttribute("data-rows",JSON.stringify(meta.rows||[]));
      var prev=null;for(var k=others.length-1;k>=0;k--){if(others[k].getAttribute("data-board-key")===key){prev=others[k];break;}}
      if(prev){
        var old=[];try{old=JSON.parse(prev.getAttribute("data-rows")||"[]");}catch(e){}
        var same=0;while(same<old.length&&same<meta.rows.length&&old[same]===meta.rows[same])same++;
        Array.prototype.forEach.call(g.children,function(el){var r=Number(el.getAttribute("data-row"));if(r<same){el.__klSkip=true;el.style.opacity="1";}});
        prev.style.display="none";prev.setAttribute("data-replaced","1");
        g.setAttribute("transform",prev.getAttribute("transform")||"");
        var rest=klVisibleGroups(g),mineNow=klElementBoxes([g]),obst=klElementBoxes(rest);
        var fits=mineNow.every(function(m){return m.y>=8&&m.y+m.height<=494;})&&!mineNow.some(function(m){return obst.some(function(o){return klOverlap(m,o,6);});});
        if(fits)return;
        g.removeAttribute("transform");others=rest;
      }
    }
    var bb;try{bb=g.getBBox();}catch(e){bb=null;}
    if(!bb||(!bb.width&&!bb.height))return;
    var s=Math.min(1,740/Math.max(1,bb.width),456/Math.max(1,bb.height));
    var left=bb.x*s,rightE=(bb.x+bb.width)*s,top=bb.y*s,bottom=(bb.y+bb.height)*s;
    var dx=left<20?20-left:rightE>780?780-rightE:0;
    var mine=klElementBoxes([g]).map(function(m){return {x:m.x*s,y:m.y*s,width:m.width*s,height:m.height*s};});
    var obst=klElementBoxes(others);
    function freeAt(dy){
      if(top+dy<14||bottom+dy>490)return false;
      return !mine.some(function(m){var t={x:m.x+dx,y:m.y+dy,width:m.width,height:m.height};return obst.some(function(o){return klOverlap(t,o,8);});});
    }
    var floor=obst.reduce(function(m,o){return Math.max(m,o.y+o.height);},0);
    var tries=[s===1?0:24-top,floor+24-top],dy=null;
    for(var t=0;t<tries.length;t++){if(freeAt(tries[t])){dy=tries[t];break;}}
    if(dy===null){
      if(others.length){klNewPage(g);if(L&&L.state==="teaching")setStatus("fresh board — step "+(L.step+1)+" of "+L.steps.length);}
      dy=(s===1&&top>=14&&bottom<=490)?0:24-top;
    }
    g.setAttribute("transform","translate("+Math.round(dx)+" "+Math.round(dy)+")"+(s<1?" scale("+s.toFixed(3)+")":""));
  }
  function cleanWhiteboardLayout(){
    var root=document.getElementById("klSteps");if(!root||!L)return;klSaveHistory();
    var gs=Array.prototype.filter.call(root.children,function(g){return g.getAttribute("data-replaced")!=="1";});
    gs.forEach(function(g){
      Array.prototype.forEach.call(g.children,function(el){if(el.getAttribute("data-kl-offset")==="1")klApplyOffset(el,0,0);});
      g.removeAttribute("transform");g.style.display="none";g.removeAttribute("data-hidden");
    });
    gs.forEach(function(g){g.style.display="";placeGroup(g,null);});
    setStatus("board tidied");
  }

  /* ---------------- timestamped lesson replay ---------------- */
  function lessonStepDuration(step){
    var voice=String(step.voice||""),speech=Math.min(60,1.8+voice.length*.06/(KV.prefs.rate||1)),draw=0;
    var scratch=document.createElementNS("http://www.w3.org/2000/svg","g");scratch.innerHTML=step.svgElements||"";
    Array.prototype.slice.call(scratch.children).forEach(function(el){
      if(el.tagName.toLowerCase()==="text")draw+=Math.max(.3,String(el.textContent||"").length*.042);
      else draw+=1.2;
    });
    return Math.max(4,speech,draw)+.7;
  }
  function buildLessonTimeline(){
    if(!L)return;var t=0;L.timeline=L.steps.map(function(step){var d=lessonStepDuration(step),item={start:t,end:t+d,duration:d};t+=d;return item;});
    L.totalTime=t;L.replayTime=0;updateReplayUI();
  }
  function fmtReplay(t){t=Math.max(0,Number(t)||0);var m=Math.floor(t/60),s=Math.floor(t%60);return m+":"+(s<10?"0":"")+s;}
  function updateReplayUI(){
    if(!L)return;var track=document.getElementById("klReplayTrack"),time=document.getElementById("klReplayTime");
    if(track){track.max=String(L.totalTime||0);track.value=String(Math.max(0,Math.min(L.totalTime||0,L.replayTime||0)));}
    if(time)time.textContent=fmtReplay(L.replayTime)+" / "+fmtReplay(L.totalTime);
  }
  function replayClock(){
    if(!L||L.state!=="teaching"||!L.timeline.length)return;
    var item=L.timeline[L.step],end=item?item.end:L.totalTime;
    L.replayTime=Math.min(end,(L.replayTime||0)+.2);updateReplayUI();
  }
  function klNewStepGroup(i){
    var g=document.createElementNS("http://www.w3.org/2000/svg","g");g.innerHTML=L.steps[i].svgElements||"";
    g.setAttribute("data-step",String(i));g.__klDrawn=false;
    if(L.steps[i].__ordered)g.setAttribute("data-ordered","1");
    Array.prototype.slice.call(g.children).forEach(function(el){el.style.opacity="0";el.__klFullText=el.textContent||"";klEnableDrag(el);});
    document.getElementById("klSteps").appendChild(g);placeGroup(g,L.steps[i].__meta);L.groups[i]=g;return g;
  }
  function klShowGroup(g){
    if(!g)return;g.__klDrawn=true;
    Array.prototype.slice.call(g.children).forEach(function(el){el.style.opacity="1";el.style.strokeDasharray=el.getAttribute("data-dash")||"none";el.style.strokeDashoffset="0";if(el.tagName.toLowerCase()==="text"&&el.__klFullText!=null)el.textContent=el.__klFullText;});
  }
  function klRevealGroup(g,elapsed){
    var els=Array.prototype.slice.call(g.children),shapes=els.filter(function(el){return el.tagName.toLowerCase()!=="text";}),labels=els.filter(function(el){return el.tagName.toLowerCase()==="text";}),at=0;
    var seq=(g.getAttribute("data-ordered")==="1"?els:shapes.concat(labels)).filter(function(el){return !el.__klSkip;});
    seq.forEach(function(el){
      var text=el.tagName.toLowerCase()==="text",len=0,dur;
      if(text)dur=Math.max(.3,String(el.__klFullText||"").length*.042);
      else{try{len=el.getTotalLength?el.getTotalLength():0;}catch(e){len=0;}dur=len?Math.min(2.4,Math.max(.65,len*.0032)):.05;}
      var local=elapsed-at;
      if(local>=dur){el.style.opacity="1";el.style.strokeDasharray=el.getAttribute("data-dash")||"none";el.style.strokeDashoffset="0";if(text)el.textContent=el.__klFullText||"";}
      else if(local>0){
        el.style.opacity="1";
        if(text){var full=el.__klFullText||"";el.textContent=full.slice(0,Math.max(1,Math.floor(full.length*local/dur)));}
        else if(len){el.style.strokeDasharray=String(len);el.style.strokeDashoffset=String(len*(1-local/dur));}
      }else el.style.opacity="0";
      at+=dur;
    });
  }
  function rebuildBoard(upto){
    var root=document.getElementById("klSteps");if(!root)return;
    root.innerHTML="";L.groups=[];L.history=[];
    for(var j=0;j<upto;j++)klShowGroup(klNewStepGroup(j));
  }
  /* Stop everything in flight (speech, timers, pending answers) before jumping somewhere new. */
  function haltForNav(){
    L.run++;L.askSeq++;KV.stop();clearTimeout(L.advT);clearTimeout(L.autoT);hideNote();L.afterQ=false;
  }
  function seekReplay(target){
    if(!L||!L.timeline.length)return;
    haltForNav();
    target=Math.max(0,Math.min(L.totalTime,Number(target)||0));
    var idx=L.timeline.length-1;for(var i=0;i<L.timeline.length;i++){if(target<L.timeline[i].end){idx=i;break;}}
    rebuildBoard(idx);
    var local=target-L.timeline[idx].start,current=klNewStepGroup(idx);klRevealGroup(current,local);
    var sents=L.steps[idx].__sent||[];
    L.step=idx;L.replayTime=target;L.state="paused";L.needsResume=true;L.stepSpoken=false;
    L.seekSentence=L.sentence=Math.max(0,Math.min(sents.length-1,Math.floor(local/L.timeline[idx].duration*sents.length)));
    if(sents.length)caption(sents,L.seekSentence);
    setStatus("replay paused at "+fmtReplay(target)+" — tap ▶ Play");updateReplayUI();updateControls();
  }
  function rewindReplay(seconds){if(!L||!L.timeline.length)return;seekReplay(Math.max(0,(L.replayTime||0)-seconds));}
  function goStep(i){
    if(!L||!L.steps.length)return;
    if(i>=L.steps.length){haltForNav();rebuildBoard(L.steps.length);finishLesson();return;}
    i=Math.max(0,i);
    haltForNav();rebuildBoard(i);playStep(i);
  }
  function replayStep(){
    if(!L||!L.steps.length)return;
    var i=Math.min(L.step,L.steps.length-1);
    haltForNav();
    var g=L.groups[i];if(g)g.remove();L.groups[i]=null;
    playStep(i);
  }

  /* ---------------- teaching loop ---------------- */
  function playStep(i,opts){
    if(!L)return;opts=opts||{};
    clearTimeout(L.advT);
    if(!L.steps[i]){finishLesson();return;}
    var run=++L.run;
    L.groups.forEach(function(g,k){if(g&&k!==i&&!g.__klDrawn)klShowGroup(g);}); /* finish any half-drawn step */
    L.step=i;L.state="teaching";L.needsResume=false;L.stepSpoken=false;L.afterQ=false;L.sentence=0;
    hideNote();
    if(L.timeline[i]){L.replayTime=L.timeline[i].start;updateReplayUI();}
    setStatus("teaching — step "+(i+1)+" of "+L.steps.length);
    var old=L.groups[i];if(old&&old.isConnected)old.remove();
    var g=klNewStepGroup(i);
    var pen=document.getElementById("klPen");if(pen)pen.style.opacity="1";
    animateGroup(g,run);
    updateControls();
    speakStep(i,0,opts.lead);
  }
  function speakStep(i,from,lead){
    if(!L||!L.steps[i])return;
    var run=L.run,st=L.steps[i],sents=st.__sent&&st.__sent.length?st.__sent:[stepLabel(st,i)+"."];
    from=Math.max(0,Math.min(sents.length-1,from||0));
    var leadList=lead?KV.sentences(lead):[],n=leadList.length,list=leadList.concat(sents.slice(from));
    KV.play(list,{
      onSentence:function(k){
        if(!L||L.run!==run)return;
        if(k<n){caption(list,k);return;}
        L.sentence=from+k-n;caption(sents,L.sentence);
      },
      onEnd:function(){if(!L||L.run!==run||L.state!=="teaching")return;L.stepSpoken=true;afterSpoken(run);}
    });
  }
  /* A real teacher finishes writing before moving on: wait (briefly) for the drawing. */
  function afterSpoken(run){
    var waited=0;
    (function check(){
      if(!L||L.run!==run||L.state!=="teaching")return;
      var g=L.groups[L.step];
      if(g&&g.isConnected&&!g.__klDrawn&&waited<6000){waited+=150;L.advT=setTimeout(check,150);return;}
      if(g&&!g.__klDrawn)klShowGroup(g);
      L.advT=setTimeout(function(){if(L&&L.run===run&&L.state==="teaching")playStep(L.step+1);},700);
    })();
  }
  function finishLesson(){
    if(!L)return;
    L.run++;KV.stop();clearTimeout(L.advT);
    L.step=Math.max(0,L.steps.length-1);L.state="done";L.afterQ=false;
    L.groups.forEach(function(g){if(g&&!g.__klDrawn)klShowGroup(g);});
    L.replayTime=L.totalTime;updateReplayUI();
    var pen=document.getElementById("klPen");if(pen)pen.style.opacity="0";
    setStatus("lesson complete — your turn");
    var sub=document.getElementById("klSub");
    if(sub)sub.innerHTML="<b>Knovo:</b> ✅ That's the lesson! Answer my check question below, ask me anything, or tap a step in the plan to revisit it.";
    logLine("sys","Lesson complete — answer the check question or ask anything.");
    updateControls();
    var q=document.getElementById("klQ");if(q&&window.innerWidth>=900)try{q.focus();}catch(e){}
  }
  function pauseLesson(msg){
    if(!L||L.state!=="teaching")return;
    L.state="paused";KV.pause();clearTimeout(L.advT);
    setStatus(msg||"paused — tap ▶ Play to continue");updateControls();
  }
  function togglePause(){
    if(!L||!L.steps.length)return;
    if(L.state==="teaching"){pauseLesson();return;}
    if(L.state==="done"){goStep(0);return;}
    if(L.state==="answering"||L.state==="waiting"||(L.state==="paused"&&L.afterQ)){resumeLesson();return;}
    if(L.state!=="paused")return;
    L.state="teaching";setStatus("teaching — step "+(L.step+1)+" of "+L.steps.length);
    if(L.needsResume){ /* resume after a rewind/seek: finish the board, speak from that point */
      L.needsResume=false;klShowGroup(L.groups[L.step]);updateControls();speakStep(L.step,L.seekSentence);return;
    }
    updateControls();
    if(L.stepSpoken){afterSpoken(L.run);return;}
    if(!KV.resume())speakStep(L.step,L.sentence);
  }
  var BRIDGES=["Okay, back to the board.","Right, where were we?","Great, let's carry on.","Alright, picking up where we left off.","Good. Now, back to it."];
  function resumeLesson(){
    if(!L||!L.steps.length)return;
    L.askSeq++;clearTimeout(L.autoT);clearTimeout(L.advT);hideNote();L.afterQ=false;
    if(L.state==="done"||L.wasDone){L.wasDone=false;L.state="done";KV.stop();updateControls();return;}
    var bridge=BRIDGES[Math.floor(Math.random()*BRIDGES.length)];
    L.state="teaching";updateControls();setStatus("teaching — step "+(L.step+1)+" of "+L.steps.length);
    if(L.stepSpoken){playStep(L.step+1,{lead:bridge});return;}
    var g=L.groups[L.step];
    if(!g||!g.isConnected){playStep(L.step,{lead:bridge});return;}
    if(L.needsResume){L.needsResume=false;klShowGroup(g);}
    speakStep(L.step,L.sentence,bridge);
  }

  /* ---------------- human-style drawing ----------------
     Shapes are traced with the pen riding the path, then labels are
     handwritten letter by letter. Drawing freezes while Knovo is paused
     or answering, and stops cleanly when the student jumps elsewhere. */
  function movePen(x,y){var pen=document.getElementById("klPen");if(pen)pen.setAttribute("transform","translate("+x+","+y+")");}
  function klAlive(g,run,force){return !!(L&&g.isConnected&&(force||L.run===run));}
  function klHalted(force){return !force&&!!L&&L.state!=="teaching";}
  function animateGroup(g,run,force){
    g.__klDrawn=false;
    var els=Array.prototype.slice.call(g.children);
    var shapes=els.filter(function(el){return el.tagName&&el.tagName.toLowerCase()!=="text";});
    var labels=els.filter(function(el){return el.tagName&&el.tagName.toLowerCase()==="text";});
    var seq=(g.getAttribute("data-ordered")==="1"?els:shapes.concat(labels)).filter(function(el){return !el.__klSkip;});
    (function next(k){
      if(!klAlive(g,run,force))return;
      if(k>=seq.length){g.__klDrawn=true;return;}
      if(klHalted(force)){setTimeout(function(){next(k);},150);return;}
      var el=seq[k],tag=el.tagName?el.tagName.toLowerCase():"";
      if(tag==="text")writeOnText(el,g,run,force,function(){next(k+1);});
      else drawShape(el,g,run,force,function(){next(k+1);});
    })(0);
  }
  function drawShape(el,g,run,force,done){
    var len=0;try{len=el.getTotalLength?el.getTotalLength():0;}catch(e){len=0;}
    if(!len||!isFinite(len)){el.style.opacity="1";done();return;}
    el.style.opacity="1";el.style.strokeDasharray=String(len);el.style.strokeDashoffset=String(len);
    var dur=Math.min(2400,Math.max(650,len*3.2)),t=0,last=null;
    function fr(ts){
      if(!klAlive(g,run,force))return;
      if(last===null)last=ts;var dt=Math.min(100,ts-last);last=ts;
      if(!klHalted(force))t+=dt;
      var p=Math.min(1,t/dur);
      el.style.strokeDashoffset=String(len*(1-p));
      try{var pt=el.getPointAtLength(len*p),ctm=el.getCTM&&el.getCTM();
        if(ctm)movePen(pt.x*ctm.a+pt.y*ctm.c+ctm.e,pt.x*ctm.b+pt.y*ctm.d+ctm.f);else movePen(pt.x,pt.y);}catch(e){}
      if(p<1)requestAnimationFrame(fr);
      else{el.style.strokeDasharray=el.getAttribute("data-dash")||"none";el.style.strokeDashoffset="0";done();}
    }
    requestAnimationFrame(fr);
  }
  function writeOnText(el,g,run,force,done){
    el.style.opacity="1";
    var full=el.__klFullText!=null?el.__klFullText:(el.textContent||"");el.textContent="";
    var x0=parseFloat(el.getAttribute("x"))||0,y0=parseFloat(el.getAttribute("y"))||0,i=0;
    (function stepFn(){
      if(!klAlive(g,run,force))return;
      if(klHalted(force)){setTimeout(stepFn,150);return;}
      if(i>=full.length){done();return;}
      i++;el.textContent=full.slice(0,i);
      try{var w=el.getComputedTextLength?el.getComputedTextLength():i*10;var ctm=el.getCTM&&el.getCTM();
        var px=x0+w+8,py=y0-8;if(ctm)movePen(px*ctm.a+py*ctm.c+ctm.e,px*ctm.b+py*ctm.d+ctm.f);else movePen(px,py);}catch(e){}
      setTimeout(stepFn,full[i-1]===" "?20:42); /* natural handwriting pace */
    })();
  }

  /* ---------------- raise hand: Q&A that remembers the lesson ---------------- */
  var RE_CONT=/^(ok(ay)?|ok then|got it|gotcha|yes|yeah|yep|sure|continue|carry on|go on|keep going|resume|proceed|makes sense|that makes sense|understood|i understand( now)?|i get it( now)?|go ahead|thanks?|thank you|cool|great|nice|alright|all right)([ ,]+(please|now|thanks|thank you|continue|carry on|go on|let'?s continue))*[ .!]*$/i;
  var RE_NEXT=/^(next( step)?|skip( this| it| ahead)?|move on|next one)( please)?[ .!]*$/i;
  var RE_BACK=/^(go back|back|previous( step)?|last step|go back a step)( please)?[ .!]*$/i;
  var RE_REPEAT=/^(can you )?(repeat( that| this| it| the step)?|again|say (that|it) again|once more|replay( that)?)( please)?[ .!?]*$/i;
  var RE_PAUSE=/^(pause|stop|wait|hold on|one sec(ond)?)[ .!]*$/i;
  function hideNote(){var n=document.getElementById("klNote");if(n)n.remove();}
  function boardText(){
    var root=document.getElementById("klSteps");if(!root)return "";
    var out=[];klVisibleGroups().forEach(function(g){Array.prototype.forEach.call(g.querySelectorAll("text"),function(t){out.push(t.__klFullText!=null?t.__klFullText:t.textContent);});});
    return out.filter(Boolean).join(" · ").replace(/\s+/g," ").slice(0,700);
  }
  function buildAskBody(q,wasDone){
    var st=L.steps[L.step]||{},n=L.steps.length;
    var plan=L.steps.map(function(s,i){return (i+1)+". "+stepLabel(s,i);}).join("\n");
    var said=(st.__sent||[]).slice(0,(L.sentence||0)+1).join(" ");
    var board=boardText();
    var ctx="LIVE LESSON CONTEXT — keep all of this in mind for every reply.\nLesson title: "+L.title+
      "\nWhat the student originally asked for: "+L.topic+
      (L.context?"\nEarlier chat with the student: "+L.context.slice(0,500):"")+
      "\nLesson plan:\n"+plan+"\n"+
      (wasDone?"Position: the lesson has finished. The final step (with the check question) was: "+st.voice
              :"Position: step "+(L.step+1)+" of "+n+" ("+stepLabel(st,L.step)+").\nThis step's full script: "+st.voice+"\nYou had just said: \""+said.slice(-400)+"\"")+
      (board?"\nWritten on the board so far: "+board:"");
    var contents=[{role:"user",parts:[{text:ctx}]},
      {role:"model",parts:[{text:JSON.stringify({say:"Got it. I'm teaching "+L.title+" and I'm at "+(wasDone?"the end of the lesson":"step "+(L.step+1))+". I'll answer in that context and remember what we discuss.",board:"",action:"wait"})}]}];
    L.chat.forEach(function(m){contents.push({role:m.role,parts:[{text:m.role==="model"?JSON.stringify({say:m.text,board:"",action:"wait"}):m.text}]});});
    contents.push({role:"user",parts:[{text:q}]});
    /* "lesson_qa" counts against the chat allowance; the updated server also asks Gemini for strict JSON */
    return {mode:"lesson_qa",systemInstruction:{parts:[{text:TUTOR_SYS}]},contents:contents};
  }
  function cleanSay(s){
    return String(s||"").replace(/```[\s\S]*?```/g," ").replace(/\*\*|__|`/g,"").replace(/^#{1,6}\s+/gm,"")
      .replace(/^\s*(?:[-*•]|\d+[.)])\s+/gm,"").replace(/\s+/g," ").trim().slice(0,900);
  }
  function parseAnswer(txt){
    var t=String(txt||"").replace(/```(?:json|JSON)?/g,"").trim(),o=null,a=t.indexOf("{"),b=t.lastIndexOf("}");
    if(a>=0&&b>a){try{o=JSON.parse(t.slice(a,b+1));}catch(e){try{o=JSON.parse(repairJSON(t.slice(a)).text);}catch(e2){o=null;}}}
    var say="";
    if(o&&typeof o==="object")say=String(o.say||o.answer||o.reply||o.text||"");
    if(!say&&a>=0){var m=/"say"\s*:\s*"((?:[^"\\]|\\.)*)/.exec(t);if(m){try{say=JSON.parse("\""+m[1]+"\"");}catch(e){say=m[1];}}}
    if(!say)say=o?"":t; /* the model answered in plain prose */
    var act=String(o&&o.action||"wait").toLowerCase().replace(/[^a-z]/g,"");
    if(!/^(resume|repeat|next|back|wait)$/.test(act))act="wait";
    return {say:cleanSay(say)||"Good question — could you put it another way so I can be sure I answer exactly what you mean?",board:o?answerBoard(o.board||o.svg):null,action:act};
  }
  function showThinking(q){
    hideNote();
    var stage=document.getElementById("klStage");if(!stage)return;
    var n=document.createElement("div");n.className="klSay";n.id="klNote";
    n.innerHTML="<span class='klSayAv'>✦</span><button class='klSayX' title='Close'>✕</button><b>You asked</b><span class='klSayQ'></span><span class='klThinking'><i></i><i></i><i></i> Knovo is thinking</span>";
    n.querySelector(".klSayQ").textContent=q;
    n.querySelector(".klSayX").onclick=hideNote;
    stage.appendChild(n);
  }
  function showSay(list){
    hideNote();
    var stage=document.getElementById("klStage");if(!stage)return;
    var n=document.createElement("div");n.className="klSay";n.id="klNote";
    n.innerHTML="<span class='klSayAv'>✦</span><button class='klSayX' title='Close'>✕</button><b>Knovo answers</b><span class='klSayTxt'></span>";
    var box=n.querySelector(".klSayTxt");
    list.forEach(function(s,i){var sp=document.createElement("span");sp.className="klSaySent";sp.setAttribute("data-k",i);sp.textContent=s+" ";box.appendChild(sp);});
    n.querySelector(".klSayX").onclick=hideNote;
    stage.appendChild(n);
  }
  function highlightSay(k){
    var n=document.getElementById("klNote");if(!n)return;
    Array.prototype.forEach.call(n.querySelectorAll(".klSaySent"),function(sp){var i=Number(sp.getAttribute("data-k"));sp.classList.toggle("now",i===k);sp.classList.toggle("said",i<k);});
  }
  function answerBoard(b){
    if(b&&typeof b==="object"){var nb=normBoard(b);return nb?{svg:renderBoard(nb),ordered:true}:null;}
    var svg=sanitizeSVG(String(b||""));return svg?{svg:svg,ordered:false}:null;
  }
  function drawAnswerSketch(ab){
    var root=document.getElementById("klSteps");if(!root||!ab||!ab.svg)return;
    var g=document.createElementNS("http://www.w3.org/2000/svg","g");g.setAttribute("data-answer","1");g.innerHTML=ab.svg;
    if(ab.ordered)g.setAttribute("data-ordered","1");
    Array.prototype.slice.call(g.children).forEach(function(el){el.style.opacity="0";el.__klFullText=el.textContent||"";klEnableDrag(el);});
    root.appendChild(g);placeGroup(g,null);animateGroup(g,L.run,true);
  }
  async function askQuestion(override){
    if(!L)return;
    var inp=document.getElementById("klQ");
    var q=String(override!=null?override:(inp?inp.value:"")).replace(/\s+/g," ").trim().slice(0,500);
    if(!q)return;
    if(L.state==="setup"){var ti=document.getElementById("klTopicIn");if(ti)ti.value=q;if(inp)inp.value="";beginFromStart();return;}
    if(!L.steps.length){if(window.toast)toast(L.state==="error"?"The lesson didn't start — tap ↻ Try again first.":"One moment — Knovo is still preparing the board.");return;}
    if(inp)inp.value="";
    var st=L.state;
    /* quick spoken-style commands are handled instantly, no server round trip */
    if(st!=="done"){
      if(RE_PAUSE.test(q)){pauseLesson();return;}
      if(RE_REPEAT.test(q)){replayStep();return;}
      if(RE_NEXT.test(q)){goStep(L.step+1);return;}
      if(RE_BACK.test(q)){goStep(L.step-1);return;}
      if(RE_CONT.test(q)){if(st!=="teaching")resumeLesson();return;}
    }
    var wasDone=st==="done"||(L.wasDone&&(st==="answering"||st==="waiting"));
    clearTimeout(L.advT);clearTimeout(L.autoT);KV.stop(); /* raise hand: freeze the lesson where it is */
    L.wasDone=wasDone;L.state="answering";L.afterQ=true;updateControls();
    logLine("you",q);
    var ask=++L.askSeq,tagged=(wasDone?"Student (after the lesson): ":"Student (raising hand at step "+(L.step+1)+"): ")+q;
    showThinking(q);setStatus("thinking about your question…");
    var sub=document.getElementById("klSub");if(sub)sub.innerHTML="<b>Knovo:</b> ✋ Good question — give me a second…";
    var res=await liveFetch(buildAskBody(tagged,wasDone),75000);
    if(!L||ask!==L.askSeq)return;
    if(res.auth){sessionExpired();return;}
    var say,board=null,action="wait",ok=false;
    if(res.limit){
      say="You've used today's Knovo credits"+(res.msLeft?" — they refill in "+fmtWait(res.msLeft):"")+". The lesson itself can keep going, so tap Continue whenever you're ready.";
    }else if(res.error){
      say="Sorry, I couldn't reach my notes just then. Tap Ask to try that question again, or Continue to carry on with the lesson.";
      if(inp&&!inp.value)inp.value=q;
    }else{
      var pr=parseAnswer(res.text);say=pr.say;board=pr.board;action=pr.action;ok=true;
      L.chat.push({role:"user",text:tagged},{role:"model",text:say});
      if(L.chat.length>24)L.chat=L.chat.slice(-24);
    }
    var item=logLine("knovo",say);if(item&&!ok)item.classList.add("err");
    if(board)drawAnswerSketch(board);
    var list=KV.sentences(say);if(!list.length)list=[say];
    showSay(list);setStatus("answering your question");
    KV.play(list,{
      onSentence:function(k){if(!L||ask!==L.askSeq)return;highlightSay(k);caption(list,k);},
      onEnd:function(){
        if(!L||ask!==L.askSeq)return;
        highlightSay(list.length);
        if(L.wasDone){
          L.state="done";L.afterQ=false;L.wasDone=false;updateControls();setStatus("lesson complete — ask anything else");
          if(sub)sub.innerHTML="<b>Knovo:</b> Ask me something else, or tap a step in the plan to revisit it.";return;
        }
        if(ok&&action==="resume"){L.autoT=setTimeout(function(){if(L&&ask===L.askSeq)resumeLesson();},900);return;}
        if(ok&&action==="repeat"){L.autoT=setTimeout(function(){if(L&&ask===L.askSeq)replayStep();},700);return;}
        if(ok&&action==="next"){L.autoT=setTimeout(function(){if(L&&ask===L.askSeq)goStep(L.step+1);},700);return;}
        if(ok&&action==="back"){L.autoT=setTimeout(function(){if(L&&ask===L.askSeq)goStep(L.step-1);},700);return;}
        L.state="waiting";updateControls();setStatus("your turn — ask a follow-up or continue");
        if(sub)sub.innerHTML="<b>Knovo:</b> Does that help? Ask a follow-up, or tap <b>▶ Continue lesson</b> and I'll pick up where we left off.";
      }
    });
  }
  function micAsk(){
    if(!L)return;
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){if(window.toast)toast("Voice input isn't supported in this browser — type your question instead.");return;}
    if(L.rec){try{L.rec.stop();}catch(e){}return;} /* second tap = done talking */
    var wasTeaching=L.state==="teaching";
    if(wasTeaching)pauseLesson("listening…");else KV.pause();
    var rec=new SR(),inp=document.getElementById("klQ"),btn=document.getElementById("klMic"),heard=false,fin="";
    rec.lang=(navigator.language&&/^en/i.test(navigator.language))?navigator.language:"en-GB";
    rec.interimResults=true;rec.maxAlternatives=1;rec.continuous=false;
    L.rec=rec;if(btn)btn.classList.add("on");setStatus("listening — ask your question");
    rec.onresult=function(e){var interim="";for(var i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)fin+=e.results[i][0].transcript;else interim+=e.results[i][0].transcript;}if(inp)inp.value=(fin+" "+interim).trim();heard=true;};
    rec.onerror=function(ev){
      if(ev.error==="not-allowed"||ev.error==="service-not-allowed"){if(window.toast)toast("Microphone access is blocked — allow it in your browser, or type your question.");}
      else if(ev.error!=="aborted"&&ev.error!=="no-speech"){if(window.toast)toast("Couldn't hear that — try again or type your question.");}
    };
    rec.onend=function(){
      if(!L)return;L.rec=null;if(btn)btn.classList.remove("on");
      if(heard&&inp&&inp.value.trim())askQuestion();
      else setStatus(L.state==="paused"?"paused — tap ▶ Play to continue":"ready");
    };
    try{rec.start();}catch(e){L.rec=null;if(btn)btn.classList.remove("on");}
  }

  /* ---------------- voice & speed settings ---------------- */
  function initVoicePanel(){
    var btn=document.getElementById("klVoiceBtn"),panel=document.getElementById("klVoicePanel"),sel=document.getElementById("klVoiceSel"),
        rate=document.getElementById("klRate"),rv=document.getElementById("klRateVal"),mute=document.getElementById("klMute"),test=document.getElementById("klVoiceTest");
    if(!btn||!panel)return;
    function fill(){
      if(!document.getElementById("klVoiceSel"))return;
      var vs=KV.voices(),cur=KV.best();sel.innerHTML="";
      if(!vs.length){sel.innerHTML="<option>Browser default voice</option>";sel.disabled=true;return;}
      sel.disabled=false;
      vs.forEach(function(v){var o=document.createElement("option");o.value=v.name;o.textContent=v.name.replace(/^(Microsoft|Google) /,"")+" · "+v.lang+(/(Natural|Neural)/i.test(v.name)?" ★":"");if(cur&&v.name===cur.name)o.selected=true;sel.appendChild(o);});
    }
    fill();setTimeout(fill,600);
    try{if(KV.supported)speechSynthesis.addEventListener("voiceschanged",fill);}catch(e){}
    rate.value=String(KV.prefs.rate);rv.textContent=Number(KV.prefs.rate).toFixed(2)+"×";mute.checked=KV.prefs.muted;
    btn.onclick=function(){panel.hidden=!panel.hidden;btn.setAttribute("aria-expanded",panel.hidden?"false":"true");if(!panel.hidden)fill();};
    sel.onchange=function(){KV.prefs.voice=sel.value;KV.save();};
    rate.oninput=function(){KV.prefs.rate=Number(rate.value)||1;rv.textContent=KV.prefs.rate.toFixed(2)+"×";KV.save();};
    mute.onchange=function(){KV.prefs.muted=mute.checked;KV.save();};
    test.onclick=function(){if(L&&L.state==="teaching")pauseLesson("paused for a voice test — tap ▶ Play to continue");KV.play("Hi, I'm Knovo. This is how I'll sound in your lesson.",{});};
    if(!KV.supported){btn.title="This browser has no speech voice — captions will guide the lesson";mute.checked=true;mute.disabled=true;}
  }

  document.addEventListener("keydown",function(e){
    if(!L||!document.getElementById("knovoLiveModal"))return;
    var t=e.target;if(t&&(/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName)||t.isContentEditable))return;
    if(e.key===" "||e.code==="Space"){e.preventDefault();togglePause();}
  });

})();
