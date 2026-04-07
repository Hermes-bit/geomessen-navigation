// js/utils/dom.js

/**
 * Raccourci jQuery-like pour afficher/masquer
 */
export function toggleMenu(id) {
  $(`#${id}`).toggleClass('active');
}

/**
 * Efface un champ de recherche et son point associé
 */
export function clearSearch(inputId, points, updateFn) {
  $(`#${inputId}`).val('');
  points[inputId === 'search-start' ? 0 : 1] = null;
  updateFn();
}
