# Vynl — site vitrine

Site marketing statique de Vynl. HTML, CSS et JavaScript natifs : pas de
framework, pas de build, aucune dépendance. Il oriente vers l'app auditeur et
le Creator Studio, et affiche le catalogue réel via l'API publique.

## Pages

| Fichier | Contenu |
| --- | --- |
| `index.html` | Accueil : hero (disque), pourquoi Vynl, les 3 étiquettes, catalogue réel, créateurs |
| `creators.html` | Creator Studio : fonctionnalités (Live / Coming), parcours, prérequis |
| `transparency.html` | Étiquettes human / AI-assisted / AI-generated, royalties centrées sur l'utilisateur |

## Structure

```
css/style.css    tokens de design + tous les composants
js/config.js     URLs des autres apps et de l'API (seul endroit à modifier)
js/main.js       liens, menu mobile, disque, apparition au scroll, catalogue
favicon.svg
vercel.json      { "framework": null }
```

## Lancer en local

```bash
python3 -m http.server 8110
```

Puis ouvrir `http://localhost:8110`. En local, le catalogue interroge
`http://localhost:4000` (l'API) ; s'il ne répond pas, la section reste
simplement masquée.

## Identité

Nocturne et chaleureuse, le sillon du vinyle comme fil conducteur.

| Token | Valeur | Usage |
| --- | --- | --- |
| `--ink` | `#15120F` | fond principal |
| `--surface` | `#201B17` | cartes, bandeaux |
| `--copper` | `#D98B3D` | actions uniquement : boutons, arc de progression, badge IA |
| `--ember` | `#B5432B` | accent discret : étiquette du disque, liseré, points de statut |
| `--cream` | `#F4ECE0` | texte |

Polices : **Fraunces** (titres, logo en italique) et **IBM Plex Sans**
(interface et texte), chargées depuis Google Fonts. Coins à 10-12 px. Icônes
SVG en traits fins, pas d'emoji, pas de dégradé multicolore.

Le braise `#B5432B` a un contraste de ~3,4:1 sur l'encre : à réserver aux
aplats, filets et éléments décoratifs, jamais au texte courant.

## À savoir

- **Liens vers les apps** : ils vivent dans `js/config.js` et sont injectés via
  `data-link="<clé>"`. Le `href` écrit dans le HTML n'est qu'un repli sans JS.
- **CORS** : le catalogue appelle l'API depuis le navigateur. Le domaine de ce
  site doit figurer dans `CORS_ALLOWED_ORIGINS` sur Render, sinon la section
  « Just pressed » ne s'affichera jamais (sans erreur visible).
- **Aucune donnée inventée** : pas de faux artistes ni de chiffres. Les
  fonctionnalités pas encore construites sont marquées « Coming ».
- **Animation du disque** : purement décorative. Elle démarre à l'arrêt si le
  visiteur a activé `prefers-reduced-motion`.
