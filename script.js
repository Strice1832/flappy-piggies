const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* ================= FULLSCREEN ================= */
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* ================= IMAGES ================= */
const bgImg = new Image();
bgImg.src = "assets/background.webp";

const pigImg = new Image();
pigImg.src = "assets/piggy1.png";

const birdImg = new Image();
birdImg.src = "assets/red-angry-bird1.png";

/* ================= AUDIO ================= */
let musicOn = true;
let soundOn = true;
let audioUnlocked = false;

const introMusic = new Audio("audio/intro.mp3");
introMusic.loop = true;
introMusic.volume = 0.6;

const gameMusic = new Audio("audio/game.mp3");
gameMusic.loop = true;
gameMusic.volume = 0.6;

const flapSound = new Audio("audio/Flap.mp3");
flapSound.volume = 0.7;

const gameOverSound = new Audio("audio/Game Over.mp3");
gameOverSound.volume = 0.7;

window.addEventListener("pointerdown", () => {
  if (!audioUnlocked) {
    audioUnlocked = true;
    if (musicOn) introMusic.play().catch(() => {});
  }
}, { once: true });

/* ================= STATE ================= */
const STATE = { HOME: 0, PLAYING: 1, GAMEOVER: 2 };
let state = STATE.HOME;

/* ================= BACKGROUND ================= */
let bgOffset = 0;
const bgSpeed = 0.4;

/* ================= HOME FLYING PIGS ================= */
let homePigs = [];
let homeSpawnTimer = 0;
let homeNextSpawn = randomHomeDelay();

function randomHomeDelay() {
  return 120 + Math.random() * 240;
}

function spawnHomePig() {
  if (homePigs.length >= 3) return;

  const fromLeft = Math.random() > 0.5;
  homePigs.push({
    x: fromLeft ? -120 : canvas.width + 120,
    y: Math.random() * canvas.height * 0.5 + 40,
    speed: fromLeft ? 7 + Math.random() * 3 : -(7 + Math.random() * 3),
    size: 64,
    flip: !fromLeft
  });
}

/* ================= PLAYER ================= */
const pigSize = 92;
let pig = {
  x: 140,
  y: 300,
  w: pigSize,
  h: pigSize,
  vel: 0
};

/* ================= PHYSICS ================= */
const gravity = 0.2;
const flapPower = -4.3;
const maxFall = 7;

/* ================= HITBOX ================= */
const hitboxSide = 10;
const hitboxTop = 16;
const hitboxBottom = 6;

/* ================= PILLARS ================= */
const birdSize = 72;
const pillarSpeed = 2;
const pillarInterval = 140;
let pillars = [];
let pillarTimer = 0;
const gap = () => canvas.height * 0.45;

/* ================= SCORE ================= */
let score = 0;

/* ================= BUTTONS ================= */
const btn = {
  start: { w: 220, h: 60 },
  restart: { w: 220, h: 60 },
  home: { w: 220, h: 60 },
  music: { w: 160, h: 40 },
  sound: { w: 160, h: 40 }
};

/* ================= INPUT ================= */
canvas.addEventListener("click", e => {
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;

  if (state === STATE.HOME) {
    if (hit(x, y, btn.start)) startGame();
    if (hit(x, y, btn.music)) toggleMusic();
    if (hit(x, y, btn.sound)) toggleSound();
    return;
  }

  if (state === STATE.GAMEOVER) {
    if (hit(x, y, btn.restart)) startGame();
    if (hit(x, y, btn.home)) goHome();
    if (hit(x, y, btn.music)) toggleMusic();
    if (hit(x, y, btn.sound)) toggleSound();
    return;
  }

  if (state === STATE.PLAYING) {
    pig.vel = flapPower;
    if (soundOn) {
      const s = flapSound.cloneNode();
      s.play();
    }
  }
});

function hit(x, y, b) {
  return x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h;
}

/* ================= TOGGLES ================= */
function toggleMusic() {
  musicOn = !musicOn;
  introMusic.pause();
  gameMusic.pause();
  if (musicOn && audioUnlocked) {
    (state === STATE.PLAYING ? gameMusic : introMusic).play();
  }
}

function toggleSound() {
  soundOn = !soundOn;
}

/* ================= GAME FLOW ================= */
function startGame() {
  pig.y = canvas.height / 2;
  pig.vel = 0;
  pillars = [];
  score = 0;
  pillarTimer = 0;
  state = STATE.PLAYING;

  introMusic.pause();
  if (musicOn && audioUnlocked) gameMusic.play();
}

if (musicOn) {
  gameMusic.currentTime = 0;
  gameMusic.play().catch(() => {});
}

function endGame() {
  state = STATE.GAMEOVER;
  gameMusic.pause();
  if (soundOn) gameOverSound.play();
}

function goHome() {
  state = STATE.HOME;
  homePigs = [];
  homeSpawnTimer = 0;
  homeNextSpawn = randomHomeDelay();
  if (musicOn && audioUnlocked) introMusic.play();
}

/* ================= UPDATE ================= */
function update() {
  bgOffset += bgSpeed;

  if (state === STATE.HOME) {
    homeSpawnTimer++;
    if (homeSpawnTimer >= homeNextSpawn) {
      spawnHomePig();
      homeSpawnTimer = 0;
      homeNextSpawn = randomHomeDelay();
    }

    homePigs.forEach(p => p.x += p.speed);
    homePigs = homePigs.filter(p => p.x > -200 && p.x < canvas.width + 200);
    return;
  }

  if (state !== STATE.PLAYING) return;

  pig.vel += gravity;
  pig.vel = Math.min(pig.vel, maxFall);
  pig.y += pig.vel;

  if (pig.y < 0 || pig.y + pig.h > canvas.height) endGame();

  pillarTimer++;
  if (pillarTimer >= pillarInterval) {
    spawnPillar();
    pillarTimer = 0;
  }

  pillars.forEach(p => {
    p.x -= pillarSpeed;

    const L = pig.x + hitboxSide;
    const R = pig.x + pig.w - hitboxSide;
    const T = pig.y + hitboxTop;
    const B = pig.y + pig.h - hitboxBottom;

    if (R > p.x && L < p.x + birdSize && (T < p.top || B > p.bottom))
      endGame();

    if (!p.passed && p.x + birdSize < pig.x) {
      score++;
      p.passed = true;
    }
  });

  pillars = pillars.filter(p => p.x > -birdSize);
}

function spawnPillar() {
  const t = Math.random() * (canvas.height / 2) + 140;
  pillars.push({ x: canvas.width, top: t, bottom: t + gap(), passed: false });
}

/* ================= DRAW ================= */
function drawBackground() {
  if (!bgImg.complete) {
    ctx.fillStyle = "#87CEEB";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const scale = canvas.height / bgImg.height;
  const w = bgImg.width * scale;
  let x = -(bgOffset % w);

  while (x < canvas.width) {
    ctx.drawImage(bgImg, x, 0, w, canvas.height);
    x += w;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  if (state === STATE.HOME) {
    drawHome();
    return;
  }

  pillars.forEach(p => {
    for (let y = p.top; y > -birdSize; y -= birdSize)
      ctx.drawImage(birdImg, p.x, y - birdSize, birdSize, birdSize);
    for (let y = p.bottom; y < canvas.height; y += birdSize)
      ctx.drawImage(birdImg, p.x, y, birdSize, birdSize);
  });

  ctx.drawImage(pigImg, pig.x, pig.y, pig.w, pig.h);

/* score box FIXED */
ctx.save();

ctx.textAlign = "left";
ctx.textBaseline = "middle";

const scoreBoxX = 20;
const scoreBoxY = 20;
const scoreBoxW = 190;
const scoreBoxH = 52;

ctx.fillStyle = "rgba(0,0,0,0.65)";
ctx.fillRect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH);

ctx.fillStyle = "#ffffff";
ctx.font = "24px Arial";
ctx.fillText(
  "Score: " + score,
  scoreBoxX + 14,
  scoreBoxY + scoreBoxH / 2
);

ctx.restore();

  if (state === STATE.GAMEOVER) drawGameOver();
}

/* ================= HOME ================= */
function drawHome() {
  homePigs.forEach(p => {
    ctx.save();
    if (p.flip) {
      ctx.scale(-1, 1);
      ctx.drawImage(pigImg, -p.x - p.size, p.y, p.size, p.size);
    } else {
      ctx.drawImage(pigImg, p.x, p.y, p.size, p.size);
    }
    ctx.restore();
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "#2ECC71";
  ctx.font = "72px 'Comic Sans MS', cursive";
  ctx.fillText("Flappy Piggies", canvas.width / 2, canvas.height / 2 - 140);

  btn.start.x = canvas.width / 2 - 110;
  btn.start.y = canvas.height / 2 - 30;
  drawButton(btn.start, "START", "#4CAF50");

  drawToggles();
}

/* ================= GAME OVER ================= */
function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = "56px Arial";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 140);

  const y = canvas.height / 2 - 20;
  btn.restart.x = canvas.width / 2 - 240;
  btn.restart.y = y;
  btn.home.x = canvas.width / 2 + 20;
  btn.home.y = y;

  drawButton(btn.restart, "Restart", "#4CAF50")
  drawButton(btn.home, "Home", "#16A085")

  drawToggles();
}

/* ================= TOGGLES ================= */
function drawToggles() {
  const cx = canvas.width / 2;
  const y = canvas.height / 2 + 70;

  btn.music.x = cx - 180;
  btn.music.y = y;
  btn.sound.x = cx + 20;
  btn.sound.y = y;

  drawButton(btn.music, musicOn ? "Music: ON" : "Music: OFF", "#2196F3");
  drawButton(btn.sound, soundOn ? "Sound: ON" : "Sound: OFF", "#FF5722");
}

/* ================= BUTTON ================= */
function drawButton(b, text, color) {
  ctx.fillStyle = color;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = "#fff";
  ctx.font = "22px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, b.x + b.w / 2, b.y + 28);
}

/* ================= LOOP ================= */
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
