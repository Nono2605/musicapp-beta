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
favicon.png, apple-touch-icon.png, assets/vynl-icon.png
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

Direction artistique « studio d'écoute nocturne » : un fond très sombre et une
seule source de lumière bleue qui fait briller le vinyle. Règle : 80 % de
sombre, 15 % de bleu, 5 % de cyan (le cyan est rare : ce qui est actif).

| Token | Valeur | Usage |
| --- | --- | --- |
| `--vynl-nuit` | `#050816` | fond principal |
| `--vynl-abysse` | `#0B1130` | surfaces : en-tête, sections alternées |
| `--vynl-vinyle` | `#17204F` | cartes, notices |
| `--vynl-sillon` | `#32428C` | bordures (à 40 %), pistes de progression |
| `--vynl-bleu` / `--vynl-bleu-profond` | `#0059F9` / `#001CB2` | boutons, survol |
| `--vynl-cyan` | `#19E3FF` | accent rare : actif, focus, badges IA |
| `--vynl-reflet` | `#90BFE9` | reflets, icônes secondaires |

Texte : blanc `#FFFFFF`, bleu-gris `#A9B4D6`, bleu-gris foncé `#6B77A6`.

Polices (Google Fonts) : **Dela Gothic One** pour la marque et les grands
titres d'impact (jamais sous 24 px), **Sora** pour tout le reste. Boutons en
pilule de 48 px, cartes à 16 px, icônes en trait de 1,75 px. Une seule lueur
forte par écran, animations de 200 à 300 ms. Seul dégradé sur du texte :
l'accent du titre du hero.

Logo : `assets/vynl-icon.png` (icône seule, 192 px) + le nom en Dela Gothic One,
assemblés en version horizontale dans l'en-tête et le pied de page. Favicon :
`favicon.png` et `apple-touch-icon.png`, générés depuis la même icône.

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
