// js/utils/geocoding.js
import { CONFIG } from '../config.js';

/**
 * Recherche d'adresses via Nominatim
 * @param {string} query - Texte de recherche
 * @param {number} limit - Nombre de résultats max
 * @param {Array|null} proximityCoords - [lon, lat] pour biais de proximité
 * @returns {Promise<Array>} Résultats Nominatim
 */
export async function searchAddress(query, limit = 10, proximityCoords = null) {
  try {
    let url = `${CONFIG.NOMINATIM_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1`;
    if (proximityCoords) {
      url += `&lat=${proximityCoords[1]}&lon=${proximityCoords[0]}`;
    }

    const response = await fetch(url, {
      headers: { 'Accept-Language': 'fr', 'Accept': 'application/json' },
    });

    if (!response.ok) throw new Error(`Nominatim: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('[Geocoding] searchAddress:', error.message);
    return [];
  }
}

/**
 * Géocodage inverse (coordonnées → adresse)
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<Object|null>}
 */
export async function reverseGeocode(lat, lon) {
  try {
    const url = `${CONFIG.NOMINATIM_URL}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'fr', 'Accept': 'application/json' },
    });

    if (!response.ok) throw new Error(`Reverse geocode: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('[Geocoding] reverseGeocode:', error.message);
    return null;
  }
}

/**
 * Géocodage automatique : cherche un lieu et retourne [lon, lat] + label
 * @param {string} query
 * @returns {Promise<{lon: number, lat: number, label: string}|null>}
 */
export async function geocodeFirst(query) {
  const results = await searchAddress(query, 1);
  if (!results.length) return null;

  const f = results[0];
  return {
    lon: parseFloat(f.lon),
    lat: parseFloat(f.lat),
    label: f.display_name || query,
  };
}
