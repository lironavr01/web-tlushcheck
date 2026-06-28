import { requireAuth, getUser } from './auth.js';
import { apiGet } from './api.js';
import { state, currentMonth } from './state.js';
import { initRouter, navigate, currentTab } from './router.js';
import { setRerender } from './bus.js';
import { reloadWorkplaces } from './tabs/shared.js';
import { renderHome } from './tabs/home.js';
import { renderShifts } from './tabs/shifts.js';
import { renderAuditor } from './tabs/auditor.js';
import { renderSummary } from './tabs/summary.js';
import { renderSettings } from './tabs/settings.js';

requireAuth();

const RENDERERS = {
  home: renderHome,
  shifts: renderShifts,
  auditor: renderAuditor,
  summary: renderSummary,
  settings: renderSettings,
};

const dispatch = (tab) => RENDERERS[tab]?.(document.getElementById(`tab-${tab}`));
setRerender(() => dispatch(currentTab()));

function setAvatar() {
  document.getElementById('avatar').textContent = (state.user?.name || '·')[0];
}

async function boot() {
  state.user = getUser();
  state.month = currentMonth();
  state.year = String(new Date().getFullYear());
  setAvatar();

  // Refresh the user (role may have changed) and load workplaces before first render.
  try {
    const { data } = await apiGet('/auth/me');
    state.user = data.user;
    setAvatar();
  } catch {
    /* api.js already redirects to login on 401 */
  }
  await reloadWorkplaces();

  initRouter(dispatch);
  navigate('home');
}

boot();
