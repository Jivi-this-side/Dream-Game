const $ = s => document.querySelector(s);
const lerp = (a,b,t)=>a+(b-a)*t;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease = t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const rand=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const C = h=>new THREE.Color(h);
const grayOf = h=>{const c=C(h);const l=.299*c.r+.587*c.g+.114*c.b;return new THREE.Color(l,l,l);};
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

const SCENES=[
{ key:'paper', num:'I', en:'SKETCH', move:'roll',
  skyM:['#fbfbf8','#e9e7e0'], skyC:['#fdf2e0','#f5dcc0'],
  ui:'#26241f', uiBright:false,
  fragNeed:14, speed:22, fogN:34, fogF:230,
  accents:['#c95d3f','#3e6fae','#d9a441','#5d8f6a'],
  fragColor:'#d9a441', trail:'#d9a441',
  root:57, chord:[0,3,7,14], scale:[0,3,5,7,10],
  poems:[
    'Everthing starts with a sketch',
    'every line is a street you almost took',
    'color is memory, arriving',
    'speed becomes color'],
  words:['a window light','the last bus','wet newspaper','an open umbrella','an unsent letter']
},
{ key:'rain', num:'II', en:'BARISH', move:'roll',
  skyM:['#101216','#181b21'], skyC:['#070f2e','#1c3c7e'],
  ui:'#dce6f5', uiBright:true,
  fragNeed:16, speed:27, fogN:26, fogF:200,
  accents:['#54d6ff','#ff5fa8','#ffd166'],
  fragColor:'#54d6ff', trail:'#54d6ff',
  root:50, chord:[0,3,7,10,14], scale:[0,3,5,7,10],
  poems:[
    'the rain knows your name',
    'blue is the speed of missing someone',
    'headlights write letters no one reads',
    'run until the night forgives you'],
  words:['neon in a puddle','cold coffee','a voicemail','the 2 a.m. radio','a lit window','wet asphalt']
},
{ 
  key: 'desert', 
  num: 'III', 
  en: 'GARDEN DESERT', 
  move: 'roll',
  skyM: ['#38bdf8', '#bae6fd'], 
  skyC: ['#ff8fae', '#fef08a'], 
  ui: '#1c1917', 
  uiBright: false,              
  fragNeed: 16, 
  speed: 30, 
  fogN: 20, 
  fogF: 320,                   
  accents: ['#e11d48', '#16a34a', '#fb923c'], 
  fragColor: '#e11d48', 
  trail: '#ff4d6d',
  root: 53, 
  chord: [0, 4, 7, 11, 14], 
  scale: [0, 2, 4, 7, 9],
  poems: [
    'the garden blooms beneath the open sky',
    'birds drift on warm desert breeze',
    'sunlight tracing paths through blooming petals',
    'even the sand learns to bloom'
  ],
  words: ['rose petal', 'blue sky', 'sunlight', 'green leaf', 'flying bird', 'oasis']
},
{ 
  key: 'sky', 
  num: 'V', 
  en: 'SPACE REACH', 
  move: 'fly',
  skyM: ['#030712', '#0f172a'], 
  skyC: ['#38bdf8', '#ff8fae'], 
  ui: '#f0f9ff', 
  uiBright: true,
  fragNeed: 16, 
  speed: 34, 
  fogN: 50, 
  fogF: 400,                  
  accents: ['#38bdf8', '#ff8fae', '#fef08a'], 
  fragColor: '#38bdf8', 
  trail: '#7dd3fc',
  root: 60, 
  chord: [0, 5, 7, 12, 16], 
  scale: [0, 2, 4, 7, 9],
  poems: [
    'clouds soften into stardust at the edge of space',
    'drifting above the atmosphere where silence lives',
    'stars breathe in the shadow of the cosmos',
    'speed bends the light of distant worlds'
  ],
  words: ['stardust', 'cosmic wind', 'nebula bloom', 'zero gravity', 'open space', 'orbit']
},
{ key:'white', num:'VI', en:'THE WHITE ROOM', move:'roll',
  skyM:['#ffffff','#f5f5f2'], skyC:['#ffffff','#f5f5f2'],
  ui:'#15140f', uiBright:false,
  fragNeed:9, speed:28, fogN:40, fogF:320, flat:true,
  accents:['#15140f'],
  fragColor:'#15140f', trail:'#bfbcb2',
  root:57, chord:[0,7,12,19], scale:[0,2,4,7,9],
  poems:[
    'almost awake',
    'keep only the lines',
    'the dream folds itself flat'],
  words:['a heartbeat','your name','morning light','silence','the road']
}];
const COLLAPSE_POEM='the dream forgets its depth';


const renderer = new THREE.WebGLRenderer({canvas:$('#gl'),antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,900);
const LOOK = new THREE.Vector3(0,1.2,-6);
const BASE_DIST = 14;
const BASE_FOV = 62;
function doResize(){
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
}
addEventListener('resize',doResize);
addEventListener('orientationchange',()=>{setTimeout(doResize,260);});

const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;
  const g=c.getContext('2d');const r=g.createRadialGradient(32,32,0,32,32,32);
  r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.4,'rgba(255,255,255,.45)');
  r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);
  const t=new THREE.CanvasTexture(c);return t;})();



let sceneIdx=0, S=SCENES[0];
let progress=0;
let state='attract';          
let speed=24, time=0, dreamTime=0;
let worldGroup=null;
let movers=[], updaters=[], colorables=[], fadables=[], frags=[], bursts=[];
let shownPoems=new Set(), collapsedThisScene=false;
let totalFrags=0, comboT=0, combo=0, pickupCount=0;
let carX=0, steer=0, steerV=0;
let spawnTimer=0;
let collapse={t:0,target:0,hold:0};
let boostActive=false, boostT=0;
let runPhase=0;


const AU={ctx:null,master:null,pad:[],filter:null,delay:null,muted:false,noise:null};
const m2f=m=>440*Math.pow(2,(m-69)/12);
function audioInit(){
  if(AU.ctx)return;
  const ctx=new (window.AudioContext||window.webkitAudioContext)();
  AU.ctx=ctx;
  AU.master=ctx.createGain();AU.master.gain.value=.0;AU.master.connect(ctx.destination);
  AU.filter=ctx.createBiquadFilter();AU.filter.type='lowpass';AU.filter.frequency.value=520;AU.filter.Q.value=.6;
  AU.filter.connect(AU.master);
  AU.delay=ctx.createDelay(1);AU.delay.delayTime.value=.42;
  const fb=ctx.createGain();fb.gain.value=.42;
  AU.delay.connect(fb);fb.connect(AU.delay);
  const wet=ctx.createGain();wet.gain.value=.4;
  AU.delay.connect(wet);wet.connect(AU.master);
  AU.delaySend=ctx.createGain();AU.delaySend.gain.value=1;AU.delaySend.connect(AU.delay);
  AU.master.gain.linearRampToValueAtTime(.5,ctx.currentTime+3);
  startPad();
}
function startPad(){
  stopPad();
  const ctx=AU.ctx;if(!ctx)return;
  const notes=S.chord.map(o=>m2f(S.root+o));
  notes.forEach((f,i)=>{
    [0,1].forEach(k=>{
      const o=ctx.createOscillator();o.type=k?'triangle':'sine';
      o.frequency.value=f*(k?.5:1);o.detune.value=rand(-6,6);
      const g=ctx.createGain();g.gain.value=0;
      g.gain.linearRampToValueAtTime(.05/(i*.4+1),ctx.currentTime+rand(3,6));
      o.connect(g);g.connect(AU.filter);o.start();
      AU.pad.push({o,g});
    });
  });
  if(S.key==='rain'&&!AU.noise){
    const len=AU.ctx.sampleRate*2,buf=AU.ctx.createBuffer(1,len,AU.ctx.sampleRate);
    const d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
    const src=AU.ctx.createBufferSource();src.buffer=buf;src.loop=true;
    const lp=AU.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;
    const g=AU.ctx.createGain();g.gain.value=0;g.gain.linearRampToValueAtTime(.035,AU.ctx.currentTime+4);
    src.connect(lp);lp.connect(g);g.connect(AU.master);src.start();
    AU.noise={src,g};
  } else if(S.key!=='rain'&&AU.noise){
    AU.noise.g.gain.linearRampToValueAtTime(0,AU.ctx.currentTime+2);
    const n=AU.noise;setTimeout(()=>{try{n.src.stop()}catch(e){}},2500);AU.noise=null;
  }
}
function stopPad(){
  AU.pad.forEach(p=>{try{p.g.gain.linearRampToValueAtTime(0,AU.ctx.currentTime+1.4);
    setTimeout(()=>{try{p.o.stop()}catch(e){}},1800);}catch(e){}});
  AU.pad=[];
}
function pluck(idx){
  if(!AU.ctx||AU.muted)return;
  const ctx=AU.ctx;
  const deg=S.scale[idx%S.scale.length]+12*Math.floor(idx/S.scale.length);
  const f=m2f(S.root+24+deg);
  const o=ctx.createOscillator();o.type='triangle';o.frequency.value=f;
  const g=ctx.createGain();g.gain.setValueAtTime(.22,ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(.0008,ctx.currentTime+.9);
  o.connect(g);g.connect(AU.master);g.connect(AU.delaySend);
  o.start();o.stop(ctx.currentTime+1);
  const o2=ctx.createOscillator();o2.type='sine';o2.frequency.value=f*2;
  const g2=ctx.createGain();g2.gain.setValueAtTime(.06,ctx.currentTime);
  g2.gain.exponentialRampToValueAtTime(.0008,ctx.currentTime+.5);
  o2.connect(g2);g2.connect(AU.delaySend);o2.start();o2.stop(ctx.currentTime+.6);
}
function riser(){
  if(!AU.ctx)return;const ctx=AU.ctx;
  const len=ctx.sampleRate*2,buf=ctx.createBuffer(1,len,ctx.sampleRate);
  const d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(i/len);
  const src=ctx.createBufferSource();src.buffer=buf;
  const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.Q.value=1.4;
  bp.frequency.setValueAtTime(220,ctx.currentTime);
  bp.frequency.exponentialRampToValueAtTime(3200,ctx.currentTime+1.9);
  const g=ctx.createGain();g.gain.value=.16;
  src.connect(bp);bp.connect(g);g.connect(AU.master);src.start();
  setTimeout(()=>{pluck(7);setTimeout(()=>pluck(9),160);},1900);
}
function collapseSound(down){
  if(!AU.ctx)return;const ctx=AU.ctx;
  const o=ctx.createOscillator();o.type='sine';
  o.frequency.setValueAtTime(down?330:110,ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(down?110:330,ctx.currentTime+.8);
  const g=ctx.createGain();g.gain.setValueAtTime(.1,ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+1);
  o.connect(g);g.connect(AU.delaySend);o.start();o.stop(ctx.currentTime+1.1);
}


function tint(mat, targetHex, monoHex){
  colorables.push({mat,target:C(targetHex),mono:monoHex?C(monoHex):grayOf(targetHex)});
}
function fade(mat,max){ mat.transparent=true; mat.opacity=0; fadables.push({mat,max}); }
function applyColor(){
  const p=ease(progress);
  for(const c of colorables) c.mat.color.copy(c.mono).lerp(c.target,p);
  for(const f of fadables) f.mat.opacity=f.max*p;
  const top=grayLerp(S.skyM[0],S.skyC[0],p), bot=grayLerp(S.skyM[1],S.skyC[1],p);
  document.body.style.background=`linear-gradient(${top},${bot})`;
  if(scene.fog) scene.fog.color.set(bot);
  $('#meterFill').style.width=(progress*100).toFixed(1)+'%';
  $('#meterLabel').textContent='COLOR · '+Math.round(progress*100)+'%';
}
function grayLerp(a,b,p){
  const ca=C(a),cb=C(b);ca.lerp(cb,p);
  return '#'+ca.getHexString();
}


function lineMat(hex,op=1){return new THREE.LineBasicMaterial({color:hex,transparent:op<1,opacity:op});}
function edges(geo,mat){return new THREE.LineSegments(new THREE.EdgesGeometry(geo),mat);}
function mover(o,span,onRecycle){movers.push({o,span,onRecycle});}
function glowSprite(hex,scale,op=.8){
  const m=new THREE.SpriteMaterial({map:glowTex,color:hex,transparent:true,opacity:op,
    blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
  const s=new THREE.Sprite(m);s.scale.set(scale,scale,1);return s;
}

function clearWorld(){
  if(worldGroup){
    worldGroup.traverse(o=>{ if(o.geometry)o.geometry.dispose();
      if(o.material){Array.isArray(o.material)?o.material.forEach(m=>m.dispose()):o.material.dispose();}});
    scene.remove(worldGroup);
  }
  movers=[];updaters=[];colorables=[];fadables=[];bursts=[];
  frags.forEach(f=>scene.remove(f.g));frags=[];
  worldGroup=new THREE.Group();scene.add(worldGroup);
}

function buildRoad(opt){
  const o=Object.assign({w:12,fill:'#e3e1da',fillC:'#efdcc2',line:'#26241f',lineC:null,
    dash:'#26241f',dashC:null,glowEdges:false},opt||{});
  const g=new THREE.Group();
  const fillMat=new THREE.MeshBasicMaterial({color:o.fill});
  tint(fillMat,o.fillC||o.fill,o.fill);
  const road=new THREE.Mesh(new THREE.PlaneGeometry(o.w,560),fillMat);
  road.rotation.x=-Math.PI/2;road.position.set(0,0,-250);g.add(road);
  for(const side of[-1,1]){
    const mat=lineMat(o.line);if(o.lineC)tint(mat,o.lineC,o.line);
    const geo=new THREE.BufferGeometry().setFromPoints(
      [new THREE.Vector3(side*o.w/2,.02,16),new THREE.Vector3(side*o.w/2,.02,-540)]);
    g.add(new THREE.Line(geo,mat));
    if(o.glowEdges){
      const gm=new THREE.MeshBasicMaterial({color:o.lineC||o.line,transparent:true,opacity:0,
        blending:THREE.AdditiveBlending,depthWrite:false});
      fade(gm,.5);
      const strip=new THREE.Mesh(new THREE.PlaneGeometry(.5,560),gm);
      strip.rotation.x=-Math.PI/2;strip.position.set(side*o.w/2,.015,-250);g.add(strip);
    }
  }
  const dashMat=lineMat(o.dash,.9);if(o.dashC)tint(dashMat,o.dashC,o.dash);
  for(let i=0;i<34;i++){
    const d=new THREE.Mesh(new THREE.PlaneGeometry(.16,4.6),
      new THREE.MeshBasicMaterial({color:o.dash,transparent:true,opacity:.85}));
    if(o.dashC)tint(d.material,o.dashC,o.dash);else tint(d.material,o.dash,o.dash);
    d.rotation.x=-Math.PI/2;d.position.set(0,.03,-i*15+10);
    g.add(d);mover(d,34*15);
  }
  worldGroup.add(g);
}


let runner, bodyMat, trailMat, glowL, ballMesh, ballInner;

function buildBall(){
  runner=new THREE.Group();
  bodyMat=lineMat('#26241f');
  
  const ballRadius = 0.55;
  const outerGeo = new THREE.IcosahedronGeometry(ballRadius, 2);
  ballMesh = edges(outerGeo, bodyMat);
  runner.add(ballMesh);

  const innerGeo = new THREE.OctahedronGeometry(ballRadius * 0.55, 0);
  ballInner = edges(innerGeo, bodyMat);
  ballMesh.add(ballInner);

  glowL=glowSprite('#ff5555', 1.8, 0); runner.add(glowL);
  glowR=glowSprite('#ff5555', 1.2, 0); runner.add(glowR);

  trailMat=new THREE.MeshBasicMaterial({color:'#d9a441',transparent:true,opacity:0,
    blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
  const trail=new THREE.Mesh(new THREE.PlaneGeometry(1.2,12),trailMat);
  trail.rotation.x=-Math.PI/2;trail.position.set(0,.02,5.5);
  scene.add(trail);runner.userData.trail=trail;

  scene.add(runner);
}
function styleRunner(){
  const dark=!S.uiBright;
  bodyMat.color.set(dark?'#26241f':'#eef2fa');
  trailMat.color.set(S.trail);
  glowL.material.color.set(S.accents[0]);glowR.material.color.set(S.accents[0]);
}
function animateStickman(d,mode){
  const radius = 0.55;
  const rotDelta = (speed * d) / radius;
  ballMesh.rotation.x += rotDelta;
  
  ballInner.rotation.y += d * 2.5;
  ballInner.rotation.z += d * 1.5;

  if(mode==='swim'){
    const bob = Math.sin(time * 3.5) * 0.12;
    runner.position.y = 0.55 + bob;
    glowL.position.set(0, 0, 0);
    glowR.position.set(0, 0, 0);
  } else if(mode==='fly'){
    const hover = Math.sin(time * 4) * 0.25 + 0.4;
    runner.position.y = 1.2 + hover;
    glowL.position.set(0, 0, 0);
    glowR.position.set(0, 0, 0);
  } else {
    const bounce = Math.abs(Math.sin(time * 12)) * 0.04;
    runner.position.y = radius + bounce;
    glowL.position.set(0, 0, 0);
    glowR.position.set(0, 0, 0);
  }
}

/* ---------------- DREAM I · paper city (roll) ---------------- */
function buildPaper(){
  buildRoad({fill:'#eceae3',fillC:'#f3e2c8',line:'#26241f',dash:'#26241f'});
  const ink=lineMat('#26241f');
  for(const side of[-1,1]) for(let i=0;i<22;i++){
    const g=new THREE.Group();
    const w=rand(4,9),h=rand(3,24),dep=rand(4,8);
    const box=new THREE.BoxGeometry(w,h,dep);
    g.add(edges(box,ink));
    const fm=new THREE.MeshBasicMaterial({color:pick(S.accents)});fade(fm,rand(.18,.4));
    const fill=new THREE.Mesh(box,fm);fill.scale.set(.985,.985,.985);g.add(fill);
    g.position.set(side*rand(9.5,24),h/2,-i*24+rand(-6,6));
    worldGroup.add(g);
    mover(g,22*24,o=>{const nh=rand(3,24);o.children[0].scale.y=nh/h;o.children[1].scale.y=.985*nh/h;
      o.position.y=nh/2;o.position.x=side*rand(9.5,24);});
  }
  const pg=new THREE.BufferGeometry();const n=90;const pos=new Float32Array(n*3);
  for(let i=0;i<n;i++){pos[i*3]=rand(-30,30);pos[i*3+1]=rand(.5,18);pos[i*3+2]=rand(-240,10);}
  pg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const pm=new THREE.PointsMaterial({color:'#26241f',size:.12,transparent:true,opacity:.4});
  const pts=new THREE.Points(pg,pm);worldGroup.add(pts);
  updaters.push(d=>{const a=pg.attributes.position.array;
    for(let i=0;i<n;i++){a[i*3+2]+=speed*d*.4;if(a[i*3+2]>12)a[i*3+2]-=252;}
    pg.attributes.position.needsUpdate=true;});
}

/* ---------------- DREAM II · rain avenue (roll) ---------------- */
function buildRain(){
  buildRoad({w:12,fill:'#0d0f13',fillC:'#0e1830',line:'#8b93a3',lineC:'#6fd2ff',
    dash:'#8b93a3',dashC:'#bfe9ff',glowEdges:true});
  for(let i=0;i<14;i++){
    const side=i%2?1:-1;
    const g=new THREE.Group();
    const pm=lineMat('#7d8694');tint(pm,'#9fc6ff','#7d8694');
    const pole=new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0,0,0),new THREE.Vector3(0,7.5,0),new THREE.Vector3(-side*2.2,7.5,0)]);
    g.add(new THREE.Line(pole,pm));
    const lamp=glowSprite(pick(S.accents),3.4,0);fade(lamp.material,.9);
    lamp.position.set(-side*2.2,7.4,0);g.add(lamp);
    const poolM=new THREE.MeshBasicMaterial({color:lamp.material.color.getHex(),
      blending:THREE.AdditiveBlending,depthWrite:false});fade(poolM,.3);
    const pool=new THREE.Mesh(new THREE.CircleGeometry(2.6,18),poolM);
    pool.rotation.x=-Math.PI/2;pool.position.set(-side*2.2,.018,0);g.add(pool);
    g.position.set(side*6.6,0,-i*36+10);
    worldGroup.add(g);mover(g,14*36);
  }
  const skM=new THREE.MeshBasicMaterial({color:'#15171c'});tint(skM,'#0c1f4a','#15171c');
  for(let i=0;i<26;i++){
    const w=rand(6,16),h=rand(8,40);
    const b=new THREE.Mesh(new THREE.PlaneGeometry(w,h),skM);
    b.position.set(rand(-130,130),h/2,-150-rand(0,22));worldGroup.add(b);
  }
  const wg=new THREE.BufferGeometry();const wn=160;const wp=new Float32Array(wn*3);
  for(let i=0;i<wn;i++){wp[i*3]=rand(-120,120);wp[i*3+1]=rand(2,36);wp[i*3+2]=-149-rand(0,20);}
  wg.setAttribute('position',new THREE.BufferAttribute(wp,3));
  const wm=new THREE.PointsMaterial({color:'#ffd166',size:.9,transparent:true,opacity:0,
    blending:THREE.AdditiveBlending,depthWrite:false,fog:false});fade(wm,.85);
  worldGroup.add(new THREE.Points(wg,wm));
  const rn=240,rg=new THREE.BufferGeometry();
  const rp=new Float32Array(rn*6);const drops=[];
  for(let i=0;i<rn;i++){drops.push({x:rand(-22,22),y:rand(0,18),z:rand(-60,12),v:rand(22,34)});}
  rg.setAttribute('position',new THREE.BufferAttribute(rp,3));
  const rm=lineMat('#6a7280',.55);tint(rm,'#7fc4ff','#6a7280');
  worldGroup.add(new THREE.LineSegments(rg,rm));
  updaters.push(d=>{
    for(let i=0;i<rn;i++){const r=drops[i];r.y-=r.v*d;
      if(r.y<0){r.y=rand(14,18);r.x=rand(-22,22)+carX*.5;r.z=rand(-60,12);}
      rp[i*6]=r.x;rp[i*6+1]=r.y;rp[i*6+2]=r.z;
      rp[i*6+3]=r.x+.16;rp[i*6+4]=r.y-.85;rp[i*6+5]=r.z;}
    rg.attributes.position.needsUpdate=true;});
}

/* ---------------- DREAM III · garden desert (bright sky) ---------------- */
let dunePhase = 0;

function buildDesert() {
  buildRoad({
    w: 11,
    fill: '#f5e6ca',
    fillC: '#e11d48',
    line: '#16a34a',
    lineC: '#ff4d6d',
    dash: '#16a34a',
    dashC: '#fb923c'
  });

  const seg = 64;
  const dg = new THREE.PlaneGeometry(560, 560, seg, seg);
  const dm = new THREE.MeshBasicMaterial({
    color: '#84cc16', 
    wireframe: true,
    transparent: true,
    opacity: 0.45
  });
  tint(dm, '#ff8fae', '#84cc16');

  const dunes = new THREE.Mesh(dg, dm);
  dunes.rotation.x = -Math.PI / 2;
  dunes.position.set(0, -0.25, -230);
  worldGroup.add(dunes);

  const base = dg.attributes.position.array.slice();
  updaters.push(d => {
    dunePhase += speed * d;
    const a = dg.attributes.position.array;
    for (let i = 0; i < a.length; i += 3) {
      const x = base[i], y = base[i + 1];
      const zWorld = y - dunePhase;
      const cover = clamp((Math.abs(x) - 7) / 14, 0, 1);
      a[i + 2] = cover * (
        Math.sin(x * 0.045 + zWorld * 0.018) * 2.4 +
        Math.sin(x * 0.013 - zWorld * 0.031 + 2) * 3.4 +
        Math.sin(x * 0.08 + zWorld * 0.05) * 0.7
      );
    }
    dg.attributes.position.needsUpdate = true;
  });

  const sunM = new THREE.MeshBasicMaterial({
    color: '#fff7ed',
    fog: false,
    transparent: true,
    opacity: 0
  });
  fade(sunM, 0.98);

  const sun = new THREE.Mesh(new THREE.CircleGeometry(28, 48), sunM);
  sun.position.set(-26, 32, -330);
  worldGroup.add(sun);

  const sunGlow = glowSprite('#fef08a', 140, 0);
  fade(sunGlow.material, 0.5);
  sunGlow.position.copy(sun.position);
  worldGroup.add(sunGlow);

  const cm = lineMat('#16a34a');
  tint(cm, '#e11d48', '#16a34a');

  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const g = new THREE.Group();
      const h = rand(2.5, 5.0);

      g.add(edges(new THREE.CylinderGeometry(0.2, 0.3, h, 6), cm).translateY(h / 2));

      const arm = edges(new THREE.CylinderGeometry(0.12, 0.16, h * 0.45, 6), cm);
      arm.position.set(0.5 * side, h * 0.55, 0);
      arm.rotation.z = side * 0.6;
      g.add(arm);

      const flowerHead = edges(new THREE.IcosahedronGeometry(0.6, 0), cm);
      flowerHead.position.set(0, h + 0.3, 0);
      g.add(flowerHead);

      g.position.set(side * rand(8.5, 26), 0, -i * 54 + rand(-12, 12));
      worldGroup.add(g);
      mover(g, 8 * 54, o => { o.position.x = side * rand(8.5, 26); });
    }
  }

  const n = 120;
  const pgd = new THREE.BufferGeometry();
  const pp = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pp[i * 3] = rand(-40, 40);
    pp[i * 3 + 1] = rand(0.5, 12);
    pp[i * 3 + 2] = rand(-240, 10);
  }
  pgd.setAttribute('position', new THREE.BufferAttribute(pp, 3));

  const ppm = new THREE.PointsMaterial({
    color: '#ff4d6d',
    size: 0.22,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  fade(ppm, 0.75);
  worldGroup.add(new THREE.Points(pgd, ppm));

  updaters.push(d => {
    const a = pgd.attributes.position.array;
    for (let i = 0; i < n; i++) {
      a[i * 3 + 2] += speed * d * 0.4;
      a[i * 3 + 1] += Math.sin(time + i) * 0.003;
      if (a[i * 3 + 2] > 12) a[i * 3 + 2] -= 252;
    }
    pgd.attributes.position.needsUpdate = true;
  });

  const birdCount = 14;
  const birdGeo = new THREE.BufferGeometry();
  const birdPositions = new Float32Array(birdCount * 3);
  const birdOffsets = [];

  for (let i = 0; i < birdCount; i++) {
    birdPositions[i * 3] = rand(-60, 60);
    birdPositions[i * 3 + 1] = rand(15, 35);
    birdPositions[i * 3 + 2] = rand(-200, -20);
    birdOffsets.push({
      speedX: rand(0.2, 0.6),
      speedY: rand(0.01, 0.03),
      phase: rand(0, Math.PI * 2)
    });
  }

  birdGeo.setAttribute('position', new THREE.BufferAttribute(birdPositions, 3));
  const birdMat = new THREE.PointsMaterial({
    color: '#1c1917',
    size: 0.45,
    transparent: true,
    opacity: 0.8
  });

  const birdGroup = new THREE.Points(birdGeo, birdMat);
  worldGroup.add(birdGroup);

  updaters.push(d => {
    const pos = birdGeo.attributes.position.array;
    for (let i = 0; i < birdCount; i++) {
      const o = birdOffsets[i];
      pos[i * 3] += o.speedX;                          
      pos[i * 3 + 1] += Math.sin(time * 2 + o.phase) * o.speedY; 
      
      if (pos[i * 3] > 70) pos[i * 3] = -70;
    }
    birdGeo.attributes.position.needsUpdate = true;
  });
}
/* ---------------- DREAM IV · golden sea (swim) ---------------- */
function buildSea(){
  buildRoad({w:9,fill:'#191a1e',fillC:'#3a2a14',line:'#7d7668',lineC:'#ffd98a',
    dash:'#7d7668',dashC:'#ffe9b0',glowEdges:true});
  const seg=56;
  const wgM=new THREE.PlaneGeometry(620,620,seg,seg);
  const wm=new THREE.MeshBasicMaterial({color:'#3a3d44',wireframe:true,transparent:true,opacity:.5});
  tint(wm,'#e8b35a','#3a3d44');
  const water=new THREE.Mesh(wgM,wm);water.rotation.x=-Math.PI/2;water.position.set(0,-1.4,-250);
  worldGroup.add(water);
  const wbase=wgM.attributes.position.array.slice();
  let wt=0;
  updaters.push(d=>{
    wt+=d;const a=wgM.attributes.position.array;
    const scroll=wt*speed*.35;
    for(let i=0;i<a.length;i+=3){
      const x=wbase[i],y=wbase[i+1];
      a[i+2]=Math.sin(x*.05+wt*1.1)*0.7+Math.sin((y-scroll)*.06+x*.02)*0.9
            +Math.sin((y-scroll)*.14+wt*.7)*0.35;
    }
    wgM.attributes.position.needsUpdate=true;
  });
  const pmm=lineMat('#6e695e');tint(pmm,'#d9a441','#6e695e');
  for(const side of[-1,1]) for(let i=0;i<16;i++){
    const post=edges(new THREE.BoxGeometry(.3,2.2,.3),pmm);
    post.position.set(side*4.7,-1,-i*30+10);
    worldGroup.add(post);mover(post,16*30);
  }
  const sunM=new THREE.MeshBasicMaterial({color:'#fff3cf',fog:false,transparent:true,opacity:0});
  fade(sunM,1);
  const sun=new THREE.Mesh(new THREE.CircleGeometry(24,48),sunM);
  sun.position.set(0,-6,-340);worldGroup.add(sun);
  const halo=glowSprite('#ffcf6e',150,0);fade(halo.material,.5);
  halo.position.copy(sun.position);worldGroup.add(halo);
  updaters.push(()=>{const y=lerp(-8,30,ease(progress));sun.position.y=y;halo.position.y=y;});
  const lpM=new THREE.MeshBasicMaterial({color:'#ffdf9a',blending:THREE.AdditiveBlending,
    depthWrite:false});fade(lpM,.4);
  const lp=new THREE.Mesh(new THREE.PlaneGeometry(10,330),lpM);
  lp.rotation.x=-Math.PI/2;lp.position.set(0,-1.2,-175);worldGroup.add(lp);
  const n=160,sg=new THREE.BufferGeometry();const sp=new Float32Array(n*3);
  for(let i=0;i<n;i++){sp[i*3]=rand(-80,80);sp[i*3+1]=-1.1;sp[i*3+2]=rand(-300,0);}
  sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
  const sm=new THREE.PointsMaterial({color:'#ffe9b0',size:.5,transparent:true,opacity:0,
    blending:THREE.AdditiveBlending,depthWrite:false});fade(sm,.9);
  worldGroup.add(new THREE.Points(sg,sm));
  updaters.push(d=>{sm.size=.35+Math.sin(time*3)*.15;
    const a=sg.attributes.position.array;
    for(let i=0;i<n;i++){a[i*3+2]+=speed*d*.6;if(a[i*3+2]>6)a[i*3+2]-=306;}
    sg.attributes.position.needsUpdate=true;});
}

/* ---------------- DREAM V · space reach (fly) ---------------- */
function buildSky() {
  const sunM = new THREE.MeshBasicMaterial({ color: '#fffbeb', fog: false, transparent: true, opacity: 0 });
  fade(sunM, 0.95);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(22, 48), sunM);
  sun.position.set(0, 30, -350);
  worldGroup.add(sun);

  const halo = glowSprite('#38bdf8', 150, 0);
  fade(halo.material, 0.6);
  halo.position.copy(sun.position);
  worldGroup.add(halo);

  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = 128;
  cloudCanvas.height = 128;
  const ctx = cloudCanvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  grad.addColorStop(0.3, 'rgba(224, 242, 254, 0.4)');
  grad.addColorStop(0.7, 'rgba(186, 230, 253, 0.1)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const cloudTexture = new THREE.CanvasTexture(cloudCanvas);

  const cloudGroup = new THREE.Group();
  const cloudCount = 18;

  for (let i = 0; i < cloudCount; i++) {
    const puffCount = 12;
    const cloudGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(puffCount * 3);

    for (let p = 0; p < puffCount; p++) {
      positions[p * 3] = rand(-6, 6);
      positions[p * 3 + 1] = rand(-2, 2);
      positions[p * 3 + 2] = rand(-4, 4);
    }
    cloudGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const cloudMat = new THREE.PointsMaterial({
      map: cloudTexture,
      size: 16,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const cloudCluster = new THREE.Points(cloudGeo, cloudMat);
    cloudCluster.position.set(rand(-45, 45), rand(-5, 20), -i * 22 + rand(-8, 8));
    worldGroup.add(cloudCluster);

    mover(cloudCluster, cloudCount * 22, o => {
      o.position.x = rand(-45, 45);
      o.position.y = rand(-5, 20);
    });
  }

  const starCount = 200;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = rand(-80, 80);
    starPositions[i * 3 + 1] = rand(-20, 60);
    starPositions[i * 3 + 2] = rand(-300, 10);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

  const starMat = new THREE.PointsMaterial({
    color: '#ffffff',
    size: 0.3,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending
  });
  fade(starMat, 0.85);
  worldGroup.add(new THREE.Points(starGeo, starMat));

  updaters.push(d => {
    const pos = starGeo.attributes.position.array;
    for (let i = 0; i < starCount; i++) {
      pos[i * 3 + 2] += speed * d * 0.2; 
      if (pos[i * 3 + 2] > 10) pos[i * 3 + 2] -= 310;
    }
    starGeo.attributes.position.needsUpdate = true;
  });

  const bm = lineMat('#38bdf8');
  tint(bm, '#ff8fae', '#38bdf8');
  const birds = [];

  for (let i = 0; i < 10; i++) {
    const wingGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.5, 0, 0.2),
      new THREE.Vector3(0, 0, -0.15),
      new THREE.Vector3(0.5, 0, 0.2)
    ]);
    const b = new THREE.Line(wingGeo, bm);
    b.position.set(rand(-18, 18), rand(3, 18), -i * 40 + rand(-10, 10));
    worldGroup.add(b);
    birds.push(b);

    mover(b, 10 * 40, o => {
      o.position.x = rand(-18, 18);
      o.position.y = rand(3, 18);
    });
  }

  updaters.push(() => {
    birds.forEach((b, i) => {
      b.rotation.z = Math.sin(time * 5 + i) * 0.45;
    });
  });

 
  const wn = 80;
  const wg = new THREE.BufferGeometry();
  const wp = new Float32Array(wn * 6);
  const winds = [];

  for (let i = 0; i < wn; i++) {
    winds.push({ x: rand(-20, 20), y: rand(-5, 25), z: rand(-100, 10) });
  }
  wg.setAttribute('position', new THREE.BufferAttribute(wp, 3));

  const wm = lineMat('#7dd3fc', 0.6);
  tint(wm, '#ffffff', '#7dd3fc');
  worldGroup.add(new THREE.LineSegments(wg, wm));

  updaters.push(d => {
    const a = wg.attributes.position.array;
    for (let i = 0; i < wn; i++) {
      const w = winds[i];
      w.z += speed * d * 1.8;
      if (w.z > 12) {
        w.z -= 112;
        w.x = rand(-20, 20);
        w.y = rand(-5, 25);
      }
      a[i * 6] = w.x;
      a[i * 6 + 1] = w.y;
      a[i * 6 + 2] = w.z;
      a[i * 6 + 3] = w.x;
      a[i * 6 + 4] = w.y;
      a[i * 6 + 5] = w.z - 4; 
    }
    wg.attributes.position.needsUpdate = true;
  });
}

/* ---------------- DREAM VI · the white room (roll) ---------------- */
function buildWhite(){
  buildRoad({w:10,fill:'#ffffff',fillC:'#ffffff',line:'#15140f',dash:'#15140f'});
  const ink=lineMat('#15140f');
  for(let i=0;i<16;i++){
    const kind=i%3;
    let o;
    if(kind===0)o=edges(new THREE.TorusGeometry(rand(2,5),.04,8,40),ink);
    else if(kind===1)o=edges(new THREE.BoxGeometry(rand(1,3),rand(1,3),.1),ink);
    else o=edges(new THREE.CircleGeometry(rand(1,2.5),24),ink);
    o.position.set(pick([-1,1])*rand(7,20),rand(2,12),-i*32+rand(-8,8));
    o.rotation.z=rand(0,Math.PI);
    worldGroup.add(o);mover(o,16*32,(m)=>{m.rotation.z=rand(0,Math.PI);});
  }
  for(let i=0;i<6;i++){
    const gate=edges(new THREE.BoxGeometry(11,8,.2),ink);
    gate.position.set(0,4,-i*85-40);
    worldGroup.add(gate);mover(gate,6*85);
  }
  const hz=new THREE.BufferGeometry().setFromPoints(
    [new THREE.Vector3(-300,.01,-200),new THREE.Vector3(300,.01,-200)]);
  worldGroup.add(new THREE.Line(hz,ink));
}

const BUILDERS={paper:buildPaper,rain:buildRain,desert:buildDesert,sea:buildSea,sky:buildSky,white:buildWhite};


function spawnFragment(){
  const g=new THREE.Group();
  const mat=lineMat(S.uiBright?'#ffffff':'#26241f');
  const oct=edges(new THREE.OctahedronGeometry(.42),mat);
  g.add(oct);
  const glow=glowSprite(S.fragColor,2.4,.75);g.add(glow);
  const fy = S.move==='fly' ? rand(1.4,3.2) : S.move==='swim' ? 1.0 : 1.05;
  g.position.set(rand(-4.4,4.4),fy,-250);
  scene.add(g);
  frags.push({g,oct,glow,phase:rand(0,6.28),dead:false});
}
function burst(pos,hex){
  const n=26,geo=new THREE.BufferGeometry();
  const p=new Float32Array(n*3),v=[];
  for(let i=0;i<n;i++){p[i*3]=pos.x;p[i*3+1]=pos.y;p[i*3+2]=pos.z;
    v.push(new THREE.Vector3(rand(-1,1),rand(.2,1.6),rand(-1,1)).multiplyScalar(rand(3,8)));}
  geo.setAttribute('position',new THREE.BufferAttribute(p,3));
  const m=new THREE.PointsMaterial({color:hex,size:.22,transparent:true,opacity:.95,
    blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
  const pts=new THREE.Points(geo,m);scene.add(pts);
  bursts.push({pts,v,life:0});
}
function updateBursts(d){
  for(let i=bursts.length-1;i>=0;i--){
    const b=bursts[i];b.life+=d;
    const a=b.pts.geometry.attributes.position.array;
    for(let j=0;j<b.v.length;j++){
      a[j*3]+=b.v[j].x*d;a[j*3+1]+=b.v[j].y*d;a[j*3+2]+=b.v[j].z*d+speed*d;
      b.v[j].y-=4*d;}
    b.pts.geometry.attributes.position.needsUpdate=true;
    b.pts.material.opacity=Math.max(0,.95-b.life*1.2);
    if(b.life>.9){scene.remove(b.pts);b.pts.geometry.dispose();b.pts.material.dispose();bursts.splice(i,1);}
  }
}
function collect(f){
  f.dead=true;scene.remove(f.g);
  totalFrags++;pickupCount++;
  comboT=2.6;combo=Math.min(combo+1,11);
  pluck(combo+2);
  burst(f.g.position,S.fragColor);
  if(navigator.vibrate)navigator.vibrate(10);
  progress=clamp(progress+1/S.fragNeed,0,1);
  $('#fragTag').textContent=String(Math.round(progress*S.fragNeed)).padStart(2,'0')+' / '+S.fragNeed;
  if(pickupCount%3===0)showWord(pick(S.words));
  checkMilestones();
  if(progress>=1&&state==='play')dissolve();
}
function updateFrags(d){
  for(let i=frags.length-1;i>=0;i--){
    const f=frags[i];if(f.dead){frags.splice(i,1);continue;}
    f.g.position.z+=speed*d;
    f.oct.rotation.y+=d*1.6;f.oct.rotation.x+=d*.7;
    f.g.position.y+=Math.sin(time*2.2+f.phase)*.002;
    f.glow.material.opacity=.55+Math.sin(time*3+f.phase)*.25;
    if(f.g.position.z>10){scene.remove(f.g);frags.splice(i,1);combo=0;continue;}
    if(Math.abs(f.g.position.z)<1.7&&Math.abs(f.g.position.x-carX)<1.6)collect(f);
  }
}

let poemTimer=null;
function showPoem(text,dur=5200){
  const el=$('#poem');
  el.querySelector('.en').textContent=text;
  el.classList.add('show');
  clearTimeout(poemTimer);
  poemTimer=setTimeout(()=>el.classList.remove('show'),dur);
}
let wordTimer=null;
function showWord(w){
  const el=$('#word');el.textContent='— '+w+' —';el.classList.add('show');
  clearTimeout(wordTimer);wordTimer=setTimeout(()=>el.classList.remove('show'),2200);
}
function checkMilestones(){
  const marks=[[.0,0],[.27,1],[.55,2],[.8,3]];
  for(const[m,idx]of marks){
    if(progress>=m&&!shownPoems.has(idx)&&S.poems[idx]){
      shownPoems.add(idx);showPoem(S.poems[idx]);break;
    }
  }
  if(progress>=.5&&!collapsedThisScene&&!S.flat){collapsedThisScene=true;triggerCollapse();}
}
function setUI(){
  document.documentElement.style.setProperty('--ink',S.ui);
  const tag=$('#sceneTag');
  tag.querySelector('.num').textContent=S.num;
  tag.querySelector('.en').textContent=S.en;
  tag.querySelector('.mode').textContent=S.move;
  $('#fragTag').textContent='00 / '+S.fragNeed;
  $('#meterFill').style.background=`linear-gradient(90deg,${S.accents.join(',')})`;
}


function triggerCollapse(){
  if(collapse.target===1)return;
  collapse.target=1;collapse.hold=3.4;
  $('#flash').classList.remove('zap');void $('#flash').offsetWidth;
  $('#flash').classList.add('zap');
  collapseSound(true);
  showPoem(COLLAPSE_POEM,3600);
}
function updateCollapse(d){
  if(S.flat){collapse.t=lerp(collapse.t,1,d*1.2);return;}
  if(collapse.target===1){
    collapse.t=Math.min(1,collapse.t+d*1.1);
    if(collapse.t>=1){collapse.hold-=d;
      if(collapse.hold<=0){collapse.target=0;collapseSound(false);
        $('#flash').classList.remove('zap');void $('#flash').offsetWidth;
        $('#flash').classList.add('zap');}}
  } else collapse.t=Math.max(0,collapse.t-d*1.1);
}

/* ------------------------------------------------------------
   SCENE FLOW
------------------------------------------------------------ */
function buildScene(i){
  sceneIdx=i;S=SCENES[i];
  progress=0;shownPoems=new Set();collapsedThisScene=false;
  pickupCount=0;combo=0;spawnTimer=1.2;
  collapse={t:S.flat?1:0,target:0,hold:0};
  clearWorld();
  BUILDERS[S.key]();
  scene.fog=new THREE.Fog(C(S.skyM[1]),S.fogN,S.fogF);
  styleRunner();setUI();applyColor();
  speed=S.speed;
  if(AU.ctx)startPad();
  if(state==='play')setTimeout(()=>{if(S.poems[0]&&!shownPoems.has(0)){shownPoems.add(0);showPoem(S.poems[0]);}},2400);
}
function dissolve(){
  state='dissolve';riser();
  if(navigator.vibrate)navigator.vibrate(30);
  const card=$('#card');
  const next=SCENES[sceneIdx+1];
  if(!next){finish();return;}
  card.querySelector('.num').textContent=next.num;
  card.querySelector('.name').textContent=next.en;
  card.querySelector('.mode').textContent=next.move;
  setTimeout(()=>card.classList.add('show'),300);
  const surge=setInterval(()=>{speed*=1.04;},50);
  setTimeout(()=>{
    clearInterval(surge);
    buildScene(sceneIdx+1);
    setTimeout(()=>{card.classList.remove('show');state='play';},1900);
  },2100);
}
function finish(){
  state='end';
  $('#endStats').innerHTML=
    totalFrags+' memories collected<br>'+
    Math.floor(dreamTime/60)+' min '+Math.floor(dreamTime%60)+' s of dreaming';
  setTimeout(()=>{$('#end').classList.add('show');},900);
  stopPad();
}
$('#again').addEventListener('click',()=>{
  $('#end').classList.remove('show');
  setTimeout(()=>{$('#end').style.display='none';
    totalFrags=0;dreamTime=0;buildScene(0);state='play';},800);
});

/* ------------------------------------------------------------
   CONTROL MODE — touch-swipe or phone-tilt steering
------------------------------------------------------------ */
let controlMode='touch', tiltBaseline=null, tiltInput=0, tiltGranted=false;

function updateModeUI(){
  $('#modeTouch').classList.toggle('active',controlMode==='touch');
  $('#modeTilt').classList.toggle('active',controlMode==='tilt');
  $('#modeNote').textContent = controlMode==='tilt'
    ? (tiltGranted ? 'tilt your phone left / right · two fingers to boost'
                   : 'requesting motion access')
    : 'swipe the lanes · two fingers to boost';
}
function onTilt(e){
  const g=e.gamma; if(g==null)return;
  if(tiltBaseline===null)tiltBaseline=g;
  tiltInput=clamp((g-tiltBaseline)/24,-1,1);
}
function requestTilt(){
  if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){
    DeviceOrientationEvent.requestPermission().then(res=>{
      if(res==='granted'){tiltGranted=true;tiltBaseline=null;addEventListener('deviceorientation',onTilt);}
      else{controlMode='touch';}
      updateModeUI();
    }).catch(()=>{controlMode='touch';updateModeUI();});
  } else if('DeviceOrientationEvent' in window){
    tiltGranted=true;tiltBaseline=null;addEventListener('deviceorientation',onTilt);
    updateModeUI();
  } else {
    controlMode='touch';updateModeUI();
  }
}
function recenterTilt(){ tiltBaseline=null; if(navigator.vibrate)navigator.vibrate(8); }

if(isTouch)$('#modeToggle').style.display='flex';
$('#modeTouch').addEventListener('click',e=>{e.stopPropagation();controlMode='touch';updateModeUI();});
$('#modeTilt').addEventListener('click',e=>{e.stopPropagation();controlMode='tilt';requestTilt();updateModeUI();});
$('#modeTouch').addEventListener('touchend',e=>{e.stopPropagation();e.preventDefault();controlMode='touch';updateModeUI();});
$('#modeTilt').addEventListener('touchend',e=>{e.stopPropagation();e.preventDefault();controlMode='tilt';requestTilt();updateModeUI();});
$('#recenter').addEventListener('click',e=>{e.stopPropagation();recenterTilt();});
$('#recenter').addEventListener('touchend',e=>{e.stopPropagation();e.preventDefault();recenterTilt();});
updateModeUI();

/* ------------------------------------------------------------
   INPUT
------------------------------------------------------------ */
const keys={};
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;
  if(e.key.toLowerCase()==='m')toggleMute();
  if(e.key===' '){boostActive=true;e.preventDefault();}});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;
  if(e.key===' ')boostActive=false;});

let touchDir=0;
addEventListener('touchstart',e=>{
  if(e.touches.length>=2)boostActive=true;
  if(controlMode==='touch'&&e.touches[0])touchDir=e.touches[0].clientX<innerWidth/2?-1:1;
},{passive:true});
addEventListener('touchmove',e=>{
  if(controlMode==='touch'&&e.touches[0])touchDir=e.touches[0].clientX<innerWidth/2?-1:1;
},{passive:true});
addEventListener('touchend',e=>{
  if(e.touches.length<2)boostActive=false;
  if(e.touches.length===0)touchDir=0;
});
addEventListener('touchcancel',()=>{touchDir=0;boostActive=false;});
addEventListener('touchmove',e=>{e.preventDefault();},{passive:false});

function toggleMute(){
  if(!AU.ctx)return;AU.muted=!AU.muted;
  AU.master.gain.linearRampToValueAtTime(AU.muted?0:.5,AU.ctx.currentTime+.4);
  $('#mute').textContent=AU.muted?'SOUND · OFF':'SOUND · ON';
}
$('#mute').addEventListener('click',e=>{e.stopPropagation();toggleMute();});
$('#mute').addEventListener('touchend',e=>{e.stopPropagation();e.preventDefault();toggleMute();});

$('#start').addEventListener('click',begin);
$('#start').addEventListener('touchend',begin);
let begun=false;
function begin(){
  if(begun)return;begun=true;
  audioInit();
  $('#start').classList.add('gone');
  state='play';
  $('#boostHint').classList.add('show');
  setTimeout(()=>$('#boostHint').classList.remove('show'),4200);
  if(controlMode==='tilt')$('#recenter').classList.add('show');
  setTimeout(()=>{shownPoems.add(0);showPoem(S.poems[0]);},1800);
}

/* ------------------------------------------------------------
   FILM GRAIN
------------------------------------------------------------ */
const grainC=$('#grain');let grainT=0;
function drawGrain(){
  if(reduced)return;
  const g=grainC.getContext('2d');
  grainC.width=128;grainC.height=128;
  const img=g.createImageData(128,128);
  for(let i=0;i<img.data.length;i+=4){
    const v=Math.random()*255;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=255;}
  g.putImageData(img,0,0);
}
grainC.style.width='100vw';grainC.style.height='100vh';
grainC.style.imageRendering='pixelated';

/* ------------------------------------------------------------
   MAIN LOOP
------------------------------------------------------------ */
buildBall();
buildScene(0);
applyColor();

let last=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  const d=Math.min(.05,(now-last)/1000);last=now;
  time+=d;
  if(state==='play')dreamTime+=d;

  let input=0;
  if(controlMode==='tilt'&&tiltGranted){
    input=tiltInput;
  } else {
    if(keys['arrowleft']||keys['a'])input-=1;
    if(keys['arrowright']||keys['d'])input+=1;
    input=input||touchDir;
  }
  if(state!=='play'&&state!=='dissolve')input=0;
  steerV=lerp(steerV,input,d*6);
  carX=clamp(carX+steerV*15*d,-4.6,4.6);
  runner.position.x=carX;
  runner.rotation.z=-steerV*.22;
  runner.rotation.y=-steerV*.1;
  runner.userData.trail.position.x=lerp(runner.userData.trail.position.x,carX,d*7);
  trailMat.opacity=(.04+ease(progress)*.22+boostT*.25)*(state==='end'?0:1);
  glowL.material.opacity=glowR.material.opacity=.25+ease(progress)*.45+boostT*.3;

  if(state==='play'){
    boostT=lerp(boostT,boostActive?1:0,d*4);
    speed=lerp(speed,S.speed+ease(progress)*9+boostT*12,d);
    spawnTimer-=d;
    if(spawnTimer<=0){spawnFragment();spawnTimer=rand(1.1,1.8);}
  } else {
    boostT=lerp(boostT,0,d*3);
  }
  animateStickman(d,S.move||'roll');

  const dz=speed*d;
  for(const m of movers){m.o.position.z+=dz;
    if(m.o.position.z>16){m.o.position.z-=m.span;m.onRecycle&&m.onRecycle(m.o);}}
  for(const u of updaters)u(d);
  updateFrags(d);updateBursts(d);
  if(comboT>0){comboT-=d;if(comboT<=0)combo=0;}

  updateCollapse(d);
  const ct=ease(collapse.t);
  const fov=lerp(BASE_FOV,8,ct);
  const dist=BASE_DIST*Math.tan(THREE.MathUtils.degToRad(BASE_FOV/2))
            /Math.tan(THREE.MathUtils.degToRad(fov/2));
  camera.fov=fov+(state==='dissolve'?Math.min(14,(speed-S.speed)*.25)*(1-ct):0)+boostT*4*(1-ct);
  camera.updateProjectionMatrix();
  const sway=reduced?0:Math.sin(time*.5)*.35*(1-ct);
  camera.position.set(carX*.45+sway,4.2+Math.sin(time*.32)*.15*(1-ct),LOOK.z+dist);
  camera.lookAt(carX*.6,LOOK.y,LOOK.z);
  if(scene.fog){scene.fog.near=S.fogN+(dist-BASE_DIST);scene.fog.far=S.fogF+(dist-BASE_DIST);}

  applyColor();

  grainT+=d;if(grainT>.1){grainT=0;drawGrain();}

  renderer.render(scene,camera);
}
requestAnimationFrame(frame);

document.addEventListener('visibilitychange',()=>{
  if(!AU.ctx)return;
  if(document.hidden)AU.ctx.suspend();else if(!AU.muted)AU.ctx.resume();
});
