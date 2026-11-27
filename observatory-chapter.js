// Chapter three follows Briarhart: a letter, a canal, and a guardian who remembers the sky.
const SIGNAL_NAMES=['Unaligned','Moon','Leaf','Star'];
const CHAPTER_QUEST_IDS=['last-letter','open-sky'];
const previousChapterFlags=freshChapterFlags;
freshChapterFlags=function(){return {...previousChapterFlags(),letterAccepted:false,letterRoute:'',parcelDelivered:false,observatoryOpen:false,lensSteps:[0,0,0],signalSolved:false,orreryDefeated:false};};
Object.assign(game.flags,{letterAccepted:false,letterRoute:'',parcelDelivered:false,observatoryOpen:false,lensSteps:[0,0,0],signalSolved:false,orreryDefeated:false});
for(const [key,file]of Object.entries({canal:'canal-walk-v13.png',observatory:'glass-observatory-v13.png'})){const image=new Image();image.src='assets/'+file;paintedWorld[key]=image;}
TRAIL_GEAR.starCompass={name:'Wayfarer Compass',slot:'trinket',health:4,description:'+4 maximum HP'};
function letterOrder(){return game.flags.letterRoute==='home'?[1,2,3]:[2,3,1];}
function chooseLetterRoute(route){
 if(!game.flags.briarDefeated||game.flags.letterAccepted||!['home','canal'].includes(route))return false;
 game.flags.letterAccepted=true;game.flags.letterRoute=route;saveAdventure();
 return true;
}
function offerPipLetter(){
 if(!cityVoices().includes('Pip')){cityVoices().push('Pip');saveAdventure();}
 if(game.flags.orreryDefeated)return ['Pip has finally emptied the oldest pocket of the postbag.','“There are new letters already. This time, I know the road is open.”'];
 if(game.flags.letterAccepted)return game.flags.parcelDelivered?['“You delivered it? I knew an old letter could still find the right person.”','Tamsin can open the Glass Observatory. Its keeper has been waiting for a reply.']:game.flags.letterRoute==='home'?['“Mallow will know the handwriting. Take the cottage road south.”']:['“Tamsin keeps the canal lanterns. Look for the new path at the east edge of the square.”'];
 setDialog(['Pip holds out a letter sealed with a tiny brass star.','“It is addressed to the keeper of the Glass Observatory. Mallow knew the sender. Tamsin knew the way.”','“You can take it home first, or follow the canal and deliver it directly. Which story should it carry?”'],()=>{
  const panel=document.querySelector('#letter-decision');game.mode='overworld';game.message=null;
  if(panel&&typeof panel.showModal==='function'){game.roomInputLocked=true;keys.clear();panel.showModal();}
  else setDialog(['Mallow waits at the cottage. Tamsin waits along the canal.']);
 });return null;
}
const pipActor=rooms.city.interactables.find(n=>n.name==='Pip'),oldPipTalk=pipActor.talk;
pipActor.talk=()=>game.flags.briarDefeated?offerPipLetter():oldPipTalk();
const mallowActor=rooms.cottage.interactables.find(n=>n.name==='Mallow'),previousMallowTalk=mallowActor.talk;
mallowActor.talk=()=>{
 if(game.flags.letterAccepted&&game.flags.letterRoute==='home'&&!game.flags.parcelDelivered){game.flags.parcelDelivered=true;saveAdventure();return ['Mallow recognizes the faded handwriting before you finish opening the letter.','“That is my old teacher. I thought the observatory had forgotten us.”','Mallow adds a small note beneath the old words: “We kept the cottage light on.”','Take the reply to Tamsin beside the canal boat.'];}
 if(game.flags.orreryDefeated)return ['Mallow has placed a star-shaped lantern beside the soup pot.','“Pip tells me the observatory is open. We have a few years of visiting to catch up on.”'];
 return previousMallowTalk();
};
function talkTamsin(){
 if(game.flags.orreryDefeated)return ['Tamsin lights the last canal lantern.','“For years I thought a keeper was someone who stayed. Perhaps it is someone who makes returning possible.”'];
 if(!game.flags.letterAccepted)return ['Tamsin is checking the lanterns beside the courier boat.','“The observatory is just beyond the bridge, but its door is still asleep. Pip has a letter that might wake it.”'];
 if(game.flags.letterRoute==='home'&&!game.flags.parcelDelivered)return ['“Mallow still lives at the cottage? Let that letter take the long way home. I can keep the boat waiting.”'];
 game.flags.parcelDelivered=true;game.flags.observatoryOpen=true;saveAdventure();
 return ['Tamsin reads the letter twice, then gives you a brass door key.','“The observatory keeper became so afraid of forgetting the sky that every lens turned inward.”',game.flags.letterRoute==='home'?'“Mallow wrote the order down: Moon, Leaf, Star. A night, a shelter, a destination.”':'“The canal keeps the order: Leaf, Star, Moon. A beginning, a journey, a place to rest.”','Cross the bridge. Align the three lenses, then speak with the Living Orrery.'];
}
function turnLens(index){
 if(game.flags.signalSolved)return ['The lens is aligned. Its light reaches the open dome.'];
 game.flags.lensSteps??=[0,0,0];game.flags.lensSteps[index]=(game.flags.lensSteps[index]+1)%4;saveAdventure();
 return [`${['West','Middle','East'][index]} lens: ${SIGNAL_NAMES[game.flags.lensSteps[index]]}.`,'Interact again to turn this lens. Read the keeper’s note beside the star chart if you need the order.'];
}
function readStarChart(){
 const f=game.flags,order=letterOrder(),current=f.lensSteps||[0,0,0];
 if(f.signalSolved)return ['The three lenses share a single beam of starlight.','The Living Orrery is ready to hear your letter.'];
 if(current.every((value,i)=>value===order[i])){f.signalSolved=true;saveAdventure();return ['Moonlight, green light, and starlight cross above the old chart.','The observatory answers with a low, warm chime. The Living Orrery unfolds its hands.','Speak with the keeper beneath the dome.'];}
 return ['The keeper’s note is tucked inside the old star chart.',`From west to east: ${order.map(i=>SIGNAL_NAMES[i]).join(', ')}.`,`The lenses currently read: ${current.map(i=>SIGNAL_NAMES[i]).join(', ')}.`,'Turn each lens at its pedestal, then return to this chart.'];
}
function talkStoryOrrery(){
 if(game.flags.orreryDefeated)return ['The Living Orrery has begun marking visits instead of counting missing stars.','“The first entry says: a small heart, carrying a very late letter.”'];
 if(!game.flags.signalSolved)return ['The Living Orrery turns in place, watching an empty patch of sky.','Three lenses are still looking inward. Tamsin’s note may show you how to turn them toward the world.'];
 setDialog(['You place Pip’s letter on the keeper’s brass hand.',game.flags.letterRoute==='home'?'Mallow’s reply catches the starlight. The keeper holds it gently.':'Tamsin’s lantern reflects in the keeper’s glass eye. The road home is visible again.','“I can remember every star. I had forgotten how to welcome a visitor.”','“Show me how a living heart finds its way through a changing sky.”'],()=>startBattle('orrery',false));return null;
}
rooms.city.exits.push({area:rect(845,431,48,29),to:'canal',spawn:{x:480,y:548,facing:'up'},canTravel:()=>game.flags.briarDefeated,lockedLines:['The canal arch is tangled shut. Briarhart must open the city’s paths first.']});
rooms.canal={name:'Canal Walk',bounds:[rect(64,416,832,190),rect(397,178,202,272)],solids:[rect(226,442,34,22)],exits:[{area:rect(425,601,110,22),to:'city',spawn:{x:823,y:450,facing:'left'}},{area:rect(447,180,68,20),to:'observatory',spawn:{x:480,y:546,facing:'up'},canTravel:()=>game.flags.observatoryOpen,lockedLines:['The station door is still asleep. Tamsin beside the canal boat may know its keeper.']}],interactables:[{name:'Tamsin',area:rect(218,411,55,65),talk:talkTamsin},{name:'Courier bench',area:rect(170,382,132,39),talk:()=>['Some parcels have faded labels. Someone has kept them dry for years.','A small note reads: “A late delivery is still a delivery.”']},{name:'Canal lantern',area:rect(820,382,55,45),talk:()=>['A clear flame sways beside the water.',game.flags.orreryDefeated?'Tamsin has lit both sides of the canal for the first time in years.':'The far bank is still waiting for a light from the observatory.']}]};
rooms.observatory={name:'Glass Observatory',bounds:[rect(110,275,740,323),rect(414,249,185,70)],solids:[rect(128,291,40,22),rect(265,274,45,20),rect(798,289,40,22),rect(459,245,46,27)],exits:[{area:rect(426,593,110,25),to:'canal',spawn:{x:480,y:218,facing:'down'}}],interactables:[{name:'West lens',area:rect(116,257,64,63),talk:()=>turnLens(0)},{name:'Middle lens',area:rect(254,238,66,64),talk:()=>turnLens(1)},{name:'East lens',area:rect(787,256,66,64),talk:()=>turnLens(2)},{name:'Star chart',area:rect(448,339,67,44),talk:readStarChart},{name:'Living Orrery',area:rect(446,210,78,75),talk:talkStoryOrrery}]};
function drawNewChapter(){
 const room=game.room;if(!['canal','observatory'].includes(room))return false;
 if(artReady(paintedWorld[room]))ctx.drawImage(paintedWorld[room],0,0,W,H);else fillGradient('#253f4a','#b2aa89');
 const actors=[{y:game.player.y,draw:drawPlayer}];
 if(room==='canal')actors.push({y:465,draw:()=>{ctx.save();ctx.filter='hue-rotate(24deg)';drawCityActor({name:'Tamsin',x:244,y:465,cell:2});ctx.restore();}});
 else actors.push({y:270,draw:()=>paintCharacter(paintedWorld.rivals,482,270,110,{atlasCell:2,glow:game.flags.signalSolved?'#e7d9a84d':null})});
 for(const actor of actors.sort((a,b)=>a.y-b.y))actor.draw();
 if(room==='canal'){pixelText('VERDANT CROSSING · SOUTH',480,612,13,'#fff1cf','center');pixelText('GLASS OBSERVATORY',480,167,14,'#f5e2b9','center');}
 else{for(const [i,x,y]of [[0,146,328],[1,287,307],[2,814,327]]){ctx.fillStyle='#17222be8';roundRect(x-52,y-13,104,27,8,true);pixelText(SIGNAL_NAMES[(game.flags.lensSteps||[])[i]||0],x,y,13,game.flags.signalSolved?'#bcefc9':'#f3d7a8','center');}pixelText('KEEPER’S STAR CHART',480,391,12,'#e8dab7','center');}
 drawRoomHud();return true;
}
const beforeObservatoryFinish=finishStoryBattle;
finishStoryBattle=function(lines){
 if(game.battle?.bossId!=='orrery')return beforeObservatoryFinish(lines);
 game.flags.orreryDefeated=true;game.battle.won=true;game.mode='battleEnd';
 const ending=game.flags.letterRoute==='home'?'The keeper reads Mallow’s reply. “Then the cottage light was for me.”':'The keeper watches Tamsin’s lantern cross the bridge. “A road can wait without giving up.”';
 game.message=dialog([...lines,ending,'The observatory dome opens. A beam of light follows the canal back to Verdant Crossing.','Pip, Tamsin, and Mallow will have new things to say. Your journey is remembered.'],()=>{game.battle=null;game.mode='overworld';document.body?.classList.remove('in-battle');restAtFountain();changeRoom('observatory',{x:480,y:426,facing:'up'});updateDemoInterface();updateAdventureUI();});
};
JOURNAL_QUESTS.push({id:'last-letter',name:'A letter worth delivering',hint:'Accept Pip’s letter after Briarhart. Visit Mallow or take it directly to Tamsin beside the canal.',xp:18,progress:()=>[game.flags.parcelDelivered?1:0,1]},{id:'open-sky',name:'A window onto the sky',hint:'Align the observatory lenses and resolve the Living Orrery’s story encounter.',xp:30,gear:'starCompass',progress:()=>[game.flags.orreryDefeated?1:0,1]});
const previousObjective=adventureObjective;
adventureObjective=function(){if(!game.flags.briarDefeated)return previousObjective();if(!game.flags.letterAccepted)return 'Speak with Pip in Verdant Crossing about the letter with the brass star.';if(!game.flags.parcelDelivered)return game.flags.letterRoute==='home'?'Bring Pip’s letter to Mallow at the cottage.':'Take the east path from Verdant Crossing and find Tamsin beside the canal boat.';if(!game.flags.observatoryOpen)return 'Bring Mallow’s reply to Tamsin beside the canal boat.';if(!game.flags.signalSolved)return 'Cross the canal bridge, turn the three observatory lenses, then read the keeper’s star chart.';if(!game.flags.orreryDefeated)return 'Meet the Living Orrery beneath the observatory dome.';return 'The observatory is open. Visit Pip, Tamsin, and Mallow, or finish the remaining journal entries.';};
const letterDialog=document.querySelector('#letter-decision');
letterDialog?.addEventListener('keydown',event=>event.stopPropagation());
letterDialog?.addEventListener('cancel',()=>{game.roomInputLocked=false;keys.clear();});
document.querySelectorAll('[data-letter-route]').forEach(button=>button.addEventListener('click',()=>{if(chooseLetterRoute(button.dataset.letterRoute)){letterDialog.close();game.roomInputLocked=false;keys.clear();setDialog([game.flags.letterRoute==='home'?'You tuck the letter safely away. Mallow’s cottage is the first stop.':'You follow the canal lanterns. Tamsin is waiting beside the courier boat.']);}}));
function safeChapterFlags(raw,base){
 const route=raw.letterAccepted===true&&['home','canal'].includes(raw.letterRoute)?raw.letterRoute:'';
 const delivered=Boolean(route)&&raw.parcelDelivered===true,opened=base.briarDefeated&&delivered&&raw.observatoryOpen===true;
 const steps=Array.from({length:3},(_,i)=>Number.isInteger(raw.lensSteps?.[i])&&raw.lensSteps[i]>=0&&raw.lensSteps[i]<=3?raw.lensSteps[i]:0);
 const order=route==='home'?[1,2,3]:[2,3,1],solved=opened&&raw.signalSolved===true&&steps.every((n,i)=>n===order[i]);
 return {letterAccepted:Boolean(route),letterRoute:route,parcelDelivered:delivered,observatoryOpen:opened,lensSteps:steps,signalSolved:solved,orreryDefeated:solved&&raw.orreryDefeated===true};
}

// A visible, isolated chapter preview never writes over the player's adventure.
let chapterPreviewSnapshot=null;
const saveOutsidePreview=saveAdventure;
saveAdventure=function(){if(chapterPreviewSnapshot)return false;return saveOutsidePreview();};
document.querySelector('#observatory-preview')?.addEventListener('click',()=>{
 if(game.battle||chapterPreviewSnapshot)return;
 chapterPreviewSnapshot={player:structuredClone(game.player),flags:structuredClone(game.flags),room:game.room,mode:game.mode,message:game.message,hasAdventureSave:game.hasAdventureSave};
 Object.assign(game.flags,freshChapterFlags(),{bossDefeated:true,cityUnlocked:true,briarDefeated:true,metMallow:true});
 Object.assign(game.player,freshProgress());game.player.xp=180;game.player.level=levelFromXP(180);applyHeroStats();game.player.hp=game.player.maxHp;
 game.message=null;game.mode='overworld';keys.clear();changeRoom('city',{x:480,y:550,facing:'up'});
 document.querySelector('#leave-chapter-preview').hidden=false;
 setDialog(['CHAPTER THREE PREVIEW / Your saved adventure will stay unchanged.','Find Pip, the courier in Verdant Crossing. He has a letter with a brass star.','Use Return to my adventure to leave this preview.']);
});
document.querySelector('#leave-chapter-preview')?.addEventListener('click',()=>{
 if(!chapterPreviewSnapshot)return;const snapshot=chapterPreviewSnapshot;chapterPreviewSnapshot=null;
 game.battle=null;game.paused=false;game.roomInputLocked=false;document.body?.classList.remove('in-battle');keys.clear();Object.assign(game,snapshot);
 document.querySelector('#leave-chapter-preview').hidden=true;updateDemoInterface();updateAdventureUI();
});
const updateBeforeChapter=updateDemoInterface;
updateDemoInterface=function(){updateBeforeChapter();const tag=document.querySelector('.chapter');if(tag&&['canal','observatory'].includes(game.room))tag.textContent='CHAPTER 03 / '+(game.room==='canal'?'THE CANAL LANTERNS':'GLASS OBSERVATORY')+(chapterPreviewSnapshot?' / PREVIEW':'');
 const preview=document.querySelector('#observatory-preview');if(preview)preview.disabled=Boolean(game.battle)||Boolean(chapterPreviewSnapshot);
};
const resetOutsideChapterPreview=resetGame;
resetGame=function(){if(chapterPreviewSnapshot){setDialog(['This is an isolated chapter preview. Choose Return to my adventure before starting a new story.']);return;}return resetOutsideChapterPreview();};

const drawRoomBeforeCanal=drawRoomHud;
drawRoomHud=function(){drawRoomBeforeCanal();if(game.room==='city'&&game.flags.briarDefeated){ctx.fillStyle='#19262fe8';roundRect(780,405,112,25,6,true);pixelText('CANAL WALK →',836,422,11,'#fff0c9','center');}};
const updateWithChapterObjectives=updateDemoInterface;
updateDemoInterface=function(){updateWithChapterObjectives();if(game.battle)return;const note=document.querySelector('#quest-note');if(note&&game.flags.briarDefeated)note.textContent=adventureObjective();if(chapterPreviewSnapshot){const tag=document.querySelector('.chapter');if(tag&&!tag.textContent.includes('PREVIEW'))tag.textContent+=' / PREVIEW';}};
