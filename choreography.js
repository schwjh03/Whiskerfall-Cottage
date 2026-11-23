// Authored sequences are separate attacks; random cosmetic variants are not counted.
const stage=(kind,label,extra={})=>({kind,label,...extra});
const CHOREOGRAPHED_ATTACKS=[
 {id:'nyx_moonwake',boss:'nyx',phase:1,name:'Moonwake Procession',stages:[stage('ringGate','Find the crescent opening'),stage('wisps','Bait the silver wisps'),stage('moonblades','Leave the locked moonlines')]},
 {id:'nyx_mirrorcourt',boss:'nyx',phase:1,name:'Mirror Court',stages:[stage('mirrorFans','Two mirrors answer'),stage('braid','Thread the crossing ribbons'),stage('crosscut','The mirrors shatter')]},
 {id:'nyx_starlace',boss:'nyx',phase:1,name:'Starlace Waltz',stages:[stage('braid','Follow the starlace'),stage('ringGate','Step through the moon'),stage('wisps','The stars follow you')]},
 {id:'nyx_tidalveil',boss:'nyx',phase:1,name:'Tidal Veil',stages:[stage('tide','Ride the rising tide'),stage('sigils','Leave the marked pools'),stage('returnFans','The tide comes back')]},
 {id:'nyx_ninthbell',boss:'nyx',phase:2,name:'The Ninth Bell',stages:[stage('sigils','The bells mark your footsteps'),stage('crosscut','Silver bells cut across'),stage('bells','Find the silent column')]},
 {id:'nyx_lanternwake',boss:'nyx',phase:2,name:'Lantern Wake',stages:[stage('satellites','Lanterns circle the room'),stage('wisps','Their lights begin to follow'),stage('holdRule','Hollow cyan: be still')]},
 {id:'nyx_moonfracture',boss:'nyx',phase:2,name:'Fractured Moon',stages:[stage('fracture','Moonshards split apart'),stage('moveRule','Striped amber: keep moving'),stage('ringGate','Find the broken crescent')]},
 {id:'nyx_royalparadox',boss:'nyx',phase:3,name:'Royal Paradox',stages:[stage('mirrorFans','Watch both reflections'),stage('returnFans','Reflections turn back'),stage('crosscut','Step out of the final cut')]},
 {id:'nyx_eventide',boss:'nyx',phase:3,name:'Eventide Coronation',stages:[stage('ringGate','The crown opens'),stage('moonblades','The crown cuts'),stage('satellites','The crown becomes a constellation')]},
 {id:'briar_rootlabyrinth',boss:'briar',phase:1,name:'Root Labyrinth',stages:[stage('roots','Read the waking roots'),stage('brambles','Follow the living opening'),stage('ringGate','Step through the blossom ring')]},
 {id:'briar_pollensea',boss:'briar',phase:1,name:'Pollen Sea',stages:[stage('sigils','Leave the pollen beds'),stage('tide','A breeze moves the spores'),stage('wisps','The seeds seek warmth')]},
 {id:'briar_thorncanopy',boss:'briar',phase:1,name:'Thorn Canopy',stages:[stage('shower','The canopy sheds its thorns'),stage('crosscut','Roots sweep the clearing'),stage('seedburst','Watch the buds open')]},
 {id:'briar_rosecompass',boss:'briar',phase:1,name:'Rose Compass',stages:[stage('ringGate','Find the missing petal'),stage('mirrorFans','Two branches point inward'),stage('satellites','The roses orbit you')]},
 {id:'briar_ancientroots',boss:'briar',phase:2,name:'Ancient Roots',stages:[stage('pendulum','Old branches swing'),stage('sigils','The forest marks the ground'),stage('brambles','The undergrowth crosses')]},
 {id:'briar_harvestmoon',boss:'briar',phase:2,name:'Harvest Moon',stages:[stage('returnFans','Leaves return to their branches'),stage('seedburst','The harvest falls'),stage('ringGate','A final flower opens')]},
 {id:'briar_glassgarden',boss:'briar',phase:2,name:'Glass Garden',stages:[stage('sigils','Glass buds mark your path'),stage('crosscut','Briars cross the garden'),stage('fracture','The buds break into petals')]},
 {id:'briar_thousandpetals',boss:'briar',phase:3,name:'Thousand-Petal Storm',stages:[stage('braid','Petals weave together'),stage('tide','The wind turns'),stage('satellites','The storm becomes a spiral')]},
 {id:'briar_wildheart',boss:'briar',phase:3,name:'Heart of the Wild',stages:[stage('ringGate','Hear the forest heartbeat'),stage('seedburst','New growth follows your steps'),stage('brambles','Find the path home')]},
 {id:'orrery_hourofglass',boss:'orrery',phase:1,name:'Hourglass Collapse',stages:[stage('sand','Follow the falling hours'),stage('tide','The hourglass turns'),stage('crosscut','Clock hands cross')]},
 {id:'orrery_celestialloom',boss:'orrery',phase:1,name:'Celestial Loom',stages:[stage('satellites','The gears find their orbits'),stage('braid','Comets stitch the sky'),stage('pendulum','The loom swings shut')]},
 {id:'orrery_skippedsecond',boss:'orrery',phase:1,name:'The Skipped Second',stages:[stage('sigils','The clock remembers your steps'),stage('timewarp','A second pauses'),stage('shower','The lost time falls')]},
 {id:'orrery_clockworkmaze',boss:'orrery',phase:1,name:'Clockwork Maze',stages:[stage('bells','Find the unlocked corridor'),stage('crosscut','The corridor rotates'),stage('ringGate','Leave through the broken gear')]},
 {id:'orrery_satellitereign',boss:'orrery',phase:2,name:'Satellite Reign',stages:[stage('satellites','The small moons align'),stage('mirrorFans','Their paths intersect'),stage('comets','The satellites fall')]},
 {id:'orrery_backwardsdawn',boss:'orrery',phase:2,name:'Backwards Dawn',stages:[stage('returnFans','Dawn runs backward'),stage('pendulum','Follow the returning hand'),stage('moonblades','Time locks onto you')]},
 {id:'orrery_equinox',boss:'orrery',phase:2,name:'Equinox Engine',stages:[stage('crosscut','Balance the two hands'),stage('ringGate','Find the open orbit'),stage('sand','The hours drain away')]},
 {id:'orrery_zerohour',boss:'orrery',phase:3,name:'Zero Hour',stages:[stage('timewarp','The clock stops'),stage('moonblades','One hand still remembers'),stage('shower','Every second falls at once')]},
 {id:'orrery_infinitehour',boss:'orrery',phase:3,name:'Infinite Hour',stages:[stage('fracture','The dial breaks into stars'),stage('satellites','The pieces find new orbits'),stage('pendulum','The last hand keeps moving')]}
].map(a=>({...a,hint:a.stages[0].label+'. Watch for a warning before each new movement.'}));
function activePattern(b){return b.livePattern||b.pattern;}
function sequenceFor(b){if(b.routeEnemy)return [stage(b.pattern,b.attack?.hint||'Read the woodland pattern')];if(b.mechanicPractice)return [movementPhrase(b.mechanicPractice,b.mechanicPractice==='gravity'?'Practice jumping and landing on the ledges':'Practice steering between the orbit tracks')];const authored=CHOREOGRAPHED_ATTACKS.find(a=>a.id===b.pattern);if(authored)return choreographMovement(authored,authored.stages);
 if(b.forcedAttackId||b.phase===1)return [stage(b.pattern,b.attack?.hint||'Read the pattern')];
 const pools={nyx:['moonblades','orbit','fans','bells'],briar:['roots','petals','seedburst','brambles'],orrery:['gears','comets','pendulum','timewarp']},pool=pools[b.bossId].filter(id=>id!==b.pattern),next=pool[randomIndex(b,pool.length)];
 const mode=b.bossId==='orrery'?'orbit':'gravity';const stages=[stage(b.pattern,b.attack?.hint||'Read the opening'),movementPhrase(mode,mode==='gravity'?'The arena grows stepping stones. Jump the low waves.':'The clock turns into an orbit. Steer between its spokes.',next)];if(b.awakened&&b.difficulty==='eclipse'){const third=pool.filter(id=>id!==next)[randomIndex(b,pool.length-1)];stages.push(stage(third,ATTACKS.find(a=>a.id===third).hint));}return stages;
}
function prepareEvolution(b){b.sequence=sequenceFor(b);b.stageIndex=-1;b.stageStart=0;b.stageGraceUntil=0;b.livePattern=null;b.stageLabel='';b.shiftWarned=-1;if(b.sequence.length>1)b.echo=null;}
function updateAttackEvolution(b){
 if(!b.sequence)prepareEvolution(b);const grace=b.grace||.9,progress=clamp((b.phaseTimer-grace)/(b.duration-grace),0,.999999),index=Math.min(b.sequence.length-1,Math.floor(progress*b.sequence.length));
 if(index!==b.stageIndex){const part=b.sequence[index];b.stageIndex=index;b.livePattern=part.kind;b.stageSpec=part;b.stageStart=b.phaseTimer;b.pressureTimer=2.2;b.pressureWave=0;b.stageGraceUntil=b.phaseTimer+(index===0?grace:1.05);b.bullets=[];b.beams=[];b.hazards=[];b.spawnTick=0;b.volley=0;b.safeLanes={};b.ruleStep=-1;b.variant.direction=index===0?b.variant.direction:-b.variant.direction;b.stageLabel=b.sequence.length>1?`Movement ${index+1} / ${b.sequence.length} · ${part.label}`:'';b.text=part.label;const compatible=!['bargain','stillness','embers','holdRule','moveRule'].includes(part.kind);b.echo=b.phase===3&&['relentless','eclipse'].includes(b.difficulty)&&compatible&&battleRandom(b)<.45?{nyx:'moonfire',briar:'seedfall',orrery:'stardust'}[b.bossId]:null;b.echoTimer=2.6;enterMovementStage(b,part);if(part.mode)b.echo=null;if(index>0){cueAttack(b,part.mode?MODE_INFO[part.mode].name+' · '+(part.mode==='gravity'?'UP / SPACE JUMP':'LEFT / RIGHT TURN'):'FREE HEART · '+part.label,part.mode?1.8:1.05);emitSparks(480,432,b.boss.colors[b.phase-1],20);tone(392, .18,.025,'triangle');}}
 const next=(index+1)/b.sequence.length*(b.duration-grace)+grace;if(index<b.sequence.length-1&&next-b.phaseTimer<.7&&b.shiftWarned!==index){b.shiftWarned=index;cueAttack(b,'A NEW MOVEMENT IS COMING · '+MODE_INFO[b.sequence[index+1].mode||'free'].name,.7);}
}
function attackPalette(b){return b.bossId==='briar'?{a:'#a9db91',b:'#f0d6a0',shape:'leaf'}:b.bossId==='orrery'?{a:'#b6ddff',b:'#f1d28c',shape:'gear'}:{a:'#d3b9fa',b:'#f2b6dc',shape:'star'};}
function stageBullet(b,x,y,angle,speed,extra={}){const p=attackPalette(b);addBullet(b,x,y,Math.cos(angle)*speed,Math.sin(angle)*speed,{r:5,shape:p.shape,color:p.a,...extra});}
function spawnChoreographedMechanic(b,box,t,speed,n){
 const kind=activePattern(b),p=attackPalette(b),dir=b.variant?.direction||1;
 if(kind==='ringGate'){
  b.spawnTick=1.7;const x=box.x+box.w*.5,y=box.y+box.h*.5,gap=randomRange(b,-Math.PI,Math.PI);addSpecialHazard(b,{type:'ringGate',x,y,gap,gapWidth:1.25,radius:12,growth:72*speed,width:8,warn:.85,active:2.7,color:p.a});
 }else if(kind==='wisps'){
  b.spawnTick=1.1;for(const side of [-1,1]){const x=side<0?box.x-15:box.x+box.w+15,y=randomRange(b,box.y+20,box.y+box.h-20),a=Math.atan2(b.soul.y-y,b.soul.x-x);stageBullet(b,x,y,a,95*speed,{homing:.6,homeFor:1.15,color:p.b,safeTime:.25});}
 }else if(kind==='mirrorFans'){
  b.spawnTick=1.15;const y=box.y+25+(n%3)*(box.h-50)/2;for(const side of [-1,1]){const x=side<0?box.x-20:box.x+box.w+20,a=Math.atan2(b.soul.y-y,b.soul.x-x);for(let i=-1;i<=1;i++)stageBullet(b,x,y,a+i*.28,105*speed);}
 }else if(kind==='braid'){
  b.spawnTick=.48;for(const side of [-1,1]){const x=side<0?box.x-18:box.x+box.w+18,y=box.y+box.h*.5+Math.sin(n*.7)*55;stageBullet(b,x,y,side<0?0:Math.PI,135*speed,{curve:side*.3,color:side<0?p.a:p.b});}
 }else if(kind==='tide'){
  b.spawnTick=.7;const gap=nextSafeLane(b,7),up=dir<0;for(let i=0;i<7;i++)if(Math.abs(i-gap)>0)stageBullet(b,box.x+28+i*62,up?box.y+box.h+15:box.y-15,up?-Math.PI/2:Math.PI/2,115*speed,{curve:Math.sin(n)*.1});
 }else if(kind==='sigils'){
  b.spawnTick=t>4?1.05:1.3;addSpecialHazard(b,{type:'sigil',x:clamp(b.soul.x+randomRange(b,-24,24),box.x+32,box.x+box.w-32),y:clamp(b.soul.y+randomRange(b,-18,18),box.y+32,box.y+box.h-32),r:27,warn:1.15,active:.6,color:p.a});
 }else if(kind==='returnFans'){
  b.spawnTick=1.45;const gap=nextSafeLane(b,9);for(let i=0;i<9;i++)if(i!==gap&&i!==(gap+1)%9)stageBullet(b,480,430,i*Math.PI*2/9+(b.variant?.angle||0),86*speed,{safeTime:.45,reverseAt:.9,freezeFor:.4,color:p.b});
 }else if(kind==='crosscut'){
  b.spawnTick=1.5;const left=n%2===0,x=left?box.x-20:box.x+box.w+20,y=n%3===0?box.y+box.h+15:box.y-15,a=Math.atan2(b.soul.y-y,b.soul.x-x);addSpecialHazard(b,{type:'blade',x,y,angle:a,length:550,width:11,warn:1.1,active:.4,spin:0,color:p.a});
 }else if(kind==='satellites'){
  b.spawnTick=.8;const a=t*.9*dir+(b.variant?.angle||0);for(let i=0;i<(t>4?3:2);i++){const theta=a+i*Math.PI*2/(t>4?3:2),x=480+Math.cos(theta)*150,y=432+Math.sin(theta)*68;addSpecialHazard(b,{type:'satellite',x,y,r:9,warn:.55,active:.25,color:p.b,angle:Math.atan2(b.soul.y-y,b.soul.x-x),speed:105*speed});}
 }else if(kind==='holdRule'||kind==='moveRule'){
  b.spawnTick=.65;const rule=kind==='holdRule'?'still':'move',x=dir>0?box.x-18:box.x+box.w+18;for(let i=0;i<6;i++)stageBullet(b,x,box.y+17+i*35,dir>0?0:Math.PI,120*speed,{rule,shape:'circle',color:rule==='still'?'#72edf4':'#ffc77d',r:6});
 }else if(kind==='fracture'){
  b.spawnTick=1.15;const x=randomRange(b,box.x+55,box.x+box.w-55);stageBullet(b,x,box.y-20,Math.PI/2,80*speed,{splitAt:.8,splitCount:5,splitSpeed:90*speed,color:p.b,r:8});
 }else if(kind==='shower'){
  b.spawnTick=t>4?.3:.4;const x=randomRange(b,box.x+20,box.x+box.w-20);stageBullet(b,x,box.y-18,Math.PI/2+Math.sin(n)*.25,55*speed,{ay:120*speed,color:p.b});
 }else if(kind==='sand'){
  b.spawnTick=.6;const gap=nextSafeLane(b,8);for(let i=0;i<8;i++)if(Math.abs(i-gap)>1)stageBullet(b,box.x+24+i*54,box.y-15,Math.PI/2+Math.sin(n*.5)*.12,130*speed,{r:4,shape:'diamond'});
 }else return false;
 b.spawnTick/=(b.config.density||1)*(b.variant?.tempo||1);return true;
}
function updateChoreographyProjectile(p,b,dt){
 if(p.homing&&p.t<p.homeFor){const target=Math.atan2(b.soul.y-p.y,b.soul.x-p.x),angle=Math.atan2(p.vy,p.vx),delta=Math.atan2(Math.sin(target-angle),Math.cos(target-angle)),turn=clamp(delta,-p.homing*dt,p.homing*dt),speed=Math.hypot(p.vx,p.vy);p.vx=Math.cos(angle+turn)*speed;p.vy=Math.sin(angle+turn)*speed;}
 if(p.splitAt&&!p.split&&p.t>=p.splitAt){p.split=true;p.dead=true;emitSparks(p.x,p.y,p.color,9);for(let i=0;i<p.splitCount;i++){const angle=Math.PI*.1+i*Math.PI*.8/(p.splitCount-1);stageBullet(b,p.x,p.y,angle,p.splitSpeed,{color:p.color,r:4,safeTime:.2});}}
}
function updateChoreographyHazard(h,b){if(h.type==='satellite'&&!h.fired&&h.age>=h.warn){h.fired=true;stageBullet(b,h.x,h.y,h.angle,h.speed,{color:h.color,safeTime:.2});}}
