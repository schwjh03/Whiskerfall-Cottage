// Chapter two follows the story encounter, never a practice victory.
const CITY_RESIDENTS=[
 {name:'Juniper',x:355,y:336,cell:0,lines:['Juniper brushes a leaf from your scarf.','"Briarhart grew these vines to shelter us when the city fell silent."','"Now the roots cannot tell a visitor from a threat. Please listen to him."'],after:['"The flowers have opened again. He heard you, little traveler."']},
 {name:'Pip',x:604,y:432,cell:1,lines:['Pip checks a satchel full of undelivered letters.','"The gatekeeper has been waiting for news from the cottage."','"Tell Briarhart that Nyx rang the bell. We are still here."'],after:['"First letter delivered: the city is safe. The next one is for Mallow!"']},
 {name:'Rowan',x:165,y:448,cell:2,lines:['Rowan lifts a small lantern toward the arch.','"That is Briarhart. He remembers the city before the ivy."','"Two voices from the square should remind him why he guards it."'],after:['"A guardian can learn to open a gate, too."']},
 {name:'Marigold',x:794,y:456,cell:3,lines:['Marigold offers a tiny white flower.','"There are paths between the thorns. Watch for them when he tests you."','"Rest at the fountain before you go. Even brave hearts need water."'],after:['"A new season! I should plant something outrageously colorful."']}
];
for(const [key,file]of Object.entries({city:'city-overgrown-v8.png',walk:'player-walk-v8.png',folk:'city-folk-v8.png'})){const image=new Image();image.src='assets/'+file;paintedWorld[key]=image;}
function freshChapterFlags(){return {cityUnlocked:false,cityPreview:false,briarDefeated:false,metBriar:false,cityVoices:[]};}
Object.assign(game.flags,freshChapterFlags());
function cityVoices(){return game.flags.cityVoices??=[];}
function talkToResident(resident){if(!cityVoices().includes(resident.name))cityVoices().push(resident.name);return game.flags.briarDefeated?resident.after:resident.lines;}
function talkToBriar(){
 if(game.flags.briarDefeated)return ['Briarhart rests beneath the living arch.','"The city has room for another story. Walk gently, little heart."'];
 game.flags.metBriar=true;
 if(cityVoices().length<2)return ['Briarhart lowers his antlers. The ivy tightens around the arch.','"Nyx sent you? Before I hear your heart, hear the people I protect."','Speak with two residents in the square, then return to Briarhart.'];
 setDialog(['You tell Briarhart what the city remembers.','"Then let me hear the courage beneath those words."','The roots part. Briarhart invites you into the heart of the grove.'],()=>startBattle('briar',false));return null;
}
function restAtFountain(){game.player.hp=game.player.maxHp;refillProvisions();saveAdventure();return ['Cool water runs over the old stone paws.','Your HP and provisions are restored. The city gives you a moment to breathe.'];}
rooms.city={name:'Verdant Crossing',bounds:[rect(64,246,832,250),rect(363,210,226,80),rect(368,475,220,165)],solids:[rect(128,291,203,104),rect(650,248,171,138),rect(64,482,300,24),rect(588,482,308,24),...CITY_RESIDENTS.map(n=>rect(n.x-15,n.y-4,30,20)),rect(452,226,56,28)],exits:[{area:rect(425,603,110,23),to:'cottage',spawn:{x:478,y:478,facing:'up'}}],interactables:[
 ...CITY_RESIDENTS.map(n=>({name:n.name,area:rect(n.x-22,n.y-28,44,48),talk:()=>talkToResident(n)})),
 {name:'Briarhart',area:rect(447,208,66,55),talk:talkToBriar},
 {name:'Fountain',area:rect(128,291,203,104),talk:restAtFountain}
]};
const cottageMallow=rooms.cottage.interactables.find(n=>n.name==='Mallow'),oldMallowTalk=cottageMallow.talk;
cottageMallow.talk=()=>game.flags.briarDefeated?['Mallow reads a letter tied with a green ribbon.','"Pip says the city is safe. I knew your little heart would find its way."']:game.flags.bossDefeated?['"I heard Nyx ring the bell. The road to Verdant Crossing is open again."','"The trail map beside the bookshelves shows the woodland road. Briarhart is waiting beyond it."']:oldMallowTalk();
function enterCity(preview=false){
 if(!preview)return travelFromCottage();
 if(game.battle||(!preview&&!game.flags.cityUnlocked))return;
 if(preview){game.flags.cityPreview=true;game.flags.cityUnlocked=true;game.flags.basementUnlocked=true;}
 game.message=null;game.paused=false;game.mode='overworld';changeRoom('city',{x:480,y:550,facing:'up'});updateDemoInterface();
 if(preview)setDialog(['CHAPTER TWO PREVIEW · Verdant Crossing','In the story, Nyx opens this road after your encounter. This shortcut lets you explore the next chapter.','Meet the residents, rest at the fountain, then find Briarhart beneath the arch.']);
}
function finishStoryBattle(lines){
 const bossId=game.battle?.bossId||'nyx';game.battle.won=true;game.mode='battleEnd';
 if(bossId==='briar'){
  game.flags.briarDefeated=true;
  game.message=dialog([...lines,'Briarhart lifts his crown. The vines loosen their hold on the square.','"A city is more than its walls. Thank you for remembering its people."','Return to Verdant Crossing. The residents have something new to tell you.'],()=>{game.battle=null;game.mode='overworld';changeRoom('city',{x:480,y:294,facing:'down'});updateDemoInterface();});
 }else{
  game.flags.bossDefeated=true;game.flags.cityUnlocked=true;game.flags.cityPreview=false;
  game.message=dialog([...lines,'Nyx rings the bell. Beyond the cottage, a road wakes beneath the ivy.','"Follow it to Verdant Crossing. Briarhart has kept the gate closed for too long."','Return to Mallow in the cottage. Your HP and provisions are restored. Use the trail map beside the bookshelves when you are ready.'],()=>{game.battle=null;game.mode='overworld';restAtFountain();changeRoom('cottage',{x:478,y:478,facing:'up'});updateDemoInterface();});
 }
}
function walkAtlasFrame(facing,distance,moving){return ({down:0,up:1,left:2,right:3}[facing]??0)*4+(moving?Math.floor(distance/12)%4:1);}
function drawWalkingPlayer(x,y,scale,facing,distance,moving){
 if(!moving&&typeof drawIdlePlayer==='function'&&drawIdlePlayer(x,y,scale,facing))return true;
 if(!artReady(paintedWorld.walk))return false;
 const image=paintedWorld.walk,cell=walkAtlasFrame(facing,distance,moving),sw=image.naturalWidth/4,sh=image.naturalHeight/4,height=92*scale;
 ctx.save();ctx.fillStyle='#17110b38';ctx.beginPath();ctx.ellipse(x,y+4,14*scale,4*scale,0,0,Math.PI*2);ctx.fill();ctx.imageSmoothingEnabled=true;ctx.drawImage(image,cell%4*sw,Math.floor(cell/4)*sh,sw,sh,x-height/2,y-height+9,height,height);ctx.restore();return true;
}
function drawCityActor(n){ctx.save();ctx.fillStyle='#17291a38';ctx.beginPath();ctx.ellipse(n.x,n.y+3,18,5,0,0,Math.PI*2);ctx.fill();ctx.restore();paintCharacter(paintedWorld.folk,n.x,n.y+4,86+(reduceMotion?0:Math.sin((game.worldClock||0)*1.6+n.cell)*.6),{atlasCell:n.cell});}
function drawOvergrownCity(){
 if(artReady(paintedWorld.city))ctx.drawImage(paintedWorld.city,0,0,W,H);else fillGradient('#27473a','#61714a');
 const time=performance.now()/1000;
 // Static figures stay planted. Only leaves and fountain light move.
 const actors=[...CITY_RESIDENTS.map(n=>({y:n.y,draw:()=>drawCityActor(n)})),{y:252,draw:()=>paintCharacter(paintedWorld.rivals,480,252,122,{atlasCell:0,glow:game.flags.briarDefeated?null:'#a9e4ac33'})},{y:game.player.y,draw:drawPlayer}];
 for(const actor of actors.sort((a,b)=>a.y-b.y))actor.draw();
 ctx.save();ctx.fillStyle='#102a20d9';roundRect(402,131,156,33,10,true);pixelText('Briarhart',480,147,17,'#e4f0c8','center');ctx.restore();
 if(!reduceMotion)for(let i=0;i<12;i++){const x=(i*137+time*14)%W,y=210+(i*37+Math.sin(time+i)*12)%290;ctx.save();ctx.translate(x,y);ctx.rotate(time*.3+i);ctx.globalAlpha=.48;ctx.fillStyle=game.flags.briarDefeated?'#f3d29a':'#bfd680';ctx.beginPath();ctx.ellipse(0,0,4,1.8,0,0,Math.PI*2);ctx.fill();ctx.restore();}
 pixelText('WOODLAND ROAD · SOUTH',480,611,13,'#fbefd2','center');
}
document.querySelector('#city-preview')?.addEventListener('click',event=>{enterCity(true);event.currentTarget.blur();});
document.querySelector('#city-travel')?.addEventListener('click',event=>{travelFromCottage();event.currentTarget.blur();});
