// Elaris Island - API Client
const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:8080' : '';

const API = {
  async request(method, path, body) {
    try {
      const opts = { method, headers: {'Content-Type':'application/json'} };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(API_BASE + path, opts);
      return await res.json();
    } catch(e) {
      console.error('API error:', e);
      return { error: e.message };
    }
  },
  register: (username, password) => API.request('POST', '/api/register', {username, password}),
  login: (username, password) => API.request('POST', '/api/login', {username, password}),
  saveSession: (data) => API.request('POST', '/api/session', data),
  getSession: (id) => API.request('GET', `/api/session?id=${id}`),
  getSessions: (userId) => API.request('GET', userId ? `/api/sessions?user_id=${userId}` : '/api/sessions'),
  saveProgress: (userId, progress) => API.request('POST', '/api/user/progress', {userId, progress}),
  narrator: (prompt, system, maxTokens) => API.request('POST', '/api/narrator', {prompt, system, max_tokens: maxTokens || 600}),
  health: () => API.request('GET', '/api/health'),
};
