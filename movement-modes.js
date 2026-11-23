// Movement changes are part of authored phrases, with matching arena geometry.
const MOVEMENT_PHRASES={
 nyx_moonwake:['gravity','Moonsteps rise from the broken crescent'],
 nyx_mirrorcourt:['gravity','The mirrors become silver stepping stones'],
 nyx_starlace:['orbit','Follow the starlace around its orbit'],
 nyx_tidalveil:['gravity','The tide lifts a path above its ribbons'],
 nyx_ninthbell:['gravity','Climb above the low bell echoes'],
 nyx_lanternwake:['orbit','Ride the lanterns around the court'],
 nyx_moonfracture:['gravity','The moonshards become a stairway'],
 nyx_royalparadox:['gravity','Stand on the reflections; jump their echoes'],
 nyx_eventide:['orbit','Follow the turning crescent crown'],
 briar_rootlabyrinth:['gravity','The roots rise into living ledges'],
 briar_pollensea:['gravity','Leaf rafts lift you above the pollen'],
 briar_thorncanopy:['gravity','Jump the thorns beneath the canopy'],
 briar_rosecompass:['orbit','Ride the rose compass between its petals'],
 briar_ancientroots:['gravity','Old branches become a climbing path'],
 briar_harvestmoon:['gravity','Climb the boughs above the fallen leaves'],
 briar_glassgarden:['gravity','Jump between the glass blossom shelves'],
 briar_thousandpetals:['orbit','Ride the eye of the petal storm'],
 briar_wildheart:['gravity','The forest grows a path beneath your feet'],
 orrery_hourofglass:['gravity','Climb above the spilling hours'],
 orrery_celestialloom:['orbit','Steer between the loom’s turning spokes'],
 orrery_skippedsecond:['gravity','The frozen seconds become stepping gears'],
 orrery_clockworkmaze:['gravity','Jump between the moving clock shelves'],
 orrery_satellitereign:['orbit','Ride the satellite rails'],
 orrery_backwardsdawn:['gravity','Climb the returning clock hands'],
 orrery_equinox:['orbit','Balance inside the equinox rings'],
 orrery_zerohour:['gravity','Time stops; the clock shelves remain'],
 orrery_infinitehour:['orbit','Ride the broken dial between its stars']
};
const MODE_INFO={free:{name:'FREE HEART',controls:'WASD / ARROWS move · SPACE dash',color:'#ff8eae'},gravity:{name:'GRAVITY HEART',controls:'LEFT / RIGHT move · UP / W / SPACE jump',color:'#a9f0c4'},orbit:{name:'ORBIT HEART',controls:'LEFT / RIGHT turn · UP inward · DOWN outward · SPACE dash',color:'#f4d795'}};
function movementPhrase(mode,label,source=''){return {kind:mode==='gravity'?'platformRun':'orbitRun',mode,label,source};}
function choreographMovement(attack,parts){const phrase=MOVEMENT_PHRASES[attack.id];return parts.map((part,i)=>i===1&&phrase?movementPhrase(phrase[0],phrase[1],part.kind):part);}
function movementMode(b){return b?.arenaMode||'free';}
function movementHint(b){return MODE_INFO[movementMode(b)].controls;}
function enterMovementStage(b,part){
 const mode=part.mode||'free';b.arenaMode=mode;b.platforms=[];b.arenaObstacles=[];b.jumpBuffer=0;b.jumpAssist=0;b.coyote=0;b.jumpHeld=keys.has(' ')||keys.has('arrowup')||keys.has('w');b.dashTime=0;b.trail=[];
 const s=b.soul,box=b.box;s.vy=0;s.grounded=false;s.platformId=null;
 if(mode==='gravity'){
  const floor=box.y+box.h-8;
  b.platforms=[{id:0,baseX:box.x+28,baseY:floor-49,w:104,phase:0},{id:1,baseX:box.x+163,baseY:floor-94,w:104,phase:2},{id:2,baseX:box.x+298,baseY:floor-49,w:104,phase:4}].map(p=>({...p,x:p.baseX,y:p.baseY,oldX:p.baseX,oldY:p.baseY}));
  s.x=box.x+box.w/2;s.y=floor-s.r;s.grounded=true;b.coyote=.1;
 }else if(mode==='orbit'){b.orbit={angle:Math.PI/2,radius:.94};placeOrbitSoul(b);}
 else{s.x=clamp(s.x,box.x+15,box.x+box.w-15);s.y=clamp(s.y,box.y+20,box.y+box.h-20);}
 if(mode!=='free'){b.stageGraceUntil=Math.max(b.stageGraceUntil,b.phaseTimer+1.8);b.invuln=Math.max(b.invuln||0,1.8);}
 updateMovementUI(b);
}
function clearMovementArena(b){b.arenaMode='free';b.platforms=[];b.arenaObstacles=[];b.orbit=null;b.jumpBuffer=0;b.soul.vy=0;b.soul.grounded=false;updateMovementUI(b);}
function requestSoulJump(b=game.battle){if(!b||game.paused||game.mode!=='battleDodge'||movementMode(b)!=='gravity')return false;b.jumpBuffer=.14;b.jumpAssist=.16;return true;}
function updateSoulMotion(b,dt){
 const s=b.soul,oldX=s.x,oldY=s.y;const mode=movementMode(b);
 if(mode==='gravity')moveGravitySoul(b,dt);else if(mode==='orbit')moveOrbitSoul(b,dt);else moveFreeSoul(b,dt);
 b.moving=Math.hypot(s.x-oldX,s.y-oldY)>.001;
}
function moveFreeSoul(b,dt){
 const s=b.soul;let dx=Number(keys.has('arrowright')||keys.has('d'))-Number(keys.has('arrowleft')||keys.has('a')),dy=Number(keys.has('arrowdown')||keys.has('s'))-Number(keys.has('arrowup')||keys.has('w'));
 const length=Math.hypot(dx,dy);if(length){dx/=length;dy/=length;s.dx=dx;s.dy=dy;}
 if(b.dashTime>0){dx=s.dx;dy=s.dy;}
 const speed=b.dashTime>0?650:keys.has('shift')?105:s.speed;s.x+=dx*speed*dt;s.y+=dy*speed*dt;
 if(activePattern(b)==='vortex'&&b.phaseTimer>1){const d=Math.hypot(480-s.x,430-s.y)||1;s.x+=(480-s.x)/d*34*dt;s.y+=(430-s.y)/d*34*dt;}
 s.x=clamp(s.x,b.box.x+9,b.box.x+b.box.w-9);s.y=clamp(s.y,b.box.y+9,b.box.y+b.box.h-9);
}
function moveGravitySoul(b,dt){
 const s=b.soul,box=b.box,t=b.phaseTimer-(b.stageStart||0),floor=box.y+box.h-8;
 for(const p of b.platforms){p.oldX=p.x;p.oldY=p.y;p.x=p.baseX+(b.bossId==='orrery'?Math.sin(t*.85+p.phase)*13:0);p.y=p.baseY+(b.bossId==='orrery'?Math.sin(t*.9+p.phase)*7:0);}
 const support=b.platforms.find(p=>p.id===s.platformId);if(s.grounded&&support){s.x+=support.x-support.oldX;s.y+=support.y-support.oldY;}
 const physical=keys.has(' ')||keys.has('arrowup')||keys.has('w');if(physical&&!b.jumpHeld)b.jumpBuffer=.14;b.jumpHeld=physical;const held=physical||(b.jumpAssist||0)>0;b.jumpAssist=Math.max(0,(b.jumpAssist||0)-dt);
 b.jumpBuffer=Math.max(0,(b.jumpBuffer||0)-dt);b.coyote=s.grounded?.1:Math.max(0,(b.coyote||0)-dt);
 if(b.jumpBuffer>0&&b.coyote>0){s.vy=-365;s.grounded=false;s.platformId=null;b.coyote=0;b.jumpBuffer=0;tone(520,.07,.02,'triangle');}
 if(!held&&s.vy< -175)s.vy=-175;
 const dx=Number(keys.has('arrowright')||keys.has('d'))-Number(keys.has('arrowleft')||keys.has('a'));
 s.x=clamp(s.x+dx*(keys.has('shift')?105:195)*dt,box.x+s.r+3,box.x+box.w-s.r-3);
 const previousBottom=s.y+s.r;s.vy+=950*dt;s.y+=s.vy*dt;s.grounded=false;s.platformId=null;
 if(s.vy>=0){const landings=b.platforms.filter(p=>s.x+s.r>p.x&&s.x-s.r<p.x+p.w&&previousBottom<=p.oldY+2&&s.y+s.r>=p.y).sort((a,c)=>a.y-c.y);const landing=landings[0];if(landing){s.y=landing.y-s.r;s.vy=0;s.grounded=true;s.platformId=landing.id;}else if(s.y+s.r>=floor){s.y=floor-s.r;s.vy=0;s.grounded=true;}}
 if(s.y<box.y+s.r+3){s.y=box.y+s.r+3;s.vy=Math.max(0,s.vy);}
}
function placeOrbitSoul(b){const {angle,radius}=b.orbit,box=b.box;b.soul.x=box.x+box.w/2+Math.cos(angle)*(box.w*.36)*radius;b.soul.y=box.y+box.h/2+Math.sin(angle)*(box.h*.32)*radius;}
function moveOrbitSoul(b,dt){
 const turn=Number(keys.has('arrowright')||keys.has('d'))-Number(keys.has('arrowleft')||keys.has('a')),radial=Number(keys.has('arrowdown')||keys.has('s'))-Number(keys.has('arrowup')||keys.has('w'));
 if(turn)b.orbit.direction=turn;
 b.orbit.angle+=(b.dashTime>0?(b.orbit.direction||1)*6:turn*(keys.has('shift')?1.3:2.5))*dt;b.orbit.radius=clamp(b.orbit.radius+radial*.62*dt,.64,1.13);placeOrbitSoul(b);
}
function spawnMovementPattern(b,box,t,speed,n){
 if(activePattern(b)==='platformRun'){
  b.spawnTick=b.difficulty==='story'?2.35:1.9;const floor=box.y+box.h-8,direction=(Math.floor((n-1)/3)%2? -1:1)*(b.variant?.direction||1),color=attackPalette(b).a;
  if(b.arenaObstacles.length<12)b.arenaObstacles.push({age:0,warn:.85,x:direction>0?box.x-28:box.x+box.w+8,y:floor-17,w:25,h:15,vx:direction*(105+Math.min(22,n*3))*b.config.speed,active:6.5,color});
  if(n>=2){const x=clamp(b.soul.x+randomRange(b,-35,35),box.x+20,box.x+box.w-20);stageBullet(b,x,box.y-18,Math.PI/2,72*speed,{r:4,color:attackPalette(b).b,shape:b.bossId==='briar'?'leaf':b.bossId==='orrery'?'gear':'star'});}
  if(n>=4&&n%2===0)stageBullet(b,box.x+box.w-b.soul.x+box.x,box.y-18,Math.PI/2,61*speed,{r:4});
  b.spawnTick/=(b.config.density||1)*(b.variant?.tempo||1);return true;
 }
 if(activePattern(b)==='orbitRun'){
  b.spawnTick=b.difficulty==='story'?1.7:1.25;const angle=(b.variant?.angle||0)+n*.38*(b.variant?.direction||1),count=8;
  for(let i=0;i<count;i++){if(i===n%count||i===(n+1)%count)continue;stageBullet(b,box.x+box.w/2,box.y+box.h/2,angle+i*Math.PI*2/count,70*speed,{r:4,safeTime:.55,color:i%2?attackPalette(b).a:attackPalette(b).b});}
  if(n>=3&&n%2===0){const ray=b.orbit.angle+(n%4?-.32:.32);addSpecialHazard(b,{type:'blade',x:box.x+box.w/2,y:box.y+box.h/2,angle:ray,length:270,width:8,warn:1.2,active:.28,spin:0,color:attackPalette(b).b});}
  b.spawnTick/=(b.config.density||1)*(b.variant?.tempo||1);return true;
 }
 return false;
}
function obstacleHitsSoul(h,s){const x=clamp(s.x,h.x,h.x+h.w),y=clamp(s.y,h.y,h.y+h.h);return Math.hypot(s.x-x,s.y-y)<s.r;}
function updateMovementObstacles(b,dt){
 for(const h of b.arenaObstacles||[]){h.age+=dt;if(h.age>=h.warn){h.x+=h.vx*dt;if(obstacleHitsSoul(h,b.soul))hurtSoul(5);if(game.mode!=='battleDodge')return;}}
 b.arenaObstacles=(b.arenaObstacles||[]).filter(h=>h.age<h.warn+h.active&&h.x>b.box.x-70&&h.x<b.box.x+b.box.w+70);
}
function drawMovementArena(b){
 const box=b.box,mode=movementMode(b),accent=MODE_INFO[mode].color;
 if(mode==='gravity'){
  const floor=box.y+box.h-8;ctx.save();ctx.fillStyle='#1a2c32';ctx.fillRect(box.x,floor,box.w,8);ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(box.x,floor);ctx.lineTo(box.x+box.w,floor);ctx.stroke();
  for(const p of b.platforms){
   if(b.bossId==='briar'){ctx.fillStyle='#274333';roundRect(p.x,p.y,p.w,12,5,true);ctx.strokeStyle='#a9ce84';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x+4,p.y);ctx.quadraticCurveTo(p.x+p.w/2,p.y-3,p.x+p.w-4,p.y);ctx.stroke();for(let i=0;i<4;i++)botanicalLeaf(p.x+12+i*24,p.y+7,i%2?.6:-.6,5,i%2);}
   else if(b.bossId==='orrery'){ctx.fillStyle='#594b31';roundRect(p.x,p.y,p.w,11,4,true);ctx.strokeStyle='#e7cf88';ctx.lineWidth=2;ctx.strokeRect(p.x+2,p.y,p.w-4,4);for(let i=8;i<p.w;i+=16){ctx.fillStyle='#ba945b';ctx.fillRect(p.x+i,p.y+8,6,6);}}
   else{const light=ctx.createLinearGradient(0,p.y-3,0,p.y+13);light.addColorStop(0,'#e5d9ff');light.addColorStop(.3,'#9588c5');light.addColorStop(1,'#30284a');ctx.fillStyle=light;roundRect(p.x,p.y,p.w,11,5,true);ctx.fillStyle='#fff5';ctx.fillRect(p.x+6,p.y,p.w-12,2);}
  }ctx.restore();
 }
 if(mode==='orbit'){ctx.save();ctx.strokeStyle=accent+'66';ctx.lineWidth=1.5;for(const radius of [.64,.94,1.13]){ctx.setLineDash(radius===.94?[]:[3,7]);ctx.beginPath();ctx.ellipse(box.x+box.w/2,box.y+box.h/2,box.w*.36*radius,box.h*.32*radius,0,0,Math.PI*2);ctx.stroke();}ctx.setLineDash([]);for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.fillStyle=accent+'99';ctx.beginPath();ctx.arc(box.x+box.w/2+Math.cos(a)*box.w*.36,box.y+box.h/2+Math.sin(a)*box.h*.32,2,0,Math.PI*2);ctx.fill();}ctx.restore();}
 for(const h of b.arenaObstacles||[])drawGroundWave(h,b);
 if(b.phaseTimer<(b.stageGraceUntil||0)&&mode!=='free'){ctx.save();ctx.fillStyle='#0b1423eb';roundRect(box.x+16,box.y+12,box.w-32,68,8,true);pixelText(MODE_INFO[mode].name,480,box.y+33,18,accent,'center');pixelText(mode==='gravity'?'UP / W / SPACE: JUMP · LAND ON THE LEDGES':'LEFT / RIGHT: TURN · UP / DOWN: CHANGE ORBIT',480,box.y+61,14,'#eef1e5','center');ctx.restore();}
}
function drawGroundWave(h,b){
 ctx.save();const warning=h.age<h.warn;ctx.globalAlpha=warning?.35+.3*Math.sin(h.age*15):1;const x=warning?(h.vx>0?b.box.x+6:b.box.x+b.box.w-31):h.x,y=h.y;
 if(warning){ctx.strokeStyle='#ffe9bd';ctx.setLineDash([4,5]);ctx.strokeRect(x-4,y-4,h.w+8,h.h+8);ctx.setLineDash([]);}
 if(b.bossId==='briar'){ctx.fillStyle='#71944c';ctx.beginPath();ctx.moveTo(x,y+h.h);ctx.quadraticCurveTo(x+4,y-2,x+9,y+h.h*.4);ctx.quadraticCurveTo(x+17,y-5,x+h.w,y+h.h);ctx.closePath();ctx.fill();ctx.strokeStyle='#c2d99b';ctx.lineWidth=1.5;ctx.stroke();}
 else if(b.bossId==='orrery'){ctx.translate(x+h.w/2,y+h.h/2);ctx.rotate(h.age*(h.vx>0?3:-3));ctx.fillStyle='#e1bf7c';ctx.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?5:8;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.fillStyle='#27424b';ctx.beginPath();ctx.arc(0,0,3,0,Math.PI*2);ctx.fill();}
 else{ctx.shadowColor='#c7a8ff';ctx.shadowBlur=12;const light=ctx.createLinearGradient(0,y,0,y+h.h);light.addColorStop(0,'#eee0ff');light.addColorStop(.5,'#b29fe4');light.addColorStop(1,'#6b59a2');ctx.fillStyle=light;ctx.beginPath();ctx.moveTo(x,y+h.h);ctx.quadraticCurveTo(x+h.w*.5,y-4,x+h.w,y+h.h);ctx.quadraticCurveTo(x+h.w*.5,y+7,x,y+h.h);ctx.fill();}
 ctx.restore();
}
function updateMovementUI(b){
 const mode=b?movementMode(b):'free',button=document.querySelector('[data-key=" "]');if(button&&button.textContent!==(mode==='gravity'?'Jump':'Dash'))button.textContent=mode==='gravity'?'Jump':'Dash';
 const chip=document.querySelector('#movement-state');if(chip){chip.hidden=!b||game.mode!=='battleDodge';if(chip.dataset)chip.dataset.mode=mode;const text=MODE_INFO[mode].name+' · '+MODE_INFO[mode].controls;if(chip.textContent!==text)chip.textContent=text;}
}
