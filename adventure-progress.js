const ADVENTURE_SAVE='whiskerfall-adventure-v1';
const LEVEL_XP=[0,40,100,180,280,400];
const TRAIL_GEAR={
 barkCharm:{name:'Bark Charm',slot:'ward',defense:1,description:'+1 defense'},
 bramblePin:{name:'Bramble Pin',slot:'weapon',attack:2,description:'+2 attack'},
 dewLocket:{name:'Dewglass Locket',slot:'trinket',health:3,description:'+3 maximum HP'},
 cedarFang:{name:'Cedar Fang',slot:'weapon',attack:3,description:'+3 attack'}
};
function freshProgress(){return {xp:0,level:1,gear:[],equipped:{}};}
function levelFromXP(xp){return 1+LEVEL_XP.slice(1).filter(threshold=>xp>=threshold).length;}
function heroStats(){const p=game.player;let health=36+(p.level-1)*3,attack=p.level-1,defense=0;for(const id of Object.values(p.equipped||{})){const gear=TRAIL_GEAR[id];if(gear&&p.gear?.includes(id)){health+=gear.health||0;attack+=gear.attack||0;defense+=gear.defense||0;}}return {health,attack,defense};}
function applyHeroStats(){const stats=heroStats();game.player.maxHp=stats.health;game.player.hp=clamp(game.player.hp,0,stats.health);return stats;}
function combatStats(b=game.battle){return b?.practice?{health:36,attack:0,defense:0}:heroStats();}
function refillProvisions(){const extras=game.player.items.filter(item=>!['Warm Milk','Moon Tart'].includes(item.name)).slice(0,4);game.player.items=[{name:'Warm Milk',heal:14},{name:'Moon Tart',heal:22},...extras];}
function grantExperience(amount){const p=game.player,oldLevel=p.level,oldMax=p.maxHp;p.xp=Math.min(400,p.xp+Math.max(0,Math.floor(amount)));p.level=levelFromXP(p.xp);applyHeroStats();if(p.level>oldLevel)p.hp=Math.min(p.maxHp,p.hp+Math.max(0,p.maxHp-oldMax));return p.level>oldLevel?`Level ${p.level}! Maximum HP +${(p.level-oldLevel)*3}; attack +${p.level-oldLevel}.`:null;}
function grantGear(id){const item=TRAIL_GEAR[id],p=game.player;if(!item||p.gear.includes(id))return null;p.gear.push(id);const old=TRAIL_GEAR[p.equipped[item.slot]],value=item.attack||item.defense||item.health||0;if(!old||value>(old.attack||old.defense||old.health||0))p.equipped[item.slot]=id;applyHeroStats();return `${item.name} found: ${item.description}. ${p.equipped[item.slot]===id?'Equipped.':'Available in your pack.'}`;}
function equipGear(id){if(game.battle||game.mode!=='overworld'||!game.player.gear.includes(id)||!TRAIL_GEAR[id])return false;game.player.equipped[TRAIL_GEAR[id].slot]=id;applyHeroStats();saveAdventure();updateAdventureUI();return true;}
function prepareAdventureBattle(practice){
 if(!practice){applyHeroStats();saveAdventure();return null;}
 const snapshot=game.battle?.practiceSnapshot||{hp:game.player.hp,items:game.player.items.map(i=>({...i}))};game.player.maxHp=36;game.player.hp=36;game.player.items=[{name:'Warm Milk',heal:14},{name:'Moon Tart',heal:22}];return snapshot;
}
function restorePracticeResources(b){if(!b?.practiceSnapshot)return;game.player.hp=b.practiceSnapshot.hp;game.player.items=b.practiceSnapshot.items.map(i=>({...i}));applyHeroStats();}
function resetAdventureProgress(){Object.assign(game.player,freshProgress());game.player.maxHp=36;game.player.hp=36;game.flags.routeCleared={};game.flags.trailChest=false;game.flags.routeHistory=[];game.flags.questRewards=[];game.hasAdventureSave=false;try{localStorage.removeItem(ADVENTURE_SAVE);}catch{}updateAdventureUI();}
function safeAdventure(raw){
 if(!raw||typeof raw!=='object'||raw.version!==1)return null;
 const p=raw.player||{},flags=raw.flags||{},xp=Number.isFinite(p.xp)?clamp(Math.floor(p.xp),0,400):0,gear=Array.isArray(p.gear)?[...new Set(p.gear.filter(id=>Object.hasOwn(TRAIL_GEAR,id)))]:[],equipped={};
 for(const slot of ['weapon','ward','trinket']){const id=p.equipped?.[slot];if(gear.includes(id)&&TRAIL_GEAR[id].slot===slot)equipped[slot]=id;}
 const validNames=CITY_RESIDENTS.map(n=>n.name),cityVoices=Array.isArray(flags.cityVoices)?[...new Set(flags.cityVoices.filter(n=>validNames.includes(n)))]:[],routeCleared={};
 for(const spawn of ROUTE_SPAWNS)if(flags.routeCleared?.[spawn.id]===true)routeCleared[spawn.id]=true;
 const cleanFlags={metMallow:flags.metMallow===true,checkedSoup:flags.checkedSoup===true,basementUnlocked:flags.basementUnlocked===true,bossDefeated:flags.bossDefeated===true,cityUnlocked:flags.cityUnlocked===true||flags.bossDefeated===true,cityPreview:flags.cityPreview===true,briarDefeated:flags.briarDefeated===true,metBriar:flags.metBriar===true,cityVoices,routeCleared,routeHistory:[...new Set((Array.isArray(flags.routeHistory)?flags.routeHistory:Object.keys(routeCleared)).filter(id=>ROUTE_SPAWNS.some(s=>s.id===id)))],questRewards:[...new Set((Array.isArray(flags.questRewards)?flags.questRewards:[]).filter(id=>['first-bell','woodland-guide','city-voices'].includes(id)))],trailChest:flags.trailChest===true};
 const items=Array.isArray(p.items)?p.items.filter(i=>i&&['Warm Milk','Moon Tart','Trail Berry'].includes(i.name)).slice(0,6).map(i=>({name:i.name,heal:i.name==='Warm Milk'?14:i.name==='Moon Tart'?22:8})):[];
 const allowed=['cottage',...(cleanFlags.basementUnlocked?['basement']:[]),...(cleanFlags.cityUnlocked?['cedar','briarway','city']:[])],room=allowed.includes(raw.room)?raw.room:'cottage';
 return {player:{xp,level:levelFromXP(xp),gear,equipped,items:items.length?items:[{name:'Warm Milk',heal:14},{name:'Moon Tart',heal:22}],hp:Number.isFinite(p.hp)?clamp(p.hp,1,54):36},flags:cleanFlags,room};
}
function initializeAdventure(){
 Object.assign(game.player,freshProgress());game.flags.routeCleared={};game.flags.trailChest=false;game.flags.routeHistory=[];game.flags.questRewards=[];
 try{const clean=safeAdventure(JSON.parse(localStorage.getItem(ADVENTURE_SAVE)||'null'));if(clean){Object.assign(game.player,clean.player);Object.assign(game.flags,clean.flags);game.room=clean.room;Object.assign(game.player,adventureArrival(clean.room));game.hasAdventureSave=true;}}catch{}
 applyHeroStats();updateAdventureUI();
}
function adventureArrival(room){return {cottage:{x:478,y:478,facing:'up'},basement:{x:478,y:480,facing:'up'},cedar:{x:480,y:540,facing:'up'},briarway:{x:480,y:540,facing:'up'},city:{x:480,y:550,facing:'up'}}[room]||{x:478,y:478,facing:'up'};}
function saveAdventure(){
 if(!gameReady||game.battle)return false;
 try{const p=game.player;localStorage.setItem(ADVENTURE_SAVE,JSON.stringify({version:1,room:game.room,player:{xp:p.xp,gear:p.gear,equipped:p.equipped,hp:p.hp,items:p.items},flags:game.flags}));game.hasAdventureSave=true;return true;}catch{return false;}
}
let adventureUIKey='';
function updateAdventureUI(){
 updateQuestJournal();
 if(!game.player.level)return;const p=game.player,stats=heroStats(),panel=document.querySelector('#adventure-stats');if(!panel)return;
 const next=LEVEL_XP[p.level],text=`Level ${p.level} · ${next===undefined?'Level cap':p.xp+' / '+next+' XP'} · Max HP ${stats.health} · Attack +${stats.attack} · Defense ${stats.defense}`;
 if(panel.textContent!==text)panel.textContent=text;
 const begin=document.querySelector('#begin-story');if(begin&&game.mode==='title')begin.textContent=game.hasAdventureSave?'Continue adventure':'Begin / Continue';
 const bag=document.querySelector('#gear-pack'),key=JSON.stringify([p.gear,p.equipped,Boolean(game.battle),game.mode==='overworld']);if(!bag||typeof document.createElement!=='function'||key===adventureUIKey)return;adventureUIKey=key;bag.replaceChildren();
 if(!p.gear.length){const note=document.createElement('p');note.textContent='Meet woodland creatures to earn XP and equipment. Fighting and sparing grant the same rewards.';bag.appendChild(note);}
 for(const id of p.gear){const gear=TRAIL_GEAR[id],button=document.createElement('button');button.type='button';const equipped=p.equipped[gear.slot]===id;button.textContent=`${gear.name} · ${gear.description}${equipped?' · equipped':''}`;button.disabled=equipped||Boolean(game.battle)||game.mode!=='overworld';button.addEventListener('click',()=>equipGear(id));bag.appendChild(button);}
}
setInterval(updateAdventureUI,300);
