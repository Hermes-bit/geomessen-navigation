// js/routing/transitService.js
import { CONFIG } from '../config.js';

/**
 * Recherche des itinéraires en transports en commun via Navitia
 * @param {Array} start - [lon, lat]
 * @param {Array} end - [lon, lat]
 * @returns {Promise<Array>} Liste des journeys Navitia
 */
export async function fetchTransitJourneys(start, end) {
  const from = `${start[0]};${start[1]}`;
  const to = `${end[0]};${end[1]}`;
  const dt = getNavitiaDatetime();
  const auth = 'Basic ' + btoa(CONFIG.NAVITIA_TOKEN + ':');

  try {
    const response = await fetch(
      `https://api.navitia.io/v1/journeys?from=${from}&to=${to}&datetime=${dt}&count=4&min_nb_journeys=1`,
      { headers: { 'Authorization': auth } }
    );

    if (!response.ok) throw new Error(`Navitia: ${response.status}`);
    const data = await response.json();
    return data.journeys || [];
  } catch (error) {
    console.error('[Transit] fetchTransitJourneys:', error.message);
    throw new Error('Erreur réseau. Vérifiez votre token Navitia sur navitia.io');
  }
}

/**
 * Formate la date actuelle au format Navitia (YYYYMMDDTHHmmss)
 */
function getNavitiaDatetime() {
  const n = new Date();
  const p = (x) => String(x).padStart(2, '0');
  return `${n.getFullYear()}${p(n.getMonth() + 1)}${p(n.getDate())}T${p(n.getHours())}${p(n.getMinutes())}${p(n.getSeconds())}`;
}

/**
 * Formate un datetime Navitia en heure lisible (ex: "16h45")
 */
export function formatNavitiaTime(dt) {
  return dt.slice(9, 11) + 'h' + dt.slice(11, 13);
}
