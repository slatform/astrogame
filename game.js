const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const ui = document.getElementById('ui');
const scoreDisplay = document.getElementById('score');

canvas.width = Math.min(600, window.innerWidth * 0.9);
canvas.height = Math.min(800, window.innerHeight * 0.9);

let player = { x: 100, y: canvas.height / 2, size: 30, speed: 5 };
let obstacles = [];
let stars = [];
let score = 0;
let gameSpeed = 2;
let gameRunning = false;

let keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

canvas.addEventListener('touchstart', (e) => player.y -= 50);
canvas.addEventListener('touchmove', (e) => {
  const touch = e.touches[0];
  player.x = touch.clientX - canvas.offsetLeft;
  player.y = touch.clientY - canvas.offsetTop;
});

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
    if (checkCollision(player, o)) gameRunning = false;
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.fillStyle = 'gray';
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.size, o.size));
  ctx.fillStyle = 'yellow';
  stars.forEach(s => ctx.fillRect(s.x, s.y, s.size, s.size));
}

function checkCollision(a, b) {
  return a.x < b.x + b.size && a.x + a.size > b.x && a.y < b.y + b.size && a.y + a.size > b.y;
}

gameRunning = true;
update();