class SocketManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.callbacks = {};
  }

  connect() {
    if (this.socket) return;

    this.socket = io(CONSTANTS.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket.id);
      this.connected = true;
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.connected = false;
      this.emit('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.emit('error', error);
    });

    // Game events
    this.socket.on('gameState', (data) => this.emit('gameState', data));
    this.socket.on('playerJoined', (data) => this.emit('playerJoined', data));
    this.socket.on('playerMoved', (data) => this.emit('playerMoved', data));
    this.socket.on('playerLeft', (id) => this.emit('playerLeft', id));
    this.socket.on('playerDied', (data) => this.emit('playerDied', data));
    this.socket.on('gameUpdate', (data) => this.emit('gameUpdate', data));
    this.socket.on('powerUpCollected', (data) => this.emit('powerUpCollected', data));
    this.socket.on('shieldDestroyed', () => this.emit('shieldDestroyed'));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  on(event, callback) {
    if (!this.callbacks[event]) this.callbacks[event] = [];
    this.callbacks[event].push(callback);
  }

  off(event, callback) {
    if (!this.callbacks[event]) return;
    this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  // Send events to server
  joinGame(username, x, y) {
    if (this.socket) {
      this.socket.emit('joinGame', { username, x, y });
    }
  }

  playerMove(x, y, vx, vy) {
    if (this.socket) {
      this.socket.emit('playerMove', { x, y, vx, vy });
    }
  }

  collectPowerUp(powerUpId) {
    if (this.socket) {
      this.socket.emit('collectPowerUp', powerUpId);
    }
  }

  playerHit() {
    if (this.socket) {
      this.socket.emit('playerHit');
    }
  }
}

// Expose globally
window.socketManager = new SocketManager();