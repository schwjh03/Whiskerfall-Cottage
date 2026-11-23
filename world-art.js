const nyxPortrait=new Image();nyxPortrait.src='assets/nyx-portrait-v5.png';
const paintedWorld={};for(const [key,file]of Object.entries({cottage:'cottage-painted-v5.png',cellar:'cellar-painted-v5.png',mallow:'mallow-painted-v5.png',player:'player-painted-v5.png',nyxAwake:'nyx-eclipse-v5.png',rivals:'rival-bosses-v5.png'})){const img=new Image();img.src='assets/'+file;paintedWorld[key]=img;}
paintedWorld.grove=new Image();paintedWorld.grove.src='../capsule-beasts/assets/moonwood-v5.png';
function artReady(image){return Boolean(image?.complete&&image.naturalWidth);}
function paintCharacter(image,x,y,height,{atlasCell=null,bob=0,lean=0,glow=null}={}){if(!artReady(image))return false;ctx.save();ctx.imageSmoothingEnabled=true;ctx.translate(x,y+bob);ctx.rotate(lean);if(glow){ctx.shadowColor=glow;ctx.shadowBlur=18;}if(atlasCell!==null){const sw=image.naturalWidth/2,sh=image.naturalHeight/2;ctx.drawImage(image,atlasCell%2*sw,Math.floor(atlasCell/2)*sh,sw,sh,-height/2,-height*.96,height,height);}else{const width=height*image.naturalWidth/image.naturalHeight;ctx.drawImage(image,-width/2,-height,width,height);}ctx.restore();return true;}
function drawPaintedCast(kind,x,y,scale,facing,bob,frame,moving){
 if(kind==='player'){if(typeof drawWalkingPlayer==='function'&&drawWalkingPlayer(x,y,scale,facing,frame,moving))return true;if(!artReady(paintedWorld.player))return false;const cell={down:0,up:1,left:2,right:3}[facing]??0,phase=Math.sin(frame);ctx.save();ctx.fillStyle='#17110b38';ctx.beginPath();ctx.ellipse(x,y+2,16*scale,5*scale,0,0,Math.PI*2);ctx.fill();ctx.restore();paintCharacter(paintedWorld.player,x,y,92*scale,{atlasCell:cell,bob:moving?Math.abs(phase)*2.8:bob,lean:moving&&!reduceMotion?phase*.025:0});if(moving)drawStepDust(x,y,scale,phase);return true;}
 if(kind==='mallow'){if(!artReady(paintedWorld.mallow))return false;return paintCharacter(paintedWorld.mallow,x,y,77*scale*(1+(reduceMotion?0:Math.sin((game.worldClock||0)*1.6)*.005)),{bob:0,glow:'#f3c37922'});}return false;
}
function drawBossPortrait(b,time){if(b.routeEnemy)return paintCharacter(paintedWorld.creatures,480,254,222,{atlasCell:b.routeEnemy.cell,glow:b.routeEnemy.colors[0]+'44'});const x=480+(b.bossFlash&&!reduceMotion?Math.sin(time*100)*b.bossFlash*18:0),height=b.awakened?258:235;ctx.save();if(b.bossFlash)ctx.filter='brightness(1.65) saturate(.65)';let drawn=false;if(b.bossId==='nyx'){if(b.awakened&&artReady(paintedWorld.nyxAwake))drawn=paintCharacter(paintedWorld.nyxAwake,x,254,height,{bob:reduceMotion?0:Math.sin(time*1.8)*3,glow:'#ce9eff77'});else drawn=drawNyxPortrait(x,251,232,time);}else{const cell=(b.bossId==='orrery'?2:0)+(b.awakened?1:0);drawn=paintCharacter(paintedWorld.rivals,x,254,height,{atlasCell:cell,bob:reduceMotion?0:Math.sin(time*1.7)*3,glow:b.boss.colors[b.phase-1]+'55'});}ctx.restore();return drawn;}
function drawPaintedCottage(){if(!artReady(paintedWorld.cottage))return false;ctx.drawImage(paintedWorld.cottage,0,0,W,H);const t=performance.now()/1000;ctx.save();ctx.globalAlpha=.12+Math.sin(t*3)*.02;const warm=ctx.createRadialGradient(476,300,3,476,300,150);warm.addColorStop(0,'#ffbf5f');warm.addColorStop(1,'#ffbf5f00');ctx.fillStyle=warm;ctx.fillRect(320,145,310,310);ctx.restore();drawCatSprite('mallow',620,309,1.45,'down',0,t);drawAtmosphere('cottage');if(!game.flags.basementUnlocked){ctx.fillStyle='#7f302a';roundRect(435,538,88,5,2,true);}return true;}
function drawPaintedCellar(){if(!artReady(paintedWorld.cellar))return false;ctx.drawImage(paintedWorld.cellar,0,0,W,H);if(!game.flags.bossDefeated){drawNyxPortrait(480,332,188,performance.now()/1000);pixelText('Duchess Nyx',480,118,15,'#e7d6f3','center');}drawAtmosphere('cellar');return true;}
function drawPaintedTitle(){if(!artReady(paintedWorld.cottage))return false;ctx.drawImage(paintedWorld.cottage,0,0,W,H);const shade=ctx.createLinearGradient(0,0,0,H);shade.addColorStop(0,'#0b111dcf');shade.addColorStop(.45,'#0b111d33');shade.addColorStop(1,'#0b111dcf');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);ctx.save();ctx.shadowColor='#07101d';ctx.shadowBlur=15;ctx.fillStyle='#f9e7c8';ctx.textAlign='center';ctx.font='italic 65px Georgia';ctx.fillText('Whiskerfall Cottage',480,112);ctx.font='17px Georgia';ctx.fillStyle='#e3d7ba';ctx.fillText('A warm home. A wild heart. A bell beneath the floor.',480,150);ctx.restore();drawPaintedCast('player',480,480,1.4,'down',0,0,false);pixelText('Z / ENTER · BEGIN YOUR STORY',480,579,17,'#f5e4bf','center');return true;}

// Geometry follows the painted furniture, not the retired flat room drawing.
rooms.cottage.bounds=[rect(82,184,800,308),rect(397,470,170,150)];
rooms.cottage.solids=[rect(118,183,183,59),rect(662,182,180,32),rect(108,327,222,128),rect(614,310,241,145),rect(416,252,120,86),rect(80,173,806,20),rect(68,183,15,309),rect(882,183,15,309),rect(80,486,317,20),rect(567,486,320,20)];
rooms.cottage.interactables.find(x=>x.name==='Mallow').area=rect(584,260,72,78);
rooms.cottage.interactables.find(x=>x.name==='Bed').area=rect(118,183,183,64);
rooms.cottage.interactables.find(x=>x.name==='Books').area=rect(662,178,180,45);
rooms.cottage.interactables.find(x=>x.name==='Window').area=rect(382,162,190,42);
rooms.basement.bounds=[rect(75,177,811,368),rect(425,106,110,90)];
rooms.basement.solids=[rect(60,172,15,380),rect(886,172,15,380),rect(75,545,811,15),rect(75,164,350,16),rect(535,164,351,16),rect(153,410,173,113),rect(628,429,163,94),rect(375,244,203,96)];
rooms.basement.interactables.find(x=>x.name==='Boss').area=rect(375,239,203,106);
rooms.basement.interactables.find(x=>x.name==='Crates').area=rect(153,410,173,113);
rooms.basement.interactables.find(x=>x.name==='Candles').area=rect(628,429,163,94);
function drawNyxPortrait(x,feet,height,time=0){
 if(!nyxPortrait.complete||!nyxPortrait.naturalWidth)return false;
 const width=height*nyxPortrait.naturalWidth/nyxPortrait.naturalHeight;
 ctx.save();ctx.translate(x,feet+(reduceMotion?0:Math.sin(time*1.8)*3));ctx.imageSmoothingEnabled=true;ctx.shadowBlur=22;ctx.shadowColor='#9f77dc66';ctx.drawImage(nyxPortrait,-width/2,-height,width,height);ctx.restore();return true;
}
function drawEclipseSanctum(b,time,accent){
 ctx.save();if(b.bossId==='briar'&&artReady(paintedWorld.grove)){ctx.globalAlpha=.3;ctx.drawImage(paintedWorld.grove,0,0,W,H);ctx.globalAlpha=1;ctx.fillStyle='#071d1733';ctx.fillRect(0,0,W,H);}if(b.bossId==='orrery'){ctx.save();ctx.translate(480,155);ctx.rotate(reduceMotion?0:time*.04);ctx.strokeStyle='#d5af6f33';ctx.lineWidth=2;for(const radius of [110,146,163]){ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();}for(let i=0;i<24;i++){const a=i*Math.PI/12;ctx.beginPath();ctx.moveTo(Math.cos(a)*146,Math.sin(a)*146);ctx.lineTo(Math.cos(a)*(i%2?157:164),Math.sin(a)*(i%2?157:164));ctx.stroke();}ctx.restore();}

 const glow=ctx.createRadialGradient(480,157,5,480,200,350);glow.addColorStop(0,accent+'28');glow.addColorStop(.6,accent+'0b');glow.addColorStop(1,'#0000');ctx.fillStyle=glow;ctx.fillRect(100,0,760,370);
 // Faint arches and layered pillars sit behind the combat UI.
 for(let i=0;i<4;i++){const inset=i*24;ctx.strokeStyle=i%2?'#71658c1c':'#9b80c21b';ctx.lineWidth=6-i;ctx.beginPath();ctx.moveTo(291+inset,306);ctx.lineTo(291+inset,122);ctx.bezierCurveTo(291+inset,34,424,5+inset,480,0);ctx.bezierCurveTo(536,5+inset,669-inset,34,669-inset,122);ctx.lineTo(669-inset,306);ctx.stroke();}
 for(const x of [284,676]){const pillar=ctx.createLinearGradient(x-12,0,x+12,0);pillar.addColorStop(0,'#15172b');pillar.addColorStop(.5,'#57506a33');pillar.addColorStop(1,'#111628');ctx.fillStyle=pillar;ctx.fillRect(x-9,60,18,247);ctx.fillStyle='#9c84b42a';ctx.fillRect(x-14,59,28,5);ctx.fillRect(x-14,303,28,5);}
 // The floor mirrors the boss's current phase without competing with hazards.
 ctx.strokeStyle=accent+'12';ctx.lineWidth=1;for(let i=0;i<6;i++){ctx.beginPath();ctx.ellipse(480,552,180+i*60,12+i*14,0,0,Math.PI*2);ctx.stroke();}
 for(let i=0;i<8;i++){const a=i*Math.PI/4+(reduceMotion?0:time*.04),x=480+Math.cos(a)*158,y=150+Math.sin(a)*80;ctx.fillStyle=accent+'88';ctx.beginPath();ctx.moveTo(x,y-3);ctx.lineTo(x+2,y);ctx.lineTo(x,y+3);ctx.lineTo(x-2,y);ctx.closePath();ctx.fill();}
 ctx.restore();
}
function drawStrikeSlash(b){if(!b.bossFlash)return;ctx.save();ctx.globalAlpha=Math.min(1,b.bossFlash*2);ctx.shadowColor='#fff0b2';ctx.shadowBlur=20;ctx.strokeStyle='#fff1cb';ctx.lineWidth=5;const p=1-b.bossFlash/.5;ctx.beginPath();ctx.moveTo(420+p*18,214-p*18);ctx.lineTo(540-p*18,81+p*18);ctx.stroke();ctx.strokeStyle='#df9dc9';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(415+p*18,215-p*18);ctx.lineTo(533-p*18,76+p*18);ctx.stroke();ctx.restore();}
