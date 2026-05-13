class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y, id, username, isLocal = false) {
    super(scene, x, y);
    
    this.playerId = id;
    this.username = username || 'Player';
    this.isLocal = isLocal;
    this.speed = CONSTANTS.PLAYER_SPEED;
    this.hasShield = false;
    this.hasSpeed = false;
    this.isImmortal = false;
    
    this.setActive(true);
    this.setVisible(true);
    
    this.shipGraphics = scene.add.graphics();
    this.drawShip(0x4ECDC4);
    this.add(this.shipGraphics);
    
    this.shieldGraphics = scene.add.graphics();
    this.shieldGraphics.visible = false;
    this.add(this.shieldGraphics);
    
    this.nameText = scene.add.text(0, -35, this.username, {
      fontSize: '12px',
      fill: '#ffffff',
      fontFamily: 'Courier New',
      backgroundColor: '#00000080',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    this.add(this.nameText);
    
    this.scoreText = scene.add.text(0, 40, '0', {
      fontSize: '14px',
      fill: '#F7DC6F',
      fontFamily: 'Courier New',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.scoreText);
    
    scene.add.existing(this);
    
    scene.physics.world.enable(this);
    if (this.body) {
      this.body.setCircle(CONSTANTS.PLAYER_SIZE);
      this.body.setCollideWorldBounds(true);
    }
    
    if (isLocal) {
      this.setupVirtualJoystick(scene);
      this.setupKeyboard(scene);
    }
  }

  drawShip(color) {
    this.shipGraphics.clear();
    
    this.shipGraphics.fillStyle(color, 1);
    this.shipGraphics.beginPath();
    this.shipGraphics.moveTo(0, -CONSTANTS.PLAYER_SIZE);
    this.shipGraphics.lineTo(-CONSTANTS.PLAYER_SIZE * 0.8, CONSTANTS.PLAYER_SIZE);
    this.shipGraphics.lineTo(CONSTANTS.PLAYER_SIZE * 0.8, CONSTANTS.PLAYER_SIZE);
    this.shipGraphics.closePath();
    this.shipGraphics.fillPath();
    
    this.shipGraphics.fillStyle(0xFF6600, 0.8);
    this.shipGraphics.fillTriangle(
      -8, CONSTANTS.PLAYER_SIZE,
      8, CONSTANTS.PLAYER_SIZE,
      0, CONSTANTS.PLAYER_SIZE + 15
    );
  }

  setupVirtualJoystick(scene) {
    const JOYSTICK_X = 120;
    const JOYSTICK_Y = CONSTANTS.GAME_HEIGHT - 120;
    const BASE_RADIUS = 60;
    const THUMB_RADIUS = 25;
    const MAX_DRAG = 50;
    
    this.joystick = {
      active: false,
      baseX: JOYSTICK_X,
      baseY: JOYSTICK_Y,
      thumbX: JOYSTICK_X,
      thumbY: JOYSTICK_Y,
      deltaX: 0,
      deltaY: 0,
      maxDrag: MAX_DRAG,
      baseRadius: BASE_RADIUS,
      thumbRadius: THUMB_RADIUS
    };
    
    this.joystickBaseGraphics = scene.add.graphics();
    this.drawJoystickBase();
    this.joystickBaseGraphics.setScrollFactor(0);
    this.joystickBaseGraphics.setDepth(100);
    
    this.joystickThumbGraphics = scene.add.graphics();
    this.drawJoystickThumb();
    this.joystickThumbGraphics.setScrollFactor(0);
    this.joystickThumbGraphics.setDepth(101);
    
    // Touch events
    scene.input.on('pointerdown', (pointer) => {
      const distToCenter = Phaser.Math.Distance.Between(
        pointer.x, pointer.y,
        this.joystick.baseX, this.joystick.baseY
      );
      
      if (distToCenter < this.joystick.baseRadius + 50) {
        this.joystick.active = true;
        this.updateJoystickThumb(pointer.x, pointer.y);
      }
    });
    
    scene.input.on('pointermove', (pointer) => {
      if (!this.joystick.active) return;
      this.updateJoystickThumb(pointer.x, pointer.y);
    });
    
    scene.input.on('pointerup', () => {
      if (!this.joystick.active) return;
      this.joystick.active = false;
      this.joystick.deltaX = 0;
      this.joystick.deltaY = 0;
      this.joystick.thumbX = this.joystick.baseX;
      this.joystick.thumbY = this.joystick.baseY;
      this.drawJoystickThumb();
    });
  }

  updateJoystickThumb(pointerX, pointerY) {
    const dx = pointerX - this.joystick.baseX;
    const dy = pointerY - this.joystick.baseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDrag = this.joystick.maxDrag;
    
    if (distance > maxDrag) {
      const angle = Math.atan2(dy, dx);
      this.joystick.thumbX = this.joystick.baseX + Math.cos(angle) * maxDrag;
      this.joystick.thumbY = this.joystick.baseY + Math.sin(angle) * maxDrag;
      this.joystick.deltaX = Math.cos(angle);
      this.joystick.deltaY = Math.sin(angle);
    } else {
      this.joystick.thumbX = pointerX;
      this.joystick.thumbY = pointerY;
      this.joystick.deltaX = distance > 0 ? dx / maxDrag : 0;
      this.joystick.deltaY = distance > 0 ? dy / maxDrag : 0;
    }
    
    this.drawJoystickThumb();
  }

  drawJoystickBase() {
    const x = this.joystick.baseX;
    const y = this.joystick.baseY;
    const r = this.joystick.baseRadius;
    
    this.joystickBaseGraphics.clear();
    this.joystickBaseGraphics.fillStyle(0xFFFFFF, 0.15);
    this.joystickBaseGraphics.fillCircle(x, y, r);
    this.joystickBaseGraphics.lineStyle(2, 0xFFFFFF, 0.4);
    this.joystickBaseGraphics.strokeCircle(x, y, r);
    this.joystickBaseGraphics.lineStyle(1, 0x4ECDC4, 0.2);
    this.joystickBaseGraphics.strokeCircle(x, y, r * 0.5);
  }

  drawJoystickThumb() {
    const x = this.joystick.thumbX;
    const y = this.joystick.thumbY;
    const r = this.joystick.thumbRadius;
    
    this.joystickThumbGraphics.clear();
    this.joystickThumbGraphics.fillStyle(0x4ECDC4, 0.8);
    this.joystickThumbGraphics.fillCircle(x, y, r);
    this.joystickThumbGraphics.lineStyle(2, 0xFFFFFF, 0.9);
    this.joystickThumbGraphics.strokeCircle(x, y, r);
    this.joystickThumbGraphics.fillStyle(0xFFFFFF, 1);
    this.joystickThumbGraphics.fillCircle(x, y, 8);
  }

  setupKeyboard(scene) {
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });
  }

  update(time, delta) {
    if (!this.isLocal || !this.body) return;
    
    const speed = this.hasSpeed ? this.speed * 1.5 : this.speed;
    let vx = 0;
    let vy = 0;
    
    // === INPUT DARI ANALOG (touch) ===
    if (this.joystick && this.joystick.active) {
      vx = this.joystick.deltaX * speed;
      vy = this.joystick.deltaY * speed;
    }
    
    // === INPUT DARI KEYBOARD (WASD/Arrow) ===
    // FIX: Update visual analog juga saat keyboard ditekan!
    let kx = 0;
    let ky = 0;
    
    if (this.cursors.left.isDown || this.wasd.left.isDown) kx = -1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) kx = 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) ky = -1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) ky = 1;
    
    if (kx !== 0 || ky !== 0) {
      const len = Math.sqrt(kx * kx + ky * ky);
      vx = (kx / len) * speed;
      vy = (ky / len) * speed;
      
      // FIX: Update visual analog mengikuti keyboard!
      this.joystick.deltaX = kx / len;
      this.joystick.deltaY = ky / len;
      
      // Update thumb position untuk visual feedback
      this.joystick.thumbX = this.joystick.baseX + (kx / len) * this.joystick.maxDrag;
      this.joystick.thumbY = this.joystick.baseY + (ky / len) * this.joystick.maxDrag;
      this.drawJoystickThumb();
    } else if (!this.joystick.active) {
      // Reset thumb ke center kalau tidak ada input
      this.joystick.deltaX = 0;
      this.joystick.deltaY = 0;
      this.joystick.thumbX = this.joystick.baseX;
      this.joystick.thumbY = this.joystick.baseY;
      this.drawJoystickThumb();
    }
    
    this.body.setVelocity(vx, vy);
    
    if (time % 50 < 20 && window.socketManager) {
      window.socketManager.playerMove(this.x, this.y, vx, vy);
    }
    
    if (vx !== 0 || vy !== 0) {
      const angle = Math.atan2(vy, vx);
      this.setRotation(angle + Math.PI / 2);
    }
  }

  setShield(active) {
    this.hasShield = active;
    if (this.shieldGraphics) {
      this.shieldGraphics.visible = active;
      if (active) {
        this.shieldGraphics.clear();
        this.shieldGraphics.lineStyle(3, 0x45B7D1, 0.9);
        this.shieldGraphics.strokeCircle(0, 0, CONSTANTS.PLAYER_SIZE + 12);
      }
    }
  }

  setSpeedBoost(active) {
    this.hasSpeed = active;
  }

  updateScore(score) {
    if (this.scoreText) {
      this.scoreText.setText(score.toString());
    }
  }

  destroy() {
    if (this.shipGraphics) this.shipGraphics.destroy();
    if (this.shieldGraphics) this.shieldGraphics.destroy();
    if (this.nameText) this.nameText.destroy();
    if (this.scoreText) this.scoreText.destroy();
    if (this.joystickBaseGraphics) this.joystickBaseGraphics.destroy();
    if (this.joystickThumbGraphics) this.joystickThumbGraphics.destroy();
    if (this.body) this.body.destroy();
    super.destroy();
  }
}