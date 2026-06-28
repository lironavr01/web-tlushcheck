// Tab router — toggles the visible <section> and the active nav item.
const TABS = ['home', 'shifts', 'auditor', 'summary', 'settings'];
let current = null;
let handler = null;

export function initRouter(onChange) {
  handler = onChange;
  document.querySelectorAll('.bottom-nav a').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(a.dataset.tab);
    });
  });
}

export function navigate(tab) {
  if (!TABS.includes(tab)) tab = 'home';
  current = tab;
  TABS.forEach((t) => document.getElementById(`tab-${t}`)?.classList.toggle('hidden', t !== tab));
  document.querySelectorAll('.bottom-nav a').forEach((a) =>
    a.classList.toggle('active', a.dataset.tab === tab)
  );
  window.scrollTo(0, 0);
  handler?.(tab);
}

export const currentTab = () => current;
