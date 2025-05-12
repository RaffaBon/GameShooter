const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.cursor = 'none';

const player = {
  size: 40,
  x: canvas.width / 2 - 20,
  y: canvas.height - 60,
  color: '#FFFFFF',
  speed: 10
};

const projectiles = [];
const enemies = [];
const enemyProjectiles = [];
const rainProjectiles = [];
let normalEnemyCount = 0;

let score = 0;
let lives = 5;
let enemiesEscaped = 7;
let gameOver = false;
let gamePaused = false;

let timerStarted = false;
let rainActive = false;
let timer = 5;
let timerInterval;

let isShaking = false;
let shakeInterval;

window.addEventListener('keydown', (e) => {
  if (e.altKey && e.key === 'p') {
    const senha = prompt("Digite a senha:");
    if (senha === '5595') {
      const novoScore = prompt("Digite o novo valor do score:");
      const novoScoreNum = parseInt(novoScore);
      if (!isNaN(novoScoreNum)) {
        score = Math.min(novoScoreNum, 50);
      } else {
        alert("Valor inválido.");
      }
    } else {
      alert("Senha incorreta!");
    }
    return;
  }

  if (gamePaused) return;

  if (e.key === ' ' || e.key === 'Space') {
    createProjectile();
  }

  if (e.key === 'Backspace') {
    e.preventDefault();
    window.location.href = "../index.html";
  }
});

function createProjectile() {
  const projectile = {
    x: player.x + player.size / 2 - 2.5,
    y: player.y,
    width: 5,
    height: 15,
    color: '#FFFFFF',
    speed: 7
  };
  projectiles.push(projectile);
}

function spawnEnemy() {
  let enemy;
  const strongEnemyCondition = score >= 30 && normalEnemyCount >= 5;

  if (strongEnemyCondition) {
    let health = 3;
    let canShoot = false;

    if (score >= 40) {
      health = 6;
      canShoot = score >= 45;
    }

    enemy = {
      x: Math.random() * (canvas.width - 40),
      y: -40,
      size: 40,
      speed: 2,
      color: 'darkred',
      health: health,
      hitsTaken: 0,
      canShoot: canShoot,
      shootFrequency: 0.002
    };

    normalEnemyCount = 0;
  } else {
    enemy = {
      x: Math.random() * (canvas.width - 40),
      y: -40,
      size: 40,
      speed: score >= 25 ? 3 : 2,
      color: 'red',
      health: 1,
      hitsTaken: 0,
      canShoot: score >= 15,
      shootFrequency: score >= 25 ? 0.01 : 0.005
    };
    normalEnemyCount++;
  }

  enemies.push(enemy);
}

function createEnemyProjectile(enemy) {
  const projectile = {
    x: enemy.x + enemy.size / 2 - 2.5,
    y: enemy.y + enemy.size,
    width: 5,
    height: 15,
    color: 'red',
    speed: 6
  };
  enemyProjectiles.push(projectile);
}

function createRainProjectile() {
  const projectile = {
    x: Math.random() * (canvas.width - 5),
    y: 0,
    width: 5,
    height: 15,
    color: 'red',
    speed: 6
  };
  rainProjectiles.push(projectile);
}

function updateRainProjectiles() {
  for (let i = 0; i < rainProjectiles.length; i++) {
    const p = rainProjectiles[i];
    p.y += p.speed;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.width, p.height);

    if (p.y > canvas.height) {
      rainProjectiles.splice(i, 1);
      i--;
      continue;
    }

    if (isColliding(p, player)) {
      lives--;
      rainProjectiles.splice(i, 1);
      i--;
      if (lives <= 0) {
        gameOver = true;
        showExplosionAndEnd();
      }
    }
  }
}

function isColliding(a, b) {
  const aWidth = a.width || a.size;
  const aHeight = a.height || a.size;
  const bWidth = b.width || b.size;
  const bHeight = b.height || b.size;

  return (
    a.x < b.x + bWidth &&
    a.x + aWidth > b.x &&
    a.y < b.y + bHeight &&
    a.y + aHeight > b.y
  );
}

let pointerLocked = false;
document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === canvas;
});

window.addEventListener('mousemove', (e) => {
  if (!gamePaused) {
    if (pointerLocked) {
      player.x += e.movementX;
    } else {
      player.x = e.clientX - player.size / 2;
    }

    if (player.x < 0) player.x = 0;
    if (player.x + player.size > canvas.width) {
      player.x = canvas.width - player.size;
    }
  }
});

window.addEventListener('mousedown', (e) => {
  if (!gamePaused && e.button === 0) {
    createProjectile();
  }
});

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.size, player.size);
}

function drawProjectiles() {
  for (let i = 0; i < projectiles.length; i++) {
    const p = projectiles[i];
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.width, p.height);
    p.y -= p.speed;
    if (p.y < 0) {
      projectiles.splice(i, 1);
      i--;
    }
  }
}

function updateEnemyProjectiles() {
  for (let i = 0; i < enemyProjectiles.length; i++) {
    const p = enemyProjectiles[i];
    p.y += p.speed;

    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.width, p.height);

    if (p.y > canvas.height) {
      enemyProjectiles.splice(i, 1);
      i--;
      continue;
    }

    if (isColliding(p, player)) {
      lives--;
      enemyProjectiles.splice(i, 1);
      i--;
      if (lives <= 0) {
        gameOver = true;
        showExplosionAndEnd();
      }
    }
  }
}

function drawEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    ctx.fillStyle = e.color;
    ctx.fillRect(e.x, e.y, e.size, e.size);
    e.y += e.speed;

    if (e.y > canvas.height) {
      enemiesEscaped--;
      enemies.splice(i, 1);
      i--;
      checkGameOver();
      continue;
    }

    if (isColliding(player, e)) {
      lives--;
      enemies.splice(i, 1);
      i--;
      checkGameOver();
      continue;
    }

    for (let j = 0; j < projectiles.length; j++) {
      const p = projectiles[j];
      if (isColliding(e, p)) {
        if (e.health > 1) {
          e.hitsTaken++;
          projectiles.splice(j, 1);
          if (e.hitsTaken >= e.health) {
            enemies.splice(i, 1);
            if (score < 50) score++;
            i--;
          }
        } else {
          enemies.splice(i, 1);
          projectiles.splice(j, 1);
          if (score < 50) score++;
          i--;
        }
        break;
      }
    }

    if (e.canShoot && Math.random() < e.shootFrequency) {
      createEnemyProjectile(e);
    }
  }
}

function drawScore() {
  ctx.fillStyle = '#00FF00';
  ctx.font = '16px "Press Start 2P"';
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE: ${score}`, canvas.width - 20, 40);
}

function drawStats() {
  ctx.fillStyle = '#00FF00';
  ctx.font = '14px "Press Start 2P"';
  ctx.textAlign = 'left';
  ctx.fillText(`LIVES: ${lives}`, 20, canvas.height - 20);
  ctx.textAlign = 'right';
  ctx.fillText(`ESCAPED: ${enemiesEscaped}`, canvas.width - 20, canvas.height - 20);
}

function checkGameOver() {
  if (gameOver) return;

  if (lives <= 0 || enemiesEscaped <= 0) {
    gameOver = true;
    gamePaused = true;

    if (lives <= 0) {
      showExplosionAndEnd();
    } else {
      setTimeout(() => {
        alert(`Game Over! Pontuação Final: ${score}`);
        window.location.href = "../index.html";
      }, 100);
    }
  }
}

function showExplosionAndEnd() {
  const playerElement = document.querySelector('canvas');
  playerElement.style.visibility = 'hidden';

  const explosion = document.createElement('img');
  explosion.src = "../IMG/Explosão.gif";
  explosion.style.position = 'absolute';
  explosion.style.width = '80px';
  explosion.style.height = '80px';
  explosion.style.left = `${player.x + player.size / 2 - 40}px`;
  explosion.style.top = `${player.y + player.size / 2 - 40}px`;
  explosion.style.zIndex = 9999;
  document.body.appendChild(explosion);

  setTimeout(() => {
    explosion.remove();
    alert(`Game Over! Pontuação Final: ${score}`);
    window.location.href = "../index.html";
  }, 1000);
}

function startScreenShake(duration = 3000, intensity = 5) {
  if (isShaking) return;
  isShaking = true;

  shakeInterval = setInterval(() => {
    const offsetX = (Math.random() - 0.5) * intensity * 2;
    const offsetY = (Math.random() - 0.5) * intensity * 2;
    canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  }, 50);

  setTimeout(() => {
    stopScreenShake();
  }, duration);
}

function stopScreenShake() {
  clearInterval(shakeInterval);
  canvas.style.transform = 'translate(0px, 0px)';
  isShaking = false;
}

function startTimer() {
  if (timerStarted) return;

  timerStarted = true;
  timer = 5;

  console.log("Iniciando timer de 5 segundos...");

  timerInterval = setInterval(() => {
    console.log(`Tempo restante: ${timer} segundos`);

    if (timer === 4) {
      startScreenShake(3000);
    }

    if (timer === 0) {
      clearInterval(timerInterval);
      stopScreenShake();
      startRainPhase();
    }

    timer--;
  }, 1000);
}

function createRainProjectile(angle = 90) {
  const radians = (angle * Math.PI) / 180;
  const speed = 6;

  const projectile = {
    x: Math.random() * (canvas.width - 5),
    y: 0,
    width: 5,
    height: 15,
    color: 'red',
    speedX: Math.cos(radians) * speed,
    speedY: Math.sin(radians) * speed
  };

  rainProjectiles.push(projectile);
}

function updateRainProjectiles() {
  for (let i = 0; i < rainProjectiles.length; i++) {
    const p = rainProjectiles[i];
    p.x += p.speedX;
    p.y += p.speedY;

    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.width, p.height);

    if (p.y > canvas.height || p.x < 0 || p.x > canvas.width) {
      rainProjectiles.splice(i, 1);
      i--;
      continue;
    }

    if (isColliding(p, player)) {
      lives--;
      rainProjectiles.splice(i, 1);
      i--;
      if (lives <= 0) {
        gameOver = true;
        showExplosionAndEnd();
      }
    }
  }
}

function startRainPhase() {
  rainActive = true;
  console.log("Chuva de projéteis iniciada!");

  const rainDuration = 15000; // 15 segundos
  let rainTick = 0;

  const rainInterval = setInterval(() => {
    if (!rainActive) return;

    rainTick++;

    if (rainTick % 2 === 0) {
      // Fase com brechas centrais
      createRainProjectile(88);
      createRainProjectile(92);
    } else {
      // Fase mais aberta, mas com diagonais  
      createRainProjectile(80);
      createRainProjectile(100);
    }

    // Chance de abrir brechas ocasionais no meio
    if (Math.random() < 0.3) {
      createRainProjectile(90);
    }
  }, 130); // frequencia dos tiros

  setTimeout(() => {
    clearInterval(rainInterval);
    rainActive = false;
    console.log("Chuva de projéteis finalizada. Iniciando timer de 3 segundos...");
    startCooldownTimer();
  }, rainDuration);
}



function startCooldownTimer() {
  timer = 3;
  timerInterval = setInterval(() => {
    console.log(`Cooldown: ${timer} segundos restantes`);
    timer--;

    if (timer < 0) {
      clearInterval(timerInterval);
      console.log("Fim do cooldown.");
    }
  }, 1000);
}

function gameLoop() {
  if (gameOver || gamePaused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPlayer();
  drawProjectiles();
  drawEnemies();
  updateEnemyProjectiles();
  updateRainProjectiles();
  drawScore();
  drawStats();

  if (score >= 50 && !timerStarted) {
    startTimer();
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();

setInterval(() => {
  if (!gameOver && !gamePaused && score < 50) spawnEnemy();
}, 1500);

canvas.addEventListener('click', () => {
  canvas.requestPointerLock();
});
