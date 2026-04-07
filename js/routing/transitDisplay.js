// js/routing/transitDisplay.js
import { fetchTransitJourneys, formatNavitiaTime } from './transitService.js';

/**
 * Affiche le panneau transports en commun avec les résultats Navitia
 * @param {Array} start - [lon, lat]
 * @param {Array} end - [lon, lat]
 */
export async function afficherTransit(start, end) {
  if (!start || !end) return;

  $('#transit-results').html('<div class="transit-loading">Recherche des itinéraires...</div>');
  $('#transit-overlay, #transit-panel').addClass('show');
  $('#instructions').html('<span style="color:#007AFF;">Transports en commun...</span>');

  try {
    const journeys = await fetchTransitJourneys(start, end);
    if (!journeys.length) {
      $('#transit-results').html(
        '<div class="transit-loading">Aucun itinéraire trouvé.<br><small>Vérifiez votre token Navitia.</small></div>'
      );
      return;
    }
    renderTransitJourneys(journeys);
  } catch (error) {
    $('#transit-results').html(
      `<div class="transit-loading" style="color:#e53935;">${error.message}</div>`
    );
  }
}

/**
 * Ferme le panneau transports en commun
 */
export function fermerTransit() {
  $('#transit-overlay, #transit-panel').removeClass('show');
}

/**
 * Génère le HTML des résultats Navitia
 */
function renderTransitJourneys(journeys) {
  const html = journeys
    .map((journey, idx) => {
      const dep = formatNavitiaTime(journey.departure_date_time);
      const arr = formatNavitiaTime(journey.arrival_date_time);
      const dur = Math.round(journey.duration / 60);
      const walkTotal = journey.sections
        .filter((s) => (s.type === 'street_network' || s.type === 'crow_fly') && s.mode === 'walking')
        .reduce((acc, s) => acc + s.duration, 0);
      const walkMin = Math.round(walkTotal / 60);

      const steps = journey.sections
        .map((s) => {
          if (s.type === 'waiting') return '';
          if ((s.type === 'street_network' || s.type === 'crow_fly') && s.duration > 30) {
            const m = Math.round(s.duration / 60);
            return `<span class="transit-step-walk"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2.5"><circle cx="12" cy="5" r="2"/><path d="M12 22V13l-3-3 3-7"/><path d="M9 13l-3 4M15 13l3 4"/></svg>${m} min</span>`;
          }
          if (s.type === 'public_transport') {
            const info = s.display_informations;
            const color = '#' + (info.color || '1976D2');
            const label = info.label || info.code || info.name || '?';
            const modeIcon = { Bus: '🚌', Metro: '🚇', Tramway: '🚊', Train: '🚆', RER: '🚆', Intercités: '🚆' };
            const icon = modeIcon[info.commercial_mode] || '🚌';
            return `<span class="transit-step-line" style="background:${color};">${icon} ${label}</span>`;
          }
          return '';
        })
        .filter(Boolean)
        .join('<span class="transit-step-arrow">›</span>');

      const details = journey.sections
        .filter((s) => s.type === 'public_transport')
        .map((s) => {
          const info = s.display_informations;
          const color = '#' + (info.color || '1976D2');
          const label = info.label || info.code || info.name || '?';
          const depStop = s.from?.stop_point?.name || s.from?.name || '';
          const arrStop = s.to?.stop_point?.name || s.to?.name || '';
          const depTime = formatNavitiaTime(s.departure_date_time);
          const headsign = info.headsign || info.direction || '';
          return `
          <div class="transit-detail">
            <span class="transit-detail-line" style="background:${color};">${label}</span>
            <div style="flex:1;">
              <div style="font-weight:600;color:#222;">${depTime} — ${depStop}</div>
              ${headsign ? `<div style="color:#888;font-size:11px;">Direction ${headsign}</div>` : ''}
              <div style="color:#555;margin-top:2px;">↓ ${arrStop}</div>
            </div>
          </div>`;
        })
        .join('');

      const lastWalk = journey.sections
        .slice()
        .reverse()
        .find((s) => (s.type === 'street_network' || s.type === 'crow_fly') && s.mode === 'walking' && s.duration > 30);
      const walkDetail = lastWalk
        ? `<div class="transit-walk-detail">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.5"><circle cx="12" cy="5" r="2"/><path d="M12 22V13l-3-3 3-7"/><path d="M9 13l-3 4M15 13l3 4"/></svg>
            <span>${Math.round(lastWalk.duration / 60)} min à pied jusqu'à destination</span>
          </div>`
        : '';

      return `
      <div class="transit-journey-card ${idx === 0 ? 'optimal' : ''}">
        ${idx === 0 ? '<span class="transit-badge">Recommandé</span>' : ''}
        <div class="transit-journey-header">
          <span class="transit-time">${dep} – ${arr}</span>
          <span class="transit-dur">${dur} min</span>
        </div>
        <div class="transit-steps">${steps || '<span style="color:#888;font-size:12px;">Itinéraire direct</span>'}</div>
        ${details}
        ${walkDetail}
        ${walkMin > 0 ? `<div style="font-size:11px;color:#aaa;margin-top:6px;">dont ${walkMin} min à pied</div>` : ''}
      </div>`;
    })
    .join('');

  $('#transit-results').html(html);
}
