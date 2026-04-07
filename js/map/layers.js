// js/map/layers.js

/**
 * Couche OpenStreetMap (fond de carte par défaut)
 */
export const layerOSM = new ol.layer.Tile({
  source: new ol.source.OSM(),
  className: 'layer-osm',
});

/**
 * Couche satellite Google (masquée par défaut)
 */
export const layerSat = new ol.layer.Tile({
  source: new ol.source.XYZ({
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
  }),
  visible: false,
});

/**
 * Source vecteur pour l'itinéraire et les marqueurs
 */
export const sourceVecteur = new ol.source.Vector();

/**
 * Source vecteur pour la position GPS
 */
export const sourceMaPosition = new ol.source.Vector();

/**
 * Source vecteur pour l'animation de pulsation GPS
 */
export const sourcePulsation = new ol.source.Vector();
