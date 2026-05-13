class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.survivalTime = data.survivalTime || 0;
    this.powerUpsCollected = data.powerUpsCollected || 0;
    this.isLoggedIn = data.isLoggedIn || false;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a);
    
    // Game Over text
    this.add.text(width / 2, height * 0.2, 'GAME OVER', {
      fontSize: '48px',
      fill: '#FF6B6B',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Stats
    this.add.text(width / 2, height * 0.35, `Score: ${this.finalScore}`, {
      fontSize: '28px',
      fill: '#F7DC6F',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    this.add.text(width / 2, height * 0.42, `Survived: ${Math.floor(this.survivalTime)}s`, {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    this.add.text(width / 2, height * 0.48, `Power-ups: ${this.powerUpsCollected}`, {
      fontSize: '18px',
      fill: '#4ECDC4',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    // Login prompt if not logged in
    if (!this.isLoggedIn) {
      this.add.text(width / 2, height * 0.58, 'Login to save your score!', {
        fontSize: '16px',
        fill: '#FFA07A',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
    } else {
      this.add.text(width / 2, height * 0.58, 'Score saved!', {
        fontSize: '16px',
        fill: '#4ECDC4',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
    }
    
    // Buttons
    this.createButton(width / 2, height * 0.7, 'PLAY AGAIN', () => {
      this.scene.start('GameScene', { username: 'Player' });
    });
    
    this.createButton(width / 2, height * 0.8, 'LEADERBOARD', () => {
      this.scene.start('LeaderboardScene');
    });
    
    this.createButton(width / 2, height * 0.9, 'MENU', () => {
      this.scene.start('MenuScene');
    });
  }

  createButton(x, y, text, callback) {
    const button = this.add.container(x, y);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x222222, 0.8);
    bg.fillRoundedRect(-100, -20, 200, 40, 10);
    bg.lineStyle(2, 0x4ECDC4, 1);
    bg.strokeRoundedRect(-100, -20, 200, 40, 10);
    button.add(bg);
    
    const label = this.add.text(0, 0, text, {
      fontSize: '16px',
      fill: '#4ECDC4',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    button.add(label);
    
    button.setSize(200, 40);
    button.setInteractive({ useHandCursor: true });
    
    button.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x4ECDC4, 0.3);
      bg.fillRoundedRect(-100, -20, 200, 40, 10);
      bg.lineStyle(2, 0x4ECDC4, 1);
      bg.strokeRoundedRect(-100, -20, 200, 40, 10);
    });
    
    button.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x222222, 0.8);
      bg.fillRoundedRect(-100, -20, 200, 40, 10);
      bg.lineStyle(2, 0x4ECDC4, 1);
      bg.strokeRoundedRect(-100, -20, 200, 40, 10);
    });
    
    button.on('pointerdown', callback);
    
    return button;
  }
}