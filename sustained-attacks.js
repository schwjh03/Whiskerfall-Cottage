// Budget time per movement, so warnings never consume most of its action.
function attackTurnDuration(b,finale=false){
 if(b.routeEnemy)return b.difficulty==='story'?8:10;
 const count=b.sequence?.length||1;
 const movement={story:8,standard:9,relentless:10,eclipse:11}[b.difficulty]||9;
 const active=movement+(b.phase-1)*.45;
 return count===1?Math.max(finale?16:14,active+4):.9+count*(active+1.05);
}
function strengthenCadence(b){
 // The second and third phrases tighten without changing projectile speed.
 const age=b.phaseTimer-(b.stageGraceUntil||b.grace||.9);
 b.spawnTick*=age>6?.82:age>3?.92:1;
}
function updateSustainedPressure(b,dt){
 if(movementMode(b)!=='free')return;
 const pattern=activePattern(b),grace=b.stageGraceUntil||b.grace||.9;
 if(b.phaseTimer<grace+2.3||b.phaseTimer>b.duration-1.3)return;
 if(['bargain','stillness','embers','holdRule','moveRule'].includes(pattern))return;
 // Leave each transition clear; no follow-up survives into another mechanic.
 const next=b.sequence?.length>1?(b.stageIndex+1)/b.sequence.length*(b.duration-(b.grace||.9))+(b.grace||.9):b.duration;
 if(next-b.phaseTimer<1.4)return;
 b.pressureTimer=(b.pressureTimer??0)-dt;if(b.pressureTimer>0)return;
 b.pressureWave=(b.pressureWave||0)+1;
 const sparse=['wisps','sigils','satellites','fracture','moonblades','pendulum','shower','comets','braid'].includes(pattern);
 b.pressureTimer=(sparse?1.75:2.8)+(b.difficulty==='story'?.65:0);
 const palette=attackPalette(b),box=b.box,age=b.phaseTimer-grace;
 const count=age>6&&b.difficulty!=='story'?3:2;
 for(let i=0;i<count;i++){
  const side=(b.pressureWave+i)%2,x=side?box.x-17:box.x+box.w+17;
  const y=box.y+28+((b.pressureWave*53+i*83)%(box.h-56));
  const angle=Math.atan2(b.soul.y-y,b.soul.x-x);
  // A visible, harmless wind-up at the rim precedes the aimed follow-up.
  stageBullet(b,x,y,angle,(sparse?83:68)*b.config.speed,{color:palette.b,r:4,delay:.55,safeTime:.7,curve:(i%2?1:-1)*.08});
 }
}
