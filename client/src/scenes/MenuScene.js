class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Background stars
    this.createStarfield();
    
    // Title
    this.add.text(width / 2, height * 0.2, 'SPACE SURVIVOR', {
      fontSize: '48px',
      fontFamily: 'Courier New',
      fill: '#4ECDC4',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.add.text(width / 2, height * 0.3, 'Survive the asteroid field!', {
      fontSize: '18px',
      fontFamily: 'Courier New',
      fill: '#888888'
    }).setOrigin(0.5);
    
    // Check login status
    const isLoggedIn = window.api.isLoggedIn();
    
    if (isLoggedIn) {
      this.showLoggedInMenu();
    } else {
      this.showLoginMenu();
    }
  }

  createStarfield() {
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, CONSTANTS.GAME_WIDTH);
      const y = Phaser.Math.Between(0, CONSTANTS.GAME_HEIGHT);
      const star = this.add.image(x, y, 'star');
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 1));
      star.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
      
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: 0.2 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1
      });
    }
  }

  showLoginMenu() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Play as Guest button
    this.createButton(width / 2, height * 0.5, 'PLAY AS GUEST', () => {
      this.scene.start('GameScene', { username: 'Guest' + Math.floor(Math.random() * 9999) });
    });
    
    // Login button
    this.createButton(width / 2, height * 0.6, 'LOGIN', () => {
      this.showLoginForm();
    });
    
    // Register button
    this.createButton(width / 2, height * 0.7, 'REGISTER', () => {
      this.showRegisterForm();
    });
    
    // Leaderboard button
    this.createButton(width / 2, height * 0.8, 'LEADERBOARD', () => {
      this.scene.start('LeaderboardScene');
    });
  }

  showLoggedInMenu() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Get username from token (simplified)
    const username = 'Player'; // In real app, decode JWT or store username
    
    this.add.text(width / 2, height * 0.4, `Welcome, ${username}!`, {
      fontSize: '20px',
      fill: '#4ECDC4',
      fontFamily: 'Courier New'
    }).setOrigin(0.5);
    
    // Play button
    this.createButton(width / 2, height * 0.5, 'PLAY', () => {
      this.scene.start('GameScene', { username });
    });
    
    // Leaderboard button
    this.createButton(width / 2, height * 0.6, 'LEADERBOARD', () => {
      this.scene.start('LeaderboardScene');
    });
    
    // Logout button
    this.createButton(width / 2, height * 0.7, 'LOGOUT', () => {
      window.api.clearToken();
      this.scene.restart();
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

  showLoginForm() {
    // In real implementation, use HTML overlay or Phaser input
    // For simplicity, using prompt (replace with proper UI in production)
    const username = prompt('Username:');
    const password = prompt('Password:');
    
    if (username && password) {
      window.api.login(username, password)
        .then(() => this.scene.restart())
        .catch(err => alert('Login failed: ' + err.message));
    }
  }

  showRegisterForm() {
    const username = prompt('Username:');
    const email = prompt('Email:');
    const password = prompt('Password (min 6 chars):');
    
    if (username && email && password) {
      window.api.register(username, email, password)
        .then(() => this.scene.restart())
        .catch(err => alert('Register failed: ' + err.message));
    }
  }
}