/* =======================
   Flappy Piggies – script.js
   ======================= */

/* ========= Canvas ========= */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/* ========= Game States ========= */
const STATE = {
  HOME: 0,
  PLAYING: 1,
  GAMEOVER: 2
};
let state = STATE.HOME;

/* ========= Images ========= */
const bgImg = new Image();
bgImg.src = "assets/background.webp";

const pigImg = new Image();
pigImg.src = "assets/piggy1.png";

const birdImg = new Image();
birdImg.src = "assets/red-angry-bird1.png";

/* ========= Audio ========= */
let musicOn = true;
let soundOn = true;
let audioUnlocked = false;

const introMusic = new Audio("audio/intro.mp3");
const gameMusic = new Audio("audio/game.mp3");
const flapSound = new Audio("audio/flap.mp3");
const gameOverSound = new Audio("audio/gameover.mp3");

introMusic.loop = true;
gameMusic.loop = true;

function unlockAudio() {
  if (audioUnlocked) return;
  [introMusic, gameMusic, flapSound, gameOverSound].forEach(a => {
    a.volume = 0;
    a.play().then(() => {
      a.pause();
      a.currentTime = 0;
      a.volume = 1;
    }).catch(()=>{});
  });
  audioUnlocked = true;
}

/* ========= Background Scroll ========= */
let bgX = 0;
const bgSpeed = 0.3;

/* ========= Pig ========= */
const pig = {
  x: 120,
  y: 200,
  radius: 26,
  velocity: 0
};

const gravity = 0.2;      // balanced feel
const flapPower = -4.3;   // balanced feel

/* ========= Pillars ========= */
let pillars = [];
const pillarWidth = 60;
const pillarGap = 190;    // increased gap
const pillarSpeed = 2.2;
const pillarSpacing = 300;

/* ========= Score ========= */
let score = 0;

/* ========= UI Buttons ========= */
const btn = {
  start: { w: 220, h: 60 },
  restart: { w: 220, h: 60 },
  home: { w: 220, h: 60 },
  music: { w: 160, h: 45 },
  sound: { w: 160, h: 45 }
};

/* ========= Utility ========= */
function inRect(x, y, b) {
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

/* ========= Music Control ========= */
function playIntro() {
  gameMusic.pause();
  gameMusic.currentTime = 0;
  if (musicOn) introMusic.play().catch(()=>{});
}

function playGameMusic() {
  introMusic.pause();
  introMusic.currentTime = 0;
  if (musicOn) gameMusic.play().catch(()=>{});
}

/* ========= Game Logic ========= */
function resetGame() {
  pig.y = canvas.height / 2;
  pig.velocity = 0;
  pillars = [];
  score = 0;
}

function spawnPillar() {
  const topHeight = Math.random() * (canvas.height - pillarGap - 200) + 100;
  pillars.push({
    x: canvas.width,
    top: topHeight,
    passed: false
  });
}

/* ========= Collision ========= */
function collide(p, pl) {
  const inX = p.x + p.radius > pl.x && p.x - p.radius < pl.x + pillarWidth;
  const hitTop = p.y - p.radius < pl.top;
  const hitBottom = p.y + p.radius > pl.top + pillarGap;
  return inX && (hitTop || hitBottom);
}

/* ========= Input ========= */
function flap() {
  if (state === STATE.PLAYING) {
    pig.velocity = flapPower;
    if (soundOn) {
      flapSound.currentTime = 0;
      flapSound.play().catch(()=>{});
    }
  }
}

canvas.addEventListener("mousedown", e => {
  unlockAudio();
  const r = canvas.getBoundingClientRect();
  const mx = e.clientX - r.left;
  const my = e.clientY - r.top;

  if (state === STATE.HOME) {
    if (inRect(mx,my,btn.start)) {
      state = STATE.PLAYING;
      resetGame();
      playGameMusic();
    }
    if (inRect(mx,my,btn.music)) {
      musicOn = !musicOn;
      musicOn ? playIntro() : introMusic.pause();
    }
    if (inRect(mx,my,btn.sound)) soundOn = !soundOn;
  }

  else if (state === STATE.GAMEOVER) {
    if (inRect(mx,my,btn.restart)) {
      state = STATE.PLAYING;
      resetGame();
      playGameMusic();
    }
    if (inRect(mx,my,btn.home)) {
      state = STATE.HOME;
      playIntro();
    }
    if (inRect(mx,my,btn.music)) {
      musicOn = !musicOn;
      musicOn ? playIntro() : introMusic.pause();
    }
    if (inRect(mx,my,btn.sound)) soundOn = !soundOn;
  }

  flap();
});

document.addEventListener("keydown", e => {
  if (e.code === "Space") flap();
});

/* ========= Drawing ========= */
function drawBackground() {
  bgX -= bgSpeed;
  if (bgX <= -canvas.width) bgX = 0;
  ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);
}

function drawPig() {
  ctx.drawImage(
    pigImg,
    pig.x - pig.radius,
    pig.y - pig.radius,
    pig.radius * 2,
    pig.radius * 2
  );
}

function drawPillars() {
  pillars.forEach(p => {
    for (let y = -40; y < p.top; y += 40)
      ctx.drawImage(birdImg, p.x, y, 40, 40);
    for (let y = p.top + pillarGap; y < canvas.height; y += 40)
      ctx.drawImage(birdImg, p.x, y, 40, 40);
  });
}

function drawScore() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(20,20,170,50);
  ctx.fillStyle = "#fff";
  ctx.font = "26px Arial";
  ctx.fillText("Score: " + score, 35, 55);
}

function drawButton(b, txt, color) {
  ctx.fillStyle = color;
  ctx.fillRect(b.x,b.y,b.w,b.h);
  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.textAlign = "center";
  ctx.fillText(txt, b.x + b.w/2, b.y + b.h/2 + 7);
  ctx.textAlign = "left";
}

/* ========= UI ========= */
function placeButtons(home) {
  const cx = canvas.width / 2;

  if (home) {
    btn.start.x = cx - 110;
    btn.start.y = canvas.height / 2 - 20;

    btn.music.x = cx - 180;
    btn.music.y = canvas.height / 2 + 60;

    btn.sound.x = cx + 20;
    btn.sound.y = canvas.height / 2 + 60;

    drawButton(btn.start,"START","#4CAF50");
  } else {
    btn.restart.x = cx - 240;
    btn.restart.y = canvas.height / 2;

    btn.home.x = cx + 20;
    btn.home.y = canvas.height / 2;

    btn.music.x = cx - 180;
    btn.music.y = canvas.height / 2 + 80;

    btn.sound.x = cx + 20;
    btn.sound.y = canvas.height / 2 + 80;

    drawButton(btn.restart,"Restart","#FF9800");
    drawButton(btn.home,"Home","#009688");
  }

  drawButton(btn.music, musicOn ? "Music: ON" : "Music: OFF", "#2196F3");
  drawButton(btn.sound, soundOn ? "Sound: ON" : "Sound: OFF", "#FF5722");
}

/* ========= Screens ========= */
function drawHome() {
  drawBackground();
  ctx.fillStyle = "#2ecc71";
  ctx.font = "64px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Flappy Piggies", canvas.width/2, canvas.height/3);
  ctx.textAlign = "left";
  placeButtons(true);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = "56px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width/2, canvas.height/3);
  ctx.textAlign = "left";
  placeButtons(false);
}

/* ========= Update ========= */
function update() {
  if (state === STATE.PLAYING) {
    pig.velocity += gravity;
    pig.y += pig.velocity;

    if (pillars.length === 0 || pillars[pillars.length-1].x < canvas.width - pillarSpacing)
      spawnPillar();

    pillars.forEach(p => {
      p.x -= pillarSpeed;

      if (!p.passed && p.x + pillarWidth < pig.x) {
        score++;
        p.passed = true;
      }

      if (collide(pig,p)) {
        state = STATE.GAMEOVER;
        gameMusic.pause();
        if (soundOn) gameOverSound.play().catch(()=>{});
      }
    });

    if (pig.y > canvas.height || pig.y < 0) {
      state = STATE.GAMEOVER;
      gameMusic.pause();
      if (soundOn) gameOverSound.play().catch(()=>{});
    }

    pillars = pillars.filter(p => p.x > -pillarWidth);
  }
}

/* ========= Loop ========= */
function loop() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if (state === STATE.HOME) drawHome();
  else {
    drawBackground();
    drawPillars();
    drawPig();
    drawScore();
    if (state === STATE.GAMEOVER) drawGameOver();
  }

  update();
  requestAnimationFrame(loop);
}

/* ========= Start ========= */
playIntro();
loop();

