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

let player = { x: 100, y: canvas.height / 2, size: 30, speed: 5 };
let obstacles = [];
let stars = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameSpeed = 2;
let gameRunning = false;

highScoreDisplay.textContent = highScore;

let keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

canvas.addEventListener('touchstart', (e) => player.y -= 50);
canvas.addEventListener('touchmove', (e) => {
  const touch = e.touches[0];
  player.x = touch.clientX - canvas.offsetLeft;
  player.y = touch.clientY - canvas.offsetTop;
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

function startGame() {
  startScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';
  player = { x: 100, y: canvas.height / 2, size: 30, speed: 5 };
  obstacles = [];
  stars = [];
  score = 0;
  gameSpeed = 2;
  scoreDisplay.textContent = score;
  gameRunning = true;
  update();
}

function spawnObstacle() {
  obstacles.push({
    x: canvas.width,
    y: Math.random() * (canvas.height - 50),
    size: 40 + Math.random() * 20
  });
}

function spawnStar() {
  stars.push({
    x: canvas.width,
    y: Math.random() * (canvas.height - 20),
    size: 20
  });
}

function update() {
  if (!gameRunning) return;

  if (keys['ArrowUp']) player.y -= player.speed;
  if (keys['ArrowDown']) player.y += player.speed;
  if (keys['ArrowLeft']) player.x -= player.speed;
  if (keys['ArrowRight']) player.x += player.speed;
  if (keys[' ']) player.y -= 50;

  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

  obstacles.forEach(o => o.x -= gameSpeed);
  stars.forEach(s => s.x -= gameSpeed);

  obstacles.forEach(o => {
    if (checkCollision(player, o)) {
      gameRunning = false;
      endGame();
    }
  });
  stars = stars.filter(s => {
    if (checkCollision(player, s)) {
      score += 1;
      scoreDisplay.textContent = score;
      return false;
    }
    return true;
  });

  if (Math.random() < 0.02) spawnObstacle();
  if (Math.random() < 0.01) spawnStar();

  gameSpeed += 0.001;

  obstacles = obstacles.filter(o => o.x + o.size > 0);
  stars = stars.filter(s => s.x + s.size > 0);

  draw();
  requestAnimationFrame(update);
}

function draw() {
  // Draw background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Add some static stars for depth
  ctx.fillStyle = 'white';
  for (let i = 0; i < 50; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
  }

  // Draw player as a circle instead of a square
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw obstacles
  ctx.fillStyle = 'gray';
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.size, o.size));

  // Draw stars
  ctx.fillStyle = 'yellow';
  stars.forEach(s => ctx.fillRect(s.x, s.y, s.size, s.size));
}

function checkCollision(a, b) {
  return a.x < b.x + b.size && a.x + a.size > b.x && a.y < b.y + b.size && a.y + a.size > b.y;
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

startScreen.style.display = 'block'; // Show start screen initially