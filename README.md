# Home Gym Studio

Un petit studio 3D pour dessiner sa salle de sport à la maison (garage, sous-sol, chambre d'amis…), directement dans le navigateur, sans installation.

## Ce qu'on peut faire

- **4 vues** : plan coté vu de dessus, vue isométrique (pivotable de 90°), 3D libre, et **visite à la première personne** (ZQSD / flèches, joystick sur mobile).
- **La pièce** : largeur, profondeur et hauteur sous plafond réglables au centimètre.
- **Les murs** : un revêtement par mur (peinture, brique, brique peinte, béton banché, lambris, OSB, carrelage métro, bac acier, mousse acoustique) avec une teinte au choix. Un clic sur un mur dans la vue ouvre ses réglages.
- **Le sol** : dalles caoutchouc, puzzle EVA, résine époxy, béton lissé, parquet, gazon synthétique.
- **Les ouvertures** : porte de garage sectionnelle (qui s'ouvre vraiment, panneaux et rails compris), porte battante, fenêtre. On les fait glisser le long du mur.
- **22 équipements** : power rack, rack mural repliable, banc, poulie vis-à-vis, presse à cuisses, plateforme, haltères, kettlebells, arbre à disques, tapis de course, rameur, air bike, sac de frappe, piste gazon + traîneau, box, miroir (qui reflète vraiment en visite), écran, étagère, frigo, ventilateur, plante…
  Chaque équipement a ses dimensions modifiables, sa couleur et une rotation.
- **Les cotes** : dimensions de la pièce, des ouvertures et de l'équipement sélectionné, plus les distances aux murs. **Clique sur une cote jaune pour taper la valeur** : la pièce ou la machine s'ajuste.
- **Les contrôles** : chevauchements, espace d'usage (2 m derrière un tapis de course, par exemple), hauteur sous plafond pour les tractions et le développé militaire, gêne du rail de la porte de garage, débattement de la porte.
- **Ambiances** : jour, néons, soirée RGB.
- **Budget indicatif**, capture d'image, sauvegarde automatique dans le navigateur, export / import du projet.

## Lancer le site

C'est un site statique (HTML, CSS, JavaScript + [three.js](https://threejs.org) chargé depuis un CDN).

- En local : `npx serve .` puis ouvrir l'adresse affichée.
- En ligne avec GitHub Pages : *Settings → Pages → Deploy from a branch → `main` / `(root)`*.

## Raccourcis

| Touche | Action |
| --- | --- |
| 1 2 3 4 | Plan, Iso, 3D, Visite |
| R / Maj+R | Tourner l'élément de 90° / 15° |
| Flèches | Déplacer l'élément de 1 cm (Maj : 10 cm) |
| Alt + glisser | Déplacer sans aimant |
| Ctrl+D | Dupliquer |
| Suppr | Supprimer |
| Ctrl+Z / Ctrl+Y | Annuler / rétablir |
| O | Ouvrir / fermer la porte la plus proche |
