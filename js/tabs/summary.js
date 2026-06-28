import { state } from '../state.js';
import { apiGet } from '../api.js';
import { fmt, num, esc, monthLabel, shortMonth, loadingHTML, errorHTML, emptyHTML } from '../ui.js';
import { switcherBar, wireSwitcher, wpParam } from './shared.js';
import { renderBarChart } from '../charts.js';

export async function renderSummary(root) {
  root.innerHTML = switcherBar({ mode: 'year' }) + loadingHTML();
  wireSwitcher(root, { mode: 'year' });

  try {
    const { data } = await apiGet(`/summary/yearly?year=${state.year}${wpParam()}`);
    const months = data.months;

    if (!months.length) {
      root.innerHTML = switcherBar({ mode: 'year' }) + emptyHTML('אין נתונים לשנה זו');
      wireSwitcher(root, { mode: 'year' });
      return;
    }

    const sum = (k) => months.reduce((s, m) => s + (m[k] || 0), 0);
    const totalPay = sum('totalPay');
    const totalTips = sum('totalTips');
    const totalHours = sum('totalHours');

    root.innerHTML =
      switcherBar({ mode: 'year' }) +
      `
      <div class="stat-grid">
        <div class="stat"><span class="stat-label">שכר שנתי</span><span class="stat-value num">${fmt(totalPay)}</span></div>
        <div class="stat"><span class="stat-label">טיפים</span><span class="stat-value num">${fmt(totalTips)}</span></div>
        <div class="stat"><span class="stat-label">שעות</span><span class="stat-value num">${num(totalHours, 0)}</span></div>
      </div>

      <section class="card mt-md">
        <div class="section-head"><h2 class="h-section">שכר חודשי</h2><span class="text-faint" style="font-size:.8rem">${esc(state.year)}</span></div>
        <div style="height:175px;position:relative"><canvas data-chart></canvas></div>
      </section>

      <section class="mt-md">
        <div class="section-head"><h2 class="h-section">פירוט חודשי</h2></div>
        <div class="card">
          ${months
            .slice()
            .reverse()
            .map(
              (m) =>
                `<div class="kv"><span class="kv-label">${monthLabel(m.month)} · ${m.shiftCount} משמרות</span><span class="kv-value num">${fmt(m.totalPay || 0)}</span></div>`
            )
            .join('')}
        </div>
      </section>`;

    wireSwitcher(root, { mode: 'year' });
    renderBarChart(
      root.querySelector('[data-chart]'),
      months.map((m) => shortMonth(m.month)),
      months.map((m) => Math.round(m.totalPay || 0)),
      'שכר'
    );
  } catch (e) {
    root.innerHTML = switcherBar({ mode: 'year' }) + errorHTML(e.message);
    wireSwitcher(root, { mode: 'year' });
  }
}
