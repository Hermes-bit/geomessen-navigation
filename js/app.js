// js/app.js
// ────────────────────────────────────────────────────────
// Point d'entrée de GÉOMESSEN Mobilité
// Orchestre tous les modules sans contenir de logique métier
// ────────────────────────────────────────────────────────

import { CONFIG } from './config.js';
import { sourceVecteur, sourceMaPosition, layerOSM, layerSat } from './map/layers.js';
import { initMap, zoomIn, zoomOut, resetRotation, updateDeviceHeading } from './map/mapInit.js';
import { displayRoute, clearRoute, getCurrentRouteGeometry } from './routing/routeDisplay.js';
import { afficherTransit, fermerTransit } from './routing/transitDisplay.js';
import { extractNavIntent } from './ai/groqService.js';
import { geocodeFirst, searchAddress, reverseGeocode } from './utils/geocoding.js';
import { initSpeechRecognition, startListening } from './voice/speechRecognition.js';
import {
  ouvrirStats, fermerStats, reinitialiserStats, initStatsDrag,
  incrementerVisite, incrementerClic,
} from './charts/statsCharts.js';

// ── État global ──
let points = [null, null];
let currentMode = 'driving-car';
let activeInputId = null;
let lastUserCoords = null;
let isFirstLocation = true;

// ── Initialisation ──
const map = initMap(currentMode);

// Exposer les fonctions au HTML (onclick dans le DOM)
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.resetRotation = resetRotation;
window.ouvrirStats = ouvrirStats;
window.fermerStats = fermerStats;
window.reinitialiserStats = reinitialiserStats;
window.fermerTransit = fermerTransit;
window.toggleMenu = (id) => $(`#${id}`).toggleClass('active');
window.clearSearch = (id) => {
  $(`#${id}`).val('');
  points[id === 'search-start' ? 0 : 1] = null;
  actualiserPoints();
};
window.switchToManualStart = () => {
  $('#gps-chip').hide();
  $('#search-start').show().focus();
  $('#clear-start').hide();
  points[0] = null;
  isFirstLocation = false;
  actualiserPoints();
};
window.centerOnMe = () => {
  if (lastUserCoords) map.getView().animate({ center: lastUserCoords, zoom: 17, duration: 800 });
  else startFullNavigation();
};

// ── Géolocalisation ──
function startFullNavigation() {
  closeGeoModal();
  getUserLocation();
  setupOrientation();
}

function closeGeoModal() {
  $('#geo-modal').removeClass('show');
}

function setupOrientation() {
  const handler = (e) => {
    const heading = e.webkitCompassHeading || (360 - e.alpha);
    if (heading) updateDeviceHeading(heading);
  };
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().then((s) => {
      if (s === 'granted') window.addEventListener('deviceorientation', handler);
    });
  } else {
    window.addEventListener('deviceorientation', handler);
  }
}

function getUserLocation() {
  if (!('geolocation' in navigator)) return;

  navigator.geolocation.watchPosition(
    async (pos) => {
      const lon = pos.coords.longitude;
      const lat = pos.coords.latitude;
      const coords3857 = ol.proj.fromLonLat([lon, lat]);
      lastUserCoords = coords3857;

      sourceMaPosition.clear();
      sourceMaPosition.addFeature(new ol.Feature({ geometry: new ol.geom.Point(coords3857) }));

      if (points[1]) checkDeviation(coords3857);

      if (isFirstLocation) {
        points[0] = [lon, lat];
        map.getView().animate({ center: coords3857, zoom: 16 });

        const result = await reverseGeocode(lat, lon);
        if (result) {
          const addr = result.address || {};
          const label = addr.road || addr.pedestrian || addr.neighbourhood || addr.suburb || result.display_name || 'Ma position';
          $('#gps-chip-label').text(label);
          $('#search-start').val(label);
          actualiserPoints();
        } else {
          $('#gps-chip-label').text('Ma position');
        }
        isFirstLocation = false;
      }
    },
    null,
    { enableHighAccuracy: true }
  );
}

// ── Marqueurs ──
function actualiserPoints() {
  sourceVecteur.getFeatures().forEach((f) => {
    if (f.getGeometry().getType() === 'Point') sourceVecteur.removeFeature(f);
  });
  points.forEach((p, i) => {
    if (p) {
      const startVal = $('#search-start').val().toLowerCase();
      if (i === 0 && (startVal.includes('position') || startVal === '')) return;
      const feat = new ol.Feature({ geometry: new ol.geom.Point(ol.proj.fromLonLat(p)) });
      feat.set('isStart', i === 0);
      sourceVecteur.addFeature(feat);
    }
  });
}

// ── Déviation d'itinéraire ──
function checkDeviation(userCoords) {
  const routeGeom = getCurrentRouteGeometry();
  if (!routeGeom) return;
  const closest = routeGeom.getClosestPoint(userCoords);
  const dist = new ol.geom.LineString([userCoords, closest]).getLength();
  if (dist > 50) {
    const startVal = $('#search-start').val().toLowerCase();
    if (startVal.includes('position') || startVal === '') {
      points[0] = ol.proj.toLonLat(userCoords);
      calculerItineraire(true);
    }
  }
}

// ── Calcul d'itinéraire ──
function calculerItineraire(isDynamicUpdate = false) {
  if (!points[0] || !points[1]) return;

  if (currentMode === 'public-transport') {
    afficherTransit(points[0], points[1]);
    return;
  }

  displayRoute(points[0], points[1], currentMode, map, isDynamicUpdate);
}

// ── Recherche d'adresses ──
let searchTimeout = null;

$('#search-start, #search-end').on('focus', function () {
  activeInputId = $(this).attr('id');
});

$('#search-start, #search-end').on('input', function () {
  activeInputId = $(this).attr('id');
  const q = $(this).val();
  if (q.length < 3) return $('#search-results').hide();

  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const proximity = lastUserCoords ? ol.proj.toLonLat(lastUserCoords) : null;
    const results = await searchAddress(q, 10, proximity);
    if (!results.length) return $('#search-results').hide();

    $('#search-results')
      .html(
        results
          .map((f) => {
            const addr = f.address || {};
            const name = f.name || addr.road || addr.pedestrian || addr.neighbourhood || '';
            const city = addr.city || addr.town || addr.village || addr.county || '';
            const country = addr.country || '';
            const label = f.display_name || 'Lieu sélectionné';
            return `<div class="result-item" data-lon="${parseFloat(f.lon)}" data-lat="${parseFloat(f.lat)}" data-display="${label}"><b>${name || city}</b><br><small>${[city, country].filter(Boolean).join(', ')}</small></div>`;
          })
          .join('')
      )
      .show();
  }, 350);
});

$(document).on('click', '.result-item', function () {
  const lon = parseFloat($(this).data('lon'));
  const lat = parseFloat($(this).data('lat'));
  const idx = activeInputId === 'search-start' ? 0 : 1;
  points[idx] = [lon, lat];
  $(`#${activeInputId}`).val($(this).data('display'));
  $('#search-results').hide();
  actualiserPoints();

  if (idx === 0 && !points[1]) {
    activeInputId = 'search-end';
    $('#search-end').focus();
  } else if (points[0] && points[1]) {
    $('#search-end').blur();
    calculerItineraire();
  }
});

// ── Boutons ──
$('#btn-reverse').on('click', () => {
  const t1 = $('#search-start').val();
  $('#search-start').val($('#search-end').val());
  $('#search-end').val(t1);
  [points[0], points[1]] = [points[1], points[0]];
  actualiserPoints();
  if (points[0] && points[1]) calculerItineraire();
});

$('#btn-reset').on('click', () => {
  points = [null, null];
  clearRoute();
  $('#search-start, #search-end').val('');
  isFirstLocation = true;
});

$('.transport-btn[data-mode]').on('click', function () {
  $('.transport-btn').removeClass('active');
  $(this).addClass('active');
  currentMode = $(this).data('mode');
  actualiserPoints();
  if (points[0] && points[1]) calculerItineraire();
  window.toggleMenu('fabMenu');
});

$('.layer-card-fab').on('click', function () {
  $('.layer-card-fab').removeClass('active');
  $(this).addClass('active');
  layerOSM.setVisible($(this).data('layer') === 'osm');
  layerSat.setVisible($(this).data('layer') === 'sat');
  window.toggleMenu('fabLayers');
});

// ── Reconnaissance vocale + IA ──
async function traiterPhraseIA(texte) {
  $('#instructions').html(`<span style="color:#007AFF;">"${texte}"</span>`);
  try {
    const intent = await extractNavIntent(texte);
    if (intent.destination) {
      if (intent.depart) {
        const dep = await geocodeFirst(intent.depart);
        if (dep) {
          $('#search-start').val(dep.label);
          points[0] = [dep.lon, dep.lat];
        }
      }
      const dest = await geocodeFirst(intent.destination);
      if (dest) {
        $('#search-end').val(dest.label);
        points[1] = [dest.lon, dest.lat];
      }
      actualiserPoints();
      if (points[0] && points[1]) calculerItineraire();
    }
  } catch (error) {
    console.error('[IA]', error.message);
  }
}

initSpeechRecognition(traiterPhraseIA);
$('#btn-voice').on('click', () => startListening());

// ── Boussole ──
map.getView().on('change:rotation', () => {
  const rotation = map.getView().getRotation();
  $('#compass-arrow').css('transform', `rotate(${rotation}rad)`);
});

// ── Statistiques ──
initStatsDrag();
if (!sessionStorage.getItem('geomessen_visite_comptee')) {
  incrementerVisite();
  sessionStorage.setItem('geomessen_visite_comptee', '1');
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('#stats-panel') && !e.target.closest('.btn-stats')) {
    incrementerClic();
  }
});

// ── Démarrage ──
$(window).on('load', () => startFullNavigation());
