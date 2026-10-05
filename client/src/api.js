const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api');
let accessToken = null;

export function setAccessToken(token) { accessToken = token; }

async function request(path, options = {}, retry = true) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers ?? {}) };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: 'include' });
  if (response.status === 401 && retry && path !== '/auth/refresh') {
    const refreshed = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (refreshed.ok) {
      const data = await refreshed.json();
      setAccessToken(data.accessToken);
      return request(path, options, false);
    }
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed.' }));
    throw new Error(error.message ?? 'Request failed.');
  }
  return response.status === 204 ? null : response.json();
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  boards: () => request('/boards'),
  createBoard: (body) => request('/boards', { method: 'POST', body: JSON.stringify(body) }),
  board: (id) => request(`/boards/${id}`),
  createCard: (boardId, body) => request(`/cards/boards/${boardId}/cards`, { method: 'POST', body: JSON.stringify(body) }),
  updateCard: (id, body) => request(`/cards/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  moveCard: (id, body) => request(`/cards/${id}/move`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCard: (id) => request(`/cards/${id}`, { method: 'DELETE' }),
};
