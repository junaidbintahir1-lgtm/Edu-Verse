/* EduVerse home hero: animated slideshow + real Earth (WebGL) + floating knowledge cards + ticker + stats.
   Earth imagery in /tex is Blue Marble style NASA imagery (see HANDOFF.md for the licence note). */
(function(){
"use strict";
var EV=window.EV,$=EV.$,$$=EV.$$,esc=EV.esc,ST=EV.ST;
var DEG=Math.PI/180;

/* =====================================================================
   Content pools (every item is real, checkable science or a sourced quote)
   ===================================================================== */
var FORMULAS=[
 {id:'emc',l:'Mass–energy equivalence',h:'<i>E</i> = <i>mc</i><sup>2</sup>',fs:2.5},
 {id:'fma',l:'Newton\'s second law',h:'<i>F</i> = <i>ma</i>',fs:2.5},
 {id:'vir',l:'Ohm\'s law',h:'<i>V</i> = <i>IR</i>',fs:2.5},
 {id:'suv',l:'Equation of motion',h:'<i>v</i> = <i>u</i> + <i>at</i>',fs:2.2},
 {id:'pv',l:'Ideal gas equation',h:'<i>PV</i> = <i>nRT</i>',fs:2.3},
 {id:'pyt',l:'Pythagoras\' theorem',h:'<i>a</i><sup>2</sup> + <i>b</i><sup>2</sup> = <i>c</i><sup>2</sup>',fs:2},
 {id:'qd',l:'Quadratic formula',h:'<i>x</i> = (−<i>b</i> ± √(<i>b</i><sup>2</sup> − 4<i>ac</i>)) ⁄ 2<i>a</i>',fs:1.5},
 {id:'trg',l:'Trigonometric identity',h:'sin<sup>2</sup><i>θ</i> + cos<sup>2</sup><i>θ</i> = 1',fs:1.9},
 {id:'wv',l:'Wave equation',h:'<i>v</i> = <i>fλ</i>',fs:2.5},
 {id:'shc',l:'Thermal energy change',h:'<i>Q</i> = <i>mc</i>Δ<i>θ</i>',fs:2.3},
 {id:'ph',l:'pH of a solution',h:'pH = −log<sub>10</sub>[H<sup>+</sup>]',fs:2},
 {id:'mol',l:'Amount of substance',h:'<i>n</i> = <i>m</i> ÷ <i>M</i><sub>r</sub>',fs:2.2},
 {id:'cir',l:'Area of a circle',h:'<i>A</i> = π<i>r</i><sup>2</sup>',fs:2.4},
 {id:'dif',l:'Power rule for <i>y</i> = <i>x</i><sup><i>n</i></sup>',h:'d<i>y</i>⁄d<i>x</i> = <i>nx</i><sup><i>n</i>−1</sup>',fs:2}
];
var CHEMS=[
 {id:'ps',l:'Photosynthesis',h:'6CO<sub>2</sub> + 6H<sub>2</sub>O → C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> + 6O<sub>2</sub>',fs:1.2},
 {id:'h2o',l:'Formation of water',h:'2H<sub>2</sub> + O<sub>2</sub> → 2H<sub>2</sub>O',fs:1.5},
 {id:'ch4',l:'Combustion of methane',h:'CH<sub>4</sub> + 2O<sub>2</sub> → CO<sub>2</sub> + 2H<sub>2</sub>O',fs:1.35},
 {id:'neu',l:'Neutralisation',h:'HCl + NaOH → NaCl + H<sub>2</sub>O',fs:1.5},
 {id:'cu',l:'Electrolysis at the cathode',h:'Cu<sup>2+</sup> + 2e<sup>−</sup> → Cu',fs:1.7},
 {id:'cac',l:'Thermal decomposition',h:'CaCO<sub>3</sub> → CaO + CO<sub>2</sub>',fs:1.7},
 {id:'res',l:'Aerobic respiration',h:'C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> + 6O<sub>2</sub> → 6CO<sub>2</sub> + 6H<sub>2</sub>O',fs:1.2},
 {id:'hab',l:'Haber process',h:'N<sub>2</sub> + 3H<sub>2</sub> ⇌ 2NH<sub>3</sub>',fs:1.7},
 {id:'mg',l:'Metal and acid',h:'Mg + 2HCl → MgCl<sub>2</sub> + H<sub>2</sub>',fs:1.5}
];
var QUOTES=[
 {id:'q1',q:'One child, one teacher, one book and one pen can change the world.',a:'Malala Yousafzai',s:'UN speech, 2013'},
 {id:'q2',q:'Education is the most powerful weapon which you can use to change the world.',a:'Nelson Mandela',s:'2003'},
 {id:'q3',q:'If I have seen further it is by standing on the shoulders of Giants.',a:'Isaac Newton',s:'Letter, 1675'},
 {id:'q4',q:'Imagination is more important than knowledge.',a:'Albert Einstein',s:'Interview, 1929'},
 {id:'q5',q:'The first principle is that you must not fool yourself — and you are the easiest person to fool.',a:'Richard Feynman',s:'Caltech, 1974'}
];
var FACTS=[
 {id:'f1',h:'Sunlight takes about <b>8 min 20 s</b> to reach Earth.',t:'Space'},
 {id:'f2',h:'About <b>71%</b> of Earth\'s surface is covered by water.',t:'Earth'},
 {id:'f3',h:'Earth\'s circumference at the equator is about <b>40,075 km</b>.',t:'Earth'},
 {id:'f4',h:'Earth spins at about <b>1,670 km/h</b> at the equator.',t:'Earth'},
 {id:'f5',h:'Air is about <b>78%</b> nitrogen and <b>21%</b> oxygen.',t:'Chemistry'},
 {id:'f6',h:'Light travels at <b>299,792,458 m/s</b> in a vacuum.',t:'Physics'},
 {id:'f7',h:'Absolute zero is <b>−273.15 °C</b>, or 0 kelvin.',t:'Physics'},
 {id:'f8',h:'The human genome has about <b>3 billion</b> base pairs.',t:'Biology'},
 {id:'f9',h:'One mole is <b>6.022 × 10<sup>23</sup></b> particles.',t:'Chemistry'},
 {id:'f10',h:'Water is densest at about <b>4 °C</b>.',t:'Physics'},
 {id:'f11',h:'Diamond and graphite are both made of pure <b>carbon</b>.',t:'Chemistry'}
];
var ELEMENTS=[
 {id:'Fe',n:26,name:'Iron',m:'55.8'},{id:'Au',n:79,name:'Gold',m:'197.0'},{id:'C',n:6,name:'Carbon',m:'12.0'},
 {id:'Cu',n:29,name:'Copper',m:'63.5'},{id:'O',n:8,name:'Oxygen',m:'16.0'},{id:'Na',n:11,name:'Sodium',m:'23.0'},
 {id:'He',n:2,name:'Helium',m:'4.0'},{id:'Ca',n:20,name:'Calcium',m:'40.1'}
];
var WORDS=[];   /* filled from the site's own command-word table */

/* region the camera drifts to on each slide (lat, lon in degrees) */
var REGIONS=[{lat:26,lon:72,n:'South Asia'},{lat:42,lon:8,n:'Europe and the UK'},{lat:12,lon:34,n:'Africa and the Middle East'},{lat:20,lon:106,n:'East and Southeast Asia'}];

/* =====================================================================
   Markup
   ===================================================================== */
function words(str){
  var i=0;
  return str.split(' ').map(function(tok){var em=/\*/.test(tok),t=tok.replace(/\*/g,'');return '<span class="w'+(em?' em':'')+'" style="--i:'+(i++)+'"><span>'+esc(t)+'</span></span>';}).join(' ');
}
EV.heroHTML=function(st){
  var name=ST.profile?ST.profile.name:'future achiever';
  var S=[
   {k:'01',l:'Learn',acc:'#f0b429',acc2:'#ffd98a',h:'Your whole *syllabus*, in orbit.',p:'Short notes, full study books and flashcards for '+st.subjN+' subjects across Cambridge and Pearson Edexcel. Core revision is free with an account.',c:[['gold','#qualifications','Choose your qualification'],['','#papers','Browse papers']]},
   {k:'02',l:'Ask Knovo',acc:'#2fe0cd',acc2:'#a6f7ee',h:'Ask Knovo, get *unstuck.*',p:'Knovo reads the notes for the subject you are on, marks your answers, solves photographed questions and turns any explanation into flashcards.',c:[['tealfill','#knovo','Try Knovo'],['','',' See Pro plans','data-plans']]},
   {k:'03',l:'Practise',acc:'#f0b429',acc2:'#ffd98a',h:'Sit the paper before the *paper*.',p:'Timed mocks with a live countdown, '+st.pdfN+' PDF resources and yearly papers with worked mark schemes. Every miss goes to your notebook.',c:[['gold','#mock','Sit a timed mock'],['','#papers','Open papers']]},
   {k:'04',l:'Improve',acc:'#2fe0cd',acc2:'#a6f7ee',h:'Win a little, *every day.*',p:'A daily quiz, flip-card revision, streaks and XP turn ten minutes a day into steady progress, and show exactly where you stand.',c:[['gold','#dashboard','Open my dashboard'],['','#ranks','See the ranks']]}
  ];
  var h='<section class="hero2" id="hero2" aria-label="EduVerse introduction"><h1 class="sr">EduVerse: Cambridge and Pearson Edexcel revision</h1><div class="in h2grid">'+
  '<div class="h2copy"><div class="h2top"><span class="h2live"><i aria-hidden="true"></i>Cambridge · Pearson Edexcel</span><span class="greet">'+esc(EV.greeting())+', '+esc(name)+'.</span></div>'+
  '<div class="slides" id="slides" role="group" aria-roledescription="carousel" aria-label="What EduVerse offers">'+
  S.map(function(s,i){return '<article class="slide'+(i?'':' on')+'" data-i="'+i+'" role="group" aria-roledescription="slide" aria-label="'+(i+1)+' of '+S.length+'" style="--acc:'+s.acc+';--acc2:'+s.acc2+'"'+(i?' inert':'')+'><span class="sk"><b>'+s.k+'</b>'+esc(s.l)+'</span><h2 class="sh">'+words(s.h)+'</h2><p class="sp">'+esc(s.p)+'</p><div class="sc">'+s.c.map(function(b){return b[1]?'<a class="btn '+b[0]+'" href="'+b[1]+'">'+esc(b[2])+'</a>':'<button class="btn '+b[0]+'" type="button" '+b[3]+'>'+esc(b[2].trim())+'</button>';}).join('')+'</div></article>';}).join('')+'</div>'+
  '<div class="h2ask"><form class="ask" id="heroAsk" autocomplete="off"><img src="assets/knovo-logo.png" alt="Knovo"><label for="heroQ" class="sr">Ask Knovo</label><input id="heroQ" placeholder="Ask Knovo about any topic"><button type="submit">Ask</button></form>'+
  '<div class="chips"><button type="button" data-ask="Mark my answer: I will paste a question and my answer next.">Mark my answer</button><button type="button" data-ask="Make 5 flashcards on moments for Physics 5054.">Make flashcards</button><button type="button" data-ask="Explain electrolysis like I\'m revising tonight.">Explain a topic</button><button type="button" data-ask="Plan my revision for the next 4 weeks. Ask me my subjects and exam dates first.">Plan my revision</button></div></div>'+
  '<div class="sctl" role="group" aria-label="Slideshow controls"><div class="segs">'+S.map(function(s,i){return '<button class="hseg'+(i?'':' on')+'" type="button" data-go="'+i+'" style="--acc:'+s.acc+'" aria-label="Slide '+(i+1)+': '+esc(s.l)+'"'+(i?'':' aria-current="true"')+'><span class="n">'+s.k+'</span><span class="l">'+esc(s.l)+'</span><i class="fill"></i></button>';}).join('')+'</div>'+
  '<div class="arrows"><button type="button" data-prev aria-label="Previous slide">‹</button><button type="button" data-play aria-label="Pause slideshow"><span class="pp" aria-hidden="true"></span></button><button type="button" data-next aria-label="Next slide">›</button></div></div></div>'+
  '<div class="stage" id="stage" aria-hidden="true"><div class="earthCss"><i></i></div><div class="cards" id="cards"></div><a class="kchip" href="#knovo" tabindex="-1" title="Open Knovo"><img src="assets/knovo-logo.png" alt=""></a><div class="hud"><span class="hudPin" aria-hidden="true"></span><span id="hudTxt">Earth · viewing South Asia</span><em class="dragHint" id="dragHint">Drag to rotate</em></div></div></div></section>';
  return h;
};
EV.tickerHTML=function(st){
  var items=[];
  FORMULAS.forEach(function(f){items.push('<span class="tk f"><span class="fm">'+f.h+'</span></span>');});
  CHEMS.slice(0,6).forEach(function(f){items.push('<span class="tk c">'+f.h+'</span>');});
  FACTS.forEach(function(f){items.push('<span class="tk k"><em>'+esc(f.t)+'</em>'+f.h+'</span>');});
  var codes=EV.SUBJ.filter(function(o){return !o.soon}).slice(0,12).map(function(o){return '<span class="tk s"><span class="code">'+esc(o.s.code.split(' / ').pop())+'</span>'+esc(o.s.name)+'</span>';});
  /* interleave the lists so formulas, facts and subjects alternate */
  var out=[],n=Math.max(items.length,codes.length);for(var i=0;i<n;i++){if(items[i])out.push(items[i]);if(codes[i]&&i%2===0)out.push(codes[i]);}
  var one=out.join('');
  return '<div class="ticker" aria-hidden="true"><div class="tkTrack" style="--tkd:'+Math.round(out.length*3.2)+'s">'+one+one+'</div></div>';
};
EV.statsHTML=function(st){
  var d=[[st.subjN,'subjects','across Cambridge and Pearson Edexcel'],[st.pdfN,'PDF resources','study books, papers and mocks'],[st.cardN,'flashcards','with four levels of recall'],[st.notesN,'notes sections','short and expanded editions']];
  return '<div class="statsBand"><div class="in"><div class="sbGrid">'+d.map(function(x){return '<div class="sbi"><b data-count="'+x[0]+'">'+x[0]+'</b><span>'+esc(x[1])+'</span><small>'+esc(x[2])+'</small></div>';}).join('')+'</div></div></div>';
};
EV.countUps=function(root){
  if(!root)return function(){};
  var els=$$('[data-count]',root);if(!els.length)return function(){};
  var done=false;
  function run(){if(done)return;done=true;els.forEach(function(el){var to=+el.dataset.count,t0=performance.now(),dur=1400;if(EV.reduce){el.textContent=to;return;}
    (function step(now){var p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,3);el.textContent=Math.round(to*e);if(p<1)requestAnimationFrame(step);else el.textContent=to;})(t0);});}
  if(!('IntersectionObserver' in window))return function(){};
  var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){run();io.disconnect();}},{threshold:.4});io.observe(root);
  return function(){io.disconnect();};
};

/* =====================================================================
   Floating knowledge cards
   ===================================================================== */
/* a = angle in degrees around the Earth (0 = right, -90 = up), d = distance in Earth radii, w/h = base size in px */
var SLOTS=[
 {a:-152,d:1.16,w:262,h:128,dep:16,types:['formula','chem'],bd:7.4},
 {a:-32,d:1.22,w:236,h:112,dep:22,types:['fact','stat'],bd:8.6},
 {a:12,d:1.34,w:262,h:150,dep:12,types:['quote'],bd:9.2,special:true},
 {a:112,d:1.2,w:236,h:112,dep:20,types:['chem','formula'],bd:8},
 {a:164,d:1.34,w:226,h:112,dep:10,types:['element','word'],bd:7},
 {a:-96,d:1.3,w:226,h:112,dep:14,types:['fact','word'],bd:9.6}
];
var TYPEHUE={formula:'#f0b429',chem:'#2fe0cd',quote:'#eceee8',fact:'#8ec5ff',stat:'#f0b429',element:'#f0b429',word:'#2fe0cd',knovo:'#2fe0cd',mock:'#f0b429',streak:'#f0b429'};
var TYPELABEL={formula:'Formula',chem:'Equation',quote:'Quote',fact:'Did you know',stat:'On EduVerse',element:'Element',word:'Exam command word',knovo:'Knovo · example',mock:'Timed mock',streak:'Your progress'};

function Cards(host,stats){
  var slots=[],timers=[],used={},counters={};
  var pools={formula:FORMULAS,chem:CHEMS,quote:QUOTES,fact:FACTS,element:ELEMENTS,word:WORDS,stat:stats};
  Object.keys(pools).forEach(function(k){counters[k]=Math.floor(Math.random()*pools[k].length);});
  function render(type,it){
    var l=TYPELABEL[type],sub='',body='',fs=1;
    if(type==='formula'||type==='chem'){sub=it.l;body='<div class="'+(type==='formula'?'fm':'ch')+'">'+it.h+'</div>';fs=it.fs;}
    else if(type==='quote'){sub=it.a+' · '+it.s;body='<div class="qt"><span class="qm" aria-hidden="true">“</span>'+esc(it.q)+'</div>';fs=.9;}
    else if(type==='fact'){sub=it.t;body='<div class="fa">'+it.h+'</div>';fs=1;}
    else if(type==='element'){body='<div class="el"><div class="et"><small>'+it.n+'</small><b>'+it.id+'</b></div><div class="ei"><b>'+it.name+'</b><span>Atomic mass '+it.m+'</span></div></div>';fs=1;}
    else if(type==='word'){body='<div class="wd"><b>'+esc(it.w)+'</b><span>'+esc(it.m)+'</span></div>';fs=1;}
    else if(type==='stat'){body='<div class="st"><b>'+it.v+'</b><span>'+esc(it.l)+'</span></div>';fs=1;}
    return {label:l,cap:sub,body:body,fs:fs};
  }
  function fit(cb,fs){
    var base=16*fs;cb.style.fontSize=base+'px';var s=base,guard=0;
    while((cb.scrollHeight>cb.clientHeight+1||cb.scrollWidth>cb.clientWidth+1)&&s>9&&guard++<40){s*=.93;cb.style.fontSize=s.toFixed(1)+'px';}
  }
  function pick(slot){
    var types=slot.sp.types;
    for(var tries=0;tries<types.length*2;tries++){
      var type=types[slot.ti++%types.length],pool=pools[type];if(!pool||!pool.length)continue;
      for(var k=0;k<pool.length;k++){var it=pool[(counters[type]++)%pool.length],key=type+':'+(it.id||it.w||it.l);if(!used[key]){return {type:type,it:it,key:key};}}
    }
    return null;
  }
  function paint(slot,res,instant){
    var inner=slot.inner;
    function put(){
      if(slot.key)delete used[slot.key];slot.key=res.key||null;if(res.key)used[res.key]=1;
      slot.el.dataset.t=res.type;slot.el.style.setProperty('--ca',TYPEHUE[res.type]||'#f0b429');
      var r=res.html?{label:res.label,cap:res.sub||'',body:res.html,fs:res.fs||1}:render(res.type,res.it);
      inner.innerHTML='<span class="cl"><i aria-hidden="true"></i>'+esc(r.label)+'</span><div class="cb">'+r.body+'</div>'+(r.cap?'<div class="cap">'+r.cap+'</div>':'');
      var cb=inner.querySelector('.cb');fit(cb,r.fs);inner.classList.remove('swap');
      if(res.after)res.after(inner);
    }
    if(instant||EV.reduce){put();return;}
    inner.classList.add('swap');setTimeout(put,300);
  }
  function rotate(slot){if(slot.hold||!slot.el.isConnected)return;var r=pick(slot);if(r)paint(slot,r,false);}
  SLOTS.forEach(function(sp,i){
    var el=document.createElement('div');el.className='cd hide';el.style.setProperty('--d',sp.dep);el.style.width=sp.w+'px';el.style.height=sp.h+'px';
    var inner=document.createElement('div');inner.className='cdi';inner.style.setProperty('--bd',sp.bd+'s');inner.style.setProperty('--bl',(-i*1.3)+'s');el.appendChild(inner);host.appendChild(el);
    var slot={sp:sp,el:el,inner:inner,ti:i%sp.types.length,key:null,hold:false};slots.push(slot);
    paint(slot,pick(slot)||{type:'fact',it:FACTS[0],key:'x'+i},true);
    if(!EV.reduce)timers.push(setInterval(function(){rotate(slot);},7200+i*900));
  });
  /* give a slide its own card */
  this.special=function(res){var s=slots[2];if(!res){s.hold=false;rotate(s);return;}s.hold=true;paint(s,res,false);};
  this.layout=function(g){
    var scale=Math.max(.56,Math.min(1,g.W/760)),maxShow=g.W<560?2:99,shown=0;
    var placed=[{x:g.hud.x,y:g.hud.y,w:g.hud.w,h:g.hud.h}],pad=10;
    slots.forEach(function(s){
      var sp=s.sp,w=sp.w*scale,h=sp.h*scale;
      var cx=g.cx+Math.cos(sp.a*DEG)*g.R*sp.d,cy=g.cy+Math.sin(sp.a*DEG)*g.R*sp.d*.92;
      var x=Math.max(8,Math.min(g.W-w-8,cx-w/2)),y=Math.max(8,Math.min(g.H-h-8,cy-h/2));
      var hit=false;for(var k=0;k<placed.length;k++){var p=placed[k];if(x<p.x+p.w+pad&&x+w+pad>p.x&&y<p.y+p.h+pad&&y+h+pad>p.y){hit=true;break;}}
      if(shown>=maxShow)hit=true;
      s.el.style.left=x.toFixed(1)+'px';s.el.style.top=y.toFixed(1)+'px';s.el.style.setProperty('--cs',scale.toFixed(3));
      s.el.classList.toggle('hide',hit);if(!hit){placed.push({x:x,y:y,w:w,h:h});shown++;}
    });
  };
  this.destroy=function(){timers.forEach(clearInterval);host.innerHTML='';};
}

/* =====================================================================
   Earth (WebGL)
   ===================================================================== */
var SUN=[.85,.28,.5];
var EARTH_V='varying vec2 vUv;varying vec3 vN;varying vec3 vP;void main(){vUv=uv;vN=normalize(mat3(modelMatrix)*normal);vec4 wp=modelMatrix*vec4(position,1.0);vP=wp.xyz;gl_Position=projectionMatrix*viewMatrix*wp;}';
var EARTH_F=[
'precision highp float;uniform sampler2D uDay,uLights,uWater,uClouds;uniform vec3 uSun,uCam;uniform float uTime;varying vec2 vUv;varying vec3 vN;varying vec3 vP;',
'void main(){',
' vec3 n=normalize(vN);vec3 v=normalize(uCam-vP);float ndl=dot(n,uSun);',
' vec3 day=texture2D(uDay,vUv).rgb;float lum=dot(day,vec3(.299,.587,.114));day=mix(vec3(lum),day,1.14);',
' float dayAmt=smoothstep(-0.10,0.22,ndl);',
' vec3 col=day*(0.02+1.08*pow(max(ndl,0.0),0.62));',
' float cl=texture2D(uClouds,vUv+vec2(0.0035,-0.0025)).r;',
' col*=1.0-0.30*cl*dayAmt;',
' float wat=texture2D(uWater,vUv).r;vec3 hv=normalize(uSun+v);',
' float spec=pow(max(dot(n,hv),0.0),70.0)*wat*smoothstep(0.0,0.25,ndl);col+=vec3(1.0,0.92,0.78)*spec*0.6;',
' float nightAmt=1.0-smoothstep(-0.10,0.14,ndl);',
' float L=texture2D(uLights,vUv).r;col+=vec3(1.0,0.74,0.40)*pow(L,0.62)*3.4*nightAmt*(1.0-0.8*cl);',
' col+=day*vec3(0.50,0.68,1.0)*0.07*nightAmt;',
' float tw=smoothstep(-0.16,0.0,ndl)*(1.0-smoothstep(0.0,0.20,ndl));col+=vec3(1.0,0.45,0.20)*tw*0.20*(0.4+lum);',
' float fr=pow(1.0-max(dot(n,v),0.0),3.0);col+=vec3(0.26,0.56,1.0)*fr*(0.10+0.90*clamp(ndl+0.35,0.0,1.0))*0.95;',
' gl_FragColor=vec4(col,1.0);}'
].join('\n');
var CLOUD_F=[
'precision highp float;uniform sampler2D uClouds;uniform vec3 uSun;varying vec2 vUv;varying vec3 vN;varying vec3 vP;',
'void main(){vec3 n=normalize(vN);float c=texture2D(uClouds,vUv).r;c=smoothstep(0.10,0.80,c);',
' float ndl=dot(n,uSun);float lit=pow(max(ndl,0.0),0.58);float lim=smoothstep(-0.12,0.22,ndl);',
' vec3 col=vec3(0.96,0.975,1.0)*(0.05+1.0*lit);gl_FragColor=vec4(col,c*(0.18+0.66*lim));}'
].join('\n');
var ATMO_V='varying vec3 vNv;varying vec3 vNw;void main(){vNv=normalize(normalMatrix*normal);vNw=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
var ATMO_F='precision highp float;uniform vec3 uSun;varying vec3 vNv;varying vec3 vNw;void main(){float i=pow(clamp(0.74-dot(vNv,vec3(0.0,0.0,1.0)),0.0,1.0),3.2);float s=0.30+0.70*smoothstep(-0.45,0.55,dot(vNw,uSun));vec3 c=mix(vec3(0.20,0.50,1.0),vec3(0.35,0.85,1.0),smoothstep(0.0,0.7,i));gl_FragColor=vec4(c*i*s*1.75,i*s);}';

function glowTexture(inner,outer){
  var c=document.createElement('canvas');c.width=c.height=256;var x=c.getContext('2d'),g=x.createRadialGradient(128,128,0,128,128,128);
  g.addColorStop(0,inner);g.addColorStop(1,outer);x.fillStyle=g;x.fillRect(0,0,256,256);return new THREE.CanvasTexture(c);
}

function mountEarth(stage,onReady,hooks){
  if(typeof THREE==='undefined')return null;
  var probe=document.createElement('canvas');if(!(probe.getContext('webgl')||probe.getContext('experimental-webgl')))return null;
  var renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}catch(e){return null;}
  var coarse=window.matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,coarse?1.5:2));
  renderer.domElement.setAttribute('aria-hidden','true');
  stage.insertBefore(renderer.domElement,stage.firstChild);
  var scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(28,1,.1,400);
  var ER=1.6,root=new THREE.Group(),tilt=new THREE.Group(),spin=new THREE.Group();
  scene.add(root);root.add(tilt);tilt.add(spin);
  var sun=new THREE.Vector3(SUN[0],SUN[1],SUN[2]).normalize();

  /* stars */
  var SN=1100,sp=new Float32Array(SN*3),sc=new Float32Array(SN*3);
  for(var i=0;i<SN;i++){var v=new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(60+Math.random()*80);sp[i*3]=v.x;sp[i*3+1]=v.y;sp[i*3+2]=v.z;var b=.35+Math.random()*.65,w=Math.random();sc[i*3]=b*(w<.2?1:.8);sc[i*3+1]=b*(w<.2?.9:.88);sc[i*3+2]=b;}
  var sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sp,3));sg.setAttribute('color',new THREE.BufferAttribute(sc,3));
  var stars=new THREE.Points(sg,new THREE.PointsMaterial({size:1.5,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.85,depthWrite:false}));scene.add(stars);

  /* warm sunrise glow behind the planet, upper right */
  var halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture('rgba(255,214,150,.85)','rgba(255,150,60,0)'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.55}));
  halo.scale.set(9,9,1);halo.position.set(3.6,2.3,-4.5);scene.add(halo);
  var blue=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture('rgba(60,140,255,.55)','rgba(30,90,200,0)'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.5}));
  blue.scale.set(7.4,7.4,1);blue.position.set(0,0,-1.2);root.add(blue);

  /* Knovo's orbit */
  var ringG=new THREE.Group();ringG.rotation.set(1.18,0,-.42);root.add(ringG);
  var pts=[];for(var q=0;q<=200;q++){var a=q/200*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*2.0,0,Math.sin(a)*2.0));}
  ringG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x2fe0cd,transparent:true,opacity:.34})));
  var ringSpin=new THREE.Group();ringG.add(ringSpin);var chipAnchor=new THREE.Object3D();chipAnchor.position.set(2.0,0,0);ringSpin.add(chipAnchor);

  var loader=new THREE.TextureLoader(),maxAniso=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  var names=['day','lights','water','clouds'],tex={},loaded=0,failed=false;
  names.forEach(function(n){tex[n]=loader.load('tex/earth_'+n+'.jpg',function(){if(++loaded===names.length&&!failed)build();},undefined,function(){failed=true;if(hooks&&hooks.fail)hooks.fail();});tex[n].anisotropy=maxAniso;});

  var earthMat,cloudMat,atmoMat,clouds,earth,atmo,builtOk=false;
  function build(){
    earthMat=new THREE.ShaderMaterial({vertexShader:EARTH_V,fragmentShader:EARTH_F,uniforms:{uDay:{value:tex.day},uLights:{value:tex.lights},uWater:{value:tex.water},uClouds:{value:tex.clouds},uSun:{value:sun},uCam:{value:camera.position},uTime:{value:0}}});
    earth=new THREE.Mesh(new THREE.SphereGeometry(ER,96,96),earthMat);spin.add(earth);
    cloudMat=new THREE.ShaderMaterial({vertexShader:EARTH_V,fragmentShader:CLOUD_F,transparent:true,depthWrite:false,uniforms:{uClouds:{value:tex.clouds},uSun:{value:sun}}});
    clouds=new THREE.Mesh(new THREE.SphereGeometry(ER*1.011,96,96),cloudMat);tilt.add(clouds);
    atmoMat=new THREE.ShaderMaterial({vertexShader:ATMO_V,fragmentShader:ATMO_F,transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false,uniforms:{uSun:{value:sun}}});
    atmo=new THREE.Mesh(new THREE.SphereGeometry(ER*1.085,64,64),atmoMat);root.add(atmo);
    builtOk=true;resize();onReady();
  }

  /* camera framing: the globe is d px wide, centred in the stage */
  var G={W:0,H:0,d:0};
  function resize(){
    var W=stage.clientWidth,H=stage.clientHeight;if(!W||!H)return;
    renderer.setSize(W,H,false);camera.aspect=W/H;camera.updateProjectionMatrix();
    var d=hooks.diameter(W,H),k=d*Math.tan(14*DEG)/H,D=ER*Math.sqrt(1+1/(k*k));
    camera.position.set(0,0,D);camera.lookAt(0,0,0);G.W=W;G.H=H;G.d=d;
  }
  /* view state */
  var lat=22,latT=22,lonBase=0,lonBaseT=0,spinAcc=0,vLon=0,vLat=0,dragging=false,lastX=0,lastY=0,idleAt=0,focusI=0,t0=performance.now(),last=t0,visible=true,alive=true,seeded=false;
  function wrap(a){a=((a+180)%360+360)%360-180;return a;}
  function setFocus(i){focusI=i;var r=REGIONS[i];latT=r.lat*0.85;lonBaseT=r.lon+spinAcc;lonBaseT=lonBase+wrap(lonBaseT-lonBase);idleAt=0;if(!seeded){lonBase=lonBaseT;lat=latT;seeded=true;}}
  setFocus(0);

  function down(e){if(e.button!==undefined&&e.button!==0)return;dragging=true;stage.classList.add('drag');lastX=e.clientX;lastY=e.clientY;vLon=vLat=0;try{stage.setPointerCapture(e.pointerId);}catch(x){}if(hooks.dragged)hooks.dragged();}
  function move(e){
    if(e.pointerType==='mouse'&&hooks.mouse)hooks.mouse(e);
    if(!dragging)return;var dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;
    var k=57.3/Math.max(120,G.d/2);vLon=-dx*k;vLat=dy*k*.6;lonBase+=vLon;lonBaseT=lonBase;latT=Math.max(-50,Math.min(60,latT+vLat));lat=latT;
  }
  function up(e){if(!dragging)return;dragging=false;stage.classList.remove('drag');idleAt=performance.now()+4500;try{stage.releasePointerCapture(e.pointerId);}catch(x){}}
  stage.addEventListener('pointerdown',down);stage.addEventListener('pointermove',move);stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);
  stage.addEventListener('pointerleave',function(){if(hooks.leave)hooks.leave();});

  var io=null;if('IntersectionObserver' in window){io=new IntersectionObserver(function(es){visible=es[0].isIntersecting;});io.observe(stage);}
  var ro=null;if('ResizeObserver' in window){ro=new ResizeObserver(function(){resize();if(hooks.layout)hooks.layout(G);});ro.observe(stage);}else window.addEventListener('resize',resize);

  var ca=new THREE.Vector3(),cp=new THREE.Vector3(),cc=new THREE.Vector3(),dv=new THREE.Vector3(),pr=new THREE.Vector3();
  function occluded(p){dv.copy(p).sub(camera.position);var t=cc.copy(root.position).sub(camera.position).dot(dv)/dv.dot(dv);if(t<=0||t>=1)return false;cp.copy(camera.position).addScaledVector(dv,t);return cp.distanceTo(root.position)<ER*.97;}
  function frame(now){
    if(!alive)return;requestAnimationFrame(frame);
    if(!builtOk||!visible||document.hidden){last=now;return;}
    var dt=Math.min(.05,(now-last)/1000);last=now;
    if(!EV.reduce){spinAcc+=dt*.9;}
    if(!dragging){
      if(Math.abs(vLon)>.01||Math.abs(vLat)>.01){lonBase+=vLon;vLon*=.94;latT=Math.max(-50,Math.min(60,latT+vLat));vLat*=.94;lonBaseT=lonBase;lat=latT;}
      else if(now>idleAt){var e=1-Math.pow(.0009,dt);lonBase+=wrap(lonBaseT-lonBase)*e;lat+=(latT-lat)*e;}
    }
    var lon=lonBase-spinAcc;
    spin.rotation.y=-Math.PI/2-lon*DEG;tilt.rotation.x=lat*DEG;tilt.rotation.z=-.30;
    if(clouds)clouds.rotation.y=spin.rotation.y+spinAcc*DEG*.12;
    ringSpin.rotation.y=-(now-t0)/1000*.22;stars.rotation.y=(now-t0)/1000*.002;
    earthMat.uniforms.uTime.value=(now-t0)/1000;
    renderer.render(scene,camera);
    /* project the Knovo chip */
    if(hooks.chip){chipAnchor.getWorldPosition(ca);pr.copy(ca).project(camera);var x=(pr.x*.5+.5)*G.W,y=(-pr.y*.5+.5)*G.H,hid=occluded(ca);hooks.chip(x,y,hid,(ca.z+3)/6);}
  }
  requestAnimationFrame(frame);
  if(EV.reduce){/* one still frame */}
  return {setFocus:setFocus,resize:function(){resize();},hint:function(){return dragging;},destroy:function(){
    alive=false;if(io)io.disconnect();if(ro)ro.disconnect();else window.removeEventListener('resize',resize);
    stage.removeEventListener('pointerdown',down);stage.removeEventListener('pointermove',move);stage.removeEventListener('pointerup',up);stage.removeEventListener('pointercancel',up);
    scene.traverse(function(o){if(o.geometry)o.geometry.dispose();if(o.material){if(o.material.map)o.material.map.dispose();o.material.dispose();}});
    names.forEach(function(n){if(tex[n])tex[n].dispose();});renderer.dispose();if(renderer.domElement.parentNode)renderer.domElement.parentNode.removeChild(renderer.domElement);},
    ready:function(){return builtOk;},geom:function(){return G;}};
}

/* =====================================================================
   Mount: ties the slideshow, the Earth and the cards together
   ===================================================================== */
EV.mountHero=function(root,st){
  if(!root)return function(){};
  /* command words from the site's own table */
  if(!WORDS.length&&EV.D&&EV.D.extra)EV.D.extra.commands.forEach(function(r){WORDS.push({w:r[0],m:r[1]});});
  var stage=$('#stage',root),cardsHost=$('#cards',root),chip=$('.kchip',root),hud=$('.hud',root),hudTxt=$('#hudTxt',root),hint=$('#dragHint',root);
  var slides=$$('.slide',root),segs=$$('.hseg',root),n=slides.length,cur=0,holdUser=EV.reduce,hover=false,timers=[];
  var dur=8.5;root.style.setProperty('--dur',dur+'s');
  var stats=[{v:st.subjN,l:'subjects, ready to study',id:'s1'},{v:st.cardN,l:'flashcards, four levels',id:'s2'},{v:st.pdfN,l:'PDF study resources',id:'s3'},{v:st.qN,l:'questions with answers',id:'s4'}];
  var cards=new Cards(cardsHost,stats);

  /* ---- slides ---- */
  var playBtn=$('[data-play]',root);
  function paintPlay(){var paused=holdUser;playBtn.setAttribute('aria-label',paused?'Play slideshow':'Pause slideshow');playBtn.classList.toggle('is-paused',paused);root.classList.toggle('paused',holdUser||hover);}
  function specialFor(i){
    if(i===1)return {type:'knovo',label:'Knovo · example',sub:'',fs:1,key:'sp-knovo',html:'<div class="kc"><div class="bu u">Why does copper form at the cathode?</div><div class="bu a"><img src="assets/knovo-logo.png" alt=""><span class="bt">Cu<sup>2+</sup> gains electrons there: Cu<sup>2+</sup> + 2e<sup>−</sup> → Cu</span></div></div>'};
    if(i===2)return {type:'mock',label:'Timed mock · example',sub:'Physics 5054 · Paper 2',fs:1,key:'sp-mock',html:'<div class="mk"><b class="mkClock">1:15:00</b><span>Auto-submits at zero</span></div>',after:function(inner){var c=inner.querySelector('.mkClock');if(!c)return;var s=4500;clearInterval(cards._mk);cards._mk=setInterval(function(){if(!c.isConnected){clearInterval(cards._mk);return;}s=s<=0?4500:s-1;var h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;c.textContent=h+':'+String(m).padStart(2,'0')+':'+String(x).padStart(2,'0');},1000);}};
    if(i===3){var sn=ST.streak.count||0,xpS=EV.shownXP?EV.shownXP():ST.xp,lv=EV.level(xpS);return {type:'streak',label:'Your progress',sub:'',fs:1,key:'sp-streak',html:'<div class="sk2"><div><b>'+sn+'</b><span>day streak</span></div><div><b>Lv '+lv+'</b><span>'+xpS+' XP</span></div></div>'};}
    return null;
  }
  function go(i,user){
    i=(i+n)%n;if(i===cur&&!user)return;
    var prev=slides[cur];prev.classList.remove('on');prev.classList.add('out');prev.setAttribute('inert','');
    setTimeout(function(){prev.classList.remove('out');},700);
    cur=i;var s=slides[cur];s.classList.add('on');s.removeAttribute('inert');
    segs.forEach(function(g,k){g.classList.toggle('on',k===cur);g.classList.toggle('done',k<cur);if(k===cur)g.setAttribute('aria-current','true');else g.removeAttribute('aria-current');
      var f=g.querySelector('.fill');f.style.animation='none';void f.offsetWidth;f.style.animation='';});
    if(earth)earth.setFocus(cur);hudTxt.textContent='Earth · viewing '+REGIONS[cur].n;
    clearInterval(cards._mk);cards.special(specialFor(cur));
  }
  segs.forEach(function(g){g.addEventListener('click',function(){go(+g.dataset.go,true);});
    var f=g.querySelector('.fill');f.addEventListener('animationend',function(){if(g.classList.contains('on')&&!holdUser&&!hover)go(cur+1);});});
  $('[data-next]',root).addEventListener('click',function(){go(cur+1,true);});
  $('[data-prev]',root).addEventListener('click',function(){go(cur-1,true);});
  playBtn.addEventListener('click',function(){holdUser=!holdUser;paintPlay();if(!holdUser){/* restart the bar so the slide gets its full time */var g=segs[cur],f=g.querySelector('.fill');f.style.animation='none';void f.offsetWidth;f.style.animation='';}});
  var copy=$('.h2copy',root);
  /* hold the slideshow while a mouse is over the text or a keyboard user is focused inside it; a touch tap must never leave it stuck */
  copy.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse'){hover=true;paintPlay();}});
  copy.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse'){hover=false;paintPlay();}});
  copy.addEventListener('focusin',function(e){var t=e.target;if(t&&t.matches&&t.matches(':focus-visible')){hover=true;paintPlay();}});
  copy.addEventListener('focusout',function(){hover=false;paintPlay();});
  copy.addEventListener('keydown',function(e){var t=e.target;if(t.closest&&t.closest('.sctl')){if(e.key==='ArrowRight'){e.preventDefault();go(cur+1,true);}if(e.key==='ArrowLeft'){e.preventDefault();go(cur-1,true);}}});
  var sx=0,sy=0,sl=$('#slides',root);
  sl.addEventListener('touchstart',function(e){sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true});
  sl.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.4)go(cur+(dx<0?1:-1),true);},{passive:true});
  paintPlay();

  /* ---- geometry shared by the Earth, the cards and the CSS fallback ---- */
  function diameter(W,H){var k=W<560?.78:.66;return Math.max(220,Math.min(W*k,H*(W<560?.8:.74),640));}
  var earth=null,glow=!!stage;
  function geometry(){
    var W=stage.clientWidth,H=stage.clientHeight,d=diameter(W,H),cx=W/2,cy=H/2;
    stage.style.setProperty('--ex',cx);stage.style.setProperty('--ey',cy);stage.style.setProperty('--ed',d);
    var hw=hud.offsetWidth,hh=hud.offsetHeight;
    return {W:W,H:H,cx:cx,cy:cy,R:d/2,hud:{x:hud.offsetLeft,y:hud.offsetTop,w:hw,h:hh}};
  }
  function layout(){cards.layout(geometry());}
  var rafL=0;function layoutSoon(){cancelAnimationFrame(rafL);rafL=requestAnimationFrame(layout);}
  var ro2=null;if('ResizeObserver' in window){ro2=new ResizeObserver(layoutSoon);ro2.observe(stage);}else window.addEventListener('resize',layoutSoon);
  layout();

  /* ---- Earth ---- */
  var dragSeen=false;
  earth=mountEarth(stage,function(){stage.classList.add('ready');layout();},{
    diameter:diameter,layout:function(){layoutSoon();},
    fail:function(){stage.classList.add('nogl');},
    dragged:function(){if(!dragSeen){dragSeen=true;hint.classList.add('gone');}},
    mouse:function(e){var r=stage.getBoundingClientRect();stage.style.setProperty('--mx',((e.clientX-r.left)/r.width*2-1).toFixed(3));stage.style.setProperty('--my',((e.clientY-r.top)/r.height*2-1).toFixed(3));},
    leave:function(){stage.style.setProperty('--mx',0);stage.style.setProperty('--my',0);},
    chip:function(x,y,hid,depth){chip.style.transform='translate3d('+(x-18).toFixed(1)+'px,'+(y-18).toFixed(1)+'px,0)';chip.style.opacity=hid?'0':'1';chip.style.pointerEvents=hid?'none':'auto';}
  });
  if(!earth){stage.classList.add('nogl');}
  if(earth)earth.setFocus(0);
  if(!window.matchMedia('(pointer: fine)').matches)hint.classList.add('gone');
  var cu=EV.countUps($('.statsBand'));
  return function(){clearInterval(cards._mk);cards.destroy();if(earth)earth.destroy();if(ro2)ro2.disconnect();else window.removeEventListener('resize',layoutSoon);cancelAnimationFrame(rafL);cu();};
};
})();
