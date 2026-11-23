const BOSS_ATTACKS=[
 {id:'roots',name:'Thornwake',hint:'Vines mark their columns before rising. Step into the gaps.'},
 {id:'petals',name:'Windborne Oath',hint:'Leaves curve across the grove. Follow the open edge.'},
 {id:'briarstorm',name:'The Bloom Unbound',hint:'Read the drifting gaps. The roots remember where you stood.'},
 {id:'gears',name:'Brass Meridian',hint:'The gears sweep in from both sides. Stay between their teeth.'},
 {id:'comets',name:'Falling Hours',hint:'Stars accelerate as they fall. Keep a clear escape route.'},
 {id:'chronos',name:'The Thirteenth Hour',hint:'Clock hands pause, then rush outward. Watch the beam warnings.'}
];
const BOSSES={
 nyx:{id:'nyx',name:'Duchess Nyx',short:'Nyx',form:'Eclipse Sovereign',phases:['THE VELVET OATH','ECLIPSE AWAKENING','THE LAST BELL'],colors:['#c1a5ff','#f69cc4','#8af4ee'],sequences:[[0,1,2],[6,3,7],[5,4,8]],finale:'eclipse',hp:1,acts:[['Compliment','You notice her collar was polished for this meeting.'],['Offer Yarn','You give her something soft to hold onto.'],['Listen','You listen. She has been guarding the sound of an empty home.']],intro:['The cottage falls away. Only your heart remains.','"I am Duchess Nyx. Listen closely to the bells."','"Move with purpose. Show me your courage — or your kindness."']},
 briar:{id:'briar',name:'Briarhart',short:'Briarhart',form:'The Verdant Crown',phases:['KEEPER OF THE GROVE','ROOTS REMEMBER','THE VERDANT CROWN'],colors:['#aedc9b','#e7c681','#a2ffe4'],sequences:[[9,10,9],[10,9,11],[11,10,9]],finale:'briarstorm',hp:.95,acts:[['Mend Branch','You bind a broken branch with a strip of your scarf.'],['Offer Seed','You leave a seed where the old forest burned.'],['Listen','You listen to the quiet between the leaves.']],intro:['The grove closes around your small heart.','Briarhart lowers his antlers. The roots begin to stir.','A guardian remembers every footstep. Make yours matter.']},
 orrery:{id:'orrery',name:'Orrery, Keeper of Hours',short:'Orrery',form:'The Thirteenth Hour',phases:['THE BRASS MERIDIAN','TIME COMES UNDONE','THE THIRTEENTH HOUR'],colors:['#e9cf94','#aad9f8','#b5bdff'],sequences:[[12,13,12],[13,12,14],[14,12,13]],finale:'chronos',hp:1.05,acts:[['Wind Clock','You turn the little key that has been still for years.'],['Count Stars','You count the stars without rushing to the next.'],['Listen','You listen to the patient space between two ticks.']],intro:['A clock strikes a number you have never heard.','Orrery unfolds one brass wing. The stars hold their breath.','Every second has a shape. Find the space between them.']}
};
function spawnRivalPattern(b,box,t,speed,n){
 const pattern=activePattern(b),awake=b.awakened,count=awake?8:6;
 if(pattern==='roots'){
  b.spawnTick=awake?.8:1.05;const gap=nextSafeLane(b,5);
  for(let i=0;i<5;i++)if(i!==gap)b.beams.push({x:box.x+43+i*86,width:awake?38:32,age:0,warn:.9,active:.3});
  if(n%2===0)addBullet(b,box.x+20+(n*61)%(box.w-40),box.y+box.h+12,0,-135*speed,{shape:'leaf',color:'#d3efac',r:6});
 }else if(pattern==='petals'){
  b.spawnTick=.7;const left=n%2===0;
  for(let i=0;i<count;i++){const a=(left?0:Math.PI)+(i-(count-1)/2)*.18;addBullet(b,left?box.x-15:box.x+box.w+15,box.y+box.h*.5,Math.cos(a)*125*speed,Math.sin(a)*125*speed,{shape:'leaf',color:'#c9e6a2',r:6,curve:(left?1:-1)*.23});}
 }else if(pattern==='briarstorm'){
  b.spawnTick=.55;const gap=nextSafeLane(b,7);
  for(let i=0;i<7;i++)if(Math.abs(i-gap)>0)addBullet(b,box.x+24+i*62,box.y-16,Math.sin(n*.6)*27,140*speed,{shape:'leaf',color:awake?'#d6fff0':'#badf99',r:5});
  if(n%3===0)b.beams.push({x:b.soul.x,width:30,age:0,warn:1.05,active:.25});
 }else if(pattern==='gears'){
  b.spawnTick=.85;const gap=nextSafeLane(b,4);
  for(let i=0;i<4;i++)if(i!==gap){addBullet(b,box.x-16,box.y+25+i*52,145*speed,Math.sin(n)*12,{shape:'gear',color:'#f3d08f',r:8});if(awake)addBullet(b,box.x+box.w+16,box.y+36+i*47,-130*speed,0,{shape:'gear',color:'#bce9fa',r:7});}
 }else if(pattern==='comets'){
  b.spawnTick=awake?.36:.5;const x=randomRange(b,box.x+20,box.x+box.w-20);addBullet(b,x,box.y-20,(n%2?1:-1)*36,60*speed,{shape:'star',color:'#dceeff',r:6,ay:135*speed});if(awake&&n%4===0)b.beams.push({x:b.soul.x,width:25,age:0,warn:1,active:.25});
 }else if(pattern==='chronos'){
  b.spawnTick=.95;const gap=nextSafeLane(b,12);
  for(let i=0;i<12;i++)if(i!==gap&&i!==(gap+1)%12){const a=i*Math.PI/6+(b.variant?.angle||0)+n*.16*(b.variant?.direction||1);addBullet(b,480,432,Math.cos(a)*135*speed,Math.sin(a)*135*speed,{shape:'gear',color:i%2?'#f1d39b':'#bce5ff',r:6,delay:.45,safeTime:.6});}
  if(n%3===0)b.beams.push({x:box.x+50+(n*67)%(box.w-100),width:32,age:0,warn:1.1,active:.25});
 }else return false;
 b.spawnTick/=(b.config.density||1)*(b.variant?.tempo||1);return true;
}
function checkBossTransformation(lines){const b=game.battle;if(b.routeEnemy)return false;if(b.awakened||b.bossHp>b.bossMaxHp*.5||(b.bossId==='nyx'&&b.difficulty!=='eclipse'))return false;b.awakened=true;b.phase=3;b.transformClock=0;b.pendingLines=lines;b.bullets=[];b.beams=[];b.hazards=[];b.echo=null;game.message=null;game.mode='battleTransform';tone(82,1,.05,'triangle');return true;}
function drawBossTransformation(b,accent){const t=Math.min(1,b.transformClock/1.8);ctx.save();ctx.fillStyle='#0a102033';ctx.fillRect(0,0,W,H);ctx.strokeStyle=accent;ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.globalAlpha=(1-t)*.6;ctx.beginPath();ctx.arc(480,160,40+t*240+i*24,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;pixelText(b.boss.form.toUpperCase(),480,390,29,'#f3eaff','center');pixelText('HALF HEALTH · A NEW FORM AWAKENS',480,433,14,accent,'center');ctx.restore();}
function drawDamagePopups(b){for(const p of b.damagePopups){ctx.save();ctx.globalAlpha=Math.min(1,p.life*3);ctx.shadowColor=p.boss?'#4e1930':'#19142b';ctx.shadowBlur=12;pixelText(p.text,p.x,p.y-(1.2-p.life)*50,p.boss?30:19,p.color,'center');ctx.restore();}}
function drawBossBeam(beam,b){if(b.bossId==='briar'){drawRootColumn(beam,b);return;}const active=beam.age>=beam.warn&&beam.age<beam.warn+beam.active,color=b.bossId==='briar'?'#b7efbd':b.bossId==='orrery'?'#f7d796':'#f6a4cb';ctx.save();ctx.fillStyle=active?color:color+'22';ctx.fillRect(beam.x-beam.width/2,b.box.y,beam.width,b.box.h);ctx.strokeStyle=active?'#fff4de':color;ctx.setLineDash(active?[]:[5,8]);ctx.lineWidth=1;ctx.strokeRect(beam.x-beam.width/2,b.box.y,beam.width,b.box.h);ctx.setLineDash([]);if(active&&b.bossId==='briar'){ctx.strokeStyle='#426e46';ctx.lineWidth=5;ctx.beginPath();for(let y=b.box.y;y<=b.box.y+b.box.h;y+=7){const x=beam.x+Math.sin(y*.07)*beam.width*.25;if(y===b.box.y)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}if(b.bossId==='orrery'){ctx.strokeStyle=color;for(let y=b.box.y+12;y<b.box.y+b.box.h;y+=24){ctx.beginPath();ctx.moveTo(beam.x-5,y);ctx.lineTo(beam.x+5,y);ctx.stroke();}}ctx.restore();}
