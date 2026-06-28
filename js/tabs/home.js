import { state } from '../state.js';
import { apiGet } from '../api.js';
import { fmt, num, esc, loadingHTML, errorHTML, emptyHTML, dayNum, shortMonth } from '../ui.js';
import { switcherBar, wireSwitcher, wpParam, openShiftForm } from './shared.js';

export async function renderHome(root) {
  root.innerHTML = switcherBar({ mode: 'month' }) + loadingHTML();
  wireSwitcher(root, { mode: 'month' });

  try {
    const [{ data: sum }, { data: shifts }] = await Promise.all([
      apiGet(`/summary?month=${state.month}${wpParam()}`),
      apiGet(`/shifts?month=${state.month}${wpParam()}&sort=date&order=desc`),
    ]);
    const t = sum.totals;
    const recent = shifts.slice(0, 3);

    root.innerHTML =
      switcherBar({ mode: 'month' }) +
      `
      <section class="hero">
        <div class="hero-label">שכר החודש (סה״כ)</div>
        <div class="hero-amount num">${fmt(t.totalPay)}</div>
        <div class="hero-foot">
          <div><span class="hf-k">שעות</span><span class="hf-v num">${num(t.totalHours)}</span></div>
          <div><span class="hf-k">טיפים</span><span class="hf-v num">${fmt(t.tips)}</span></div>
          <div><span class="hf-k">משמרות</span><span class="hf-v num">${t.shiftCount}</span></div>
        </div>
      </section>

      <div class="stat-grid mt-md">
        <div class="stat"><span class="stat-label">שכר בסיס</span><span class="stat-value num">${fmt(t.basePay)}</span></div>
        <div class="stat"><span class="stat-label">טיפים</span><span class="stat-value num">${fmt(t.tips)}</span></div>
        <div class="stat"><span class="stat-label">ממוצע למשמרת</span><span class="stat-value num">${fmt(t.avgPerShift)}</span></div>
      </div>

      <button class="btn btn-primary btn-block mt-md" data-add>+ הוסף משמרת</button>

      <section class="mt-lg">
        <div class="section-head"><h2 class="h-section">משמרות אחרונות</h2></div>
        <div data-recent></div>
      </section>`;

    wireSwitcher(root, { mode: 'month' });
    root.querySelector('[data-add]').onclick = () => openShiftForm();

    const rc = root.querySelector('[data-recent]');
    rc.innerHTML = recent.length
      ? recent.map(shiftRow).join('')
      : emptyHTML('אין משמרות החודש', 'הוסיפו את המשמרת הראשונה');
  } catch (e) {
    root.innerHTML = switcherBar({ mode: 'month' }) + errorHTML(e.message);
    wireSwitcher(root, { mode: 'month' });
  }
}

function shiftRow(s) {
  const badge = s.isShabbatHoliday
    ? `<span class="badge badge-shabbat">${esc(s.holidayName || 'שבת')}</span>`
    : '';
  return `<div class="list-item">
    <div class="li-date"><span class="d-day">${dayNum(s.date)}</span><span class="d-mon">${shortMonth(s.date.slice(0, 7))}</span></div>
    <div class="li-main">
      <div class="li-title">${esc(s.startTime)}–${esc(s.endTime)} ${badge}</div>
      <div class="li-sub">${num(s.computed.hours)} שעות · טיפ ${fmt(s.computed.tipsTotal)}</div>
    </div>
    <div class="li-amount num">${fmt(s.computed.totalPay)}<small>סה״כ</small></div>
  </div>`;
}
