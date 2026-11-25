# Home Gym Studio

Un studio 3D pour dessiner sa salle de sport à la maison (garage, sous-sol, chambre d'amis…), directement dans le navigateur, sans installation.

## Ce qu'on peut faire

- **5 vues** : plan coté, isométrique (pivotable), 3D libre, **visite à la première personne** (ZQSD / flèches, joystick sur mobile) et **vue de face** de chaque mur avec les hauteurs.
- **La pièce** : dimensions au centimètre, sol posé sur dalle béton ou sur plancher (contrôle du poids au m²).
- **Les murs** : un revêtement par mur (peinture, enduit, brique, béton banché, béton ciré, lambris, bardage bois clair, OSB, carrelage métro, bac acier, mousse acoustique), sticker ou logo personnalisable.
- **Les ouvertures** : porte de garage sectionnelle qui s'ouvre vraiment, porte battante, fenêtre.
- **Le matériel Atletica aux cotes du fabricant** : R8 Drift (à disques ou PRO), R8 Bradley (court, moyen, long), R8 Duality, R7 Cage (204 ou 224 cm), station Harrier (d'angle, avec aimant d'angle), banc Predator + EVO Arm, barre Delta, barre EZ, set bumper 110 kg, haltères L1 Olympia. Options montables (barres à dips, landmine), pièces mobiles animées à la sélection, barre qui se pose seule sur les J-hooks.
- **Plus de 40 équipements** au total, plus un **équipement personnalisé** (nom, dimensions, prix, lien).
- **Silhouettes** pour tester les mouvements sous le plafond : debout, développé militaire, traction, soulevé de terre.
- **Électricité et confort** : prises, luminaires, aérateur, radiateur, déshumidificateur.
- **Les contrôles** : chevauchements, espaces d'usage, hauteur sous plafond (tractions, développé militaire), rail de la porte de garage, débattement des portes, place pour charger les disques, prise à moins de 1,5 m des appareils, aération, passage de 80 cm depuis les portes, poids au m² sur plancher.
- **La liste d'achats** : prix, lien vers chaque fiche, case « déjà acheté », reste à acheter, export CSV ; **l'inventaire des disques** et la charge maximale sur la barre.
- **La séance** : exercices possibles par machine, à ajouter à une séance (séries, répétitions, charge).
- **Le projet** : versions à comparer, lien de lecture à partager, plan à imprimer, export / import, capture d'image.

## Lancer le site

Site statique : HTML, CSS et modules JavaScript, avec [three.js](https://threejs.org) 0.160 embarqué dans `vendor/` (aucun CDN).

- En local : `npx serve .` puis ouvrir l'adresse affichée.
- En ligne : *Settings → Pages → Deploy from a branch → `main` / `(root)`*, puis https://warryks.github.io/Homegym/

## Développement

```
npm install
npm test          # test de fumée : chaque équipement du catalogue, toutes les vues, le lien de partage
npm run build     # page autonome unique dans dist/home-gym-studio.html
```

| Fichier | Rôle |
| --- | --- |
| `src/app.js` | Application : scène, vues, interactions, contrôles, panneaux |
| `src/catalog.js` | Catalogue : dimensions, prix, poids, variantes, options, exercices |
| `src/models/atletica.js` | Modèles 3D Atletica |
| `src/models/generic.js` | Modèles 3D génériques |
| `src/models/extras.js` | Silhouettes, électricité, confort, sticker, équipement personnalisé |
| `src/kit.js` | Matériaux et briques de modélisation |
| `src/textures.js` | Textures procédurales des murs et des sols |
| `tools/build.mjs` | Assemblage en un seul fichier HTML |
| `tests/smoke.mjs` | Test de fumée (Playwright) |

## Raccourcis

| Touche | Action |
| --- | --- |
| 1 2 3 4 5 | Plan, Iso, 3D, Visite, Face |
| R / Maj+R | Tourner l'élément de 90° / 15° |
| Flèches | Déplacer l'élément de 1 cm (Maj : 10 cm) |
| Alt + glisser | Déplacer sans aimant |
| Ctrl+D | Dupliquer |
| Suppr | Supprimer |
| Ctrl+Z / Ctrl+Y | Annuler / rétablir |
| O | Ouvrir / fermer la porte la plus proche |
