// A parry trades resonance and timing for safety, then a choice of counterplay.
const PARRY_COST=40, PARRY_WINDOW=.55, PARRY_COOLDOWN=2.8;
function parrySoul(){
 const b=game.battle;
 if(!b||game.paused||game.mode!=='battleDodge'||b.resonance<PARRY_COST||b.parryCooldown>0)return false;
 b.resonance-=PARRY_COST;b.parryTime=PARRY_WINDOW;b.parryCooldown=PARRY_COOLDOWN;
 emitSparks(b.soul.x,b.soul.y,'#f8e8b8',8);tone(590,.09,.025);return true;
}
function interceptParry(){
 const b=game.battle;if(!b||!(b.parryTime>0))return false;
 b.parryTime=0;b.parries=(b.parries||0)+1;b.riposte=Math.min(3,(b.riposte||0)+1);
 b.invuln=Math.max(b.invuln,.65);b.resonance=Math.min(100,b.resonance+15);b.parryFlash=.5;
 b.damagePopups.push({x:b.soul.x,y:b.soul.y-26,text:'PARRY · COUNTER +1',color:'#ffe5a4',life:1.1,boss:false});
 emitSparks(b.soul.x,b.soul.y,'#ffe3a0',22);tone(980,.14,.035);return true;
}
function spendCounter(){const b=game.battle,value=b?.riposte||0;if(b)b.riposte=0;return value;}
function updateCombatDynamics(b,dt){
 b.parryTime=Math.max(0,(b.parryTime||0)-dt);b.parryCooldown=Math.max(0,(b.parryCooldown||0)-dt);b.parryFlash=Math.max(0,(b.parryFlash||0)-dt);
}
function drawParryGuard(b){
 if(!(b.parryTime>0)&&!(b.parryFlash>0))return;
 ctx.save();ctx.strokeStyle=b.parryFlash>0?'#fff4c8':'#f4cd80';ctx.lineWidth=b.parryFlash>0?4:2;
 ctx.shadowColor='#f4cd80';ctx.shadowBlur=12;
 const radius=b.parryFlash>0?18+(1-b.parryFlash/.5)*30:18;
 ctx.beginPath();ctx.arc(b.soul.x,b.soul.y,radius,0,Math.PI*2);ctx.stroke();ctx.restore();
}

TRAIL_GEAR.trailwarden={name:'Trailwarden Charm',slot:'ward',defense:2,description:'+2 defense'};
const JOURNAL_QUESTS=[
 {id:'first-bell',name:'Beyond the first bell',hint:'Resolve the encounter with Duchess Nyx.',xp:12,progress:()=>[game.flags.bossDefeated?1:0,1]},
 {id:'woodland-guide',name:'Know the woodland',hint:'Meet all six woodland encounters. Fighting and sparing both count.',xp:24,gear:'trailwarden',progress:()=>[(game.flags.routeHistory||[]).length,ROUTE_SPAWNS.length]},
 {id:'city-voices',name:'Voices of the crossing',hint:'Talk to three different residents in Verdant Crossing.',xp:18,progress:()=>[Math.min(3,(game.flags.cityVoices||[]).length),3]}
];
function adventureObjective(){
 const f=game.flags;
 if(!f.metMallow)return 'Find Mallow in the cottage and say hello.';
 if(!f.basementUnlocked)return 'Talk to Mallow about the basement ribbon.';
 if(!f.bossDefeated)return 'Meet Duchess Nyx beneath the cottage.';
 if(!f.briarDefeated)return (f.cityVoices||[]).length<2?'Take the woodland trail to Verdant Crossing and speak with its residents.':'Meet Briarhart at the ivy arch in Verdant Crossing.';
 return 'The crossing is safe. Finish your journal or try another guardian in practice.';
}
function claimQuest(id){
 const quest=JOURNAL_QUESTS.find(q=>q.id===id);
 if(!quest||game.battle||game.mode!=='overworld'||game.message)return false;
 game.flags.questRewards??=[];const [done,total]=quest.progress();
 if(done<total||game.flags.questRewards.includes(id))return false;
 game.flags.questRewards.push(id);const level=grantExperience(quest.xp),gear=quest.gear?grantGear(quest.gear):null;
 saveAdventure();setDialog([`${quest.name}: +${quest.xp} XP.`,...(level?[level]:[]),...(gear?[gear]:[])]);updateQuestJournal();return true;
}
let journalUIKey='';
function updateQuestJournal(){
 const objective=document.querySelector('#quest-objective'),panel=document.querySelector('#quest-list');
 if(objective)objective.textContent=adventureObjective();
 if(!panel||typeof document.createElement!=='function')return;
 const claimed=game.flags.questRewards||[],blocked=Boolean(game.battle)||game.mode!=='overworld'||Boolean(game.message);
 const key=JSON.stringify([JOURNAL_QUESTS.map(q=>q.progress()),claimed,blocked]);if(key===journalUIKey)return;journalUIKey=key;panel.replaceChildren();
 for(const quest of JOURNAL_QUESTS){
  const [done,total]=quest.progress(),row=document.createElement('div'),name=document.createElement('strong'),hint=document.createElement('p'),button=document.createElement('button');
  row.className='journal-quest';name.textContent=`${quest.name} · ${done} / ${total}`;hint.textContent=quest.hint;
  button.type='button';button.textContent=claimed.includes(quest.id)?'Reward collected':done>=total?`Claim ${quest.xp} XP${quest.gear?' + charm':''}`:`Reward: ${quest.xp} XP${quest.gear?' + charm':''}`;
  button.disabled=blocked||done<total||claimed.includes(quest.id);button.addEventListener('click',()=>claimQuest(quest.id));
  row.appendChild(name);row.appendChild(hint);row.appendChild(button);panel.appendChild(row);
 }
}
