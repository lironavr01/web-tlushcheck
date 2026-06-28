// Chart.js wrapper (Chart is loaded globally via CDN in index.html).
let current = null;

export function renderBarChart(canvas, labels, data, label = 'שכר') {
  if (!window.Chart || !canvas) return;
  if (current) {
    current.destroy();
    current = null;
  }
  current = new window.Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          backgroundColor: '#1f70e1',
          hoverBackgroundColor: '#195fc3',
          borderRadius: 6,
          maxBarThickness: 36,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          callbacks: { label: (c) => '₪' + Number(c.raw).toLocaleString('he-IL') },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Heebo' } } },
        y: {
          beginAtZero: true,
          ticks: { callback: (v) => '₪' + v, font: { family: 'Heebo' } },
          grid: { color: '#ece4d6' },
        },
      },
    },
  });
}
