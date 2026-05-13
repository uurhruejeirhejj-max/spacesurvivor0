class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.username = data.username || 'Anonymous';
    this.isGameOver = false;
    this.score = 0;
    this.survivalTime = 0;
    this.powerUpsCollected = 0;
    this.startTime = Date.now();
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a);
    this.createStarfield();
    
    this.asteroids = [];
    this.powerUps = [];
    this.otherPlayers = {};
    this.asteroidGroup = this.physics.add.group();
    this.powerUpGroup = this.physics.add.group();
    
    this.player = new Player(
      this,
      width / 2,
      height / 2,
      'local',
      this.username,
      true
    );
    
    if (window.socketManager && window.socketManager.connected) {
      window.socketManager.joinGame(this.username, width / 2, height / 2);
      window.socketManager.emit('resetGame');
    }
    
    this.createUI();
    this.createDebugOverlay();
    this.setupSocketListeners();
    this.setupCollisions();
    
    this.explosionEmitter = this.add.particles(0, 0, 'explosion', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      blendMode: 'ADD',
      emitting: false
    });
  }

  createStarfield() {
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, CONSTANTS.GAME_WIDTH);
      const y = Phaser.Math.Between(0, CONSTANTS.GAME_HEIGHT);
      const star = this.add.image(x, y, 'star');
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.8));
    }
  }

  createUI() {
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '24px',
      fill: '#F7DC6F',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    });
    
    this.timeText = this.add.text(20, 50, 'Time: 0s', {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'Courier New'
    });
    
    this.powerUpText = this.add.text(20, 80, 'Power-ups: None', {
      fontSize: '14px',
      fill: '#4ECDC4',
      fontFamily: 'Courier New'
    });
    
    this.playerCountText = this.add.text(CONSTANTS.GAME_WIDTH - 20, 20, 'Players: 1', {
      fontSize: '16px',
      fill: '#888888',
      fontFamily: 'Courier New'
    }).setOrigin(1, 0);
    
    this.add.text(CONSTANTS.GAME_WIDTH / 2, CONSTANTS.GAME_HEIGHT - 30, 
      'Touch & drag left side to move', {
      fontSize: '14px',
      fill: '#555555',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
  }

  createDebugOverlay() {
    this.debugBorder = this.add.graphics();
    this.debugBorder.lineStyle(2, 0x00FF00, 0.5);
    this.debugBorder.strokeRect(0, 0, CONSTANTS.GAME_WIDTH, CONSTANTS.GAME_HEIGHT);
    
    this.debugText = this.add.text(10, CONSTANTS.GAME_HEIGHT - 80, 'DEBUG', {
      fontSize: '12px',
      fill: '#00FF00',
      fontFamily: 'Courier New',
      backgroundColor: '#000000AA'
    });
  }

  setupSocketListeners() {
    if (!window.socketManager) return;
    
    window.socketManager.on('playerJoined', (data) => {
      if (!data || !data.id || !window.socketManager.socket) return;
      if (data.id === window.socketManager.socket.id) return;
      
      if (!this.otherPlayers[data.id]) {
        this.otherPlayers[data.id] = new Player(
          this,
          data.x || 400,
          data.y || 300,
          data.id,
          data.username || 'Player',
          false
        );
        if (data.color) {
          const colorObj = Phaser.Display.Color.HexStringToColor(data.color);
          this.otherPlayers[data.id].setTint(colorObj.color);
        }
      }
    });
    
    window.socketManager.on('playerMoved', (data) => {
      if (!data || !this.otherPlayers[data.id]) return;
      this.otherPlayers[data.id].x = data.x;
      this.otherPlayers[data.id].y = data.y;
    });
    
    window.socketManager.on('playerLeft', (id) => {
      if (!id || !this.otherPlayers[id]) return;
      this.otherPlayers[id].destroy();
      delete this.otherPlayers[id];
    });
    
    window.socketManager.on('gameUpdate', (data) => {
      this.updateGameState(data);
    });
    
    window.socketManager.on('powerUpCollected', (data) => {
      if (!data || !window.socketManager.socket) return;
      if (data.playerId === window.socketManager.socket.id) {
        this.applyPowerUp(data.type);
      }
    });
    
    window.socketManager.on('shieldDestroyed', () => {
      if (this.player && this.player.setShield) {
        this.player.setShield(false);
        this.showNotification('💥 Shield Destroyed!');
        this.startImmortalBlink();
      }
    });
    
    window.socketManager.on('playerDied', (data) => {
      if (!data || !window.socketManager.socket) return;
      if (data.id === window.socketManager.socket.id) {
        this.gameOver();
      }
    });
  }

  startImmortalBlink() {
    if (!this.player) return;
    this.showNotification('👻 Immortal 1s!');
    
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        if (this.player) this.player.setAlpha(1);
      }
    });
  }

  setupCollisions() {
    this.physics.add.overlap(this.player, this.asteroidGroup, (player, asteroid) => {
      if (this.isGameOver) return;
      
      if (this.player && this.player.isImmortal) return;
      
      if (this.player && this.player.hasShield) {
        this.player.setShield(false);
        this.showNotification('💥 Shield Hit!');
        return;
      }
      
      if (window.socketManager) {
        window.socketManager.playerHit();
      }
    });
    
    this.physics.add.overlap(this.player, this.powerUpGroup, (player, powerUp) => {
      if (!powerUp || powerUp.collected) return;
      powerUp.collected = true;
      
      if (window.socketManager && powerUp.powerUpId) {
        window.socketManager.collectPowerUp(powerUp.powerUpId);
      }
      if (powerUp.collect) powerUp.collect();
      this.powerUpsCollected++;
    });
  }

  updateGameState(data) {
    if (!data) return;
    
    if (Array.isArray(data.asteroids)) {
      data.asteroids.forEach(asteroidData => {
        if (!asteroidData || !asteroidData.id) return;
        
        let asteroid = this.asteroids.find(a => a && a.asteroidId === asteroidData.id);
        if (!asteroid) {
          asteroid = new Asteroid(
            this,
            asteroidData.id,
            asteroidData.x,
            asteroidData.y,
            asteroidData.size,
            asteroidData.speed,
            asteroidData.rotationSpeed
          );
          this.asteroids.push(asteroid);
          if (this.asteroidGroup) this.asteroidGroup.add(asteroid);
        } else {
          asteroid.x = asteroidData.x;
          asteroid.y = asteroidData.y;
          asteroid.rotation = asteroidData.rotation;
        }
      });
    }
    
    if (Array.isArray(data.powerUps)) {
      data.powerUps.forEach(powerUpData => {
        if (!powerUpData || !powerUpData.id) return;
        
        let powerUp = this.powerUps.find(p => p && p.powerUpId === powerUpData.id);
        if (!powerUp) {
          powerUp = new PowerUp(
            this,
            powerUpData.id,
            powerUpData.x,
            powerUpData.y,
            powerUpData.type
          );
          this.powerUps.push(powerUp);
          if (this.powerUpGroup) this.powerUpGroup.add(powerUp);
        } else {
          powerUp.x = powerUpData.x;
          powerUp.y = powerUpData.y;
        }
      });
    }
    
    if (Array.isArray(data.players)) {
      const localId = window.socketManager && window.socketManager.socket ? window.socketManager.socket.id : null;
      const localPlayerData = data.players.find(p => p && p.id === localId);
      
      if (localPlayerData) {
        this.score = localPlayerData.score || 0;
        if (this.scoreText && this.scoreText.setText) {
          this.scoreText.setText(`Score: ${this.score}`);
        }
        
        // FIX: Filter unique supaya tidak menumpuk di UI
        const uniquePowerUps = [...new Set(localPlayerData.powerUps || [])];
        const powerUpList = uniquePowerUps.join(', ') || 'None';
        if (this.powerUpText && this.powerUpText.setText) {
          this.powerUpText.setText(`Power-ups: ${powerUpList}`);
        }
        
        if (this.player) {
          this.player.isImmortal = localPlayerData.isImmortal || false;
        }
      }
      
      const aliveCount = data.players.filter(p => p && p.isAlive).length;
      if (this.playerCountText && this.playerCountText.setText) {
        this.playerCountText.setText(`Players: ${aliveCount}`);
      }
    }
  }

    applyPowerUp(type) {
    if (!this.player) return;
    
    switch (type) {
      case 'shield':
        if (this.player.setShield) this.player.setShield(true);
        this.showNotification('🛡️ Shield Activated!');
        break;
      case 'speed':
        if (this.player.setSpeedBoost) this.player.setSpeedBoost(true);
        this.showNotification('⚡ Speed Boost!');
        this.time.delayedCall(5000, () => {
          if (this.player && this.player.setSpeedBoost) {
            this.player.setSpeedBoost(false);
          }
        });
        break;
      case 'score':
        // ← FIX: Visual +500 besar & mencolok
        this.showBigNotification('+500', '#FFD700');
        break;
    }
  }

  showNotification(text) {
    if (!this.scene.isActive('GameScene')) return;
    
    const notif = this.add.text(CONSTANTS.GAME_WIDTH / 2, 100, text, {
      fontSize: '20px',
      fill: '#F7DC6F',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: notif,
      y: 50,
      alpha: 0,
      duration: 1500,
      onComplete: () => {
        if (notif && notif.destroy) notif.destroy();
      }
    });
  }

  // ← FIX: Notifikasi besar untuk +500
  showBigNotification(text, color) {
    if (!this.scene.isActive('GameScene')) return;
    
    const notif = this.add.text(CONSTANTS.GAME_WIDTH / 2, 120, text, {
      fontSize: '48px',
      fill: color || '#FFD700',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);
    
    notif.setScale(0.5);
    
    this.tweens.add({
      targets: notif,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: notif,
          y: 60,
          alpha: 0,
          scaleX: 0.8,
          scaleY: 0.8,
          duration: 1000,
          onComplete: () => {
            if (notif && notif.destroy) notif.destroy();
          }
        });
      }
    });
  }
  
  update(time, delta) {
    if (this.isGameOver) return;
    
    if (this.player && this.player.update) {
      this.player.update(time, delta);
    }
    
    this.survivalTime = (Date.now() - this.startTime) / 1000;
    if (this.timeText && this.timeText.setText) {
      this.timeText.setText(`Time: ${Math.floor(this.survivalTime)}s`);
    }
    
    this.asteroids = this.asteroids.filter(asteroid => {
      if (!asteroid || !asteroid.active) return false;
      if (asteroid.update) {
        const stillAlive = asteroid.update(time, delta);
        if (stillAlive === false) return false;
      }
      if (asteroid.y > CONSTANTS.GAME_HEIGHT + 100) {
        if (asteroid.destroy) asteroid.destroy();
        return false;
      }
      return true;
    });
    
    this.powerUps = this.powerUps.filter(powerUp => {
      if (!powerUp || !powerUp.active) return false;
      if (powerUp.update) {
        const stillAlive = powerUp.update(time, delta);
        if (stillAlive === false) return false;
      }
      if (powerUp.y > CONSTANTS.GAME_HEIGHT + 50) {
        if (powerUp.destroy) powerUp.destroy();
        return false;
      }
      return true;
    });
    
    if (this.player && this.player.x !== undefined) {
      this.player.x = Phaser.Math.Clamp(
        this.player.x,
        CONSTANTS.PLAYER_SIZE,
        CONSTANTS.GAME_WIDTH - CONSTANTS.PLAYER_SIZE
      );
      this.player.y = Phaser.Math.Clamp(
        this.player.y,
        CONSTANTS.PLAYER_SIZE,
        CONSTANTS.GAME_HEIGHT - CONSTANTS.PLAYER_SIZE
      );
    }
    
    if (this.debugText) {
      this.debugText.setText(
        `Asteroids: ${this.asteroids.length} | ` +
        `PowerUps: ${this.powerUps.length} | ` +
        `Player: ${Math.round(this.player?.x || 0)},${Math.round(this.player?.y || 0)} | ` +
        `Score: ${this.score}`
      );
    }
  }

  gameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    
    if (this.explosionEmitter && this.player) {
      this.explosionEmitter.emitParticleAt(this.player.x, this.player.y, 20);
    }
    
    if (this.player) {
      this.player.setVisible(false);
      if (this.player.body) this.player.body.setVelocity(0, 0);
    }
    
    if (window.api && window.api.isLoggedIn && window.api.isLoggedIn()) {
      window.api.submitScore(this.score, this.survivalTime, this.powerUpsCollected)
        .then(() => console.log('Score submitted'))
        .catch(err => console.error('Failed to submit score:', err));
    }
    
    this.time.delayedCall(1000, () => {
      this.scene.start('GameOverScene', {
        score: this.score,
        survivalTime: this.survivalTime,
        powerUpsCollected: this.powerUpsCollected,
        isLoggedIn: window.api && window.api.isLoggedIn ? window.api.isLoggedIn() : false
      });
    });
  }

  shutdown() {
    if (window.socketManager) {
      window.socketManager.off('playerJoined');
      window.socketManager.off('playerMoved');
      window.socketManager.off('playerLeft');
      window.socketManager.off('gameUpdate');
      window.socketManager.off('powerUpCollected');
      window.socketManager.off('shieldDestroyed');
      window.socketManager.off('playerDied');
    }
    
    this.asteroids.forEach(a => { if (a && a.destroy) a.destroy(); });
    this.powerUps.forEach(p => { if (p && p.destroy) p.destroy(); });
    Object.values(this.otherPlayers).forEach(p => { if (p && p.destroy) p.destroy(); });
    
    this.asteroids = [];
    this.powerUps = [];
    this.otherPlayers = {};
    
    if (this.debugBorder) this.debugBorder.destroy();
    if (this.debugText) this.debugText.destroy();
  }
}