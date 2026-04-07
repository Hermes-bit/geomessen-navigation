// js/routing/routeDisplay.js
import { sourceVecteur } from '../map/layers.js';
import { fetchRoute, getSpeedFactor } from './orsService.js';

let currentRouteGeometry = null;

/**
 * Affiche un itinéraire calculé sur la carte
 * @param {Array} start - [lon, lat]
 * @param {Array} end - [lon, lat]
 * @param {string} mode - Mode de transport
 * @param {ol.Map} map - Instance de la carte
 * @param {boolean} isDynamicUpdate - Si true, ne recadre pas la vue
 * @returns {Promise<{distance: string, duration: string}|null>}
 */
export async function displayRoute(start, end, mode, map, isDynamicUpdate = false) {
  $('#instructions').html('<span style="color:#007AFF;">Calcul en cours...</span>');

  try {
    const data = await fetchRoute(start, end, mode);

    if (!data.features?.length) {
      $('#instructions').html('<span style="color:#e53935;">Itinéraire introuvable</span>');
      return null;
    }

    // Supprimer l'ancien tracé (garder les marqueurs)
    sourceVecteur.getFeatures().forEach((f) => {
      if (f.getGeometry().getType() === 'LineString') sourceVecteur.removeFeature(f);
    });

    // Ajouter le nouveau tracé
    const feature = new ol.format.GeoJSON().readFeature(data.features[0], {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    });
    currentRouteGeometry = feature.getGeometry();
    sourceVecteur.addFeature(feature);

    // Résumé distance / durée
    const summary = data.features[0].properties.summary;
    const speedFactor = getSpeedFactor(mode);
    const durationMin = Math.round((summary.duration * speedFactor) / 60);
    const distanceKm = (summary.distance / 1000).toFixed(1);

    $('#instructions').html(
      `<b>${distanceKm} km</b> <span style="opacity:0.2">|</span> <b>${durationMin} min</b>`
    );

    // Recadrer la vue sur l'itinéraire
    if (!isDynamicUpdate) {
      map.getView().fit(sourceVecteur.getExtent(), {
        padding: [120, 60, 260, 60],
        duration: 1000,
      });
    }

    return { distance: distanceKm, duration: durationMin };
  } catch (error) {
    $('#instructions').html('<span style="color:#e53935;">Erreur réseau</span>');
    return null;
  }
}

/**
 * Efface l'itinéraire de la carte
 */
export function clearRoute() {
  sourceVecteur.clear();
  currentRouteGeometry = null;
  $('#instructions').html('<span style="color:#bbb;">Prêt...</span>');
}

/**
 * Retourne la géométrie de l'itinéraire actif (pour la détection de déviation)
 */
export function getCurrentRouteGeometry() {
  return currentRouteGeometry;
}
