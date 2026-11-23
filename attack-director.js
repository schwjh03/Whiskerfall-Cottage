// One random stream per encounter keeps patterns varied and testable.
const DYNAMIC_ATTACKS=[
 {id:'moonblades',name:'Moon Scissors',hint:'The silver lines lock onto your position, then cut. Leave the warning line.'},
 {id:'bargain',name:'Twilight Bargain',hint:'Hollow cyan: hold still. Striped amber: keep moving. Watch for the rule change.'},
 {id:'seedburst',name:'A Thousand Tomorrows',hint:'Seed pods bloom after their countdown. Move away before the petals burst.'},
 {id:'brambles',name:'Bramble Crossing',hint:'Move through the opening in each sweeping vine wall.'},
 {id:'pendulum',name:'The Golden Pendulum',hint:'The clock hand warns, then sweeps. Follow its motion and keep your distance.'},
 {id:'timewarp',name:'Borrowed Seconds',hint:'Stars freeze, then reverse. Their return path is part of the attack.'}
];
const NEW_BOSS_ATTACKS={nyx:['moonblades','bargain'],briar:['seedburst','brambles'],orrery:['pendulum','timewarp']};
function createEncounterRandom(seed=Math.floor(Math.random()*4294967296)^Date.now()){
 let state=seed>>>0||0x9e3779b9;return ()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
}
function battleRandom(b){return (b.rng??=createEncounterRandom())();}
function randomRange(b,min,max){return min+(max-min)*battleRandom(b);}
function randomIndex(b,length){return Math.floor(battleRandom(b)*length);}
function shuffled(b,items){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=randomIndex(b,i+1);[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
function attackPool(b){const phases=b.boss.sequences,indices=[...phases[b.phase-1],...(b.phase>1?phases[b.phase-2]:[])];const ids=indices.map(i=>ATTACKS[i].id);const extra=NEW_BOSS_ATTACKS[b.bossId];return [...new Set([...ids,extra[0],...(b.phase>=2?[extra[1]]:[]),...CHOREOGRAPHED_ATTACKS.filter(a=>a.boss===b.bossId&&a.phase<=b.phase).map(a=>a.id)])];}
function chooseBossAttack(b){
 if(b.routeEnemy)return routeAttack(b);
 if(b.forcedAttackId)return ATTACKS.find(a=>a.id===b.forcedAttackId);
 const pool=attackPool(b),key=b.phase+':'+pool.join(',');
 if(b.attackBagKey!==key||!b.attackBag?.length){b.attackBag=shuffled(b,pool);b.attackBagKey=key;}
 const recent=(b.attackHistory||[]).slice(-2);let index=b.attackBag.findIndex(id=>!recent.includes(id));
 if(index<0)index=b.attackBag.findIndex(id=>id!==recent.at(-1));
 if(index<0)index=0;
 const id=b.attackBag.splice(index,1)[0];b.attackHistory=[...(b.attackHistory||[]),id].slice(-12);
 return ATTACKS.find(attack=>attack.id===id);
}
function prepareAttackVariation(b){
 b.variant={angle:randomRange(b,-Math.PI,Math.PI),direction:battleRandom(b)<.5?-1:1,tempo:randomRange(b,.94,1.06),offset:randomIndex(b,20)};
 b.safeLanes={};b.hazards=[];b.cue='';b.cueTimer=0;b.ruleStep=-1;b.echoTimer=2.6;
 const eligible=b.phase===3&&['relentless','eclipse'].includes(b.difficulty)&&!['stillness','embers','bargain'].includes(b.pattern);
 b.echo=eligible&&battleRandom(b)<.65?{nyx:'moonfire',briar:'seedfall',orrery:'stardust'}[b.bossId]:null;prepareEvolution(b);
}
// Adjacent lanes keep random gaps reachable instead of teleporting across the arena.
function nextSafeLane(b,count){b.safeLanes??={};const last=b.safeLanes[count];const lane=last===undefined?randomIndex(b,count):clamp(last+randomIndex(b,3)-1,0,count-1);b.safeLanes[count]=lane;return lane;}
function addSpecialHazard(b,hazard){b.hazards??=[];if(b.hazards.length<18)b.hazards.push({age:0,...hazard});}
function cueAttack(b,text,duration=1){b.cue=text;b.cueTimer=duration;}
function spawnDynamicPattern(b,box,t,speed,n){
 const pattern=activePattern(b),variant=b.variant||{direction:1,angle:0},strong=b.awakened||b.phase===3;
 if(pattern==='moonblades'){
  b.spawnTick=strong?1.25:1.6;
  const left=battleRandom(b)<.5,x=left?box.x-18:box.x+box.w+18,y=randomRange(b,box.y+12,box.y+box.h-12);
  const angle=Math.atan2(b.soul.y-y,b.soul.x-x);
  addSpecialHazard(b,{type:'blade',x,y,angle,length:530,width:strong?13:10,warn:1.1,active:.4,spin:0,color:'#ebc5ff'});
  if(strong&&n%2===0)addBullet(b,box.x+randomRange(b,25,box.w-25),box.y-15,0,110*speed,{shape:'star',color:'#ffe6c2',r:5});
 }else if(pattern==='bargain'){
  const step=Math.floor(Math.max(0,t-(b.grace||.9))/3.3),rule=step%2?'move':'still';
  if(step!==b.ruleStep){b.ruleStep=step;b.bullets=[];b.ruleGrace=t+.85;cueAttack(b,rule==='still'?'CYAN / HOLLOW · HOLD STILL':'AMBER / STRIPED · KEEP MOVING',1.05);}
  b.spawnTick=.48;if(t<b.ruleGrace)return true;
  const fromLeft=variant.direction>0;for(let i=0;i<6;i++)addBullet(b,fromLeft?box.x-18:box.x+box.w+18,box.y+17+i*35,(fromLeft?1:-1)*145*speed,Math.sin(n)*8,{rule,color:rule==='still'?'#72edf4':'#ffc77d',r:6});
 }else if(pattern==='seedburst'){
  b.spawnTick=strong?1.15:1.5;
  const x=clamp(b.soul.x+randomRange(b,-65,65),box.x+35,box.x+box.w-35),y=clamp(b.soul.y+randomRange(b,-40,40),box.y+30,box.y+box.h-30);
  addSpecialHazard(b,{type:'seed',x,y,warn:1.25,active:.25,r:23,gap:randomRange(b,-Math.PI,Math.PI),speed:100*speed,color:'#d6f7ac'});
 }else if(pattern==='brambles'){
  b.spawnTick=2.35;const lane=nextSafeLane(b,5),gapX=box.x+60+lane*(box.w-120)/4;
  addSpecialHazard(b,{type:'vineWall',gapX,gapWidth:strong?100:125,fromTop:variant.direction>0,warn:1.1,active:2.5,width:12,color:'#a9e4b5'});
 }else if(pattern==='pendulum'){
  b.spawnTick=3.0;const angle=Math.PI/2+randomRange(b,-.5,.5);
  addSpecialHazard(b,{type:'blade',x:box.x+box.w/2,y:box.y-22,angle,length:480,width:strong?13:10,warn:1.2,active:2.3,spin:variant.direction*.46,color:'#f6d699',pendulum:true});
  if(strong)for(const x of [box.x+15,box.x+box.w-15])addBullet(b,x,box.y-15,0,85*speed,{shape:'gear',color:'#cde7fa',r:6});
 }else if(pattern==='timewarp'){
  b.spawnTick=1.9;const angle=variant.angle+n*.2,gap=randomIndex(b,10);
  for(let i=0;i<10;i++)if(i!==gap&&i!==(gap+1)%10){const a=angle+i*Math.PI/5;addBullet(b,480,430,Math.cos(a)*90*speed,Math.sin(a)*90*speed,{shape:'star',color:'#bbdbff',r:5,safeTime:.5,reverseAt:.95,freezeFor:.65});}
 }else return false;
 b.spawnTick/=(b.config.density||1)*(b.variant?.tempo||1);return true;
}
function segmentDistance(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,t=clamp(((px-x1)*dx+(py-y1)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(px-(x1+t*dx),py-(y1+t*dy));}
function hazardGeometry(h,b){
 if(h.type==='blade'){const angle=h.angle+(h.age>=h.warn?(h.age-h.warn)*(h.spin||0):0);return {x1:h.x,y1:h.y,x2:h.x+Math.cos(angle)*h.length,y2:h.y+Math.sin(angle)*h.length};}
 if(h.type==='vineWall'){const p=clamp((h.age-h.warn)/h.active,0,1),y=b.box.y+(h.fromTop?p:1-p)*b.box.h;return {y,gapX:clamp(h.gapX+Math.sin(p*Math.PI)*18,b.box.x+h.gapWidth/2,b.box.x+b.box.w-h.gapWidth/2)};}
 return advancedHazardGeometry(h);
}
function hazardHitsSoul(h,b){if(h.age<h.warn||h.age>=h.warn+h.active)return false;const s=b.soul,g=hazardGeometry(h,b);if(h.type==='blade'&&b.bossId==='briar')return branchSweepHits(h,b,g);if(h.type==='blade')return segmentDistance(s.x,s.y,g.x1,g.y1,g.x2,g.y2)<h.width/2+s.r;if(h.type==='vineWall')return Math.abs(s.y-vineY(s.x,g.y,b.clock+(s.x>g.gapX?.4:0)))<h.width/2+s.r&&Math.abs(s.x-g.gapX)>h.gapWidth/2-s.r;return advancedHazardHits(h,b);}
function updateSpecialProjectile(p,b){
 if(p.reverseAt&&!p.reversed&&p.t>=p.reverseAt){p.reversed=true;p.vx=-p.vx;p.vy=-p.vy;p.freezeUntil=p.t+p.freezeFor;cueAttack(b,'TIME BREAK · SHOTS WILL RETURN',.75);}
 return p.freezeUntil&&p.t<p.freezeUntil;
}
function updateAttackHazards(b,dt){
 b.cueTimer=Math.max(0,(b.cueTimer||0)-dt);
 for(const h of b.hazards||[]){h.age+=dt;updateChoreographyHazard(h,b);
  if(h.type==='seed'&&!h.bloomed&&h.age>=h.warn){h.bloomed=true;emitSparks(h.x,h.y,h.color,12);for(let i=0;i<10;i++){const angle=i*Math.PI/5+h.gap;if(i===0||i===1)continue;addBullet(b,h.x,h.y,Math.cos(angle)*h.speed,Math.sin(angle)*h.speed,{shape:'leaf',color:h.color,r:5,safeTime:.25});}}
  if(hazardHitsSoul(h,b)){hurtSoul(6);if(game.mode!=='battleDodge')return;}
 }
 b.hazards=(b.hazards||[]).filter(h=>h.age<h.warn+h.active);
 if(b.echo&&b.phaseTimer>(b.grace||.9)&&b.phaseTimer<b.duration-1.8){b.echoTimer-=dt;if(b.echoTimer<=0){b.echoTimer=randomRange(b,2.6,3.4);const x=randomRange(b,b.box.x+20,b.box.x+b.box.w-20);addBullet(b,x,b.box.y-20,0,100*b.config.speed,{shape:b.echo==='seedfall'?'leaf':b.echo==='stardust'?'gear':'star',color:b.echo==='seedfall'?'#ddf5ac':b.echo==='stardust'?'#f5d998':'#ffd2ee',r:5});}}
}
function drawAttackHazards(b){
 for(const h of b.hazards||[]){const warning=h.age<h.warn,p=clamp(h.age/h.warn,0,1),g=hazardGeometry(h,b);ctx.save();ctx.lineCap='round';ctx.shadowColor=h.color;ctx.shadowBlur=warning?3:15;
  if(drawAdvancedHazard(h,b,warning)){ctx.restore();continue;}if(h.type==='blade'&&b.bossId==='briar'){drawBranchSweep(h,b,g,warning);ctx.restore();continue;}if(h.type==='blade'){ctx.strokeStyle=warning?h.color+'77':h.color;ctx.lineWidth=warning?2:h.width;ctx.setLineDash(warning?[7,8]:[]);ctx.beginPath();ctx.moveTo(g.x1,g.y1);ctx.lineTo(g.x2,g.y2);ctx.stroke();ctx.setLineDash([]);if(!warning){ctx.strokeStyle='#fff9e9';ctx.lineWidth=3;ctx.stroke();}else{ctx.fillStyle=h.color+'12';ctx.lineWidth=h.width;ctx.strokeStyle=h.color+'19';ctx.stroke();}ctx.fillStyle=h.color;ctx.beginPath();ctx.arc(h.x,h.y,warning?5:8,0,Math.PI*2);ctx.fill();if(h.pendulum){ctx.strokeStyle=h.color+'44';ctx.lineWidth=1;ctx.beginPath();ctx.arc(h.x,h.y,80,h.angle-.3,h.angle+.3);ctx.stroke();}}
  else if(h.type==='seed'){ctx.translate(h.x,h.y);ctx.strokeStyle=h.color;ctx.lineWidth=2;ctx.setLineDash([3,5]);ctx.beginPath();ctx.arc(0,0,h.r+Math.sin(h.age*6)*2,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(0,0,h.r+7,-Math.PI/2,-Math.PI/2+Math.PI*2*p);ctx.stroke();for(let i=0;i<5;i++){const a=i*Math.PI*2/5+h.age*.4;ctx.save();ctx.rotate(a);ctx.fillStyle=h.color+'99';ctx.beginPath();ctx.ellipse(0,-9,4,9,0,0,Math.PI*2);ctx.fill();ctx.restore();}ctx.fillStyle='#fff2be';ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();}
  else if(h.type==='vineWall')drawLivingVineWall(h,b,g,warning);
  ctx.restore();
 }
}
function drawProjectileTrail(p){if(p.rule||p.t<(p.safeTime||0))return;const speed=Math.hypot(p.vx,p.vy);if(speed<20)return;ctx.save();ctx.strokeStyle=p.color+'66';ctx.lineWidth=Math.max(1,p.r*.7);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x-p.vx*.065,p.y-p.vy*.065);ctx.lineTo(p.x,p.y);ctx.stroke();if(p.freezeUntil&&p.t<p.freezeUntil){ctx.strokeStyle='#fff4d7';ctx.lineWidth=1;ctx.setLineDash([2,3]);ctx.beginPath();ctx.arc(p.x,p.y,p.r+5,0,Math.PI*2);ctx.stroke();}ctx.restore();}
function drawAttackCue(b){if(b.cueTimer<=0)return;ctx.save();ctx.fillStyle='#101628ee';roundRect(280,278,400,38,6,true);pixelText(b.cue,480,297,12,activePattern(b)==='bargain'?(b.ruleStep%2?'#ffc77d':'#72edf4'):'#f7e2b7','center');ctx.restore();}
function bossAttackOptions(bossId){const boss=BOSSES[bossId]||BOSSES.nyx;return [...new Set([...boss.sequences.flat().map(i=>ATTACKS[i].id),...NEW_BOSS_ATTACKS[boss.id],...CHOREOGRAPHED_ATTACKS.filter(a=>a.boss===boss.id).map(a=>a.id)])];}
function populateAttackPractice(){const select=document.querySelector('#attack-select');if(!select)return;const ids=bossAttackOptions(document.querySelector('#boss-select')?.value||'nyx');select.innerHTML='<option value="random">Random mix</option>'+ids.map(id=>{const a=ATTACKS.find(a=>a.id===id);return `<option value="${id}">${a.name}</option>`;}).join('');select.value='random';const summary=document.querySelector('#attack-catalog-summary');if(summary)summary.textContent=`${ids.length} patterns · ${CHOREOGRAPHED_ATTACKS.filter(a=>a.boss===(document.querySelector('#boss-select')?.value||'nyx')).length} multi-stage attacks`;}
