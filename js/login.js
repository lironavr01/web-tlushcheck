import { apiPost } from './api.js';
import { setSession, redirectIfAuthed } from './auth.js';
import { toast } from './ui.js';

redirectIfAuthed(); // already logged in → go to the app

let mode = 'login'; // 'login' | 'register'

const segButtons = document.querySelectorAll('.segmented [data-mode]');
const nameField = document.getElementById('name-field');
const nameInput = document.getElementById('name');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submit-btn');
const errorEl = document.getElementById('form-error');
const switchText = document.getElementById('switch-text');
const switchLink = document.getElementById('switch-link');
const form = document.getElementById('auth-form');

function setMode(next) {
  mode = next;
  const isRegister = mode === 'register';
  nameField.hidden = !isRegister;
  nameInput.required = isRegister;
  passwordInput.autocomplete = isRegister ? 'new-password' : 'current-password';
  submitBtn.textContent = isRegister ? 'הרשמה' : 'התחבר';
  switchText.textContent = isRegister ? 'יש לך כבר חשבון?' : 'אין לך חשבון?';
  switchLink.textContent = isRegister ? 'להתחברות' : 'להרשמה';
  segButtons.forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  errorEl.textContent = '';
}

segButtons.forEach((b) => (b.onclick = () => setMode(b.dataset.mode)));
switchLink.onclick = (e) => {
  e.preventDefault();
  setMode(mode === 'login' ? 'register' : 'login');
};

form.onsubmit = async (e) => {
  e.preventDefault();
  errorEl.textContent = '';
  const payload = {
    email: document.getElementById('email').value.trim(),
    password: passwordInput.value,
  };
  if (mode === 'register') payload.name = nameInput.value.trim();

  submitBtn.disabled = true;
  const original = submitBtn.textContent;
  submitBtn.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,.4);border-top-color:#fff"></span>';

  try {
    const path = mode === 'register' ? '/auth/register' : '/auth/login';
    const { data } = await apiPost(path, payload, { auth: false });
    setSession(data.token, data.user);
    toast('ברוך הבא!', 'success');
    location.replace('index.html');
  } catch (err) {
    errorEl.textContent = err.message;
    submitBtn.disabled = false;
    submitBtn.textContent = original;
  }
};

setMode('login');
