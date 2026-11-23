const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;
const keys = new Set();
const pressed = new Set();
let gameReady=false;
const spriteAssets = {};

const game = {
  mode: "title",
  room: "cottage",
  lastTime: 0,
  fade: 0,
  message: null,
  menuIndex: 0,
  subMenuIndex: 0,
  battle: null,
  player: {
    x: 468,
    y: 500,
    w: 24,
    h: 34,
    speed: 150,
    facing: "down",
    step: 0,
    moving: false,
    hp: 36,
    maxHp: 36,
    items: [
      { name: "Warm Milk", heal: 14 },
      { name: "Moon Tart", heal: 22 },
    ],
  },
  flags: {
    metMallow: false,
    checkedSoup: false,
    basementUnlocked: false,
    bossDefeated: false,
  },
};

const rooms = {
  cottage: {
    name: "Cottage",
    bounds: [
      rect(94, 96, 772, 382),
      rect(396, 478, 168, 84),
    ],
    exits: [
      {
        area: rect(426, 548, 108, 20),
        to: "basement",
        spawn: { x: 478, y: 480, facing: "up" },
        lockedText: [
          "The basement latch is wrapped in a soft red ribbon.",
          "A note says: Mallow keeps the scary things downstairs.",
        ],
      },
    ],
    solids: [
      rect(120, 116, 194, 96),
      rect(642, 118, 154, 92),
      rect(152, 338, 164, 92),
      rect(576, 342, 210, 82),
      rect(382, 120, 190, 56),
      rect(416, 252, 120, 86),
      rect(86, 92, 784, 20),
      rect(86, 92, 20, 384),
      rect(854, 92, 20, 384),
      rect(86, 462, 324, 20),
      rect(552, 462, 322, 20),
    ],
    interactables: [
      {
        name: "Mallow",
        area: rect(584, 242, 72, 78),
        talk: () => {
          game.flags.metMallow = true;
          game.flags.basementUnlocked = true;
          return [
            "Mallow tilts her ears and smiles.",
            "\"You woke up! The cottage likes you already.\"",
            "\"The cellar has been making thunder-noises. I tied the latch, but...\"",
            "\"If you go down there, keep your heart small and quick.\"",
          ];
        },
      },
      {
        name: "Soup",
        area: rect(420, 240, 106, 98),
        talk: () => {
          game.flags.checkedSoup = true;
          if (game.player.hp < game.player.maxHp) {
            game.player.hp = game.player.maxHp;
            return ["The fish stew is warm enough to heal homesickness.", "Your HP is full."];
          }
          return ["A pot of fish stew hums on the stove.", "It smells like pepper, rain, and second chances."];
        },
      },
      {
        name: "Books",
        area: rect(642, 118, 154, 96),
        talk: () => [
          "The shelf is full of paw-written storybooks.",
          "One title reads: So Your Basement Is Haunted Again.",
        ],
      },
      {
        name: "Bed",
        area: rect(120, 116, 194, 96),
        talk: () => ["A quilted nest-bed. It still remembers your shape."],
      },
      {
        name: "Window",
        area: rect(380, 116, 194, 62),
        talk: () => ["Outside, golden leaves scrape politely against the glass."],
      },
    ],
  },
  basement: {
    name: "Basement",
    bounds: [rect(138, 118, 684, 404)],
    exits: [
      {
        area: rect(430, 108, 102, 34),
        to: "cottage",
        spawn: { x: 482, y: 518, facing: "up" },
      },
    ],
    solids: [
      rect(126, 104, 708, 20),
      rect(126, 104, 20, 432),
      rect(814, 104, 20, 432),
      rect(126, 520, 708, 20),
      rect(184, 402, 156, 54),
      rect(618, 386, 132, 74),
      rect(388, 232, 178, 78),
    ],
    interactables: [
      {
        name: "Boss",
        area: rect(398, 198, 164, 116),
        talk: () => {
          if (game.flags.bossDefeated) {
            return ["The floor is quiet now.", "A single silver whisker glows beside the drain."];
          }
          startBattle();
          return null;
        },
      },
      {
        name: "Crates",
        area: rect(180, 394, 168, 68),
        talk: () => ["Crates of yarn are scratched open.", "Something has been practicing dramatic entrances."],
      },
      {
        name: "Candles",
        area: rect(616, 380, 144, 88),
        talk: () => ["The candles burn blue.", "Their flames lean toward the center of the room."],
      },
    ],
  },
};

function rect(x, y, w, h) {
  return { x, y, w, h };
}

function loadSprite(src, baseW, baseH) {
  const image = new Image();
  image.src = src;
  return { image, baseW, baseH };
}

function dialog(lines, onDone) {
  return { lines, index: 0, char: 0, speed: 50, onDone };
}

function setDialog(lines, onDone) {
  game.player.moving=false;
  game.mode = game.mode.startsWith("battle") ? "battleDialog" : "dialog";
  game.message = dialog(lines, onDone);
}

function update(dt) {
  if (game.paused) return;
  if(game.battle?.hitStop>0){game.battle.hitStop=Math.max(0,game.battle.hitStop-dt);syncBattleUI();return;}
  if (game.battle) updateBattlePresentation(dt);
  if (game.mode === "overworld") updateOverworld(dt);
  if (game.mode === "battleDodge") updateBattleDodge(dt);
  game.worldClock=(game.worldClock||0)+dt;
  game.player.idleTime=game.player.moving?0:(game.player.idleTime||0)+dt;
  if (game.message) {
    const line = game.message.lines[game.message.index] ?? "";
    game.message.char = Math.min(line.length, game.message.char + dt * game.message.speed);
  }
  if (game.battle?.invuln > 0) game.battle.invuln -= dt;
  if(game.battle)syncBattleUI();
}

function updateOverworld(dt) {
  if(game.roomInputLocked)return;
  const p = game.player;
  let dx = 0;
  let dy = 0;
  if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
  if (keys.has("arrowright") || keys.has("d")) dx += 1;
  if (keys.has("arrowup") || keys.has("w")) dy -= 1;
  if (keys.has("arrowdown") || keys.has("s")) dy += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    if (Math.abs(dx) > Math.abs(dy)) p.facing = dx > 0 ? "right" : "left";
    else p.facing = dy > 0 ? "down" : "up";
    const oldX=p.x,oldY=p.y;
    tryMove(p, dx * p.speed * dt, dy * p.speed * dt);
    const distance=Math.hypot(p.x-oldX,p.y-oldY);
    p.step += distance;
    p.moving = distance > .001;
  } else {
    p.moving = false;
  }

  const room = rooms[game.room];
  for (const exit of room.exits) {
    if (intersects(playerFeet(), exit.area)) {
      if (exit.lockedText && !game.flags.basementUnlocked) {
        setDialog(exit.lockedText);
        p.y -= 22;
      } else {
        changeRoom(exit.to, exit.spawn);
      }
      break;
    }
  }
}

function tryMove(p, dx, dy) {
  const oldX = p.x;
  p.x += dx;
  if (blocked(playerFeet())) p.x = oldX;
  const oldY = p.y;
  p.y += dy;
  if (blocked(playerFeet())) p.y = oldY;
}

function blocked(feet) {
  const room = rooms[game.room];
  const inBounds = room.bounds.some((b) => intersects(feet, b));
  return !inBounds || room.solids.some((s) => intersects(feet, s));
}

function playerFeet() {
  const p = game.player;
  return rect(p.x - 9, p.y + 8, 18, 12);
}

function changeRoom(to, spawn) {
  game.roomInputLocked=keys.size>0;keys.clear();pressed.clear();
  game.fade = 1;
  game.room = to;
  Object.assign(game.player, spawn);
  game.player.moving=false;
  if(gameReady)saveAdventure();
  window.setTimeout(() => {
    game.fade = 0;
  }, 180);
}

function handleConfirm() {
  if (game.mode === "gameOver") { retryBattle(); return; }
  if (game.mode === "battleTiming") { resolveStrike(); return; }
  if (game.mode === "battleCinematic") return;
  if (game.mode === "title") {
    game.mode = "overworld";
    if(game.hasAdventureSave){setDialog(["Your journey continues in "+rooms[game.room].name+"."]);return;}
    setDialog([
      "You wake in a cottage that smells like cedar and fish stew.",
      "Somewhere below, a bell rings once.",
    ]);
    return;
  }
  if (game.message) {
    advanceDialog();
    return;
  }
  if (game.mode === "overworld") {
    const target = nearestInteractable();
    if (target) {
      const lines = target.talk();
      if (lines) setDialog(lines);
    }
    return;
  }
  if (game.mode === "battleMenu") { selectBattleAction(); return; }
  if (game.mode === "battleSubMenu") { selectSubMenu(); return; }
  if (game.mode === "battleEnd") resetGame();
}

function handleCancel() {
  if (game.mode === "battleSubMenu") game.mode = "battleMenu";
}

function advanceDialog() {
  const m = game.message;
  const line = m.lines[m.index] ?? "";
  if (m.char < line.length) {
    m.char = line.length;
    return;
  }
  m.index += 1;
  m.char = 0;
  if (m.index >= m.lines.length) {
    const done = m.onDone;
    game.message = null;
    if (done) done();
    else if (game.mode === "dialog") game.mode = "overworld";
    else if (game.mode === "battleDialog") game.mode = "battleMenu";
  }
}

function nearestInteractable() {
  const p = game.player;
  const reach = {
    down: rect(p.x - 18, p.y + 16, 36, 34),
    up: rect(p.x - 18, p.y - 34, 36, 34),
    left: rect(p.x - 42, p.y - 4, 36, 28),
    right: rect(p.x + 6, p.y - 4, 36, 28),
  }[p.facing];
  return rooms[game.room].interactables.find((item) => (!item.available||item.available())&&intersects(reach, item.area));
}

function winBattle(lines) { finishStoryBattle(lines); }

function resetGame() {
 game.paused=false;game.roomInputLocked=false;keys.clear();pressed.clear();document.body?.classList.remove("in-battle");
  const hp = game.player.maxHp;
  Object.assign(game.player, { x: 468, y: 500, facing: "down", moving:false, step:0, idleTime:0, hp, items: [{ name: "Warm Milk", heal: 14 }, { name: "Moon Tart", heal: 22 }] });
  game.mode = "title";
  game.room = "cottage";
  game.message = null;
  game.battle = null;
  game.menuIndex = 0;
  game.flags = { metMallow: false, checkedSoup: false, basementUnlocked: false, bossDefeated: false, ...freshChapterFlags() };
  resetAdventureProgress();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  if (game.mode === "title") drawTitle();
  else if (game.mode.startsWith("battle") || game.mode === "gameOver") drawBattle();
  else drawOverworld();
  if (game.message) drawDialogBox();
  if (game.paused) drawPauseOverlay();
  if (game.fade > 0) {
    ctx.fillStyle = `rgba(0,0,0,${game.fade})`;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawTitle() {
  if(drawPaintedTitle())return;
  fillGradient('#172331','#263335');
  const moon=ctx.createRadialGradient(731,127,0,731,127,180);moon.addColorStop(0,'#b3cebc33');moon.addColorStop(1,'#b3cebc00');ctx.fillStyle=moon;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#dce5c9';ctx.beginPath();ctx.arc(731,127,33,0,Math.PI*2);ctx.fill();
  drawStars(65,'#d0dcc7');
  for(let i=0;i<13;i++){const x=i*83-25; const y=280+Math.sin(i*2)*42;triangle(x-62,520,x+9,y,x+81,520,'#192b2c');triangle(x-40,435,x+9,y-10,x+57,435,'#1a3030');}
  ctx.fillStyle='#1a2927';ctx.beginPath();ctx.ellipse(480,580,610,150,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(0,73);drawCottageExterior();ctx.restore();
  pixelText('A LITTLE WORLD WITH A WILD HEART',480,70,11,'#a8bfb3','center');
  ctx.save();ctx.textAlign='center';ctx.fillStyle='#f4e8c7';ctx.font='italic 62px Georgia';ctx.fillText('Whiskerfall',480,141);ctx.font='500 22px Georgia';ctx.fillStyle='#d5bb8b';ctx.fillText('C O T T A G E',480,176);ctx.restore();
  drawCatSprite('player',480,572,1.25,'down',Math.sin(performance.now()/800)*1.4);
  drawAtmosphere('title');
  ctx.fillStyle='#172820dc';roundRect(343,594,274,31,15,true);pixelText('Z / ENTER  ·  BEGIN YOUR STORY',480,610,11,'#ddedda','center');
}

function drawOverworld() {
  if (game.room === "cottage") drawCottage();
  else if(['cedar','briarway'].includes(game.room)){drawRouteRoom();return;}
  else if(game.room==='city') { drawOvergrownCity(); drawRoomHud(); return; }
  else drawBasement();
  drawPlayer();
  if(game.room==='cottage')drawTrailMap();
  drawRoomHud();
}

function drawCottage() {
  if(drawPaintedCottage())return;
  fillGradient('#172226','#10191c');
  ctx.fillStyle='#392b26';roundRect(72,65,816,428,13,true);
  drawPlanks('#785340','#805c45');
  ctx.fillStyle='#42332c';ctx.fillRect(86,67,788,38);ctx.fillStyle='#a08058';ctx.fillRect(86,103,788,5);
  for(let x=87;x<874;x+=68){ctx.strokeStyle='#634e3c';ctx.strokeRect(x,68,66,32);}
  drawRug(327,212,294,209,'#685266');
  drawWallWindow(382,114);
  ctx.fillStyle='#dbe8cc0d';ctx.beginPath();ctx.moveTo(388,169);ctx.lineTo(562,169);ctx.lineTo(673,407);ctx.lineTo(315,407);ctx.closePath();ctx.fill();
  drawBed(124,118);drawBookcase(642,120);drawTable(152,340);drawSofa(574,344);drawStove(416,248);
  drawBasementDoor(426,470,game.flags.basementUnlocked);
  drawPottedPlant(112,262,.8);drawPottedPlant(833,274,1);drawPottedPlant(336,145,.6);
  ctx.fillStyle='#a68b60';ctx.fillRect(112,454,276,5);ctx.fillRect(575,454,271,5);
  ctx.strokeStyle='#453526';ctx.lineWidth=7;ctx.strokeRect(88,108,783,369);
  drawCatSprite('mallow',622,282,1.55,'down',Math.sin(performance.now()/700)*.9,performance.now()/280);
  ctx.fillStyle='#18251dcc';roundRect(585,202,74,23,10,true);pixelText('Mallow',622,213,11,'#e7e6c7','center');
  addWarmLight(472,287,260);drawAtmosphere('cottage');
}

function drawBasement() {
  if(drawPaintedCellar())return;
  fillGradient("#151820", "#090b0e");
  drawStoneFloor();
  ctx.fillStyle = "#162631";
  ctx.fillRect(430, 116, 102, 42);
  for (let step = 0; step < 4; step++) {
    ctx.fillStyle = step % 2 ? "#6a7d83" : "#4a626e";
    ctx.fillRect(433, 119 + step * 9, 96, 6);
  }
  pixelText("↑ COTTAGE", 481, 103, 11, "#c9dfcd", "center");
  drawCandles(626, 392);
  drawCrates(184, 404);
  drawDrain(476, 482);
  if (!game.flags.bossDefeated) {
    drawCatSprite("nyx", 480, 258, 2.1, "down", Math.sin(performance.now() / 520) * 1.2, performance.now() / 220);
    pixelText("Duchess Nyx", 480, 164, 18, "#db6b78", "center");
  }
  addCoolLight(480, 292, 290);
}

function drawDialogBox(){
  const line=game.message.lines[game.message.index]??'';const shown=line.slice(0,Math.floor(game.message.char));
  ctx.fillStyle='#101c24ee';roundRect(77,501,806,113,12,true);ctx.strokeStyle='#a1b4a2';ctx.lineWidth=1;roundRect(77,501,806,113,12,false);ctx.stroke();ctx.fillStyle='#a8cbb1';ctx.fillRect(78,519,3,76);
  const lines=wrapText(shown,690,18);lines.slice(0,2).forEach((part,i)=>pixelText(part,105,536+i*27,18,'#efead7'));
  if(game.message.char>=line.length)pixelText('Z / ENTER  ↘',849,593,10,'#b8d9bd','right');
}

function drawPlayer() {
  const p = game.player;
  const walkBob = 0;
  drawCatSprite("player", p.x, p.y, 1, p.facing, walkBob, p.step, p.moving);
}

function drawCatSprite(kind, x, y, scale, facing = "down", bob = 0, frame = 0, moving = false) {
  if(drawPaintedCast(kind,x,y,scale,facing,bob,frame,moving))return;
  if(kind==="nyx"&&typeof drawNyxPortrait==="function"&&drawNyxPortrait(x,y,92*scale,performance.now()/1000))return;
  if (drawImageCatSprite(kind, x, y, scale, facing, bob, frame, moving)) {
    return;
  }
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(scale, scale);
  if (facing === "left") ctx.scale(-1, 1);
  if (facing === "up") ctx.translate(0, 1);
  if (kind === "player") drawPlayerSprite(facing, frame, moving);
  if (kind === "mallow") drawMallowSprite(frame);
  if (kind === "nyx" || kind === "nyxBattle") drawNyxSprite(frame);
  ctx.restore();
}

function drawImageCatSprite(kind, x, y, scale, facing, bob, frame, moving) {
  const assetKey = kind === "player" ? playerAssetKey(facing, moving, frame) : kind;
  const asset = spriteAssets[assetKey];
  if (!asset || !asset.image.complete || asset.image.naturalWidth === 0) return false;

  const isPlayer = kind === "player";
  const isNyxBattle = kind === "nyxBattle";
  const idle = isPlayer && !moving ? Math.sin(performance.now() / 850) * 0.35 : 0;
  const sway = !isPlayer ? Math.sin(frame * 0.75) * 0.9 : 0;
  const walkPhase = Math.sin(frame);
  const walkLean = isPlayer && moving ? walkPhase * 1.8 : 0;
  const battlePulse = isNyxBattle ? Math.sin(performance.now() / 120) : 0;
  const battleShake = isNyxBattle && game.mode === "battleDodge" ? Math.sin(performance.now() / 35) * 1.4 : 0;
  const squashX = isPlayer && moving ? 1 + Math.abs(walkPhase) * 0.035 : 1;
  const squashY = isPlayer && moving ? 1 - Math.abs(walkPhase) * 0.025 : 1;
  const battleScale = isNyxBattle ? 1 + battlePulse * 0.012 : 1;
  const w = asset.baseW * scale;
  const h = asset.baseH * scale;

  ctx.save();
  ctx.translate(Math.round(x + walkLean + sway + battleShake), Math.round(y + bob + idle));
  if (kind === "player" && facing === "right" && !moving) ctx.scale(-1, 1);
  if (kind !== "player" && facing === "left") ctx.scale(-1, 1);
  if (isPlayer && moving) drawWalkShadow(0, 0, w, scale, walkPhase);
  if (isNyxBattle) drawBattleAura(0, -h * 0.55, w, h, battlePulse);
  ctx.scale(squashX * battleScale, squashY * battleScale);
  if (isPlayer && moving) ctx.rotate(walkPhase * 0.025);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(asset.image, -w / 2, -h, w, h);
  if (isPlayer && moving) drawStepDust(0, 0, scale, walkPhase);
  if (isNyxBattle) drawNyxBattleEffects(0, -h, w, h, battlePulse);
  ctx.restore();
  ctx.imageSmoothingEnabled = true;
  return true;
}

function playerAssetKey(facing, moving, frame) {
  if (moving) {
    const index = Math.floor(frame * 4) % 4;
    if (facing === "up") return `playerWalkUp${index}`;
    if (facing === "left") return `playerWalkLeft${index}`;
    if (facing === "right") return `playerWalkRight${index}`;
    return `playerWalkDown${index}`;
  }
  if (facing === "up") return "playerUp";
  if (facing === "left" || facing === "right") return "playerSide";
  return "playerDown";
}

function drawWalkShadow(x, y, w, scale, phase) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y + 2 * scale, w * 0.34, 4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(242,189,91,0.28)";
  ctx.fillRect(x - 10 * scale + Math.sign(phase || 1) * 5 * scale, y - 3 * scale, 6 * scale, 2 * scale);
  ctx.restore();
}

function drawStepDust(x, y, scale, phase) {
  if (Math.abs(phase) < 0.72) return;
  ctx.save();
  ctx.fillStyle = "rgba(247,237,215,0.5)";
  ctx.fillRect(x - Math.sign(phase) * 13 * scale, y - 5 * scale, 2 * scale, 2 * scale);
  ctx.fillRect(x - Math.sign(phase) * 18 * scale, y - 2 * scale, 2 * scale, 2 * scale);
  ctx.restore();
}

function drawBattleAura(x, y, w, h, pulse) {
  ctx.save();
  const radius = h * (0.56 + pulse * 0.03);
  const gradient = ctx.createRadialGradient(x, y, 8, x, y, radius);
  gradient.addColorStop(0, "rgba(82,221,255,0.18)");
  gradient.addColorStop(0.38, "rgba(219,107,120,0.12)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(-w, y - h * 0.25, w * 2, h * 1.25);
  ctx.restore();
}

function drawNyxBattleEffects(x, y, w, h, pulse) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = `rgba(88,229,255,${0.45 + pulse * 0.18})`;
  ctx.beginPath();
  ctx.arc(x + w * 0.14, y + h * 0.22, 4 + pulse * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(88,229,255,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.15, y + h * 0.22);
  ctx.lineTo(x + w * 0.32 + pulse * 6, y + h * 0.08);
  ctx.stroke();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(219,107,120,0.65)";
  ctx.fillRect(x - w * 0.28, y + h * 0.5 + pulse * 2, w * 0.56, 2);
  ctx.restore();
}

const PLAYER_FRONT_ROWS = [
  "        XX      XX        ",
  "       XffX    XffX       ",
  "      XfhhXXXXhhfX      ",
  "     XffffffffffffX     ",
  "    XfffhffffhffffX    ",
  "    XffXeXffXeXfffX    ",
  "   XfffffeeeffffffX   ",
  "   XfffffccffffffX    ",
  "    XfffhhhhhfffX     ",
  "     XXXrrrrrrXXX      ",
  "      XrrrssrrrX       ",
  "    AAXssssssssXBB     ",
  "   AAXssssssssssXBB    ",
  "   AAXssrrrrrrssXBB    ",
  "     XssbbbbssX        ",
  "     XsbbbbbbsX        ",
  "      XXbXXbXX         ",
  "       XLX  XRX        ",
  "       XLX  XRX        ",
  "       XLX  XRX        ",
  "      XXLX  XRX        ",
  "      XLLX  XRRX       ",
  "      XXXX  XXXX       ",
];

const PLAYER_BACK_ROWS = [
  "        XX      XX        ",
  "       XhhX    XhhX       ",
  "      XhhhXXXXhhhX      ",
  "     XhhhhhhhhhhhhX     ",
  "    XhhhhffffffffhX    ",
  "    XhhfffffffffffX    ",
  "   XhfffffffffffffX    ",
  "   XffffffffffhhhX     ",
  "    XffffhhhhhffX      ",
  "     XXXrrrrrrXXX      ",
  "      XrrrssrrrX       ",
  "    AAXssssssssXBB     ",
  "   AAXssssssssssXBB    ",
  "   AAXssrrrrrrssXBB    ",
  "     XssbbbbssX        ",
  "     XsbbbbbbsX        ",
  "      XXbXXbXX         ",
  "       XLX  XRX        ",
  "       XLX  XRX        ",
  "       XLX  XRX        ",
  "      XXLX  XRX        ",
  "      XLLX  XRRX       ",
  "      XXXX  XXXX       ",
];

const MALLOW_ROWS = [
  "        XX        XX        ",
  "       XccX      XccX       ",
  "      XcXXfXXXXfXXcX      ",
  "     XcffffffffffffcX     ",
  "    XffhhffffffhhfffX    ",
  "    XffXeXffffXeXfffX    ",
  "   XfffffeeeeffffffX     ",
  "   XfffffccffffffX       ",
  "    XfffhhhhhfffX        ",
  "     XXaaaaaaaaXX        ",
  "   XXXaaaagaaaagXXX      ",
  "  XffXaaggggggaaXffX     ",
  "  XffXaggggygggaXffX     ",
  "  XffXaggggggggaXffX     ",
  "   XXaaggggggaaXX        ",
  "     XaaXXXXXaaX         ",
  "     XffX   XffX         ",
  "     XffX   XffX         ",
  "     XXXX   XXXX         ",
  "          XX             ",
  "         XhhX            ",
  "        XhffX            ",
  "        XfffX            ",
  "         XffX            ",
  "          XX             ",
];

const NYX_ROWS = [
  "           XXX             ",
  "          XrrrX            ",
  "          XrrrX            ",
  "         XXrrrXX           ",
  "      XX  XrrrX  XX        ",
  "     XiiXXXXXXXiiX        ",
  "    XiiffXXXXXffiiX       ",
  "   XiiifffffffiiiX        ",
  "   XifffXfffXfffX         ",
  "  XffffXyffqXffffX        ",
  "  XffffXyffqXffffX        ",
  "  XffffffccffffffX        ",
  "   XfffrrrrrrfffX         ",
  "  qqXXrryyyyrrXXqq        ",
  " XqqXnnnnnnnnnnXqqX       ",
  " XqqXnmmmmmmmmnXqqX       ",
  "  XXnmmmmmmmmmmnXX        ",
  "    XmmmmmmmmmmX          ",
  "    XmmmmmmmmmmX          ",
  "   XnmmmmmmmmmmnX         ",
  "   XnmmmmmmmmmmnX         ",
  "   XnmmmmmmmmmmnX         ",
  "    XnnXXXXXnnX           ",
  "    XhhX   XhhX           ",
  "    XhhX   XhhX           ",
  "    XhhX   XhhX           ",
  "   XrrrX   XrrrX          ",
  "   XXXXX   XXXXX          ",
  "              XX          ",
  "             XhhX         ",
  "            XhhhhX        ",
  "            XhhhX         ",
  "             XXX          ",
];

function drawPlayerSprite(facing, frame, moving) {
  const swing = moving ? Math.sin(frame) : 0;
  const lift = moving ? Math.max(0, Math.sin(frame)) * 2 : 0;
  const liftBack = moving ? Math.max(0, -Math.sin(frame)) * 2 : 0;
  const sideLean = moving && (facing === "left" || facing === "right") ? Math.sin(frame) * 1.2 : 0;
  ctx.translate(sideLean, 0);

  const palette = {
    X: "#050505",
    f: "#f2b35f",
    h: "#9c6235",
    c: "#ffe6a8",
    r: "#d56a83",
    s: "#4db5d7",
    b: "#6b3b33",
    e: "#21120d",
    A: "#f2b35f",
    B: "#f2b35f",
    L: "#6b3b33",
    R: "#6b3b33",
  };
  const rows = facing === "up" ? PLAYER_BACK_ROWS : PLAYER_FRONT_ROWS;
  drawPixelRows(rows, palette, 2, 0, lift, liftBack, swing);
}

function drawMallowSprite(frame) {
  const breathe = Math.sin(frame) * 0.8;
  const palette = {
    X: "#050505",
    f: "#d08a55",
    h: "#7b4629",
    c: "#ffe0a8",
    a: "#8d4351",
    g: "#253d3b",
    y: "#efc06e",
    e: "#1b130f",
  };
  ctx.translate(Math.sin(frame * 0.55) * 0.45, breathe);
  drawPixelRows(MALLOW_ROWS, palette, 2);
}

function drawNyxSprite(frame) {
  const cloakSway = Math.sin(frame * 0.75) * 2;
  const palette = {
    X: "#050505",
    f: "#6f748e",
    h: "#31364d",
    i: "#8790ad",
    n: "#151725",
    m: "#252a45",
    r: "#db6b78",
    q: "#92d7ff",
    y: "#f2bd5b",
    c: "#ffe0a8",
  };
  ctx.translate(cloakSway * 0.25, Math.sin(frame * 0.8) * 0.7);
  drawPixelRows(NYX_ROWS, palette, 2);
}

function drawPixelRows(rows, palette, pixel = 2, bodyOffset = 0, lift = 0, liftBack = 0, swing = 0) {
  const width = Math.max(...rows.map((row) => row.length));
  const height = rows.length;
  const left = Math.round((-width * pixel) / 2);
  const top = -height * pixel;

  for (let y = 0; y < rows.length; y += 1) {
    const row = rows[y];
    for (let x = 0; x < row.length; x += 1) {
      const key = row[x];
      if (key === " " || !palette[key]) continue;
      let px = left + x * pixel;
      let py = top + y * pixel + bodyOffset;
      if (key === "L") {
        py -= lift;
      }
      if (key === "R") {
        py -= liftBack;
      }
      if (key === "A") {
        py += swing;
      }
      if (key === "B") {
        py -= swing;
      }
      ctx.fillStyle = palette[key] ?? palette.b ?? "#fff";
      ctx.fillRect(Math.round(px), Math.round(py), pixel, pixel);
    }
  }
}

function drawRoomHud(){
  ctx.fillStyle='#14232ae6';roundRect(20,18,183,41,8,true);ctx.strokeStyle='#54756a88';ctx.lineWidth=1;roundRect(20,18,183,41,8,false);ctx.stroke();pixelText(rooms[game.room].name,36,39,14,'#d8e4d5');
  ctx.fillStyle='#14232ae6';roundRect(738,17,200,45,8,true);pixelText('VITALITY',751,31,8,'#90afa7');drawBar(751,41,119,7,game.player.hp/game.player.maxHp,'#a8d6b6','#30474c');pixelText(game.player.hp+'/'+game.player.maxHp,921,43,10,'#cbe4c7','right');
  const target=nearestInteractable();
  if(target&&!game.message){ctx.fillStyle='#14232ae6';roundRect(334,580,292,30,14,true);pixelText('Z / INTERACT  ·  '+target.name,480,595,11,'#d8e4d5','center');}
}

function drawBed(x,y){
  ctx.fillStyle='#1e1c2188';roundRect(x-5,y+6,205,104,8,true);
  ctx.fillStyle='#483438';roundRect(x,y,190,92,6,true);ctx.fillStyle='#a58361';roundRect(x-6,y-6,15,104,4,true);roundRect(x+181,y-6,15,104,4,true);
  ctx.fillStyle='#e2ceb0';roundRect(x+16,y+12,53,65,8,true);ctx.fillStyle='#f1ddbd';roundRect(x+22,y+17,41,53,6,true);
  ctx.fillStyle='#9d6374';roundRect(x+74,y+7,102,78,5,true);
  for(let r=0;r<4;r++)for(let c=0;c<4;c++){ctx.fillStyle=(r+c)%2?'#b77b87':'#8c586c';ctx.fillRect(x+78+c*24,y+11+r*18,21,15);}
  ctx.strokeStyle='#e9c7ab66';ctx.lineWidth=1;ctx.strokeRect(x+80,y+12,88,65);ctx.fillStyle='#ceb49a';ctx.fillRect(x+73,y+7,7,78);
}

function drawBookcase(x,y){
  ctx.fillStyle='#191c2288';roundRect(x-4,y+5,164,96,5,true);ctx.fillStyle='#4a3630';roundRect(x,y,154,90,4,true);ctx.fillStyle='#9a7551';ctx.fillRect(x,y,154,8);ctx.fillRect(x,y+82,154,8);
  for(let shelf=0;shelf<2;shelf++){ctx.fillStyle='#261f24';ctx.fillRect(x+9,y+10+shelf*38,136,33);for(let i=0;i<9;i++){const h=23+(i*7%8);ctx.fillStyle=['#b58b61','#789f91','#b86f7b','#7d8da7','#d0b687'][i%5];ctx.fillRect(x+13+i*14,y+40+shelf*38-h,10,h);ctx.fillStyle='#eee0b155';ctx.fillRect(x+15+i*14,y+43+shelf*38-h,6,2);}ctx.fillStyle='#9a7551';ctx.fillRect(x+5,y+43+shelf*38,144,4);}
}

function drawTable(x,y){
  ctx.fillStyle='#20202088';roundRect(x-4,y+8,172,64,8,true);ctx.fillStyle='#533e32';roundRect(x,y+5,162,60,6,true);ctx.fillStyle='#aa8059';roundRect(x,y,162,54,6,true);ctx.strokeStyle='#79573c';ctx.lineWidth=2;for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(x+5,y+i*12);ctx.lineTo(x+157,y+i*12);ctx.stroke();}
  ctx.fillStyle='#71938a';ctx.fillRect(x+56,y+5,49,45);ctx.strokeStyle='#d5d2a94d';ctx.strokeRect(x+60,y+8,41,38);
  ctx.fillStyle='#dce1c9';ctx.beginPath();ctx.ellipse(x+80,y+27,16,12,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#819d96';ctx.stroke();ctx.fillStyle='#d4986b';ctx.beginPath();ctx.ellipse(x+80,y+27,10,6,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#dacdb0';roundRect(x+119,y+13,16,22,4,true);ctx.strokeStyle='#dacdb0';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+136,y+23,6,-Math.PI/2,Math.PI/2);ctx.stroke();
}

function drawSofa(x,y){
  ctx.fillStyle='#1b242688';roundRect(x-5,y+7,222,83,10,true);ctx.fillStyle='#385f5d';roundRect(x,y,212,78,9,true);ctx.fillStyle='#517a70';roundRect(x+7,y+5,198,22,6,true);
  ctx.fillStyle='#709386';roundRect(x+18,y+30,82,31,5,true);roundRect(x+111,y+30,82,31,5,true);ctx.fillStyle='#8ba596';ctx.fillRect(x+23,y+31,70,2);ctx.fillRect(x+116,y+31,70,2);
  ctx.fillStyle='#436b65';roundRect(x+3,y+17,17,52,7,true);roundRect(x+192,y+17,17,52,7,true);ctx.fillStyle='#d0ad84';roundRect(x+26,y+10,28,25,5,true);ctx.strokeStyle='#967b65';ctx.strokeRect(x+32,y+15,16,14);
  ctx.fillStyle='#352e2a';ctx.fillRect(x+18,y+75,16,6);ctx.fillRect(x+179,y+75,16,6);
}

function drawStove(x,y){
  ctx.fillStyle='#1e222788';roundRect(x-7,y+8,126,88,8,true);ctx.fillStyle='#414b4b';roundRect(x,y,112,86,7,true);ctx.fillStyle='#758781';roundRect(x+4,y+3,104,13,4,true);
  ctx.fillStyle='#212d31';roundRect(x+18,y+34,76,42,6,true);ctx.fillStyle='#d58d56';roundRect(x+25,y+41,62,27,3,true);
  for(let i=0;i<5;i++){const flicker=Math.sin(performance.now()/190+i)*4;ctx.fillStyle=i%2?'#f7cb79':'#e6a368';ctx.beginPath();ctx.ellipse(x+33+i*11,y+57,5,11+flicker,0,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#bfd1bc';ctx.beginPath();ctx.ellipse(x+56,y+16,29,17,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#617871';ctx.beginPath();ctx.ellipse(x+56,y+14,24,12,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d6ae70';ctx.beginPath();ctx.ellipse(x+56,y+12,18,8,0,0,Math.PI*2);ctx.fill();
  for(let i=0;i<3;i++){const t=(performance.now()/1600+i/3)%1;ctx.strokeStyle='rgba(237,231,200,'+(1-t)*.28+')';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+45+i*10,y-1-t*31);ctx.quadraticCurveTo(x+37+i*10,y-12-t*31,x+45+i*10,y-20-t*31);ctx.stroke();}
}

function drawBasementDoor(x, y, open) {
  ctx.fillStyle = open ? "#211613" : "#2a1814";
  roundRect(x, y, 108, 82, 4, true);
  ctx.strokeStyle = open ? "#f2bd5b" : "#db6b78";
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 10, y + 12, 88, 54);
  pixelText(open ? "OPEN" : "RIBBON", x + 54, y + 44, 12, open ? "#f2bd5b" : "#db6b78", "center");
}

function drawWallWindow(x,y){
  ctx.fillStyle='#382d2d';roundRect(x-7,y-5,204,70,7,true);ctx.fillStyle='#547d85';roundRect(x,y,190,58,3,true);ctx.fillStyle='#d0e1cf';ctx.beginPath();ctx.arc(x+138,y+20,12,0,Math.PI*2);ctx.fill();
  triangle(x+6,y+54,x+42,y+16,x+75,y+54,'#37575b');triangle(x+62,y+54,x+99,y+23,x+132,y+54,'#29494f');triangle(x+115,y+54,x+155,y+24,x+185,y+54,'#3c5a58');
  ctx.fillStyle='#b5a07b';ctx.fillRect(x+91,y,7,58);ctx.fillRect(x,y+28,190,5);ctx.fillRect(x-7,y+57,204,8);
  ctx.fillStyle='#bd9b91';ctx.beginPath();ctx.moveTo(x-7,y-3);ctx.lineTo(x+37,y-3);ctx.quadraticCurveTo(x+7,y+20,x+7,y+52);ctx.lineTo(x-7,y+58);ctx.fill();ctx.beginPath();ctx.moveTo(x+155,y-3);ctx.lineTo(x+197,y-3);ctx.lineTo(x+197,y+58);ctx.lineTo(x+183,y+52);ctx.quadraticCurveTo(x+181,y+16,x+155,y-3);ctx.fill();
}

function drawRug(x,y,w,h,color){
  ctx.fillStyle='#312b3280';roundRect(x-4,y+4,w+8,h+4,10,true);ctx.fillStyle=color;roundRect(x,y,w,h,9,true);ctx.strokeStyle='#bc9890';ctx.lineWidth=2;ctx.strokeRect(x+12,y+12,w-24,h-24);ctx.strokeStyle='#d4b39766';ctx.strokeRect(x+20,y+20,w-40,h-40);
  ctx.strokeStyle='#c3a19866';ctx.lineWidth=1;for(let i=0;i<7;i++){const cx=x+30+i*38;ctx.beginPath();ctx.moveTo(cx,y+27);ctx.lineTo(cx+12,y+38);ctx.lineTo(cx,y+49);ctx.lineTo(cx-12,y+38);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(cx,y+h-27);ctx.lineTo(cx+12,y+h-38);ctx.lineTo(cx,y+h-49);ctx.lineTo(cx-12,y+h-38);ctx.closePath();ctx.stroke();}
  ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,48,39,0,0,Math.PI*2);ctx.stroke();for(let i=0;i<h;i+=8){ctx.fillStyle='#c2b095';ctx.fillRect(x-5,y+i,5,3);ctx.fillRect(x+w,y+i,5,3);}
}

function drawPlanks(a,b) {
  ctx.save();ctx.beginPath();ctx.rect(86,106,788,376);ctx.clip();
  const colors=[a,b,'#72503e','#8a6248','#79543d'];
  for(let row=0;row<12;row++)for(let column=-1;column<5;column++){
    const x=86+column*196+(row%2)*98,y=106+row*32;
    ctx.fillStyle=colors[(row*7+column+11)%5];ctx.fillRect(x,y,195,31);ctx.fillStyle='#422f28';ctx.fillRect(x,y+31,196,1);
    ctx.strokeStyle='#c29b671a';ctx.lineWidth=1;for(let g=0;g<3;g++){ctx.beginPath();ctx.moveTo(x+8,y+7+g*8);ctx.bezierCurveTo(x+60,y+3+g*8,x+120,y+12+g*8,x+184,y+5+g*8);ctx.stroke();}
    ctx.fillStyle='#48392b88';ctx.fillRect(x+5,y+5,2,2);ctx.fillRect(x+185,y+25,2,2);
  }
  const shade=ctx.createRadialGradient(480,280,100,480,280,460);shade.addColorStop(0,'#0000');shade.addColorStop(1,'#11181c77');ctx.fillStyle=shade;ctx.fillRect(86,106,788,376);ctx.restore();
}

function drawStoneFloor() {
  for (let y = 120; y < 536; y += 48) {
    for (let x = 138; x < 824; x += 72) {
      ctx.fillStyle = (x + y) % 3 ? "#202632" : "#252c39";
      ctx.fillRect(x, y, 72, 48);
      ctx.strokeStyle = "#10151d";
      ctx.strokeRect(x, y, 72, 48);
    }
  }
}

function drawCandles(x, y) {
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = "#e8dcc3";
    ctx.fillRect(x + i * 28, y + (i % 2) * 14, 10, 38);
    ctx.fillStyle = "#92d7ff";
    ctx.beginPath();
    ctx.ellipse(x + 5 + i * 28, y - 6 + (i % 2) * 14, 7, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCrates(x, y) {
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = "#6f432a";
    ctx.fillRect(x + i * 52, y + (i % 2) * 10, 48, 44);
    ctx.strokeStyle = "#29160e";
    ctx.strokeRect(x + i * 52, y + (i % 2) * 10, 48, 44);
  }
}

function drawDrain(x, y) {
  ctx.fillStyle = "#060708";
  ctx.beginPath();
  ctx.ellipse(x, y, 44, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#394250";
  ctx.stroke();
}

function drawCottageExterior(){
  ctx.fillStyle='#0c171d66';ctx.beginPath();ctx.ellipse(480,470,207,38,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#785a47';roundRect(314,274,332,186,5,true);ctx.strokeStyle='#4e3e35';ctx.lineWidth=2;for(let y=290;y<460;y+=22){ctx.beginPath();ctx.moveTo(316,y);ctx.lineTo(642,y);ctx.stroke();}
  triangle(275,286,480,170,687,286,'#46575a');ctx.strokeStyle='#6a7d76';ctx.lineWidth=3;for(let row=0;row<5;row++){const y=205+row*17,half=(y-170)*1.77;ctx.beginPath();ctx.moveTo(480-half,y);ctx.lineTo(480+half,y);ctx.stroke();}
  ctx.fillStyle='#73827a';ctx.fillRect(588,190,27,67);ctx.fillStyle='#a2a78b';ctx.fillRect(582,187,39,9);
  for(const x of [352,546]){ctx.fillStyle='#362c2b';ctx.fillRect(x-5,320,68,67);ctx.fillStyle='#e9b976';ctx.fillRect(x,325,58,55);ctx.fillStyle='#bd8d59';ctx.fillRect(x+26,325,5,55);ctx.fillRect(x,351,58,4);addWarmLight(x+29,350,72);}
  ctx.fillStyle='#3f3631';roundRect(446,357,68,103,5,true);ctx.strokeStyle='#a18c66';ctx.lineWidth=3;ctx.strokeRect(453,364,54,91);ctx.fillStyle='#d4b67e';ctx.beginPath();ctx.arc(495,411,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#7c7964';ctx.fillRect(433,458,94,9);ctx.fillRect(426,467,108,9);drawPottedPlant(325,455,.6);drawPottedPlant(632,455,.65);
}

function drawStars(count, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i += 1) {
    const x = (i * 137) % W;
    const y = (i * 71) % 250;
    ctx.fillRect(x, y, 2 + (i % 2), 2 + (i % 2));
  }
}

function drawBar(x, y, w, h, pct, fill, bg) {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, Math.max(0, Math.min(w, w * pct)), h);
  ctx.strokeStyle = "#f7edd7";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
}

function addWarmLight(x, y, radius) {
  const gradient = ctx.createRadialGradient(x, y, 20, x, y, radius);
  gradient.addColorStop(0, "rgba(242,189,91,0.18)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

function addCoolLight(x, y, radius) {
  const gradient = ctx.createRadialGradient(x, y, 20, x, y, radius);
  gradient.addColorStop(0, "rgba(96,160,210,0.2)");
  gradient.addColorStop(1, "rgba(0,0,0,0.36)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

function fillGradient(top, bottom) {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

function roundRect(x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  if (fill) ctx.fill();
}

function triangle(x1, y1, x2, y2, x3, y3, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

function pixelText(text, x, y, size = 18, color = "#fff", align = "left") {
  ctx.font = `700 ${size}px "Trebuchet MS", system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000";
  ctx.fillText(text, x + 2, y + 2);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function wrapText(text, maxWidth, size) {
  ctx.font = `700 ${size}px "Trebuchet MS", system-ui, sans-serif`;
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function choose(items) {
  return items[Math.floor(Math.random() * items.length)];
}

window.addEventListener("keydown",event=>{
 const key=event.key.toLowerCase();
 if(['arrowup','arrowdown','arrowleft','arrowright',' ','enter','backspace'].includes(key))event.preventDefault();
 if(!event.repeat)controlKey(key);else if(!game.roomInputLocked)keys.add(key);
});
window.addEventListener("keyup",event=>{keys.delete(event.key.toLowerCase());game.roomInputLocked=false;});

function loop(now) {
  const dt = Math.min(0.033, (now - game.lastTime) / 1000 || 0);
  game.lastTime = now;
  update(dt);
  draw();
  pressed.clear();
  requestAnimationFrame(loop);
}

function drawPottedPlant(x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.fillStyle='#c09a7c';ctx.beginPath();ctx.moveTo(-15,-1);ctx.lineTo(15,-1);ctx.lineTo(11,22);ctx.lineTo(-10,22);ctx.closePath();ctx.fill();ctx.strokeStyle='#6e967c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,1);ctx.lineTo(0,-39);ctx.stroke();for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#8db092':'#668e76';ctx.beginPath();ctx.ellipse((i%2?1:-1)*10,-10-i*6,14,6,i%2?-.5:.5,0,Math.PI*2);ctx.fill();}ctx.restore();}
function drawAtmosphere(scene){
  const t=performance.now()/1000;ctx.save();for(let i=0;i<22;i++){const x=scene==='title'?(i*109+Math.sin(t*.3+i)*21+W)%W:160+(i*83%640)+Math.sin(t*.2+i)*12;const y=110+((i*47-t*7)%345+345)%345;ctx.globalAlpha=.15+(Math.sin(t+i)+1)*.12;ctx.fillStyle=scene==='title'?'#d5df9d':'#ead8b2';ctx.beginPath();ctx.arc(x,y,i%4===0?2:1,0,Math.PI*2);ctx.fill();}ctx.restore();
  const shade=ctx.createRadialGradient(480,320,210,480,320,590);shade.addColorStop(0,'#0000');shade.addColorStop(1,'#07121a9e');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
}
function updateDemoInterface(){
 if(game.battle)return;updateMovementUI(null);document.body?.classList.remove('in-battle');
 const state=document.querySelector('#scene-state'),quest=document.querySelector('#quest-note');if(!state)return;
 const label=game.mode==='title'?'Ready to explore':rooms[game.room].name;
 const note=game.flags.cityUnlocked?(game.flags.briarDefeated&&game.room==='city'?'The city is safe. Speak with the residents again.':game.room==='cottage'?'Use the Woodland Trail Map beside the bookshelves, or Leave cottage below.':['cedar','briarway'].includes(game.room)?'Follow the path north to the city, or south toward home. Z interacts with creatures; camp restores HP.':cityVoices().length<2?`Meet the city residents (${Math.min(2,cityVoices().length)} / 2). Briarhart waits beneath the arch.`:'The residents have shared their stories. Rest at the fountain, then speak with Briarhart.'):!game.flags.metMallow?'Find Mallow in the cottage and say hello.':game.room==='cottage'?'The cellar is open. Explore what is waiting below.':'Approach Duchess Nyx. Stay quick on your feet.';
 updateAdventureUI();
 if(state.textContent!==label)state.textContent=label;if(quest.textContent!==note)quest.textContent=note;
 const chapter=document.querySelector('.chapter');if(chapter)chapter.textContent=['cedar','briarway'].includes(game.room)?'CHAPTER 02 / THE WOODLAND ROAD':game.room==='city'?'CHAPTER 02 / VERDANT CROSSING'+(game.flags.cityPreview?' · PREVIEW':''):'CHAPTER 01 / THE COTTAGE';
 const travel=document.querySelector('#city-travel');if(travel)travel.hidden=!game.flags.cityUnlocked||game.room!=='cottage'||game.mode!=='overworld';
 const preview=document.querySelector('#city-preview');if(preview)preview.disabled=Boolean(game.battle)||game.flags.cityUnlocked;
}

setInterval(updateDemoInterface,300);
function controlKey(key){
 if(!gameReady)return;
 game.roomInputLocked=false;
 if(!keys.has(key))pressed.add(key);keys.add(key);
 if(key==='p'){togglePause();return;}
 if(game.paused)return;
 if(key==='r'){if(game.mode==='gameOver')retryBattle();else if(typeof window.confirm!=='function'||window.confirm('Start a new adventure? This replaces the saved story on this browser.'))resetGame();return;}
 if(key==='q'&&game.mode==='battleDodge'){parrySoul();return;}
 if(key==='e'&&game.mode==='battleDodge'){pulseSoul();return;}
 if(key===' '&&game.mode==='battleDodge'){if(movementMode(game.battle)==='gravity')requestSoulJump();else dashSoul();return;}
 if(['arrowup','w'].includes(key)&&game.mode==='battleDodge'&&movementMode(game.battle)==='gravity'){requestSoulJump();return;}
 if(['z',' ','enter'].includes(key)){handleConfirm();return;}
 if(key==='x')handleCancel();
 if(game.mode==='battleMenu'){
  if(['arrowleft','a'].includes(key))game.menuIndex=(game.menuIndex+3)%4;
  if(['arrowright','d'].includes(key))game.menuIndex=(game.menuIndex+1)%4;
 }
 if(game.mode==='battleSubMenu'){
  const size=game.menuIndex===1?3:Math.max(1,game.player.items.length);
  if(['arrowup','arrowleft','w','a'].includes(key))game.subMenuIndex=(game.subMenuIndex+size-1)%size;
  if(['arrowdown','arrowright','s','d'].includes(key))game.subMenuIndex=(game.subMenuIndex+1)%size;
 }
}
document.querySelectorAll('[data-key]').forEach(button=>{button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);button.classList.add('is-down');controlKey(button.dataset.key);});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>{keys.delete(button.dataset.key);game.roomInputLocked=false;button.classList.remove('is-down');});});
document.querySelector('#begin-story').addEventListener('click',event=>{handleConfirm();event.currentTarget.blur();});
window.addEventListener('blur',()=>{keys.clear();if(game.battle&&!['gameOver','battleEnd'].includes(game.mode))game.paused=true;});document.addEventListener('visibilitychange',()=>{keys.clear();if(document.hidden&&game.battle)game.paused=true;});
