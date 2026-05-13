const gameState = {
  players: {},
  asteroids: [],
  powerUps: [],
  gameLoop: null,
  lastAsteroidSpawn: 3,
  lastPowerUpSpawn: 0,
  difficulty: 2,
  isPlaying: false
};

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 20;
const ASTEROID_SIZE = 30;
const POWERUP_SIZE = 15;

// FIX: Spawn lebih sering, speed lebih kencang, tapi smooth
const SPAWN_CONFIG = {
  asteroidInterval: 1200,    // ← Dari 1200 ke 600 (cepat spawn)
  powerUpInterval: 5000,    // ← Dari 6000 ke 4000
  maxAsteroids: 8,         // ← Dari 8 ke 10
  maxPowerUps: 2,
  asteroidSpeedBase: 5,     // ← User request
  asteroidSpeedMax: 10,     // ← User request
  powerUpSpeed: 2
};

function initSocketHandlers(io) {
  console.log('🎮 Initializing socket handlers...');
  
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('joinGame', (data) => {
      const { username, x, y } = data;
      
      gameState.players[socket.id] = {
        id: socket.id,
        username: username || 'Anonymous',
        x: x || CANVAS_WIDTH / 2,
        y: y || CANVAS_HEIGHT / 2,
        vx: 0,
        vy: 0,
        score: 0,
        survivalTime: 0,
        powerUps: [],
        isAlive: true,
        immortalUntil: Date.now() + 2000,
        color: getRandomColor()
      };

      gameState.isPlaying = true;

      socket.emit('gameState', {
        players: gameState.players,
        asteroids: [],
        powerUps: [],
        yourId: socket.id
      });

      socket.broadcast.emit('playerJoined', gameState.players[socket.id]);
    });

    socket.on('resetGame', () => {
      console.log('🔄 Reset game');
      
      gameState.asteroids = [];
      gameState.powerUps = [];
      gameState.difficulty = 1;
      
      gameState.lastAsteroidSpawn = Date.now() + 1500;
      gameState.lastPowerUpSpawn = Date.now() + 4000;
      
      gameState.isPlaying = true;
      
      const player = gameState.players[socket.id];
      if (player) {
        player.immortalUntil = Date.now() + 2000;
        player.isAlive = true;
        player.score = 0;
        player.survivalTime = 0;
        player.powerUps = [];
      }
      
      io.emit('gameUpdate', {
        asteroids: [],
        powerUps: [],
        players: Object.values(gameState.players).map(p => ({
          id: p.id,
          username: p.username,
          x: p.x,
          y: p.y,
          score: p.score,
          isAlive: p.isAlive,
          color: p.color,
          powerUps: p.powerUps,
          isImmortal: Date.now() < p.immortalUntil
        }))
      });
    });

    socket.on('playerMove', (data) => {
      const player = gameState.players[socket.id];
      if (!player || !player.isAlive) return;

      player.x = Math.max(PLAYER_SIZE, Math.min(CANVAS_WIDTH - PLAYER_SIZE, data.x));
      player.y = Math.max(PLAYER_SIZE, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, data.y));
      player.vx = data.vx || 0;
      player.vy = data.vy || 0;

      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        x: player.x,
        y: player.y,
        vx: player.vx,
        vy: player.vy
      });
    });

    socket.on('collectPowerUp', (powerUpId) => {
      const index = gameState.powerUps.findIndex(p => p.id === powerUpId);
      if (index !== -1) {
        const powerUp = gameState.powerUps[index];
        const player = gameState.players[socket.id];
        
        if (player) {
          if (!player.powerUps.includes(powerUp.type)) {
            player.powerUps.push(powerUp.type);
          }
          player.score += 50;
          applyPowerUpEffect(player, powerUp.type);
        }
        
        gameState.powerUps.splice(index, 1);
        io.emit('powerUpCollected', { 
          playerId: socket.id, 
          powerUpId, 
          type: powerUp.type 
        });
      }
    });

    socket.on('playerHit', () => {
      const player = gameState.players[socket.id];
      if (!player || !player.isAlive) return;

      const now = Date.now();
      if (now < player.immortalUntil) return;

      if (player.powerUps.includes('shield')) {
        player.powerUps = player.powerUps.filter(p => p !== 'shield');
        player.immortalUntil = now + 1000;
        socket.emit('shieldDestroyed');
        return;
      }

      player.isAlive = false;
      
      const anyAlive = Object.values(gameState.players).some(p => p.isAlive);
      if (!anyAlive) {
        gameState.isPlaying = false;
      }
      
      io.emit('playerDied', {
        id: socket.id,
        username: player.username,
        score: player.score,
        survivalTime: player.survivalTime
      });
    });

    socket.on('disconnect', () => {
      delete gameState.players[socket.id];
      
      const anyAlive = Object.values(gameState.players).some(p => p.isAlive);
      if (!anyAlive) {
        gameState.isPlaying = false;
      }
      
      io.emit('playerLeft', socket.id);
    });
  });

  startGameLoop(io);
}

function startGameLoop(io) {
  if (gameState.gameLoop) return;

  console.log('🚀 Game loop started (60 FPS)');
  
  gameState.gameLoop = setInterval(() => {
    const now = Date.now();

    if (!gameState.isPlaying) return;

    const anyAlive = Object.values(gameState.players).some(p => p.isAlive);
    if (!anyAlive) {
      gameState.isPlaying = false;
      return;
    }

    const timeSinceLastAsteroid = now - gameState.lastAsteroidSpawn;
    const shouldSpawnAsteroid = 
      timeSinceLastAsteroid >= SPAWN_CONFIG.asteroidInterval && 
      gameState.asteroids.length < SPAWN_CONFIG.maxAsteroids;

    if (shouldSpawnAsteroid) {
      spawnAsteroid();
      gameState.lastAsteroidSpawn = now;
      gameState.difficulty += 0.05;
      SPAWN_CONFIG.asteroidInterval = Math.max(400, 600 - (gameState.difficulty * 30));
    }

    const timeSinceLastPowerUp = now - gameState.lastPowerUpSpawn;
    const shouldSpawnPowerUp = 
      timeSinceLastPowerUp >= SPAWN_CONFIG.powerUpInterval && 
      gameState.powerUps.length < SPAWN_CONFIG.maxPowerUps;

    if (shouldSpawnPowerUp) {
      spawnPowerUp();
      gameState.lastPowerUpSpawn = now;
    }

    // FIX: Multiplier 0.25 untuk speed 5-10 agar smooth di 60 FPS
    gameState.asteroids = gameState.asteroids.filter((asteroid) => {
      asteroid.y += asteroid.speed * 0.25;
      asteroid.rotation += asteroid.rotationSpeed * 0.25;
      return asteroid.y <= CANVAS_HEIGHT + 100;
    });

    gameState.powerUps = gameState.powerUps.filter((powerUp) => {
      powerUp.y += powerUp.speed * 0.25;
      return powerUp.y <= CANVAS_HEIGHT + 50;
    });

    Object.values(gameState.players).forEach(player => {
      if (player.isAlive) {
        player.survivalTime += 0.016;
        player.score += 1;
      }
    });

    io.emit('gameUpdate', {
      asteroids: gameState.asteroids,
      powerUps: gameState.powerUps,
      players: Object.values(gameState.players).map(p => ({
        id: p.id,
        username: p.username,
        x: p.x,
        y: p.y,
        score: p.score,
        isAlive: p.isAlive,
        color: p.color,
        powerUps: p.powerUps,
        isImmortal: Date.now() < p.immortalUntil
      }))
    });
  }, 16);
  
  console.log('✅ Game loop smooth 60 FPS');
}

function spawnAsteroid() {
  const margin = 40;
  const x = margin + Math.random() * (CANVAS_WIDTH - margin * 2);
  const y = -ASTEROID_SIZE - 50;

  const speedMultiplier = Math.min(gameState.difficulty, 3);
  const speed = SPAWN_CONFIG.asteroidSpeedBase + 
                Math.random() * (SPAWN_CONFIG.asteroidSpeedMax - SPAWN_CONFIG.asteroidSpeedBase) * 
                (speedMultiplier / 2);

  const asteroid = {
    id: Math.random().toString(36).substr(2, 9),
    x: x,
    y: y,
    size: ASTEROID_SIZE * (0.7 + Math.random() * 0.6),
    speed: speed,
    rotation: 0,
    rotationSpeed: (Math.random() - 0.5) * 0.15
  };
  
  gameState.asteroids.push(asteroid);
}

function spawnPowerUp() {
  const margin = 50;
  const x = margin + Math.random() * (CANVAS_WIDTH - margin * 2);
  const y = -POWERUP_SIZE - 50;

  const types = ['shield', 'speed', 'score'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  const powerUp = {
    id: Math.random().toString(36).substr(2, 9),
    x: x,
    y: y,
    type: type,
    size: POWERUP_SIZE,
    speed: SPAWN_CONFIG.powerUpSpeed
  };
  
  gameState.powerUps.push(powerUp);
}

function applyPowerUpEffect(player, type) {
  switch (type) {
    case 'speed':
      setTimeout(() => {
        if (player) player.powerUps = player.powerUps.filter(p => p !== 'speed');
      }, 5000);
      break;
    case 'score':
      player.score += 500;
      player.powerUps = player.powerUps.filter(p => p !== 'score');
      break;
  }
}

function getRandomColor() {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#FF99CC'];
  return colors[Math.floor(Math.random() * colors.length)];
}

module.exports = { initSocketHandlers };