paintedWorld.idle=new Image();paintedWorld.idle.src='assets/player-idle-v9.png';
function idleAtlasFrame(facing,time,reduced=false){const row=({down:0,up:1,left:2,right:3}[facing]??0),phase=((time%4.8)+4.8)%4.8;return row*4+(reduced?0:phase<1.5?0:phase<3?1:phase<3.16?2:3);}
function drawIdlePlayer(x,y,scale,facing){
 if(!artReady(paintedWorld.idle))return false;
 const time=game.player.idleTime||0,image=paintedWorld.idle,cell=idleAtlasFrame(facing,time,reduceMotion),sw=image.naturalWidth/4,sh=image.naturalHeight/4,height=92*scale,sx=cell%4*sw,sy=Math.floor(cell/4)*sh;
 const breath=reduceMotion?0:Math.sin(time*Math.PI/2.4)*.75*scale;
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.fillStyle='#17110b38';ctx.beginPath();ctx.ellipse(x,y+4,14*scale,4*scale,0,0,Math.PI*2);ctx.fill();
 // The boots and lower body stay fixed; only the upper body breathes.
 const split=.70,waist=y+9-height*(1-split);ctx.drawImage(image,sx,sy,sw,sh*split,x-height/2,y-height+9-breath,height,height*split+breath);ctx.drawImage(image,sx,sy+sh*split,sw,sh*(1-split),x-height/2,waist,height,height*(1-split));
 ctx.restore();return true;
}
