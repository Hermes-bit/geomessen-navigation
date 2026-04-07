// js/map/mapInit.js
import { CONFIG } from '../config.js';
import { layerOSM, layerSat, sourceVecteur, sourceMaPosition, sourcePulsation } from './layers.js';

let map = null;
let deviceHeading = 0;

/**
 * Style du marqueur de position GPS (avec cône directionnel)
 */
function styleMaPosition() {
  const headingRad = (deviceHeading * Math.PI) / 180;
  return [
    new ol.style.Style({
      image: new ol.style.RegularShape({
        fill: new ol.style.Fill({ color: 'rgba(0, 122, 255, 0.3)' }),
        stroke: new ol.style.Stroke({ color: 'rgba(0, 122, 255, 0.05)', width: 1 }),
        points: 3, radius: 40, rotation: headingRad, scale: [1.2, 2],
      }),
    }),
    new ol.style.Style({
      image: new ol.style.Circle({
        radius: 10,
        fill: new ol.style.Fill({ color: '#ffffff' }),
        stroke: new ol.style.Stroke({ color: 'rgba(0,0,0,0.1)', width: 1.5 }),
      }),
    }),
    new ol.style.Style({
      image: new ol.style.Circle({
        radius: 7,
        fill: new ol.style.Fill({ color: '#007AFF' }),
        stroke: new ol.style.Stroke({ color: '#ffffff', width: 2 }),
      }),
    }),
  ];
}

/**
 * Style de la pulsation GPS
 */
function stylePulsation(feature) {
  const ratio = feature.get('ratio') || 0;
  const opacity = 1 - ratio;
  return new ol.style.Style({
    image: new ol.style.Circle({
      radius: 10 + ratio * 25,
      fill: new ol.style.Fill({ color: `rgba(0, 122, 255, ${opacity * 0.3})` }),
      stroke: new ol.style.Stroke({ color: `rgba(0, 122, 255, ${opacity * 0.5})`, width: 1 }),
    }),
  });
}

/**
 * Crée le style de l'itinéraire (ligne + marqueurs)
 */
function styleItineraire(currentMode) {
  return function (feature) {
    const geometry = feature.getGeometry();
    if (geometry.getType() === 'Point') {
      return feature.get('isStart')
        ? new ol.style.Style({
            image: new ol.style.Icon({ anchor: [0.5, 1], src: 'https://cdn-icons-png.flaticon.com/128/149/149060.png', scale: 0.35 }),
          })
        : [
            new ol.style.Style({
              image: new ol.style.Circle({
                radius: 18,
                fill: new ol.style.Fill({ color: 'rgba(0, 122, 255, 0.9)' }),
                stroke: new ol.style.Stroke({ color: '#ffffff', width: 3 }),
              }),
            }),
            new ol.style.Style({
              image: new ol.style.Icon({ anchor: [0.5, 0.5], src: CONFIG.ICONS_MODES[currentMode], scale: 0.45 }),
            }),
          ];
    }
    // Ligne de l'itinéraire (bordure blanche + tracé bleu)
    return [
      new ol.style.Style({ stroke: new ol.style.Stroke({ color: '#FFFFFF', width: 10 }) }),
      new ol.style.Style({ stroke: new ol.style.Stroke({ color: '#007AFF', width: 7, lineCap: 'round' }) }),
    ];
  };
}

/**
 * Initialise la carte OpenLayers
 * @param {string} currentMode - Mode de transport actif
 * @returns {ol.Map}
 */
export function initMap(currentMode = 'driving-car') {
  const couchePulsation = new ol.layer.Vector({
    source: sourcePulsation,
    zIndex: 9998,
    style: stylePulsation,
  });

  const coucheMaPosition = new ol.layer.Vector({
    source: sourceMaPosition,
    zIndex: 9999,
    style: styleMaPosition,
  });

  const coucheItineraire = new ol.layer.Vector({
    source: sourceVecteur,
    style: styleItineraire(currentMode),
  });

  map = new ol.Map({
    target: 'carte',
    layers: [layerSat, layerOSM, coucheItineraire, couchePulsation, coucheMaPosition],
    view: new ol.View({
      center: ol.proj.fromLonLat(CONFIG.MAP_CENTER),
      zoom: CONFIG.MAP_ZOOM,
    }),
    controls: [],
  });

  // Animation de pulsation
  let pulsationStart;
  function animate(t) {
    if (!pulsationStart) pulsationStart = t;
    const ratio = ((t - pulsationStart) % 1500) / 1500;
    const lastCoords = sourceMaPosition.getFeatures()[0]?.getGeometry()?.getCoordinates();
    if (lastCoords) {
      sourcePulsation.clear();
      const f = new ol.Feature({ geometry: new ol.geom.Point(lastCoords) });
      f.set('ratio', ratio);
      sourcePulsation.addFeature(f);
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  return map;
}

/**
 * Met à jour l'orientation de la boussole
 */
export function updateDeviceHeading(heading) {
  deviceHeading = heading;
  sourceMaPosition.changed();
}

export function getMap() {
  return map;
}

// Contrôles de vue
export function zoomIn() {
  const view = map.getView();
  view.animate({ zoom: view.getZoom() + 1, duration: 250 });
}

export function zoomOut() {
  const view = map.getView();
  view.animate({ zoom: view.getZoom() - 1, duration: 250 });
}

export function resetRotation() {
  map.getView().animate({ rotation: 0, duration: 300 });
}
