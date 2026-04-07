# 🗺️ GÉOMESSEN Mobilité

Application web de calcul d'itinéraires accessibles (PMR) avec assistant IA conversationnel et commande vocale.

## Fonctionnalités

- **Calcul d'itinéraires** multi-modes : voiture, piéton, moto, fauteuil roulant, transports en commun
- **Accessibilité PMR** : profil fauteuil roulant avec contraintes (pente max 6%, largeur min 0.9m, surface lisse)
- **Assistant IA** : commande en langage naturel via Groq / LLaMA 3 (ex: "emmène-moi à la gare")
- **Navigation vocale** : reconnaissance et synthèse vocale (Web Speech API)
- **Transports en commun** : intégration Navitia avec détail des correspondances
- **Visualisation** : statistiques de fréquentation avec Chart.js
- **Géocodage** : recherche d'adresses via Nominatim avec biais de proximité

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Cartographie | OpenLayers 10 |
| Itinéraires | OpenRouteService API |
| IA / NLP | Groq API (LLaMA 3) |
| Transports | Navitia API |
| Graphiques | Chart.js 4 |
| Voix | Web Speech API |
| Géocodage | Nominatim (OSM) |

## Installation

```bash
git clone https://github.com/VOTRE_USER/geomessen-mobilite.git
cd geomessen-mobilite

# Configurer les clés API
cp js/config.example.js js/config.js
# Éditer js/config.js avec vos clés (ORS, Groq, Navitia)

# Servir localement (nécessite un serveur pour les modules ES6)
npx serve .
# ou
python -m http.server 8000
```

### Obtenir les clés API

| Service | Inscription |
|---------|------------|
| OpenRouteService | [openrouteservice.org/dev/#/signup](https://openrouteservice.org/dev/#/signup) |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) |
| Navitia | [navitia.io](https://navitia.io) |

## Architecture

```
geomessen-mobilite/
├── index.html              # Structure HTML uniquement
├── css/
│   ├── main.css            # Variables, reset, layout global
│   ├── map.css             # Carte OL, FABs, contrôles
│   ├── sidebar.css         # Recherche, stats, transit
│   └── responsive.css      # Media queries
├── js/
│   ├── app.js              # Orchestrateur principal
│   ├── config.js           # Clés API (ignoré par Git)
│   ├── config.example.js   # Template de configuration
│   ├── map/
│   │   ├── mapInit.js      # Initialisation OpenLayers
│   │   └── layers.js       # Couches cartographiques
│   ├── routing/
│   │   ├── orsService.js   # Appels API ORS
│   │   ├── routeDisplay.js # Affichage itinéraire
│   │   ├── transitService.js   # Appels Navitia
│   │   └── transitDisplay.js   # Rendu transports
│   ├── ai/
│   │   └── groqService.js  # Extraction d'intention IA
│   ├── voice/
│   │   └── speechRecognition.js  # Web Speech API
│   ├── charts/
│   │   └── statsCharts.js  # Statistiques Chart.js
│   └── utils/
│       ├── geocoding.js    # Géocodage Nominatim
│       └── dom.js          # Helpers DOM
└── docs/
    └── ARCHITECTURE.md
```

## Auteur

**Hermès Barry** — Géomaticien / Analyste SIG  
Formation CQP CPGEOM — IDGEO

## Licence

Ce projet est à usage personnel et démonstratif (portfolio).
