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

// Player with advanced properties
let player = { 
  x: 100, 
  y: canvas.height / 2, 
  size: 20, 
  speed: 5, 
  vx: 0, 
  vy: 0, 
  friction: 0.92, 
  shield: 0, 
  speedBoost: 0, 
  shrink: 0, 
  trail: [] 
};
let obstacles = [];
let stars = [];
let particles = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameSpeed = 2;
let gameRunning = false;
let combo = 0;
let backgroundStars = { slow: [], fast: [] };

// Audio placeholders (uncomment and add files)
// const bgMusic = new Audio('background.mp3'); bgMusic.loop = true;
// const jumpSound = new Audio('jump.wav');
// const collectSound = new Audio('collect.wav');
// const crashSound = new Audio('crash.wav');
// const powerUpSound = new Audio('powerup.wav');

highScoreDisplay.textContent = highScore;

// Input handling
let keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (e.key === ' ' && gameRunning) {
    player.vy -= 12;
    // jumpSound.play();
  }
});
window.addEventListener('keyup', (e) => keys[e.key] = false);
canvas.addEventListener('touchstart', (e) => player.vy -= 12);
canvas.addEventListener('touchmove', (e) => {
  const touch = e.touches[0];
  player.x = touch.clientX - canvas.offsetLeft;
  player.y = touch.clientY - canvas.offsetTop;
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Initialize layered background stars
for (let i = 0; i < 80; i++) {
  backgroundStars.slow.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2 + 1, speed: 0.5 });
  backgroundStars.fast.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 3 + 1, speed: 1.5 });
}

function startGame() {
  startScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';
  player = { x: 100, y: canvas.height / 2, size: 20, speed: 5, vx: 0, vy: 0, friction: 0.92, shield: 0, speedBoost: 0, shrink: 0, trail: [] };
  obstacles = [];
  stars = [];
  particles = [];
  score = 0;
  combo = 0;
  gameSpeed = 2;
  scoreDisplay.textContent = score;
  gameRunning = true;
  // bgMusic.play();
  update();
}

function spawnObstacle() {
  let size = 30 + Math.random() * 30;
  obstacles.push({
    x: canvas.width + size,
    y: Math.random() * (canvas.height - size),
    size: size,
    speed: gameSpeed + Math.random() * 3,
    angle: 0
  });
  // Wave pattern every 10 obstacles
  if (obstacles.length % 10 === 0) {
    for (let i = 1; i < 5; i++) {
      obstacles.push({
        x: canvas.width + size + i * 80,
        y: canvas.height / 2 + Math.sin(i) * 100,
        size: size * 0.8,
        speed: gameSpeed,
        angle: 0
      });
    }
  }
}

function spawnStar() {
  stars.push({
    x: canvas.width,
    y: Math.random() * (canvas.height - 20),
    size: 15,
    angle: 0
  });
}

function spawnParticles(x, y, color, count, spread = 5) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * spread,
      vy: (Math.random() - 0.5) * spread,
      size: Math.random() * 6 + 2,
      life: 30,
      color: color,
      alpha: 1
    });
  }
}

function update() {
  if (!gameRunning) return;

  // Player movement
  if (keys['ArrowUp']) player.vy -= 1.2;
  if (keys['ArrowDown']) player.vy += 1.2;
  if (keys['ArrowLeft']) player.vx -= 1.2;
  if (keys['ArrowRight']) player.vx += 1.2;

  let speedMod = player.speedBoost > 0 ? 1.5 : 1;
  player.vx *= player.friction;
  player.vy *= player.friction;
  player.x += player.vx * speedMod;
  player.y += player.vy * speedMod;

  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

  // Player trail
  player.trail.push({ x: player.x, y: player.y, life: 10 });
  player.trail = player.trail.filter(t => t.life-- > 0);

  // Update power-ups
  if (player.shield > 0) player.shield--;
  if (player.speedBoost > 0) player.speedBoost--;
  if (player.shrink > 0) {
    player.shrink--;
    player.size = player.shrink > 0 ? 10 : 20;
  }

  // Update objects
  obstacles.forEach(o => {
    o.x -= o.speed;
    o.angle += 0.05;
  });
  stars.forEach(s => {
    s.x -= gameSpeed;
    s.angle += 0.1;
  });

  // Collision detection
  obstacles.forEach((o, i) => {
    if (checkCollision(player, o)) {
      if (player.shield > 0) {
        obstacles.splice(i, 1);
        spawnParticles(o.x, o.y, 'gray', 15);
      } else {
        gameRunning = false;
        spawnParticles(player.x, player.y, 'red', 30, 10);
        // crashSound.play();
        // bgMusic.pause();
        endGame();
      }
    }
  });
  stars = stars.filter(s => {
    if (checkCollision(player, s)) {
      combo++;
      score += 5 * Math.min(combo, 10); // Max 10x multiplier
      scoreDisplay.textContent = score;
      spawnParticles(s.x, s.y, 'yellow', 15);
      // collectSound.play();
      let rand = Math.random();
      if (rand < 0.1) player.shield = 150;        // Shield
      else if (rand < 0.15) player.speedBoost = 100; // Speed boost
      else if (rand < 0.2) player.shrink = 200;    // Shrink
      // if (rand < 0.2) powerUpSound.play();
      return false;
    }
    return true;
  });

  // Spawn logic
  if (Math.random() < 0.04) spawnObstacle();
  if (Math.random() < 0.02) spawnStar();
  gameSpeed += 0.003;
  combo = combo > 0 && stars.length === 0 ? 0 : combo;

  // Update particles and background
  particles = particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    p.alpha = p.life / 30;
    return p.life > 0;
  });
  backgroundStars.slow.forEach(s => { s.x -= s.speed; if (s.x < 0) s.x = canvas.width; });
  backgroundStars.fast.forEach(s => { s.x -= s.speed; if (s.x < 0) s.x = canvas.width; });

  obstacles = obstacles.filter(o => o.x + o.size > 0);
  stars = stars.filter(s => s.x + s.size > 0);

  draw();
  requestAnimationFrame(update);
}

function draw() {
  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#2a2a4e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Layered starfield
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  backgroundStars.slow.forEach(s => ctx.fillRect(s.x, s.y, s.size, s.size));
  ctx.fillStyle = 'white';
  backgroundStars.fast.forEach(s => ctx.fillRect(s.x, s.y, s.size, s.size));

  // Particles
  particles.forEach(p => {
    ctx.fillStyle = `${p.color}${Math.floor(p.alpha * 255).toString(16).padStart(2, '0')}`;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });

  // Player with trail and glow
  player.trail.forEach((t, i) => {
    ctx.fillStyle = `rgba(255, 255, 255, ${t.life / 10})`;
    ctx.beginPath();
    ctx.arc(t.x + player.size / 2, t.y + player.size / 2, player.size / 2 * (t.life / 10), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = player.shield > 0 ? 'cyan' : player.speedBoost > 0 ? 'orange' : player.shrink > 0 ? 'green' : 'white';
  ctx.beginPath();
  ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Obstacles (rotating asteroids)
  obstacles.forEach(o => {
    ctx.save();
    ctx.translate(o.x + o.size / 2, o.y + o.size / 2);
    ctx.rotate(o.angle);
    ctx.fillStyle = 'gray';
    ctx.beginPath();
    ctx.arc(0, 0, o.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Stars (sparkling)
  stars.forEach(s => {
    ctx.save();
    ctx.translate(s.x + s.size / 2, s.y + s.size / 2);
    ctx.rotate(s.angle);
    ctx.fillStyle = 'yellow';
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