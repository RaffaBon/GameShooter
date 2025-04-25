// Cria o canvas do jogo
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.cursor = 'none'; // Esconde o cursor do mouse

// Define a entidade do jogador como um quadrado branco
const player = {
  size: 40,
  x: canvas.width / 2 - 20,
  y: canvas.height - 60,
  color: '#FFFFFF',
  speed: 10
};

// Cria arrays para projéteis e inimigos
const projectiles = [];
const enemies = [];
const enemyProjectiles = [];
let normalEnemyCount = 0; // Para contar inimigos normais e gerar inimigos fortes

// Contadores
let score = 0;
let lives = 5;
let enemiesEscaped = 7;
let gameOver = false;
let gamePaused = false;

// Função para criar projéteis
function createProjectile() {
  const projectile = {
    x: player.x + player.size / 2 - 2.5,
    y: player.y,
    width: 5,
    height: 15,
    color: '#FFFFFF',
    speed: 7 // Aumento da velocidade dos projéteis do jogador
  };
  projectiles.push(projectile);
}

// Criar inimigos no topo com posição aleatória
function spawnEnemy() {
  let enemy;
  if (score >= 30 && normalEnemyCount >= 5) {
    // Inimigos fortes após o score 30
    enemy = {
      x: Math.random() * (canvas.width - 40),
      y: -40,
      size: 40,
      speed: score >= 25 ? 3 : 2,
      color: 'darkred', // Cor mais escura
      health: 3, // Precisa ser atingido 3 vezes para ser destruído
      hitsTaken: 0, // Para contar quantos projéteis atingiram o inimigo
      canShoot: false // Não atiram
    };
    normalEnemyCount = 0; // Resetando contador de inimigos normais
  } else {
    // Inimigos normais
    enemy = {
      x: Math.random() * (canvas.width - 40),
      y: -40,
      size: 40,
      speed: score >= 25 ? 3 : 2,
      color: 'red',
      health: 1, // Apenas 1 acerto para destruir
      hitsTaken: 0, // Não há necessidade de rastrear hits para inimigos normais
      canShoot: score >= 15, // Inimigos atiram se o score for >= 15
      shootFrequency: score >= 25 ? 0.01 : 0.005
    };
    normalEnemyCount++;
  }

  enemies.push(enemy);
}

// Criação de projéteis inimigos
function createEnemyProjectile(enemy) {
  const projectile = {
    x: enemy.x + enemy.size / 2 - 2.5,
    y: enemy.y + enemy.size,
    width: 5,
    height: 15,
    color: 'red',
    speed: 6 // Aumento da velocidade dos projéteis dos inimigos
  };
  enemyProjectiles.push(projectile);
}

// Lógica de colisão entre dois quadrados ou retângulos
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

// Pointer lock
let pointerLocked = false;
document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === canvas;
});

// Mouse move
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

// Disparos e sair com backspace
window.addEventListener('keydown', (e) => {
  if (gamePaused) return;

  if (e.key === ' ' || e.key === 'Space') {
    createProjectile();
  }

  if (e.key === 'Backspace') {
    e.preventDefault();
    window.location.href = "../index.html";
  }
});

window.addEventListener('mousedown', (e) => {
  if (!gamePaused && e.button === 0) {
    createProjectile();
  }
});

// Desenhar jogador
function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.size, player.size);
}

// Desenhar projéteis
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

// Desenhar projéteis inimigos
function updateEnemyProjectiles() {
  for (let i = 0; i < enemyProjectiles.length; i++) {
    const p = enemyProjectiles[i];
    p.y += p.speed;

    // Desenhar projétil
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.width, p.height);

    // Chegou ao chão
    if (p.y > canvas.height) {
      enemyProjectiles.splice(i, 1);
      i--;
      continue;
    }

    // Colisão com jogador
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

// Desenhar inimigos
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
        // Se o inimigo for forte
        if (e.health > 1) {
          e.hitsTaken++; // Aumenta o contador de acertos
          projectiles.splice(j, 1); // Remove o projétil
          if (e.hitsTaken >= 3) {
            // Se o inimigo for atingido 3 vezes
            enemies.splice(i, 1); // Destrói inimigo
            score++;
            i--;
          }
        } else {
          enemies.splice(i, 1); // Destrói inimigo
          projectiles.splice(j, 1);
          score++;
          i--;
        }
        break;
      }
    }

    // Inimigos atirando só a partir do score 15
    if (score >= 15 && Math.random() < e.shootFrequency) {
      createEnemyProjectile(e);
    }
  }
}

// Desenhar score
function drawScore() {
  ctx.fillStyle = '#00FF00';
  ctx.font = '16px "Press Start 2P"';
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE: ${score}`, canvas.width - 20, 40);
}

// Novo: Desenhar contadores no canto inferior esquerdo
function drawStats() {
  ctx.fillStyle = '#00FF00';
  ctx.font = '14px "Press Start 2P"';
  
  // LIVES no canto inferior esquerdo
  ctx.textAlign = 'left';
  ctx.fillText(`LIVES: ${lives}`, 20, canvas.height - 20);

  // ESCAPED no canto inferior direito
  ctx.textAlign = 'right';
  ctx.fillText(`ESCAPED: ${enemiesEscaped}`, canvas.width - 20, canvas.height - 20);
}

// Verifica se é game over
function checkGameOver() {
  if (gameOver) return;

  if (lives <= 0 || enemiesEscaped <= 0) {
    gameOver = true;
    gamePaused = true;

    if (lives <= 0) {
      showExplosionAndEnd();
    } else {
      setTimeout(() => {
        alert(`Game Over! Pontuação Final: ${score}`);  // Exibe a pontuação no alert
        window.location.href = "../index.html";
      }, 100);
    }
  }
}

// Mostra explosão com gif
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
    alert(`Game Over! Pontuação Final: ${score}`);  // Agora exibe a pontuação após a explosão
    window.location.href = "../index.html";
  }, 1000); // Espera 1 segundo antes de exibir o alerta
}

// Loop do jogo
function gameLoop() {
  if (gameOver || gamePaused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPlayer();
  drawProjectiles();
  drawEnemies();
  updateEnemyProjectiles(); // Atualiza e desenha os projéteis dos inimigos
  drawScore();
  drawStats(); // <<< novo contador de vidas e escapados

  requestAnimationFrame(gameLoop);
}

gameLoop();

setInterval(() => {
  if (!gameOver && !gamePaused) spawnEnemy();
}, 1500); // Normal e inimigos fortes a cada 1.5 segundos

canvas.addEventListener('click', () => {
  canvas.requestPointerLock();
});
