const CONSTANTS = {
  // Game
  GAME_WIDTH: 800,
  GAME_HEIGHT: 600,
  PLAYER_SPEED: 200,
  PLAYER_SIZE: 20,
  ASTEROID_SIZE: 30,
  POWERUP_SIZE: 15,
  
  // Colors
  COLORS: {
    background: 0x0a0a1a,
    player: 0x4ECDC4,
    asteroid: 0xFF6B6B,
    shield: 0x45B7D1,
    speed: 0xFFA07A,
    score: 0xF7DC6F,
    text: '#ffffff',
    accent: '#4ECDC4'
  },
  
  API_BASE_URL: 'https://spacesurvivor0.railway.app/api',
  SOCKET_URL: 'https://spacesurvivo0.railway.app' ,
  
  // Power-up types
  POWERUPS: {
    SHIELD: 'shield',
    SPEED: 'speed',
    SCORE: 'score'
  }
};

// Expose globally
window.CONSTANTS = CONSTANTS;