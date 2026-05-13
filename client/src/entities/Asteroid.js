class Asteroid extends Phaser.GameObjects.Container {
  constructor(scene, id, x, y, size, speed, rotationSpeed) {
    super(scene, x, y);
    
    this.asteroidId = id;
    this.size = size || 30;
    this.fallSpeed = speed || 3;
    this.rotSpeed = rotationSpeed || 0.1;
    
    // PASTIKAN POSISI BENAR
    this.x = x || 400;
    this.y = y || -50;
    
    this.setActive(true);
    this.setVisible(true);
    
    // Buat graphics untuk asteroid
    this.bodyGraphics = scene.add.graphics();
    this.drawAsteroid();
    
    // TAMBAHKAN KE CONTAINER
    this.add(this.bodyGraphics);
    
    // TAMBAHKAN CONTAINER KE SCENE
    scene.add.existing(this);
    
    // Physics
    scene.physics.world.enable(this);
    if (this.body) {
      this.body.setCircle(this.size);
    }
    
    // PASTIKAN TERLIHAT
    this.setAlpha(1);
    this.setDepth(10); // Di atas background
    
    console.log('☄️ Asteroid CREATED at', this.x, this.y, 'size:', this.size);
  }

  drawAsteroid() {
    this.bodyGraphics.clear();
    
    // Warna merah terang
    this.bodyGraphics.fillStyle(0xFF4444, 1);
    this.bodyGraphics.lineStyle(3, 0xFF0000, 1);
    
    // Gambar lingkaran dengan tekstur asteroid
    this.bodyGraphics.fillCircle(0, 0, this.size);
    this.bodyGraphics.strokeCircle(0, 0, this.size);
    
    // Detail crater
    this.bodyGraphics.fillStyle(0xCC3333, 1);
    this.bodyGraphics.fillCircle(-this.size * 0.3, -this.size * 0.2, this.size * 0.25);
    this.bodyGraphics.fillCircle(this.size * 0.4, this.size * 0.3, this.size * 0.2);
    this.bodyGraphics.fillCircle(0, -this.size * 0.4, this.size * 0.15);
  }

  update(time, delta) {
    if (!this.active) return false;
    
    // Turun ke bawah
    this.y += this.fallSpeed * (delta / 16);
    this.rotation += this.rotSpeed;
    
    // Hapus kalau keluar layar bawah
    if (this.y > CONSTANTS.GAME_HEIGHT + 100) {
      console.log('☄️ Asteroid destroyed (out of bounds) at y:', this.y.toFixed(0));
      this.destroy();
      return false;
    }
    return true;
  }

  destroy() {
    if (this.bodyGraphics) {
      this.bodyGraphics.destroy();
      this.bodyGraphics = null;
    }
    if (this.body) {
      this.body.destroy();
    }
    super.destroy();
  }
}