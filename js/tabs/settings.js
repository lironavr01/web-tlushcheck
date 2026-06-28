import { state } from '../state.js';
import { apiGet, apiPatch, apiDelete } from '../api.js';
import { esc, toast, confirmModal, formModal, loadingHTML, errorHTML, emptyHTML } from '../ui.js';
import { clearAuth, updateStoredUser } from '../auth.js';
import { openWorkplaceForm, removeWorkplace } from './shared.js';
import { rerender } from '../bus.js';

const MODEL_LABEL = { hourly_tips: 'שעתי + טיפים', tips_only: 'טיפים בלבד', hourly: 'שעתי' };

export async function renderSettings(root) {
  const u = state.user || {};

  root.innerHTML = `
    <section class="card card-pad-lg center">
      <span class="avatar avatar-lg" style="margin-inline:auto">${esc((u.name || '·')[0])}</span>
      <h2 class="h-title" style="margin-top:12px">${esc(u.name || '')}</h2>
      <p class="text-faint" style="font-size:.86rem">${esc(u.email || '')}</p>
      <span class="badge ${u.role === 'admin' ? 'badge-warning' : 'badge-blue'}" style="margin-top:8px">${u.role === 'admin' ? 'מנהל מערכת' : 'משתמש'}</span>
      <div class="mt-md"><button class="btn btn-ghost btn-sm" data-edit-profile>עריכת פרופיל</button></div>
    </section>

    <section class="card mt-md">
      <div class="section-head"><h2 class="h-section">מקומות עבודה</h2><button class="sh-action" data-add-wp>+ הוספה</button></div>
      <div data-wplist></div>
    </section>

    ${
      u.role === 'admin'
        ? `<section class="card mt-md"><div class="section-head"><h2 class="h-section">ניהול משתמשים</h2><span class="badge badge-warning">מנהל</span></div><div data-users>${loadingHTML()}</div></section>`
        : ''
    }

    <button class="btn btn-danger btn-block mt-md" data-logout>התנתקות</button>
    <p class="center text-faint mt-md" style="font-size:.75rem">TipShift · גרסה 1.0.0</p>`;

  // --- workplaces ---
  const wplist = root.querySelector('[data-wplist]');
  wplist.innerHTML = state.workplaces.length
    ? state.workplaces
        .map(
          (w) => `
      <div class="list-item" style="box-shadow:none;background:var(--surface-white)">
        <div class="li-main"><div class="li-title">${esc(w.name)}</div><div class="li-sub">₪${w.hourlyRate}/שעה · ${MODEL_LABEL[w.paymentModel] || w.paymentModel}</div></div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" data-edit="${w.id || w._id}">עריכה</button>
          <button class="btn btn-danger btn-sm" data-del="${w.id || w._id}">מחק</button>
        </div>
      </div>`
        )
        .join('')
    : emptyHTML('אין מקומות עבודה', 'הוסיפו מקום עבודה ראשון');

  const findWp = (id) => state.workplaces.find((w) => (w.id || w._id) === id);
  wplist.querySelectorAll('[data-edit]').forEach((b) => (b.onclick = () => openWorkplaceForm(findWp(b.dataset.edit))));
  wplist.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => removeWorkplace(findWp(b.dataset.del))));
  root.querySelector('[data-add-wp]').onclick = () => openWorkplaceForm();

  // --- profile edit ---
  root.querySelector('[data-edit-profile]').onclick = async () => {
    const vals = await formModal({
      title: 'עריכת פרופיל',
      fields: [{ name: 'name', label: 'שם מלא', type: 'text', value: u.name, required: true }],
    });
    if (!vals) return;
    try {
      const { data } = await apiPatch(`/users/${u.id}`, { name: vals.name });
      state.user = data;
      updateStoredUser(data);
      toast('הפרופיל עודכן', 'success');
      rerender();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  // --- logout ---
  root.querySelector('[data-logout]').onclick = async () => {
    const ok = await confirmModal({ title: 'התנתקות', body: 'להתנתק מהחשבון?', confirmText: 'התנתקות', danger: true });
    if (ok) {
      clearAuth();
      location.replace('login.html');
    }
  };

  // --- admin: user management ---
  if (u.role === 'admin') {
    const box = root.querySelector('[data-users]');
    try {
      const { data: users } = await apiGet('/users');
      box.innerHTML = users
        .map(
          (usr) => `
        <div class="list-item" style="box-shadow:none;background:var(--surface-white)">
          <span class="avatar avatar-sm">${esc((usr.name || '·')[0])}</span>
          <div class="li-main"><div class="li-title">${esc(usr.name)} ${usr.role === 'admin' ? '<span class="badge badge-warning">מנהל</span>' : ''}</div><div class="li-sub">${esc(usr.email)}</div></div>
          ${usr.id !== u.id ? `<button class="btn btn-danger btn-sm" data-deluser="${usr.id}">מחק</button>` : '<span class="text-faint" style="font-size:.7rem">אתה</span>'}
        </div>`
        )
        .join('');
      box.querySelectorAll('[data-deluser]').forEach((b) => {
        b.onclick = async () => {
          const usr = users.find((x) => x.id === b.dataset.deluser);
          const ok = await confirmModal({
            title: 'מחיקת משתמש',
            body: `למחוק את ${usr.name} ואת כל הנתונים שלו?`,
            confirmText: 'מחיקה',
            danger: true,
          });
          if (!ok) return;
          try {
            await apiDelete(`/users/${usr.id}`);
            toast('המשתמש נמחק', 'success');
            rerender();
          } catch (e) {
            toast(e.message, 'error');
          }
        };
      });
    } catch (e) {
      box.innerHTML = errorHTML(e.message);
    }
  }
}
