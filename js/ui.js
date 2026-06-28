// In-app UI helpers — toasts, modals, formatters, state blocks.
// No alert()/confirm()/prompt() anywhere in this project.

/** Escape user-provided strings before inserting into innerHTML. */
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

// --- currency / number / date formatting (Hebrew locale) ---
export const fmt = (n) => '₪' + Number(n || 0).toLocaleString('he-IL', { maximumFractionDigits: 0 });
export const fmt1 = (n) =>
  '₪' + Number(n || 0).toLocaleString('he-IL', { maximumFractionDigits: 1 });
export const num = (n, d = 1) => Number(n || 0).toLocaleString('he-IL', { maximumFractionDigits: d });

const HE_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
export const monthLabel = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return `${HE_MONTHS[m - 1]} ${y}`;
};
export const dayName = (dateStr) => HE_DAYS[new Date(`${dateStr}T12:00:00`).getDay()];
export const dayNum = (dateStr) => Number(dateStr.split('-')[2]);
export const shortMonth = (ym) => HE_MONTHS[Number(ym.split('-')[1]) - 1].slice(0, 3);

// --- toast ---
export function toast(message, type = 'info', ms = 3000) {
  let host = document.querySelector('.toast-host');
  if (!host) {
    host = document.createElement('div');
    host.className = 'toast-host';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${esc(message)}</span>`;
  el.style.pointerEvents = 'auto';
  host.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .25s, transform .25s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    setTimeout(() => el.remove(), 260);
  }, ms);
}

// --- confirm modal (returns a Promise<boolean>) ---
export function confirmModal({ title, body = '', confirmText = 'אישור', cancelText = 'ביטול', danger = false }) {
  return new Promise((resolve) => {
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    back.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-title">${esc(title)}</div>
        <div class="modal-body">${esc(body)}</div>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-cancel>${esc(cancelText)}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(confirmText)}</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    const close = (v) => {
      back.remove();
      resolve(v);
    };
    back.querySelector('[data-cancel]').onclick = () => close(false);
    back.querySelector('[data-ok]').onclick = () => close(true);
    back.onclick = (e) => {
      if (e.target === back) close(false);
    };
  });
}

/**
 * Form modal. `fields` = [{name,label,type,value,required,step,options}].
 * Resolves to a values object, or null if cancelled.
 */
export function formModal({ title, fields, submitText = 'שמירה' }) {
  return new Promise((resolve) => {
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    const fieldHTML = fields
      .map((f) => {
        if (f.type === 'select') {
          const opts = (f.options || [])
            .map((o) => `<option value="${esc(o.value)}" ${o.value === f.value ? 'selected' : ''}>${esc(o.label)}</option>`)
            .join('');
          return `<div class="field"><label>${esc(f.label)}</label><select class="select" name="${f.name}">${opts}</select></div>`;
        }
        if (f.type === 'toggle') {
          return `<div class="toggle-row" style="padding-top:4px;"><div class="tr-text"><span class="tr-title">${esc(f.label)}</span></div><span class="toggle ${f.value ? 'on' : ''}" data-toggle="${f.name}"></span></div>`;
        }
        return `<div class="field"><label>${esc(f.label)}</label><input class="input" name="${f.name}" type="${f.type || 'text'}" ${f.step ? `step="${f.step}"` : ''} value="${esc(f.value ?? '')}" ${f.required ? 'required' : ''} placeholder="${esc(f.placeholder || '')}"></div>`;
      })
      .join('');
    back.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-title">${esc(title)}</div>
        <form class="stack gap-sm" data-form>${fieldHTML}
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" data-cancel>ביטול</button>
            <button type="submit" class="btn btn-primary">${esc(submitText)}</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(back);
    const toggles = {};
    back.querySelectorAll('[data-toggle]').forEach((t) => {
      toggles[t.dataset.toggle] = t.classList.contains('on');
      t.onclick = () => {
        t.classList.toggle('on');
        toggles[t.dataset.toggle] = t.classList.contains('on');
      };
    });
    const close = (v) => {
      back.remove();
      resolve(v);
    };
    back.querySelector('[data-cancel]').onclick = () => close(null);
    back.onclick = (e) => {
      if (e.target === back) close(null);
    };
    back.querySelector('[data-form]').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const values = Object.fromEntries(fd.entries());
      Object.assign(values, toggles);
      close(values);
    };
  });
}

// --- state blocks ---
export const loadingHTML = (text = 'טוען…') =>
  `<div class="loading-block"><div class="spinner"></div><span>${esc(text)}</span></div>`;

export const emptyHTML = (title, sub = '') =>
  `<div class="empty"><div class="empty-icon">
     <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h18M3 12h18M3 17h10"/></svg>
   </div><div class="empty-title">${esc(title)}</div><div>${esc(sub)}</div></div>`;

export const errorHTML = (msg) =>
  `<div class="empty"><div class="empty-icon" style="color:var(--error)">
     <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v5M12 16h.01"/><circle cx="12" cy="12" r="9"/></svg>
   </div><div class="empty-title">שגיאה</div><div>${esc(msg)}</div></div>`;
