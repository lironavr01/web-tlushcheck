// API base URL.
// Locally the client (served on :5050) talks to the API on :4000.
// In production this points to the server's Vercel URL (updated after deploy).
const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);

export const API_BASE = LOCAL
  ? 'http://localhost:4000/api'
  : 'https://tlush-web-server.vercel.app/api'; // ← updated automatically at deploy time

export const APP_NAME = 'TipShift';
