// API base URL.
// Locally the client (served on :5050) talks to the API on :4000.
// In production this points to the server's Vercel URL (updated after deploy).
const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);

export const API_BASE = LOCAL
  ? 'http://localhost:4000/api'
  : 'https://web-tlushcheck-server.vercel.app/api'; // live server (Vercel)

export const APP_NAME = 'TipShift';
