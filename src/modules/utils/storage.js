const TOKEN_KEY = 'story_app_token';
const NAME_KEY = 'story_app_name';

export const Storage = {
  getToken() { return localStorage.getItem(TOKEN_KEY); },
  setToken(token) { localStorage.setItem(TOKEN_KEY, token); },
  getName() { return localStorage.getItem(NAME_KEY); },
  setName(name) { localStorage.setItem(NAME_KEY, name); },
  clear() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(NAME_KEY); },
};


