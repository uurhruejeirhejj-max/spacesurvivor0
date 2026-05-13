class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LeaderboardScene' });
    this.leaderboardData = [];
    this.isLoading = true;
    this.error = null;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a);
    
    // Title
    this.add.text(width / 2, 40, '🏆 LEADERBOARD', {
      fontSize: '32px',
      fill: '#F7DC6F',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
      fontSize: '20px',
      fill: '#4ECDC4',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    // Fetch data
    this.fetchLeaderboard();
    
    // Back button
    this.createButton(width / 2, height - 50, 'BACK TO MENU', () => {
      this.scene.start('MenuScene');
    });
  }

  async fetchLeaderboard() {
    try {
      const response = await window.api.getLeaderboard(50);
      
      if (response.success) {
        this.leaderboardData = response.data;
        this.isLoading = false;
        this.displayLeaderboard();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      this.isLoading = false;
      this.error = error.message;
      this.showError();
    }
  }

  displayLeaderboard() {
    this.loadingText.destroy();
    
    const width = this.cameras.main.width;
    const startY = 100;
    const rowHeight = 45;
    
    if (this.leaderboardData.length === 0) {
      this.add.text(width / 2, 200, 'No scores yet!', {
        fontSize: '20px',
        fill: '#888888',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
      return;
    }
    
    // Header
    this.add.text(80, startY - 30, 'RANK', {
      fontSize: '14px',
      fill: '#888888',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    this.add.text(200, startY - 30, 'PLAYER', {
      fontSize: '14px',
      fill: '#888888',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    this.add.text(450, startY - 30, 'SCORE', {
      fontSize: '14px',
      fill: '#888888',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    this.add.text(600, startY - 30, 'TIME', {
      fontSize: '14px',
      fill: '#888888',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    // Rows
    this.leaderboardData.slice(0, 10).forEach((entry, index) => {
      const y = startY + (index * rowHeight);
      const isTop3 = index < 3;
      
      // Rank
      const rankColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#ffffff';
      this.add.text(80, y, `#${index + 1}`, {
        fontSize: isTop3 ? '18px' : '16px',
        fill: rankColor,
        fontFamily: 'Courier New',
        fontStyle: isTop3 ? 'bold' : 'normal'
      }).setOrigin(0.5);
      
      // Username
      this.add.text(200, y, entry.username, {
        fontSize: '16px',
        fill: '#ffffff',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
      
      // Score
      this.add.text(450, y, entry.score.toString(), {
        fontSize: '16px',
        fill: '#F7DC6F',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      // Survival time
      this.add.text(600, y, `${Math.floor(entry.survivalTime)}s`, {
        fontSize: '14px',
        fill: '#4ECDC4',
        fontFamily: 'Courier New'
      }).setOrigin(0.5);
      
      // Divider line
      if (index < this.leaderboardData.length - 1) {
        const line = this.add.graphics();
        line.lineStyle(1, 0x333333, 0.5);
        line.lineBetween(50, y + 20, 650, y + 20);
      }
    });
  }

  showError() {
    this.loadingText.destroy();
    this.add.text(this.cameras.main.width / 2, 200, `Error: ${this.error}`, {
      fontSize: '16px',
      fill: '#FF6B6B',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
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