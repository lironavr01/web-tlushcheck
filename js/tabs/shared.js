// Shared tab helpers: the month/workplace switcher and the shift/workplace forms.
import { state, shiftMonth } from '../state.js';
import { apiGet, apiPost, apiPut, apiDelete } from '../api.js';
import { monthLabel, esc, toast, formModal, confirmModal } from '../ui.js';
import { rerender } from '../bus.js';

const CHEV_PREV = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 6l6 6-6 6"/></svg>`;
const CHEV_NEXT = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg>`;

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Returns the switcher-bar HTML. mode: 'month' | 'year' | 'none'. */
export function switcherBar({ mode = 'month', workplace = true } = {}) {
  const label = mode === 'year' ? state.year : mode === 'month' ? monthLabel(state.month) : '';
  const nav =
    mode === 'none'
      ? ''
      : `<div class="month-nav">
           <button data-nav="prev" aria-label="קודם">${CHEV_PREV}</button>
           <span class="month-label">${esc(label)}</span>
           <button data-nav="next" aria-label="הבא">${CHEV_NEXT}</button>
         </div>`;
  const wp = workplace
    ? `<select class="wp-select" data-wp>
         <option value="all" ${state.workplaceId === 'all' ? 'selected' : ''}>כל מקומות העבודה</option>
         ${state.workplaces
           .map((w) => {
             const id = w.id || w._id;
             return `<option value="${id}" ${id === state.workplaceId ? 'selected' : ''}>${esc(w.name)}</option>`;
           })
           .join('')}
       </select>`
    : '';
  return `<div class="switcher-bar">${nav}${wp}</div>`;
}

/** Wire switcher events (re-renders the active tab on change). */
export function wireSwitcher(root, { mode = 'month' } = {}) {
  root.querySelector('[data-nav="prev"]')?.addEventListener('click', () => {
    if (mode === 'year') state.year = String(Number(state.year) - 1);
    else state.month = shiftMonth(state.month, -1);
    rerender();
  });
  root.querySelector('[data-nav="next"]')?.addEventListener('click', () => {
    if (mode === 'year') state.year = String(Number(state.year) + 1);
    else state.month = shiftMonth(state.month, +1);
    rerender();
  });
  root.querySelector('[data-wp]')?.addEventListener('change', (e) => {
    state.workplaceId = e.target.value;
    rerender();
  });
}

export const wpParam = () => (state.workplaceId !== 'all' ? `&workplaceId=${state.workplaceId}` : '');

// --- workplaces ---
export async function reloadWorkplaces() {
  try {
    const { data } = await apiGet('/workplaces');
    state.workplaces = data;
  } catch {
    state.workplaces = [];
  }
}

export async function openShiftForm(shift = null) {
  if (!state.workplaces.length) {
    toast('צריך קודם להוסיף מקום עבודה (בהגדרות)', 'error');
    return;
  }
  const wpOptions = state.workplaces.map((w) => ({ value: w.id || w._id, label: w.name }));
  const defaultWp =
    shift?.workplaceId || (state.workplaceId !== 'all' ? state.workplaceId : wpOptions[0].value);

  const values = await formModal({
    title: shift ? 'עריכת משמרת' : 'הוספת משמרת',
    submitText: shift ? 'עדכון' : 'הוספה',
    fields: [
      { name: 'workplaceId', label: 'מקום עבודה', type: 'select', options: wpOptions, value: defaultWp },
      { name: 'date', label: 'תאריך', type: 'date', value: shift?.date || today(), required: true },
      { name: 'startTime', label: 'שעת התחלה', type: 'time', value: shift?.startTime || '16:00', required: true },
      { name: 'endTime', label: 'שעת סיום', type: 'time', value: shift?.endTime || '23:00', required: true },
      { name: 'breakMinutes', label: 'הפסקה (דק׳)', type: 'number', value: shift?.breakMinutes ?? 30 },
      { name: 'tipsCash', label: 'טיפ מזומן ₪', type: 'number', value: shift?.tipsCash ?? 0 },
      { name: 'tipsPayroll', label: 'טיפ בתלוש ₪', type: 'number', value: shift?.tipsPayroll ?? 0 },
      { name: 'notes', label: 'הערות', type: 'text', value: shift?.notes || '' },
    ],
  });
  if (!values) return;
  try {
    if (shift) await apiPut(`/shifts/${shift.id}`, values);
    else await apiPost('/shifts', values);
    toast(shift ? 'המשמרת עודכנה' : 'המשמרת נוספה', 'success');
    rerender();
  } catch (e) {
    toast(e.message, 'error');
  }
}

export async function removeShift(shift) {
  const ok = await confirmModal({
    title: 'מחיקת משמרת',
    body: `למחוק את המשמרת מתאריך ${shift.date}?`,
    confirmText: 'מחיקה',
    danger: true,
  });
  if (!ok) return;
  try {
    await apiDelete(`/shifts/${shift.id}`);
    toast('המשמרת נמחקה', 'success');
    rerender();
  } catch (e) {
    toast(e.message, 'error');
  }
}

export async function openWorkplaceForm(wp = null) {
  const values = await formModal({
    title: wp ? 'עריכת מקום עבודה' : 'הוספת מקום עבודה',
    submitText: wp ? 'עדכון' : 'הוספה',
    fields: [
      { name: 'name', label: 'שם', type: 'text', value: wp?.name || '', required: true },
      { name: 'hourlyRate', label: 'שכר שעתי ₪', type: 'number', step: '0.1', value: wp?.hourlyRate ?? 35, required: true },
      {
        name: 'paymentModel',
        label: 'מודל תשלום',
        type: 'select',
        value: wp?.paymentModel || 'hourly_tips',
        options: [
          { value: 'hourly_tips', label: 'שעתי + טיפים' },
          { value: 'tips_only', label: 'טיפים בלבד' },
          { value: 'hourly', label: 'שעתי' },
        ],
      },
      { name: 'dailyThreshold', label: 'סף שעות נוספות', type: 'number', step: '0.1', value: wp?.dailyThreshold ?? 8.6 },
    ],
  });
  if (!values) return false;
  try {
    if (wp) await apiPut(`/workplaces/${wp.id || wp._id}`, values);
    else await apiPost('/workplaces', values);
    toast('מקום העבודה נשמר', 'success');
    await reloadWorkplaces();
    rerender();
    return true;
  } catch (e) {
    toast(e.message, 'error');
    return false;
  }
}

export async function removeWorkplace(wp) {
  const ok = await confirmModal({
    title: 'מחיקת מקום עבודה',
    body: `מחיקת "${wp.name}" תמחק גם את כל המשמרות שלו. להמשיך?`,
    confirmText: 'מחיקה',
    danger: true,
  });
  if (!ok) return;
  try {
    await apiDelete(`/workplaces/${wp.id || wp._id}`);
    toast('מקום העבודה נמחק', 'success');
    if (state.workplaceId === (wp.id || wp._id)) state.workplaceId = 'all';
    await reloadWorkplaces();
    rerender();
  } catch (e) {
    toast(e.message, 'error');
  }
}
