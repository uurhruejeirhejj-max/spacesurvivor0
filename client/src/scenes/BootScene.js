class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);
    
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: { font: '20px Courier New', fill: '#4ECDC4' }
    }).setOrigin(0.5);
    
    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: '0%',
      style: { font: '18px Courier New', fill: '#ffffff' }
    }).setOrigin(0.5);
    
    this.load.on('progress', (value) => {
      percentText.setText(parseInt(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0x4ECDC4, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
    
    const particleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    particleGraphics.fillStyle(0xffffff, 1);
    particleGraphics.fillCircle(4, 4, 4);
    particleGraphics.generateTexture('particle', 8, 8);
    
    const starGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    starGraphics.fillStyle(0xffffff, 1);
    starGraphics.fillCircle(2, 2, 2);
    starGraphics.generateTexture('star', 4, 4);
    
    const explosionGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    explosionGraphics.fillStyle(0xFF6B6B, 1);
    explosionGraphics.fillCircle(16, 16, 16);
    explosionGraphics.generateTexture('explosion', 32, 32);
    
    // Generate joystick textures
    const joyBase = this.make.graphics({ x: 0, y: 0, add: false });
    joyBase.fillStyle(0xFFFFFF, 0.2);
    joyBase.fillCircle(60, 60, 60);
    joyBase.lineStyle(2, 0xFFFFFF, 0.5);
    joyBase.strokeCircle(60, 60, 60);
    joyBase.generateTexture('joystickBase', 120, 120);
    
    const joyThumb = this.make.graphics({ x: 0, y: 0, add: false });
    joyThumb.fillStyle(0x4ECDC4, 0.8);
    joyThumb.fillCircle(25, 25, 25);
    joyThumb.generateTexture('joystickThumb', 50, 50);
  }

  create() {
    window.socketManager.connect();
    
    window.socketManager.on('connected', () => {
      this.scene.start('MenuScene');
    });
    
    if (window.socketManager.connected) {
      this.scene.start('MenuScene');
    }
    
    this.time.delayedCall(5000, () => {
      if (this.scene.isActive('BootScene')) {
        this.scene.start('MenuScene');
      }
    });
  }
}