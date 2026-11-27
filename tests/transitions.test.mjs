import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const source=readFileSync(new URL('../game.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../world-art.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../bosses.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../attack-director.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../choreography.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../organic-effects.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../city-chapter.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../sustained-attacks.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../idle-animation.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../movement-modes.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../woodland-journey.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../adventure-progress.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../combat-dynamics.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../observatory-chapter.js',import.meta.url),'utf8')+'\n'+readFileSync(new URL('../battle.js',import.meta.url),'utf8');
function loadGame(){
  const element={addEventListener(){},classList:{add(){},remove(){}},blur(){},textContent:''};
  const gradient={addColorStop(){}};
  const context=new Proxy({createRadialGradient:()=>gradient,createLinearGradient:()=>gradient,measureText:text=>({width:text.length*9})},{get:(target,key)=>target[key]??(()=>{})});
  const canvas={...element,width:960,height:640,getContext:()=>context};
  const sandbox={document:{querySelector:s=>s==='#game'?canvas:element,querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){},setTimeout(){}},Image:class{},requestAnimationFrame(){},setInterval(){},performance:{now:()=>0},console};
  runInNewContext(source+'\n globalThis.api={game,rooms,keys,blocked,playerFeet,updateOverworld,winBattle,handleConfirm,changeRoom,draw,nearestInteractable,startBattle,resetGame,walkAtlasFrame,talkToBriar,talkToResident,CITY_RESIDENTS,enterCity,travelFromCottage};',sandbox);
  const api=sandbox.api;
  api.game.mode='overworld';api.game.flags.basementUnlocked=true;
  return api;
}
function walk(api,key,frames,until=()=>false){
  api.game.roomInputLocked=false;api.keys.clear();api.keys.add(key);
  for(let frame=0;frame<frames;frame++){api.updateOverworld(1/60);if(until())break;}
  api.keys.clear();
}

test('every room arrival is clear of walls and reverse exit triggers',()=>{
  const api=loadGame();
  for(const [origin,room] of Object.entries(api.rooms))for(const exit of room.exits){
    api.changeRoom(exit.to,exit.spawn);
    assert.equal(api.blocked(api.playerFeet()),false,origin+' -> '+exit.to+' must spawn on walkable floor');
    api.updateOverworld(1/60);
    assert.equal(api.game.room,exit.to,'arrival must not immediately bounce into the previous room');
  }
});

test('painted furniture leaves a connected walking route to every story interaction',()=>{
 const api=loadGame();for(const [room,origin]of [['cottage',[468,500]],['basement',[478,480]],['city',[480,550]],['cedar',[480,540]],['briarway',[480,540]],['canal',[480,548]],['observatory',[480,546]]]){
  api.game.room=room;const queue=[origin],seen=new Set([origin.join(',')]),reachable=new Set();
  for(let i=0;i<queue.length;i++){const [x,y]=queue[i];Object.assign(api.game.player,{x,y});for(const facing of ['up','down','left','right']){api.game.player.facing=facing;const target=api.nearestInteractable();if(target)reachable.add(target.name);}
   for(const [dx,dy]of [[8,0],[-8,0],[0,8],[0,-8]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(nx<0||nx>960||ny<0||ny>640||seen.has(key)||api.blocked({x:nx-9,y:ny+8,w:18,h:12}))continue;seen.add(key);queue.push([nx,ny]);}}
  for(const target of api.rooms[room].interactables)assert.ok(reachable.has(target.name),room+': '+target.name+' must be reachable around painted furniture');
 }
});

test('entering the cellar allows immediate movement away from the arrival point',()=>{
  const api=loadGame();Object.assign(api.game.player,{x:478,y:518});
  walk(api,'arrowdown',30,()=>api.game.room==='basement');
  assert.equal(api.game.room,'basement');
  const arrival=api.game.player.y;
  walk(api,'arrowup',12);
  assert.ok(api.game.player.y<arrival-20,'cellar arrival must not trap the player in the bottom wall');
});

test('leaving the cellar returns to the cottage and allows continued movement and re-entry',()=>{
  const api=loadGame();api.game.room='basement';Object.assign(api.game.player,{x:478,y:160,hp:24});
  walk(api,'arrowup',60,()=>api.game.room==='cottage');
  assert.equal(api.game.room,'cottage');assert.equal(api.game.player.hp,24);
  const arrival=api.game.player.y;
  walk(api,'arrowup',20);
  assert.ok(api.game.player.y<arrival-30,'player must be able to walk out of the cottage stairwell');
  walk(api,'arrowdown',80,()=>api.game.room==='basement');
  assert.equal(api.game.room,'basement');assert.equal(api.blocked(api.playerFeet()),false);
});

test('story Nyx returns home with fresh provisions and unlocks the cottage trail map',()=>{
  const api=loadGame();api.game.room='basement';api.game.player.hp=18;
  const items=api.game.player.items;api.game.battle={won:false};
  api.winBattle(['Victory.']);
  for(let line=0;line<12&&api.game.message;line++)api.handleConfirm();
  assert.equal(api.game.room,'cottage','Nyx returns the player to Mallow before the next journey');
  assert.equal(api.game.mode,'overworld');assert.equal(api.game.message,null);assert.equal(api.game.battle,null);
  assert.equal(api.game.flags.bossDefeated,true);assert.equal(api.game.flags.cityUnlocked,true);assert.equal(api.game.player.hp,36);assert.equal(api.game.player.items.length,2);assert.notEqual(api.game.player.items,items);
  assert.equal(api.blocked(api.playerFeet()),false);
  const arrival=api.game.player.y;walk(api,'arrowup',15);assert.ok(api.game.player.y<arrival-20);
  assert.doesNotThrow(()=>api.draw(),'the cottage and trail map render after the battle state is cleared');
});

test('walk cycle follows actual distance, changes all four directions, and stops at walls',()=>{
 const a=loadGame();a.game.room='city';Object.assign(a.game.player,{x:480,y:440,step:0});walk(a,'arrowleft',12);assert.equal(a.game.player.moving,true);assert.ok(a.game.player.step>25);
 for(const [row,facing]of ['down','up','left','right'].entries())assert.deepEqual([0,12,24,36].map(d=>a.walkAtlasFrame(facing,d,true)),[0,1,2,3].map(i=>row*4+i));
 Object.assign(a.game.player,{x:480,y:238,step:0});walk(a,'arrowup',12);assert.equal(a.game.player.moving,false);assert.equal(a.game.player.step,0);assert.equal(a.walkAtlasFrame('up',90,false),5);
});
test('two different city voices unlock Briarhart and repeated conversations do not count twice',()=>{
 const a=loadGame();a.enterCity(true);a.game.message=null;a.game.mode='overworld';a.talkToBriar();assert.equal(a.game.battle,null);
 a.talkToResident(a.CITY_RESIDENTS[0]);a.talkToResident(a.CITY_RESIDENTS[0]);assert.equal(a.game.flags.cityVoices.length,1);a.talkToBriar();assert.equal(a.game.battle,null);
 a.talkToResident(a.CITY_RESIDENTS[1]);a.talkToBriar();for(let i=0;i<10&&a.game.message;i++)a.handleConfirm();assert.equal(a.game.battle.bossId,'briar');assert.equal(a.game.battle.practice,false);
});
test('story Briarhart preserves Nyx victory and returns to a restored city with new dialogue',()=>{
 const a=loadGame();a.game.flags.bossDefeated=true;a.game.flags.cityUnlocked=true;a.startBattle('briar',false);assert.equal(a.game.flags.bossDefeated,true);a.winBattle(['The grove is calm.']);for(let i=0;i<16&&a.game.message;i++)a.handleConfirm();
 assert.equal(a.game.room,'city');assert.equal(a.game.flags.briarDefeated,true);assert.equal(a.game.flags.bossDefeated,true);assert.equal(a.game.battle,null);assert.equal(a.blocked(a.playerFeet()),false);assert.match(a.talkToResident(a.CITY_RESIDENTS[1])[0],/city is safe/);
});
test('city road and unlocked waypoint allow return visits; restart clears chapter progression',()=>{
 const a=loadGame();a.enterCity(true);a.game.message=null;a.game.mode='overworld';Object.assign(a.game.player,{x:480,y:580});walk(a,'arrowdown',30,()=>a.game.room==='briarway');assert.equal(a.game.room,'briarway');walk(a,'arrowdown',180,()=>a.game.room==='cedar');assert.equal(a.game.room,'cedar');walk(a,'arrowdown',180,()=>a.game.room==='cottage');assert.equal(a.game.room,'cottage');assert.equal(a.blocked(a.playerFeet()),false);
 a.travelFromCottage();for(let i=0;i<6&&a.game.message;i++)a.handleConfirm();assert.equal(a.game.room,'cedar');walk(a,'arrowup',180,()=>a.game.room==='briarway');assert.equal(a.game.room,'briarway');walk(a,'arrowup',180,()=>a.game.room==='city');assert.equal(a.game.room,'city');a.game.flags.briarDefeated=true;a.resetGame();assert.equal(a.game.room,'cottage');assert.equal(a.game.flags.cityUnlocked,false);assert.equal(a.game.flags.briarDefeated,false);assert.equal(a.game.flags.cityVoices.length,0);assert.equal(a.game.player.step,0);
});
test('holding a travel direction cannot send a cottage arrival back down the basement stairs',()=>{
 const a=loadGame();a.game.room='cedar';a.game.flags.cityUnlocked=true;Object.assign(a.game.player,{x:480,y:570});a.keys.add('arrowdown');for(let i=0;i<120;i++)a.updateOverworld(1/60);assert.equal(a.game.room,'cottage');assert.equal(a.game.player.y,478);assert.equal(a.game.roomInputLocked,true);assert.equal(a.keys.size,0);
});
