# Chronomètre Stylé V2

Une application web de chronomètre améliorée, simple et stylée avec gestion des temps intermédiaires nommables, tri, drag & drop, sauvegarde locale, thèmes et exportation en PDF/CSV/JSON.

## Fonctionnalités

*   Démarrer, mettre en pause, et arrêter le chronomètre.
*   Enregistrer des temps intermédiaires ("Temps") sans arrêter le chrono principal.
*   **Nommer chaque temps enregistré** (ex: pour des élèves).
*   Afficher les temps intermédiaires.
*   **Supprimer des temps intermédiaires individuellement.**
*   Trier les temps intermédiaires par ordre croissant ou décroissant.
*   Glisser-déposer (drag & drop) un temps intermédiaire vers une autre application (copie le nom et le temps).
*   Remettre à zéro le chronomètre et les temps enregistrés.
*   **Sauvegarder les temps intermédiaires en format PDF, CSV ou JSON.**
*   **Thème clair et thème sombre** avec sauvegarde de la préférence.
*   **Sauvegarde automatique de l'état** (chrono, temps, thème) dans le navigateur (`localStorage`).
*   Option pour effacer les données sauvegardées.
*   Interface utilisateur épurée et moderne avec animations subtiles.
*   Améliorations d'accessibilité (aria-labels).

## Comment l'utiliser

1.  Clonez ce dépôt ou téléchargez le ZIP.
2.  Décompressez le ZIP si nécessaire.
3.  Ouvrez `index.html` dans votre navigateur web.

## Technologies Utilisées

*   HTML5
*   CSS3 (avec variables pour thèmes)
*   JavaScript (ES6+)
*   [jsPDF](https://github.com/parallax/jsPDF) pour la génération de PDF (via CDN).
*   `localStorage` pour la persistance des données.

## Icônes

Les icônes SVG proviennent de diverses sources ou sont des créations simples.

## Aperçu (Conceptuel)

*   **État initial :** Affiche "00:00:00.000" et un bouton "Play". Thème par défaut (ou sauvegardé).
*   **Chrono en marche :** Affiche le temps qui défile. Les boutons "Pause", "Enregistrer Temps", "Stop" apparaissent.
*   **Pause :** Le chrono s'arrête, affichage du temps change de style. Le bouton "Pause" devient "Reprendre".
*   **Enregistrer Temps :** Enregistre le temps actuel dans une liste. Le dernier temps est surligné.
*   **Liste des Temps :** Chaque temps affiche son nom (éditable au clic) et sa valeur. Un bouton permet de le supprimer.
*   **Stop :** Le chrono s'arrête. Les boutons "Pause", "Enregistrer Temps", "Stop" sont remplacés par "Réinitialiser" et "Sauvegarder".