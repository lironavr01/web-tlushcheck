import { state } from '../state.js';
import { apiGet } from '../api.js';
import { fmt, num, esc, loadingHTML, errorHTML, emptyHTML, dayNum, dayName } from '../ui.js';
import { switcherBar, wireSwitcher, wpParam, openShiftForm, removeShift } from './shared.js';

let sortBy = 'date';
let searchTerm = '';

export async function renderShifts(root) {
  root.innerHTML =
    switcherBar({ mode: 'month' }) +
    `
    <div class="row-between" style="gap:10px;">
      <input class="input" data-search placeholder="חיפוש בהערות…" value="${esc(searchTerm)}" style="flex:1;">
      <div class="segmented">
        <button data-sort="date" class="${sortBy === 'date' ? 'active' : ''}">תאריך</button>
        <button data-sort="pay" class="${sortBy === 'pay' ? 'active' : ''}">שכר</button>
      </div>
    </div>
    <button class="btn btn-primary btn-block mt-md" data-add>+ הוסף משמרת</button>
    <div class="mt-md" data-list></div>`;

  wireSwitcher(root, { mode: 'month' });
  const list = root.querySelector('[data-list]');
  const search = root.querySelector('[data-search]');

  // Refresh ONLY the list (keeps the search box focused while typing).
  const refresh = async () => {
    list.innerHTML = loadingHTML();
    try {
      const q =
        `/shifts?month=${state.month}${wpParam()}&sort=${sortBy}&order=desc` +
        (searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '');
      const { data: shifts, count } = await apiGet(q);
      if (!count) {
        list.innerHTML = emptyHTML('אין משמרות', searchTerm ? 'לא נמצאו תוצאות לחיפוש' : 'הוסיפו משמרת');
        return;
      }
      const total = shifts.reduce((s, x) => s + x.computed.totalPay, 0);
      list.innerHTML =
        `<div class="section-head"><h2 class="h-section">${count} משמרות</h2><span class="text-faint" style="font-size:.82rem">סה״כ ${fmt(total)}</span></div>` +
        shifts.map(rowHTML).join('');
      list.querySelectorAll('[data-row]').forEach((el) => {
        const s = shifts.find((x) => x.id === el.dataset.id);
        el.querySelector('[data-edit]').onclick = () => openShiftForm(s);
        el.querySelector('[data-del]').onclick = (e) => {
          e.stopPropagation();
          removeShift(s);
        };
      });
    } catch (e) {
      list.innerHTML = errorHTML(e.message);
    }
  };

  let tmr;
  search.oninput = () => {
    clearTimeout(tmr);
    tmr = setTimeout(() => {
      searchTerm = search.value.trim();
      refresh();
    }, 350);
  };
  root.querySelectorAll('[data-sort]').forEach((b) => {
    b.onclick = () => {
      sortBy = b.dataset.sort;
      root.querySelectorAll('[data-sort]').forEach((x) => x.classList.toggle('active', x === b));
      refresh();
    };
  });
  root.querySelector('[data-add]').onclick = () => openShiftForm();

  refresh();
}

function rowHTML(s) {
  const badge = s.isShabbatHoliday
    ? `<span class="badge badge-shabbat">${esc(s.holidayName || 'שבת')}</span>`
    : '';
  return `<div class="list-item" data-row data-id="${s.id}">
    <div class="li-date"><span class="d-day">${dayNum(s.date)}</span><span class="d-mon">${esc(dayName(s.date))}</span></div>
    <div class="li-main" data-edit style="cursor:pointer">
      <div class="li-title">${esc(s.startTime)}–${esc(s.endTime)} ${badge}</div>
      <div class="li-sub">${num(s.computed.hours)} שעות · טיפ ${fmt(s.computed.tipsTotal)}${s.notes ? ` · ${esc(s.notes)}` : ''}</div>
    </div>
    <div style="text-align:left">
      <div class="li-amount num">${fmt(s.computed.totalPay)}</div>
      <button class="btn btn-danger btn-sm" data-del style="margin-top:4px">מחק</button>
    </div>
  </div>`;
}
