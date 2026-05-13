class APIManager {
  constructor() {
    this.baseURL = CONSTANTS.API_BASE_URL;
    this.token = localStorage.getItem('token') || null;
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth
  async register(username, email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: { username, email, password }
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: { username, password }
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  // Leaderboard
  async getLeaderboard(limit = 50) {
    return this.request(`/leaderboard?limit=${limit}`);
  }

  async submitScore(score, survivalTime, powerUpsCollected) {
    return this.request('/leaderboard', {
      method: 'POST',
      body: { score, survivalTime, powerUpsCollected }
    });
  }

  async getPersonalStats() {
    return this.request('/leaderboard/me');
  }

  isLoggedIn() {
    return !!this.token;
  }
}

// Expose globally
window.api = new APIManager();