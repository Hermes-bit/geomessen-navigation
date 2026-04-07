// js/charts/statsCharts.js

const STATS_KEY = 'geomessen_stats';
let chartVisites = null;
let chartClics = null;

// ── Persistence localStorage ──

function getDateStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
}

function chargerStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY)) || {};
  } catch {
    return {};
  }
}

function sauvegarderStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function incrementerVisite() {
  const stats = chargerStats();
  const today = getDateStr();
  if (!stats[today]) stats[today] = { visites: 0, clics: 0 };
  stats[today].visites++;
  sauvegarderStats(stats);
}

export function incrementerClic() {
  const stats = chargerStats();
  const today = getDateStr();
  if (!stats[today]) stats[today] = { visites: 0, clics: 0 };
  stats[today].clics++;
  sauvegarderStats(stats);
}

// ── Données sur 7 jours ──

function obtenirDonnees7Jours() {
  const stats = chargerStats();
  const labels = [], visites = [], clics = [];
  for (let i = 6; i >= 0; i--) {
    const key = getDateStr(i);
    const d = stats[key] || { visites: 0, clics: 0 };
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - i);
    labels.push(dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
    visites.push(d.visites);
    clics.push(d.clics);
  }
  return { labels, visites, clics };
}

// ── Panneau statistiques ──

export function ouvrirStats() {
  const { labels, visites, clics } = obtenirDonnees7Jours();
  const totalVisites = visites.reduce((a, b) => a + b, 0);
  const totalClics = clics.reduce((a, b) => a + b, 0);
  $('#kpi-visites').text(totalVisites);
  $('#kpi-clics').text(totalClics);

  $('#stats-overlay, #stats-panel').addClass('show');

  if (chartVisites) { chartVisites.destroy(); chartVisites = null; }
  if (chartClics) { chartClics.destroy(); chartClics = null; }

  setTimeout(() => {
    chartVisites = new Chart(document.getElementById('chart-visites'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Visites',
          data: visites,
          backgroundColor: labels.map((_, i) => (i === 6 ? 'rgba(0,122,255,0.85)' : 'rgba(0,122,255,0.25)')),
          borderRadius: 10,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 900, easing: 'easeOutQuart' },
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { grid: { color: '#f0f0f0' }, ticks: { precision: 0, font: { size: 10 } }, beginAtZero: true },
        },
      },
    });

    chartClics = new Chart(document.getElementById('chart-clics'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Clics',
          data: clics,
          borderColor: '#34C759',
          backgroundColor: 'rgba(52,199,89,0.12)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#34C759',
          pointRadius: 4,
          pointHoverRadius: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 1000, easing: 'easeOutCubic' },
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { grid: { color: '#f0f0f0' }, ticks: { precision: 0, font: { size: 10 } }, beginAtZero: true },
        },
      },
    });
  }, 100);
}

export function fermerStats() {
  $('#stats-overlay, #stats-panel').removeClass('show');
  $('#stats-panel').css('transform', '');
}

export function reinitialiserStats() {
  if (confirm('Réinitialiser toutes les statistiques ?')) {
    localStorage.removeItem(STATS_KEY);
    incrementerVisite();
    ouvrirStats();
  }
}

/**
 * Initialise le drag-to-dismiss sur le panneau stats
 */
export function initStatsDrag() {
  const panel = document.getElementById('stats-panel');
  let startY = 0, currentY = 0, dragging = false;

  function onStart(e) {
    const touch = e.touches ? e.touches[0] : e;
    startY = touch.clientY;
    currentY = 0;
    dragging = true;
    panel.style.transition = 'none';
  }

  function onMove(e) {
    if (!dragging) return;
    const touch = e.touches ? e.touches[0] : e;
    currentY = touch.clientY - startY;
    if (currentY < 0) currentY = 0;
    panel.style.transform = `translateY(${currentY}px)`;
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    panel.style.transition = '';
    if (currentY > 120) {
      fermerStats();
    } else {
      panel.style.transform = 'translateY(0)';
    }
  }

  panel.addEventListener('touchstart', onStart, { passive: true });
  panel.addEventListener('touchmove', onMove, { passive: true });
  panel.addEventListener('touchend', onEnd);
  panel.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);
}
