// Phaser game configuration
const config = {
  type: Phaser.AUTO,
  width: CONSTANTS.GAME_WIDTH,
  height: CONSTANTS.GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0a0a1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 400,
      height: 300
    },
    max: {
      width: 1600,
      height: 1200
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [
    BootScene,
    MenuScene,
    GameScene,
    GameOverScene,
    LeaderboardScene
  ],
  render: {
    pixelArt: false,
    antialias: true
  }
};

// Initialize game when DOM is ready
window.addEventListener('load', () => {
  const game = new Phaser.Game(config);
  
  // Prevent default touch behaviors
  document.addEventListener('touchmove', (e) => {
    if (e.target.tagName !== 'INPUT') {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Prevent double-tap zoom
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
});