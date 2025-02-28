const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');

canvas.width = Math.min(600, window.innerWidth * 0.9);
canvas.height = Math.min(800, window.innerHeight * 0.9);

// Player with momentum
let player = { 
  x: 100, 
  y: canvas.height / 2, 
  size: 20, 
  speed: 5, 
  vx: 0, 
  vy: 0, 
  friction: 0.9, 
  shield: false, 
  shieldTime: 0 
};
let obstacles = [];
let stars = [];
let particles = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameSpeed = 2;
let gameRunning = false;
let backgroundStars = [];

highScoreDisplay.textContent = highScore;

// Input handling
let keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);
canvas.addEventListener('touchstart', (e) => player.vy -= 10);
canvas.addEventListener('touchmove', (e) => {
  const touch = e.touches[0];
  player.x = touch.clientX - canvas.offsetLeft;
  player.y = touch.clientY - canvas.offsetTop;
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Initialize background stars
for (let i = 0; i < 100; i++) {
  backgroundStars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 2 + 1
  });
}

function startGame() {
  startScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';
  player = { x: 100, y: canvas.height / 2, size: 20, speed: 5, vx: 0, vy: 0, friction: 0.9, shield: false, shieldTime: 0 };
  obstacles = [];
  stars = [];
  particles = [];
  score = 0;
  gameSpeed = 2;
  scoreDisplay.textContent = score;
  gameRunning = true;
  update();
}

function spawnObstacle() {
  let size = 30 + Math.random() * 30;
  obstacles.push({
    x: canvas.width + size,
    y: Math.random() * (canvas.height - size),
    size: size,
    speed: gameSpeed + Math.random() * 2
  });
}

function spawnStar() {
  stars.push({
    x: canvas.width,
    y: Math.random() * (canvas.height - 20),
    size: 15,
    angle: 0
  });
}

function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      size: Math.random() * 5 + 2,
      life: 20,
      color: color
    });
  }
}

function update() {
  if (!gameRunning) return;

  // Player movement with momentum
  if (keys['ArrowUp']) player.vy -= 1;
  if (keys['ArrowDown']) player.vy += 1;
  if (keys['ArrowLeft']) player.vx -= 1;
  if (keys['ArrowRight']) player.vx += 1;
  if (keys[' ']) player.vy -= 10;

  player.vx *= player.friction;
  player.vy *= player.friction;
  player.x += player.vx;
  player.y += player.vy;

  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

  // Update obstacles and stars
  obstacles.forEach(o => o.x -= o.speed);
  stars.forEach(s => {
    s.x -= gameSpeed;
    s.angle += 0.1;
  });

  // Shield timer
  if (player.shield) {
    player.shieldTime--;
    if (player.shieldTime <= 0) player.shield = false;
  }

  // Collision detection
  obstacles.forEach((o, i) => {
    if (checkCollision(player, o)) {
      if (!player.shield) {
        gameRunning = false;
        spawnParticles(player.x, player.y, 'red', 20);
        endGame();
      } else {
        obstacles.splice(i, 1);
        spawnParticles(o.x, o.y, 'gray', 10);
      }
    }
  });
  stars = stars.filter(s => {
    if (checkCollision(player, s)) {
      score += 5;
      if (Math.random() < 0.1) { // 10% chance for shield power-up
        player.shield = true;
        player.shieldTime = 100;
      }
      spawnParticles(s.x, s.y, 'yellow', 10);
      scoreDisplay.textContent = score;
      return false;
    }
    return true;
  });

  // Spawn logic
  if (Math.random() < 0.03) spawnObstacle();
  if (Math.random() < 0.015) spawnStar();

  gameSpeed += 0.002;

  // Update particles and background stars
  particles = particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    return p.life > 0;
  });
  backgroundStars.forEach(s => {
    s.x -= s.speed;
    if (s.x < 0) s.x = canvas.width;
  });

  obstacles = obstacles.filter(o => o.x + o.size > 0);
  stars = stars.filter(s => s.x + s.size > 0);

  draw();
  requestAnimationFrame(update);
}

function draw() {
  // Draw scrolling starfield
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  backgroundStars.forEach(s => ctx.fillRect(s.x, s.y, s.size, s.size));

  // Draw particles
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });

  // Draw player (circle with shield effect)
  ctx.fillStyle = player.shield ? 'cyan' : 'white';
  ctx.beginPath();
  ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw obstacles (circles)
  ctx.fillStyle = 'gray';
  obstacles.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x + o.size / 2, o.y + o.size / 2, o.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw stars (rotating star shape)
  ctx.fillStyle = 'yellow';
  stars.forEach(s => {
    ctx.save();
    ctx.translate(s.x + s.size / 2, s.y + s.size / 2);
    ctx.rotate(s.angle);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(Math.cos(Math.PI * 2 * i / 5) * s.size, Math.sin(Math.PI * 2 * i / 5) * s.size);
      ctx.lineTo(Math.cos(Math.PI * 2 * (i + 0.5) / 5) * s.size / 2, Math.sin(Math.PI * 2 * (i + 0.5) / 5) * s.size / 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

function checkCollision(a, b) {
  const dx = (a.x + a.size / 2) - (b.x + b.size / 2);
  const dy = (a.y + a.size / 2) - (b.y + b.size / 2);
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < (a.size / 2 + b.size / 2);
}

function endGame() {
  finalScoreDisplay.textContent = score;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('highScore', highScore);
    highScoreDisplay.textContent = highScore;
  }
  gameOverScreen.style.display = 'block';
}

startScreen.style.display = 'block';