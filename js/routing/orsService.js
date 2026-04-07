// js/routing/orsService.js
import { CONFIG } from '../config.js';

/**
 * Calcule un itinéraire via OpenRouteService
 * @param {Array} start - [lon, lat] du départ
 * @param {Array} end - [lon, lat] de l'arrivée
 * @param {string} mode - Mode de transport (clé de MODE_CONFIG)
 * @returns {Promise<Object>} Réponse GeoJSON ORS
 */
export async function fetchRoute(start, end, mode = 'driving-car') {
  const cfg = CONFIG.MODE_CONFIG[mode] || CONFIG.MODE_CONFIG['driving-car'];
  if (!cfg) throw new Error(`Mode "${mode}" non supporté par ORS`);

  const body = {
    coordinates: [start, end],
    preference: cfg.preference,
    language: 'fr',
    instructions: true,
    ...(cfg.options ? { options: cfg.options } : {}),
  };

  try {
    const response = await fetch(
      `${CONFIG.ORS_BASE_URL}/v2/directions/${cfg.profile}/geojson`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': CONFIG.ORS_API_KEY,
          'Accept': 'application/json, application/geo+json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) throw new Error(`ORS: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('[ORS] fetchRoute:', error.message);
    throw new Error("Impossible de calculer l'itinéraire. Vérifiez votre connexion.");
  }
}

/**
 * Récupère le facteur de vitesse pour un mode donné
 * @param {string} mode
 * @returns {number}
 */
export function getSpeedFactor(mode) {
  const cfg = CONFIG.MODE_CONFIG[mode];
  return cfg?.speedFactor || 1;
}
