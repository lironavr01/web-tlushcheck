// Small shared app state (selected month/year/workplace + cached workplaces).
export const state = {
  user: null,
  month: null, // 'YYYY-MM'
  year: null, // 'YYYY'
  workplaceId: 'all', // 'all' | workplace id
  workplaces: [],
};

export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonth(ym, delta) {
  let [y, m] = ym.split('-').map(Number);
  m += delta;
  if (m < 1) {
    m = 12;
    y--;
  } else if (m > 12) {
    m = 1;
    y++;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export const activeWorkplaceName = () => {
  if (state.workplaceId === 'all') return 'כל מקומות העבודה';
  return state.workplaces.find((w) => w.id === state.workplaceId || w._id === state.workplaceId)?.name || '';
};
