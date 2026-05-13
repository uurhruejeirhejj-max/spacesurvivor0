class PowerUp extends Phaser.GameObjects.Container {
  constructor(scene, id, x, y, type) {
    super(scene, x, y);
    
    // PAKAI ID DARI SERVER
    this.powerUpId = id || Math.random().toString(36).substr(2, 9);
    this.type = type || 'score';
    this.fallSpeed = 1.5;
    this.collected = false;
    
    this.setActive(true);
    this.setVisible(true);
    
    this.bodyGraphics = scene.add.graphics();
    this.drawPowerUp();
    this.add(this.bodyGraphics);
    
    const label = type === 'shield' ? '🛡️' : type === 'speed' ? '⚡' : '💎';
    this.labelText = scene.add.text(0, 0, label, {
      fontSize: '20px'
    }).setOrigin(0.5);
    this.add(this.labelText);
    
    this.glowTween = scene.tweens.add({
      targets: this,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    scene.add.existing(this);
    
    scene.physics.world.enable(this);
    if (this.body) {
      this.body.setCircle(CONSTANTS.POWERUP_SIZE);
    }
  }

  drawPowerUp() {
    this.bodyGraphics.clear();
    
    const color = this.type === 'shield' ? 0x45B7D1 
                : this.type === 'speed' ? 0xFFA07A 
                : 0xF7DC6F;
    
    this.bodyGraphics.fillStyle(color, 0.4);
    this.bodyGraphics.fillCircle(0, 0, CONSTANTS.POWERUP_SIZE + 8);
    
    this.bodyGraphics.fillStyle(color, 0.9);
    this.bodyGraphics.fillCircle(0, 0, CONSTANTS.POWERUP_SIZE);
    
    this.bodyGraphics.fillStyle(0xFFFFFF, 0.6);
    this.bodyGraphics.fillCircle(-5, -5, 4);
  }

  update(time, delta) {
    if (!this.active) return false;
    
    this.y += this.fallSpeed * (delta / 16);
    
    if (this.y > CONSTANTS.GAME_HEIGHT + 50) {
      this.destroy();
      return false;
    }
    return true;
  }

  collect() {
    if (this.glowTween) {
      this.glowTween.stop();
    }
    this.destroy();
  }

  destroy() {
    if (this.glowTween) this.glowTween.stop();
    if (this.bodyGraphics) this.bodyGraphics.destroy();
    if (this.labelText) this.labelText.destroy();
    if (this.body) this.body.destroy();
    super.destroy();
  }
}