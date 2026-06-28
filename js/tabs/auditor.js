import { state } from '../state.js';
import { apiPost } from '../api.js';
import { fmt, esc, loadingHTML, errorHTML } from '../ui.js';
import { switcherBar, wireSwitcher } from './shared.js';

export async function renderAuditor(root) {
  root.innerHTML =
    switcherBar({ mode: 'month' }) +
    `<section class="card" style="background:var(--blue-soft)">
       <div class="row-between">
         <div>
           <strong>בדיקת תלוש שכר</strong>
           <p class="text-soft" style="font-size:.84rem;margin-top:4px">הזן את הנתונים מהתלוש — נשווה לחישוב שלנו מהמשמרות.</p>
         </div>
         <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="var(--blue-dim)" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
       </div>
     </section>`;
  wireSwitcher(root, { mode: 'month' });

  if (state.workplaceId === 'all') {
    root.insertAdjacentHTML(
      'beforeend',
      `<div class="card mt-md center text-faint">בחר מקום עבודה ספציפי (למעלה) כדי לבדוק תלוש לחודש זה.</div>`
    );
    return;
  }

  root.insertAdjacentHTML(
    'beforeend',
    `<section class="card card-white mt-md">
       <div class="section-head"><h2 class="h-section">נתוני התלוש</h2></div>
       <form class="stack gap-sm" data-form>
         <div class="field-row">
           <div class="field"><label>ברוטו ₪</label><input class="input" name="reportedGross" type="number" step="0.01" value="0"></div>
           <div class="field"><label>טיפים בתלוש ₪</label><input class="input" name="reportedTips" type="number" step="0.01" value="0"></div>
         </div>
         <div class="field"><label>נטו (העברה) ₪</label><input class="input" name="reportedNet" type="number" step="0.01" value="0"></div>
         <button class="btn btn-primary btn-block" type="submit">בדוק תלוש</button>
       </form>
     </section>
     <div data-result class="mt-md"></div>`
  );

  const form = root.querySelector('[data-form]');
  const result = root.querySelector('[data-result]');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(form).entries());
    result.innerHTML = loadingHTML('בודק…');
    try {
      const { data } = await apiPost('/paystubs', {
        workplaceId: state.workplaceId,
        month: state.month,
        reportedGross: +fd.reportedGross,
        reportedTips: +fd.reportedTips,
        reportedNet: +fd.reportedNet,
      });
      result.innerHTML = renderAudit(data);
    } catch (err) {
      result.innerHTML = errorHTML(err.message);
    }
  };
}

function renderAudit({ expected, audit }) {
  const verdict = audit.ok
    ? `<section class="card" style="background:var(--success-soft)"><div class="row-between"><strong class="text-success">התלוש תקין ✓</strong><span class="badge badge-success">אין פערים</span></div></section>`
    : `<section class="card" style="background:var(--error-soft)"><div class="row-between">
         <div><strong class="text-error">נמצאו פערים בתלוש</strong><p class="text-soft" style="font-size:.84rem;margin-top:4px">לפי החישוב מגיע לך יותר מהמופיע בתלוש.</p></div>
         <span class="badge badge-error">חסר ${fmt(audit.missing)}</span></div></section>`;

  const rows = audit.rows
    .map(
      (r) =>
        `<tr class="${r.ok ? 'ok' : 'bad'}"><td>${esc(r.label)}</td><td class="col-num">${fmt(r.computed)}</td><td class="col-num">${fmt(r.reported)}</td><td class="col-num">${r.ok ? '<span class="delta">תקין</span>' : fmt(r.diff)}</td></tr>`
    )
    .join('');

  return (
    verdict +
    `<section class="card card-white mt-md">
       <table class="cmp">
         <thead><tr><th>רכיב</th><th class="col-num">מחושב</th><th class="col-num">בתלוש</th><th class="col-num">פער</th></tr></thead>
         <tbody>${rows}</tbody>
       </table>
       <p class="text-faint" style="font-size:.76rem;margin-top:10px">* "מחושב" = החישוב שלנו מ-${expected.shiftCount} המשמרות שהוזנו לחודש זה.</p>
     </section>`
  );
}
