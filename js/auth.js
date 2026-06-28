// Auth/session storage helpers (pure — no API imports, to avoid cycles).

const TOKEN_KEY = 'tipshift_token';
const USER_KEY = 'tipshift_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export const isLoggedIn = () => !!getToken();

export const setSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const updateStoredUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/** Redirect to login if not authenticated (used by the app page). */
export const requireAuth = () => {
  if (!isLoggedIn()) location.replace('login.html');
};

/** Redirect to the app if already authenticated (used by the login page). */
export const redirectIfAuthed = () => {
  if (isLoggedIn()) location.replace('index.html');
};
