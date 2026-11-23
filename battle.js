// Nyx's encounter uses a simulation clock: pausing never advances hazards.
const CHALLENGES={story:{speed:.78,damage:.65,hp:210,density:1},standard:{speed:1.12,damage:1,hp:250,density:1.12},relentless:{speed:1.28,damage:1.2,hp:290,density:1.25},eclipse:{speed:1.44,damage:1.35,hp:340,density:1.4}};
const ATTACKS=[
 {id:'rain',name:'Silverfall',hint:'Follow the open lane. Shift gives precise movement.'},
 {id:'fans',name:'Velvet Pursuit',hint:'The fans aim at your last position. Keep moving.'},
 {id:'lattice',name:'Thread the Moon',hint:'Find the gap in the crossing threads.'},
 {id:'bells',name:'Midnight Chimes',hint:'Glowing columns warn you before the bells strike.'},
 {id:'orbit',name:'Astral Bloom',hint:'Read the spaces between the expanding stars.'},
 {id:'vortex',name:'Heart of the Eclipse',hint:'The eclipse pulls inward. Dash through a narrow escape.'},
 {id:'stillness',name:'Hush of Winter',hint:'CYAN / HOLLOW: hold still as the rings pass. White stars always hurt.'},
 {id:'embers',name:'Ember Waltz',hint:'AMBER / STRIPED: keep moving as the embers pass.'},
 {id:'eclipse',name:'The Unbroken Bell',hint:'Read the beam warnings. Weave through the rotating stars.'},...BOSS_ATTACKS,...DYNAMIC_ATTACKS,...CHOREOGRAPHED_ATTACKS
];
const NYX_PHASES=['THE VELVET OATH','ECLIPSE AWAKENING','THE LAST BELL'];
let battleAudio=null,soundEnabled=false;
const reduceMotion=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function tone(frequency=400,duration=.1,volume=.04,type='sine'){
 if(!soundEnabled)return;
 try{battleAudio??=new(window.AudioContext||window.webkitAudioContext)();battleAudio.resume();const osc=battleAudio.createOscillator(),gain=battleAudio.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,battleAudio.currentTime);gain.gain.setValueAtTime(volume,battleAudio.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,battleAudio.currentTime+duration);osc.connect(gain).connect(battleAudio.destination);osc.start();osc.stop(battleAudio.currentTime+duration);}catch{soundEnabled=false;}
}
function startBattle(bossId='nyx',practice=false,routeId=null){
 const practiceSnapshot=prepareAdventureBattle(practice);
 const boss=BOSSES[bossId]||BOSSES.nyx;
 const difficulty=document.querySelector('#difficulty')?.value||'standard';
 game.paused=false;game.menuIndex=0;game.subMenuIndex=0;game.message=null;if(!practice&&!routeId&&boss.id==='nyx')game.flags.bossDefeated=false;
 const config=CHALLENGES[difficulty]||CHALLENGES.standard;
 game.battle={bossId:boss.id,boss,practice,awakened:false,transformClock:0,damagePopups:[],hitStop:0,hazards:[],attackHistory:[],bossHp:Math.round(config.hp*boss.hp),bossMaxHp:Math.round(config.hp*boss.hp),mercy:0,turn:1,phase:1,phaseTimer:0,clock:0,cinematic:0,invuln:0,bullets:[],beams:[],particles:[],trail:[],soul:{x:480,y:449,r:5,speed:215,dx:0,dy:-1},box:rect(265,331,430,210),pattern:'rain',text:'Duchess Nyx draws your heart into the eclipse.',won:false,difficulty,config,elapsed:0,totalHits:0,perfectStrikes:0,resonance:40,parryTime:0,parryCooldown:0,parryFlash:0,parries:0,riposte:0,pulseFlash:0,finale:false,recordSaved:false,dashCooldown:0,dashTime:0,graze:0,hitFlash:0,bossFlash:0,usedActs:[],cleanTurns:0,hitsThisTurn:0,strikeClock:0,notice:0};
 game.battle.practiceSnapshot=practiceSnapshot;if(routeId)configureRouteBattle(game.battle,routeId);
 const requestedMovement=document.querySelector('#movement-practice')?.value;if(practice&&['gravity','orbit'].includes(requestedMovement)){game.battle.mechanicPractice=requestedMovement;game.battle.patternPractice=true;}
 const requestedAttack=document.querySelector('#attack-select')?.value;if(practice&&bossAttackOptions(boss.id).includes(requestedAttack)){game.battle.forcedAttackId=requestedAttack;game.battle.patternPractice=true;}
 if(practice&&document.querySelector('#practice-awakened')?.checked){game.battle.formPractice=true;game.battle.awakened=true;game.battle.phase=3;game.battle.bossHp=Math.ceil(game.battle.bossMaxHp*.5);}
 const result=document.querySelector('#run-result');if(result)result.hidden=true;updatePersonalBest();
 game.mode='battleCinematic';document.body?.classList.add('in-battle');tone(110,1,.04,'triangle');
}
function retryBattle(){if(game.battle?.routeEnemy){recoverFromTrail();return;}game.player.hp=game.player.maxHp;game.player.items=[{name:'Warm Milk',heal:14},{name:'Moon Tart',heal:22}];startBattle(game.battle?.bossId||'nyx',Boolean(game.battle?.practice));}
function togglePause(){if(game.battle&&!['gameOver','battleEnd'].includes(game.mode)){game.paused=!game.paused;keys.clear();}}
function phaseFor(b){if(b.routeEnemy)return 1;return Math.min(3,1+Math.floor(Math.max((1-b.bossHp/b.bossMaxHp)*3,b.mercy/36,(b.turn-1)/3)));}
function updateBattlePresentation(dt){
 const b=game.battle;b.clock+=dt;b.damagePopups.forEach(p=>p.life-=dt);b.damagePopups=b.damagePopups.filter(p=>p.life>0);
 if(game.mode==='battleTransform'){b.transformClock+=dt;if(b.transformClock>=1.8)beginEnemyTurn([b.boss.form+' awakens.',...b.pendingLines]);}
 b.pulseFlash=Math.max(0,b.pulseFlash-dt);b.hitFlash=Math.max(0,b.hitFlash-dt);b.bossFlash=Math.max(0,b.bossFlash-dt);b.notice=Math.max(0,b.notice-dt);b.dashCooldown=Math.max(0,b.dashCooldown-dt);b.dashTime=Math.max(0,b.dashTime-dt);
 b.particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;});b.particles=b.particles.filter(p=>p.life>0);
 if(game.mode==='battleCinematic'){
  b.cinematic+=dt;
  if(b.cinematic>=2.5){game.mode='battleIntro';game.message=dialog(b.boss.intro,()=>{game.mode='battleMenu';b.text='Choose your approach. Z confirms. X goes back.';});}
 }
 if(game.mode==='battleTiming'){b.strikeClock+=dt;if(b.strikeClock>=1.65)resolveStrike();}
 if(soundEnabled&&game.mode==='battleDodge'&&Math.floor(b.clock*2)!==b.lastBeat){b.lastBeat=Math.floor(b.clock*2);tone([110,146.83,164.81,130.81][b.lastBeat%4]*(b.phase===3?2:1),.17,.018,'triangle');}
 document.body?.classList.toggle('in-battle',!b.won);
}
function dashSoul(){
 const b=game.battle;if(!b||game.paused||game.mode!=='battleDodge'||b.dashCooldown>0||movementMode(b)==='gravity')return false;
 b.dashCooldown=b.difficulty==='eclipse'?2.1:1.8;b.dashTime=.16;b.invuln=Math.max(b.invuln,.22);emitSparks(b.soul.x,b.soul.y,'#9df5ed',12);tone(740,.12);return true;
}
function emitSparks(x,y,color,count=15){const b=game.battle;if(!b)return;for(let i=0;i<count;i++){const a=i*Math.PI*2/count;b.particles.push({x,y,vx:Math.cos(a)*(45+i%3*35),vy:Math.sin(a)*(45+i%4*22),life:.35+i%4*.12,color});}}
function addBullet(b,x,y,vx,vy,extra={}){if(b.bullets.length>=350)return;b.bullets.push({x,y,vx,vy,r:6,t:0,damage:5,color:'#b8f2ed',...extra});}
function updateBattleDodge(dt){
 const b=game.battle,s=b.soul;updateCombatDynamics(b,dt);b.elapsed+=dt;b.phaseTimer+=dt;if(b.sequence)updateAttackEvolution(b);
 updateSoulMotion(b,dt);b.trail.push({x:s.x,y:s.y});if(b.trail.length>10)b.trail.shift();
 spawnPattern(b,dt);updateSustainedPressure(b,dt);updateAttackHazards(b,dt);if(game.mode!=='battleDodge')return;updateMovementObstacles(b,dt);if(game.mode!=='battleDodge')return;
 for(const bullet of b.bullets){bullet.t+=dt;updateChoreographyProjectile(bullet,b,dt);if(bullet.dead)continue;const frozen=updateSpecialProjectile(bullet,b);if(!frozen&&(!bullet.delay||bullet.t>=bullet.delay)){if(bullet.curve){const a=bullet.curve*dt,vx=bullet.vx;bullet.vx=vx*Math.cos(a)-bullet.vy*Math.sin(a);bullet.vy=vx*Math.sin(a)+bullet.vy*Math.cos(a);}bullet.vy+=(bullet.ay||0)*dt;bullet.x+=bullet.vx*dt;bullet.y+=bullet.vy*dt;}
  const distance=Math.hypot(s.x-bullet.x,s.y-bullet.y);
  if(distance<s.r+bullet.r&&bullet.t>=(bullet.safeTime||0)&&bulletHurts(bullet,b.moving))hurtSoul(bullet.damage);
  else if(distance<26&&!bullet.grazed&&insideArena(bullet,b.box)){bullet.grazed=true;b.graze++;b.resonance=Math.min(100,b.resonance+7);if(b.graze%5===0)tone(880,.045,.015);}
 }
 b.bullets=b.bullets.filter(p=>!p.dead&&p.x>b.box.x-80&&p.x<b.box.x+b.box.w+80&&p.y>b.box.y-90&&p.y<b.box.y+b.box.h+90);
 for(const beam of b.beams){beam.age+=dt;if(beam.age>=beam.warn&&beam.age<beam.warn+beam.active&&(b.bossId==='briar'?rootColumnHits(beam,b):Math.abs(s.x-beam.x)<beam.width/2+s.r))hurtSoul(6);}
 b.beams=b.beams.filter(p=>p.age<p.warn+p.active+.15);
 if(b.phaseTimer>=b.duration&&game.player.hp>0){
  b.bullets=[];b.beams=[];b.hazards=[];b.echo=null;b.livePattern=null;b.stageLabel='';b.cueTimer=0;clearMovementArena(b);if(b.finale){completeNyx();return;}b.turn++;if(!b.hitsThisTurn)b.cleanTurns++;
  b.text=b.hitsThisTurn?'The bell fades. Breathe. Choose your next move.':'Untouched. '+b.boss.short+' gives a small, approving nod.';game.mode='battleMenu';tone(523,.16);
 }
}
function insideArena(p,box){return p.x>=box.x&&p.x<=box.x+box.w&&p.y>=box.y&&p.y<=box.y+box.h;}
function hurtSoul(damage){const b=game.battle;if(b.invuln>0||game.mode!=='battleDodge')return;if(interceptParry())return;game.player.hp=Math.max(0,game.player.hp-Math.max(1,Math.round(damage*b.config.damage)-combatStats(b).defense));b.invuln=b.difficulty==='eclipse'?.6:.78;b.hitFlash=.25;b.hitsThisTurn++;b.totalHits++;b.damagePopups.push({x:b.soul.x,y:b.soul.y-18,text:'−'+Math.max(1,Math.round(damage*b.config.damage)-combatStats(b).defense),color:'#ffbdc8',life:1.2,boss:false});emitSparks(b.soul.x,b.soul.y,'#ff739c',18);tone(75,.2,.06,'sawtooth');if(game.player.hp===0){game.mode='gameOver';b.bullets=[];b.beams=[];b.hazards=[];b.echo=null;b.arenaObstacles=[];game.message=null;}}
function spawnPattern(b,dt){
 b.spawnTick-=dt;if(b.spawnTick>0||b.phaseTimer<(b.stageGraceUntil||0)||b.phaseTimer<(b.grace||.9)||b.phaseTimer>b.duration-.8)return;
 const pattern=activePattern(b),box=b.box,t=b.phaseTimer-(b.stageStart||0),speed=(1+(b.phase-1)*.13)*b.config.speed*randomRange(b,.94,1.06);b.volley=(b.volley||0)+1;const n=b.volley;if(spawnMovementPattern(b,box,t,speed,n)||spawnChoreographedMechanic(b,box,t,speed,n)||spawnDynamicPattern(b,box,t,speed,n)||spawnRivalPattern(b,box,t,speed*(b.awakened?1.1:1),n)){strengthenCadence(b);return;}
 if(pattern==='rain'){
  b.spawnTick=.57;const gap=nextSafeLane(b,8),up=b.variant?.direction<0;
  for(let i=0;i<8;i++)if(Math.abs(i-gap)>(b.phase===1?1:0))addBullet(b,box.x+27+i*53,up?box.y+box.h+18:box.y-18,Math.sin(t)*9,(up?-1:1)*150*speed,{color:'#e6c7ff',r:5});
 }else if(pattern==='lattice'){
  b.spawnTick=.76;const gap=nextSafeLane(b,5);const fromLeft=(n%2===0)!==(b.variant?.direction<0);
  for(let i=0;i<5;i++)if(i!==gap)addBullet(b,fromLeft?box.x-20:box.x+box.w+20,box.y+22+i*42,(fromLeft?1:-1)*180*speed,0,{color:'#ffca83',shape:'diamond'});
 }else if(pattern==='fans'){
  b.spawnTick=.8;const x=randomRange(b,box.x+35,box.x+box.w-35),y=b.variant?.direction<0?box.y+box.h+25:box.y-25,a=Math.atan2(b.soul.y-y,b.soul.x-x);
  for(let i=-2;i<=2;i++)addBullet(b,x,y,Math.cos(a+i*.24)*155*speed,Math.sin(a+i*.24)*155*speed,{color:'#f6a4cb',r:5});
 }else if(pattern==='bells'){
  b.spawnTick=1.05;const safe=nextSafeLane(b,4);
  for(let i=0;i<4;i++)if(i!==safe)b.beams.push({x:box.x+54+i*107,width:43,age:0,warn:.9/b.config.speed,active:.34});
  if(n%2===0)addBullet(b,box.x-15,box.y+box.h*.7,140*speed,0,{color:'#a4f4ed'});
 }else if(pattern==='orbit'){
  b.spawnTick=1.05;const cx=box.x+box.w/2,cy=box.y+box.h/2,gap=nextSafeLane(b,12);
  for(let i=0;i<12;i++)if(i!==gap&&i!==(gap+1)%12){const a=i*Math.PI/6+(b.variant?.angle||0)+t*.13*(b.variant?.direction||1);addBullet(b,cx,cy,Math.cos(a)*106*speed,Math.sin(a)*106*speed,{color:'#c4b3ff',r:5,safeTime:.35});}
 }else if(activePattern(b)==='vortex'){
  b.spawnTick=.53;const a=(b.variant?.angle||0)+t*1.5*(b.variant?.direction||1);
  for(let i=0;i<3;i++){const theta=a+i*Math.PI*2/3;addBullet(b,480+Math.cos(theta)*270,436+Math.sin(theta)*155,-Math.cos(theta)*105*speed,-Math.sin(theta)*70*speed,{color:'#95eaf4',shape:'diamond',r:5});}
  if(n%4===0)b.beams.push({x:b.soul.x,width:34,age:0,warn:1.1,active:.25});
 }else if(pattern==='stillness'){
  b.spawnTick=.65;const x=n%2?box.x-18:box.x+box.w+18;
  for(let i=0;i<6;i++)addBullet(b,x,box.y+15+i*36,(n%2?1:-1)*155*speed,0,{color:'#72edf4',rule:'still',r:7});
  if(n%3===0)addBullet(b,box.x+35+(n*73)%(box.w-70),box.y-15,0,120*speed,{color:'#f6eafa',r:5});
 }else if(pattern==='embers'){
  b.spawnTick=.58;for(let i=0;i<7;i++)addBullet(b,box.x+20+i*64,box.y-20,Math.sin(n)*17,155*speed,{color:'#ffc77d',rule:'move',r:7});
 }else if(pattern==='eclipse'){
  b.spawnTick=.74;const gap=nextSafeLane(b,10);
  for(let i=0;i<10;i++)if(i!==gap&&i!==(gap+1)%10){const a=i*Math.PI/5+(b.variant?.angle||0)+t*.28*(b.variant?.direction||1);addBullet(b,480,425,Math.cos(a)*125*speed,Math.sin(a)*125*speed,{color:i%2?'#efb6fb':'#a3f4ec',r:5,safeTime:.5});}
  if(n%2===0)b.beams.push({x:box.x+45+(n*83)%(box.w-90),width:32,age:0,warn:1.0,active:.3});
 }
 b.spawnTick/=(b.config.density||1)*(b.variant?.tempo||1);strengthenCadence(b);
 if((b.difficulty==='relentless'||b.difficulty==='eclipse')&&b.phase>=2&&n%4===0&&pattern!=='stillness')b.beams.push({x:b.soul.x,width:24,age:0,warn:1.15,active:.22});
}
function selectBattleAction(){
 const b=game.battle;if(game.menuIndex===0){b.strikeClock=0;game.mode='battleTiming';tone(330,.08);}
 else if(game.menuIndex===1||game.menuIndex===2){game.mode='battleSubMenu';game.subMenuIndex=0;}
 else if(b.mercy>=100){if(b.routeEnemy){b.ending='mercy';completeRouteEncounter(b);}else startFinale('mercy');}
 else beginEnemyTurn([b.boss.short+' is not ready. Try different ACT choices to understand this guardian.']);
}
function strikeQuality(b){return Math.max(0,1-Math.abs(b.strikeClock/1.5-.5)*2);}
function resolveStrike(){
 const b=game.battle;if(game.mode!=='battleTiming')return;const q=strikeQuality(b),counter=spendCounter(),damage=Math.round((Math.round(12+q*q*23)+combatStats(b).attack)*(1+counter*.15));if(q>.9)b.perfectStrikes++;b.bossHp=Math.max(0,b.bossHp-damage);b.bossFlash=.5;b.hitStop=.075;b.damagePopups.push({x:480,y:100,text:String(damage)+(q>.9?'!':''),color:q>.9?'#ffe7a4':'#fff0dc',life:1.2,boss:true});emitSparks(480,170,'#ffd388',26);tone(q>.9?880:220,.2,.05,'triangle');
 if(b.bossHp===0){if(b.routeEnemy){b.ending='fight';completeRouteEncounter(b);}else startFinale('fight');return;}
 const lines=[`${q>.9?'Perfect strike':q>.6?'Clean strike':'Glancing strike'} — ${damage} damage.`,b.boss.short+' answers. The room trembles.'];if(!checkBossTransformation(lines))beginEnemyTurn(lines);
}
function selectSubMenu(){
 const b=game.battle;if(game.menuIndex===1){const acts=b.boss.acts;const act=acts[game.subMenuIndex];const repeated=b.usedActs.includes(game.subMenuIndex);const counter=spendCounter();b.mercy=Math.min(100,b.mercy+counter*4+(b.routeEnemy?(repeated?20:50):(repeated?12:22)));if(!repeated)b.usedActs.push(game.subMenuIndex);beginEnemyTurn([act[1],`${repeated?'Your kindness feels familiar.':b.boss.short+' lets another piece of the guard fall.'} Mercy ${b.mercy}%.`]);}
 else if(game.menuIndex===2){if(!game.player.items.length){game.mode='battleMenu';b.text='Your pocket is empty. You still have your dash.';return;}const item=game.player.items.splice(game.subMenuIndex%game.player.items.length,1)[0];const heal=Math.min(item.heal,game.player.maxHp-game.player.hp);game.player.hp+=heal;beginEnemyTurn([`${item.name} restores ${heal} HP.`]);}
}
function beginEnemyTurn(lines){
 const b=game.battle,old=b.phase;b.phase=b.awakened?3:phaseFor(b);b.phaseTimer=0;b.spawnTick=0;b.volley=0;b.bullets=[];b.beams=[];b.hitsThisTurn=0;b.parryTime=0;b.trail=[];b.soul.x=480;b.soul.y=493;b.duration=(b.difficulty==='story'?8:9)+b.phase*1.6;
 const attack=chooseBossAttack(b);b.pattern=attack.id;b.attack=attack;prepareAttackVariation(b);b.duration=attackTurnDuration(b);b.notice=old!==b.phase?2:0;
 game.mode='battleDialog';game.message=dialog([...(old!==b.phase?[`PHASE ${b.phase}: ${b.boss.phases[b.phase-1]}`]:[]),...lines],()=>{game.mode='battleDodge';b.grace=old!==b.phase?1.5:.9;b.notice=old!==b.phase?1.3:0;b.text=attack.hint;b.invuln=Math.max(b.invuln,.8);tone(146.83,.4,.04,'triangle');});
}
function drawBattle(){
 const b=game.battle;if(!b)return;const time=b.clock,colors=b.boss.colors,accent=colors[b.phase-1];
 fillGradient('#080c1d',b.phase===3?'#19203a':'#171226');drawEclipseSanctum(b,time,accent);ctx.save();
 if(b.hitFlash&&!reduceMotion)ctx.translate(Math.sin(time*170)*b.hitFlash*15,Math.cos(time*143)*b.hitFlash*12);
 // Suspended particles and rotating celestial rings make the cellar feel unbound.
 for(let i=0;i<55;i++){const x=(i*137+Math.sin(time*.3+i)*18+W)%W,y=(i*71+time*(8+i%4))%H;ctx.globalAlpha=.15+(Math.sin(i+time)+1)*.16;ctx.fillStyle=accent;ctx.fillRect(x,y,i%7===0?3:1,2);}ctx.globalAlpha=1;
 ctx.save();ctx.translate(480,157);ctx.rotate(reduceMotion?0:time*.08);ctx.strokeStyle=accent+'44';ctx.lineWidth=1;for(const r of [80,100,128]){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();}for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(Math.cos(a)*100,Math.sin(a)*100);ctx.lineTo(Math.cos(a)*128,Math.sin(a)*128);ctx.stroke();}ctx.restore();
 ctx.save();ctx.shadowColor=accent;ctx.shadowBlur=22;if(!drawBossPortrait(b,time))drawCatSprite('nyxBattle',480,233,1.85,'down',Math.sin(time*2)*3,time*4);ctx.restore();
 drawStrikeSlash(b);
 pixelText(b.boss.name.toUpperCase(),44,36,b.bossId==='orrery'?16:20,'#faf2ff');pixelText(b.awakened?b.boss.form.toUpperCase():b.boss.phases[b.phase-1],44,61,11,accent);pixelText(b.routeEnemy?'WOODLAND ENCOUNTER':`PHASE ${b.phase} / 3`,914,36,12,accent,'right');pixelText(b.difficulty.toUpperCase(),914,60,10,'#9ba4c1','right');
 drawBar(42,80,217,6,b.bossHp/b.bossMaxHp,'#ed9bbc','#2d203e');pixelText(`Resolve ${b.bossHp} / ${b.bossMaxHp}`,43,103,11,'#d9bddb');drawBar(741,80,174,6,b.mercy/100,'#efcf86','#302937');pixelText(`Mercy ${b.mercy}%`,914,103,11,'#efd598','right');
 if(game.mode==='battleCinematic'){drawBattleCinematic(b,accent);ctx.restore();return;}if(game.mode==='battleTransform'){drawBossTransformation(b,accent);drawDamagePopups(b);ctx.restore();return;}
 pixelText(game.mode==='battleDodge'?((b.attack?.name||'The eclipse')+(b.echo?' + '+{moonfire:'Moonfire',seedfall:'Seedfall',stardust:'Stardust'}[b.echo]:'')):game.mode==='battleTiming'?'Make your moment count':'THE COTTAGE BETWEEN HEARTBEATS',480,270,18,'#f4e9ff','center');
 if(game.mode==='battleDodge'){pixelText(b.stageLabel||b.text,480,297,b.stageLabel?11:12,'#b6bfd7','center');drawBar(338,311,284,3,Math.max(0,1-b.phaseTimer/b.duration),accent,'#2b2941');}
 else if(!game.message&&game.mode!=='gameOver')pixelText(b.text,480,300,13,'#b6bfd7','center');
 drawBattleBox();
 if(game.mode==='battleDodge'){
  ctx.save();ctx.beginPath();ctx.rect(b.box.x+2,b.box.y+2,b.box.w-4,b.box.h-4);ctx.clip();
  if(b.pattern==='vortex'){ctx.strokeStyle='#8af4ee33';ctx.beginPath();ctx.arc(480,430,30+Math.sin(time*4)*8,0,Math.PI*2);ctx.stroke();}
  drawMovementArena(b);for(const beam of b.beams)drawBossBeam(beam,b);drawAttackHazards(b);
  for(const bullet of b.bullets)drawBullet(bullet);drawSoul();drawParryGuard(b);if(b.pulseFlash){ctx.strokeStyle='#a4ffeb';ctx.lineWidth=3;ctx.beginPath();ctx.arc(b.soul.x,b.soul.y,(1-b.pulseFlash/.4)*150,0,Math.PI*2);ctx.stroke();}ctx.restore();
  if(movementMode(b)==='free'&&b.phaseTimer<(b.grace||.9))pixelText('READ THE PATTERN',480,432,21,accent,'center');drawAttackCue(b);
 }else if(game.mode==='battleTiming')drawStrikeMeter();
 else if(game.mode==='battleMenu'||game.mode==='battleSubMenu'){
  if(game.mode==='battleSubMenu'){
   const entries=game.menuIndex===1?b.boss.acts.map(a=>a[0]):game.player.items.map(x=>`${x.name}  +${x.heal} HP`);
   (entries.length?entries:['No items left']).forEach((name,i)=>{pixelText(`${i===game.subMenuIndex?'›':' '} ${name}`,300,370+i*43,18,i===game.subMenuIndex?'#f5d391':'#babbd3');});
  }else{pixelText(b.mercy>=100?'The guardian is ready. You can SPARE.':'A small heart can still change the room.',480,416,19,b.mercy>=100?'#f5d391':'#dfd1ec','center');pixelText(b.riposte?`COUNTER x${b.riposte}: next FIGHT +${b.riposte*15}% damage or ACT +${b.riposte*4} mercy.`:'Move between actions. Z / Enter to choose.',480,457,12,b.riposte?'#f6d699':'#9199b4','center');}
 }
 for(const p of b.particles){ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);}ctx.globalAlpha=1;
 pixelText(`YOU`,44,566,12,'#aab9c7');drawBar(95,557,190,13,game.player.hp/game.player.maxHp,'#a8efcf','#3b233f');pixelText(`${game.player.hp} / ${game.player.maxHp}`,300,565,14,'#e8edee');
 pixelText(`GRAZE ${b.graze}   ·   PARRY ${b.parries||0} · CLEAN ${b.cleanTurns}`,915,566,11,'#aab9c7','right');
 if(game.mode==='battleDodge'){pixelText(b.parryCooldown>0?'PARRY RECHARGING':b.resonance>=PARRY_COST?'Q / PARRY READY':'PARRY: 40 RESONANCE',675,593,11,b.resonance>=PARRY_COST?'#f7df9d':'#9aaac0','center');drawBar(372,555,135,5,1-b.dashCooldown/1.8,'#8ce6ed','#242e44');pixelText(movementMode(b)==='gravity'?(b.soul.grounded?'SPACE / JUMP READY':'JUMPING'):b.dashCooldown>0?'DASH RECHARGING':'SPACE / DASH READY',440,577,10,'#8ce6ed','center');drawBar(625,555,100,5,b.resonance/100,'#f2cf82','#242e44');pixelText(b.resonance>=100?'E / PULSE READY':`RESONANCE ${Math.floor(b.resonance)}%`,675,577,10,'#f2cf82','center');pixelText(movementHint(b)+' · Q parry · E pulse',480,611,14,'#b7c6db','center');}
 else if(!game.message&&game.mode!=='gameOver')drawBattleMenu();
 drawDamagePopups(b);if(game.mode==='gameOver')drawDefeat();if(b.notice>0&&game.mode==='battleDodge'){ctx.fillStyle='#101324dd';ctx.fillRect(235,370,490,95);pixelText(b.finale?'SURVIVE THE LAST BELL':b.boss.phases[b.phase-1],480,402,23,accent,'center');pixelText(b.finale?'One last pattern. Your ending is waiting.':'The eclipse changes its rhythm.',480,440,14,'#ddd4e8','center');}ctx.restore();
}
function drawBattleCinematic(b,accent){
 const p=clamp(b.cinematic/2.5,0,1),ease=p*p*(3-2*p);ctx.fillStyle=`rgba(3,6,18,${.35+p*.2})`;ctx.fillRect(0,0,W,H);
 const x=480+Math.sin(p*Math.PI*5)*(1-p)*210,y=510-ease*130;ctx.save();ctx.translate(x,y);ctx.scale(1-p*.45,1-p*.45);ctx.shadowColor='#ff8aa6';ctx.shadowBlur=30;drawHeart(0,0,'#ff8aa6');ctx.restore();
 ctx.strokeStyle=accent;ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(480,385,30+(1-p)*330+i*17,16+(1-p)*130+i*9,p*2,0,Math.PI*2);ctx.stroke();}
 pixelText(b.bossId==='briar'?'THE GROVE REMEMBERS YOU':b.bossId==='orrery'?'YOUR HOUR HAS COME':'THE BELL HAS CHOSEN YOU',480,543,26,'#f3e7ff','center');pixelText('Your heart is drawn into the challenge.',480,580,15,'#bcabc9','center');
}
function drawBattleBox(){const b=game.battle,accent=b.boss.colors[b.phase-1];ctx.fillStyle='#070d1ceb';ctx.fillRect(b.box.x,b.box.y,b.box.w,b.box.h);ctx.shadowColor=accent;ctx.shadowBlur=game.mode==='battleDodge'?12:0;ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.strokeRect(b.box.x,b.box.y,b.box.w,b.box.h);ctx.shadowBlur=0;for(let i=0;i<4;i++){const x=i%2?b.box.x+b.box.w:b.box.x,y=i<2?b.box.y:b.box.y+b.box.h;ctx.fillStyle=accent;ctx.fillRect(x-3,y-3,6,6);}}
function drawBullet(p){drawProjectileTrail(p);ctx.save();ctx.translate(p.x,p.y);ctx.shadowColor=p.color;ctx.shadowBlur=9;ctx.fillStyle=p.color;ctx.beginPath();if(p.shape==='gear'||p.shape==='star'){ctx.rotate(p.t*2);for(let i=0;i<16;i++){const a=i*Math.PI/8,r=p.r*(i%2?.6:1.25);if(i===0)ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();}else if(p.shape==='leaf'){ctx.rotate(Math.atan2(p.vy,p.vx));ctx.ellipse(0,0,p.r*1.6,p.r*.65,0,0,Math.PI*2);}else if(p.shape==='diamond'){ctx.moveTo(0,-p.r*1.5);ctx.lineTo(p.r,0);ctx.lineTo(0,p.r*1.5);ctx.lineTo(-p.r,0);ctx.closePath();}else ctx.arc(0,0,p.r,0,Math.PI*2);if(p.rule==='still'){ctx.strokeStyle=p.color;ctx.lineWidth=2;ctx.stroke();}else ctx.fill();if(p.rule==='move'){ctx.strokeStyle='#352818';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-p.r/2,-p.r/2);ctx.lineTo(p.r/2,p.r/2);ctx.stroke();}else{ctx.fillStyle='#fff9';ctx.fillRect(-1,-2,2,2);}ctx.restore();}
function drawHeart(x,y,color){ctx.save();ctx.translate(x,y);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,8);ctx.bezierCurveTo(-17,-4,-8,-15,0,-7);ctx.bezierCurveTo(8,-15,17,-4,0,8);ctx.fill();ctx.restore();}
function drawSoul(){const b=game.battle,color=MODE_INFO[movementMode(b)].color;for(let i=0;i<b.trail.length;i++){ctx.globalAlpha=i/b.trail.length*.2;drawHeart(b.trail[i].x,b.trail[i].y,'#93f2ed');}ctx.globalAlpha=1;ctx.shadowColor=color;ctx.shadowBlur=15;drawHeart(b.soul.x,b.soul.y,b.dashTime>0?'#9df5ed':b.invuln>0&&Math.floor(b.clock*15)%2?'#fff':color);ctx.shadowBlur=0;if(keys.has('shift')){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.soul.x,b.soul.y,2,0,Math.PI*2);ctx.fill();}}
function drawStrikeMeter(){const b=game.battle,x=315,y=410,w=330;pixelText('Z / ENTER TO STRIKE',480,367,17,'#efc7ff','center');ctx.fillStyle='#29263b';ctx.fillRect(x,y,w,28);ctx.fillStyle='#a5eed1';ctx.fillRect(x+w*.46,y, w*.08,28);ctx.fillStyle='#f6d699';ctx.fillRect(x+clamp(b.strikeClock/1.5,0,1)*w-3,y-8,6,44);pixelText('Aim for the mint center.',480,476,13,'#a5b1c5','center');}
function drawBattleMenu(){['FIGHT','ACT','ITEM','SPARE'].forEach((label,i)=>{const x=190+i*148,selected=i===game.menuIndex;ctx.fillStyle=selected?'#edcf9b':'#161b31';roundRect(x,590,136,35,6,true);ctx.strokeStyle=selected?'#edcf9b':'#49506d';ctx.lineWidth=1;ctx.strokeRect(x,590,136,35);ctx.fillStyle=selected?'#17222b':i===3&&game.battle.mercy>=100?'#edd487':'#c3c4da';ctx.font='700 15px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x+68,607);});}
function drawDefeat(){ctx.fillStyle='#060a19e8';ctx.fillRect(190,235,580,345);pixelText('YOUR HEART IS STILL HERE.',480,296,26,'#efbdd9','center');pixelText(game.battle.routeEnemy?'Mallow can bring you home. Your levels and gear are safe.':'The next attempt begins at '+game.battle.boss.short+'.',480,344,17,'#c1c8df','center');pixelText(`You reached phase ${game.battle.phase}. Every pattern can be learned.`,480,384,14,'#9eaec5','center');pixelText('R / Z / ENTER  ·  TRY AGAIN',480,444,19,'#9ce7d3','center');pixelText(`${game.battle.totalHits} hits · ${game.battle.graze} grazes · ${Math.round(game.battle.elapsed)}s survived`,480,488,13,'#9eaec5','center');}
function drawPauseOverlay(){ctx.fillStyle='#080e21df';ctx.fillRect(0,0,W,H);pixelText('TAKE A BREATH',480,275,35,'#eee5fa','center');pixelText('P or Pause / Resume to continue',480,333,18,'#aecfda','center');}
const challengeButton=document.querySelector('#challenge-nyx');
challengeButton?.addEventListener('click',()=>{keys.clear();startBattle(document.querySelector('#boss-select')?.value||'nyx',true);});
if(challengeButton)challengeButton.disabled=false;
document.querySelector('#pause-game')?.addEventListener('click',togglePause);
document.querySelector('#sound-toggle')?.addEventListener('click',event=>{soundEnabled=!soundEnabled;event.currentTarget.textContent=soundEnabled?'Sound on':'Sound off';event.currentTarget.setAttribute('aria-pressed',String(soundEnabled));if(soundEnabled)tone(440,.15);});
document.querySelector('#fullscreen-game')?.addEventListener('click',()=>{const frame=document.querySelector('.game-frame');if(document.fullscreenElement)document.exitFullscreen?.();else frame.requestFullscreen?.().catch(()=>{});});
// Keep the compact interface useful during the expanded encounter.
function syncBattleUI(){
 const b=game.battle;updateMovementUI(b);if(!b){const ui=document.querySelector('#battle-choices');if(ui)ui.hidden=true;const status=document.querySelector('#battle-status');if(status)status.textContent='';return;}
 const node=document.querySelector('#scene-state'),note=document.querySelector('#quest-note');if(node)node.textContent=game.paused?'Paused':game.mode==='gameOver'?'Try again':`${b.boss.short} · ${b.routeEnemy?'Woodland':b.awakened?'Awakened':`Phase ${b.phase}`}`;if(note)note.textContent=game.mode==='battleDodge'?(activePattern(b)==='bargain'&&b.ruleStep>=0?(b.ruleStep%2?'Amber / striped shots: keep moving.':'Cyan / hollow shots: hold still.'):(b.text||b.attack?.hint)+' '+movementHint(b)):'Shift to focus. Space to dash. Z to confirm.';
 const status=document.querySelector('#battle-status');if(status){const text=game.paused?'Paused. Resume when you are ready.':game.mode==='battleCinematic'?'Your heart is being drawn into the encounter.':game.mode==='battleTransform'?b.boss.form+' is awakening.':game.mode==='battleDodge'?`${b.cueTimer>0?b.cue+'. ':''}${MODE_INFO[movementMode(b)].name}. Dodge ${b.attack?.name}. HP ${game.player.hp} of ${game.player.maxHp}.`:game.mode==='battleTiming'?'Time your strike with Z, Enter, or Strike now.':game.mode==='gameOver'?'Defeated. Retry immediately with Z or R.':game.message?game.message.lines[game.message.index]:`Choose your action. Phase ${b.phase}. HP ${game.player.hp}. Mercy ${b.mercy} percent.`;if(status.textContent!==text)status.textContent=text;}
 const ui=document.querySelector('#battle-choices');if(!ui)return;ui.hidden=false;const key=game.mode+':'+game.menuIndex+':'+game.player.items.length+':'+game.paused+':'+(b.resonance>=100)+':'+movementMode(b);if(ui.dataset.mode===key)return;ui.dataset.mode=key;ui.replaceChildren();
 let choices=[];if(game.mode==='battleCinematic'&&!game.paused)choices=[['Skip intro',()=>{b.cinematic=2.5;updateBattlePresentation(0);}]];else if(game.paused)choices=[['Resume',togglePause]];else if(game.message)choices=[['Continue',()=>{game.message.char=game.message.lines[game.message.index].length;handleConfirm();}]];else if(game.mode==='battleMenu')choices=['Fight','Act','Item','Spare'].map((label,i)=>[label,()=>{game.menuIndex=i;selectBattleAction();}]);else if(game.mode==='battleSubMenu')choices=[...(game.menuIndex===1?b.boss.acts.map(a=>a[0]):game.player.items.map(x=>x.name)).map((label,i)=>[label,()=>{game.subMenuIndex=i;selectSubMenu();}]),['Back',handleCancel]];else if(game.mode==='battleTiming')choices=[['Strike now',resolveStrike]];else if(game.mode==='battleDodge')choices=[...(movementMode(b)==='gravity'?[['Jump · Space',()=>requestSoulJump(b)]]:[]),['Resonance pulse · E',pulseSoul]];else if(game.mode==='gameOver')choices=[[b.routeEnemy?'Recover at cottage':'Retry '+b.boss.short,retryBattle]];
 for(const [label,action]of choices){const button=document.createElement('button');button.type='button';button.textContent=label;if(action===pulseSoul)button.disabled=b.resonance<100;button.addEventListener('click',()=>{action();button.blur();syncBattleUI();});ui.appendChild(button);}
}
setInterval(syncBattleUI,100);

// Movement rules are shared by collision tests and the on-screen legend.
function bulletHurts(bullet,moving){return bullet.rule==='still'?moving:bullet.rule==='move'?!moving:true;}
function pulseSoul(){const b=game.battle;if(!b||game.paused||game.mode!=='battleDodge'||b.resonance<100)return false;b.resonance=0;b.pulseFlash=.4;b.arenaObstacles=(b.arenaObstacles||[]).filter(h=>Math.hypot(h.x+h.w/2-b.soul.x,h.y+h.h/2-b.soul.y)>145);b.hazards=(b.hazards||[]).filter(h=>h.type!=='seed'||Math.hypot(h.x-b.soul.x,h.y-b.soul.y)>145);b.invuln=Math.max(b.invuln,.4);b.bullets=b.bullets.filter(p=>Math.hypot(p.x-b.soul.x,p.y-b.soul.y)>145);emitSparks(b.soul.x,b.soul.y,'#a4ffeb',32);tone(660,.3,.06);return true;}
function startFinale(ending){const b=game.battle;b.finale=true;b.ending=ending;b.phase=3;b.pattern=b.boss.finale;b.attack=ATTACKS.find(a=>a.id===b.pattern);prepareAttackVariation(b);b.phaseTimer=0;b.duration=attackTurnDuration(b,true);b.spawnTick=0;b.volley=0;b.bullets=[];b.beams=[];b.soul.x=480;b.soul.y=493;b.notice=1.5;b.hitsThisTurn=0;game.mode='battleDialog';game.message=dialog([b.boss.short+' has one last challenge.','Survive the final pattern. Your ending is waiting.'],()=>{game.mode='battleDodge';b.grace=1.6;b.notice=1.4;b.text=b.attack.hint;b.invuln=1;});}
function completeNyx(){const b=game.battle;if(b.routeEnemy){completeRouteEncounter(b);return;}const grade=b.totalHits===0?'S':b.totalHits<=3?'A':b.totalHits<=8?'B':'C',score=Math.max(0,12000-b.totalHits*700-Math.floor(b.elapsed)*15+b.graze*20+b.perfectStrikes*150+(b.parries||0)*120);const record={score,grade,seconds:Math.round(b.elapsed),hits:b.totalHits,difficulty:b.difficulty};if(!b.formPractice&&!b.patternPractice)try{const key='whiskerfall-boss-records-v2',raw=JSON.parse(localStorage.getItem(key)||'{}'),records=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};if(!Number.isFinite(records[b.bossId+':'+b.difficulty]?.score)||score>records[b.bossId+':'+b.difficulty].score)records[b.bossId+':'+b.difficulty]=record;localStorage.setItem(key,JSON.stringify(records));}catch{}b.recordSaved=!b.formPractice&&!b.patternPractice;updatePersonalBest();const result=document.querySelector('#run-result');if(result){result.hidden=false;result.textContent=`${b.patternPractice?'Attack practice · ':b.formPractice?'Form practice · ':''}Rank ${grade} · ${score.toLocaleString()} points · ${record.hits} hits · ${b.parries||0} parries · ${record.seconds}s · ${b.difficulty}`;}const ending=[b.ending==='mercy'?'You listened through the very last echo. '+b.boss.short+' bows.':b.boss.short+' lowers the guard. The room falls quiet.',`Rank ${grade}. ${b.totalHits} hits. A heart worth remembering.`];if(b.practice){b.won=true;game.mode='battleEnd';game.message=dialog([...ending,'Challenge complete. Choose another guardian in the boss selector.'],()=>{restorePracticeResources(b);game.mode='overworld';game.battle=null;saveAdventure();document.body?.classList.remove('in-battle');});}else winBattle(ending);}

function updatePersonalBest(){const el=document.querySelector('#personal-best');if(!el)return;const difficulty=document.querySelector('#difficulty')?.value||'standard';try{const record=JSON.parse(localStorage.getItem('whiskerfall-boss-records-v2')||'{}')[(document.querySelector('#boss-select')?.value||'nyx')+':'+difficulty];el.textContent=record&&Number.isFinite(record.score)&&['S','A','B','C'].includes(record.grade)?`Personal best · Rank ${record.grade} · ${Math.round(record.score).toLocaleString()} points`:'No clear yet on this difficulty. Make this your first.';}catch{el.textContent='Personal records stay on this device.';}}
document.querySelector('#difficulty')?.addEventListener('change',updatePersonalBest);updatePersonalBest();

document.querySelector('#boss-select')?.addEventListener('change',()=>{const boss=BOSSES[document.querySelector('#boss-select').value]||BOSSES.nyx;if(challengeButton)challengeButton.textContent='Challenge '+boss.short;populateAttackPractice();updatePersonalBest();});
// Start rendering only after every deferred game module has loaded.
initializeAdventure();populateAttackPractice();gameReady=true;requestAnimationFrame(loop);
