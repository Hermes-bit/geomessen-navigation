// js/config.example.js
// ────────────────────────────────────────────────────────
// INSTRUCTIONS :
// 1. Copier ce fichier : cp config.example.js config.js
// 2. Renseigner vos clés API dans config.js
// 3. Ne JAMAIS commiter config.js (il est dans .gitignore)
// ────────────────────────────────────────────────────────

export const CONFIG = {
  ORS_API_KEY: '',       // https://openrouteservice.org/dev/#/signup
  GROQ_API_KEY: '',      // https://console.groq.com/keys
  NAVITIA_TOKEN: '',     // https://navitia.io

  ORS_BASE_URL: 'https://api.openrouteservice.org',
  GROQ_MODEL: 'llama3-8b-8192',
  NOMINATIM_URL: 'https://nominatim.openstreetmap.org',
  PHOTON_URL: 'https://photon.komoot.io/api/',

  MAP_CENTER: [-1.53, 12.37],
  MAP_ZOOM: 13,

  // ... (voir config.js pour la structure complète)
};
