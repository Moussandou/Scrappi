# SCRAPPI
## Cahier des Charges Fonctionnel & Design — V1

---

# 1. Vision Produit

SCRAPPI est une application web de scrapbook multimédia permettant aux utilisateurs de créer un espace visuel libre pour organiser :
- images
- vidéos
- textes
- dessins
- stickers

L’objectif est de proposer un classeur visuel infini, personnalisable et intuitif, sans les limitations des outils existants (stockage limité, peu de liberté créative, abonnements coûteux).

SCRAPPI doit donner l’impression d’un carnet créatif vivant et manipulable.

---

# 2. Objectifs

Créer une application :
- visuelle et immersive
- fluide et intuitive
- sans friction
- sans limite créative
- utilisable comme espace personnel

Le produit doit permettre de capturer et organiser des souvenirs, inspirations et contenus multimédia librement.

---

# 3. Cible Utilisateur

- créatifs
- étudiants
- artistes
- personnes voulant organiser souvenirs/inspirations
- utilisateurs Pinterest / Notion / galerie photo insatisfaits

---

# 4. Problèmes à résoudre

Applications actuelles :
- stockage limité
- peu personnalisables
- rigides
- organisation peu visuelle
- placement contraint

SCRAPPI doit offrir :
- liberté totale de placement
- canvas libre
- personnalisation forte
- stockage confortable

---

# 5. Fonctionnalités principales

## 5.1 Système de classeurs

Utilisateur peut créer :
- classeurs
- pages
- espaces visuels

Chaque classeur possède :
- couverture personnalisée
- titre
- description

---

## 5.2 Canvas infini

Fonction cœur du produit.

Fonctionnalités :
- zoom
- déplacement libre
- placement libre d’éléments
- grille invisible
- navigation fluide

Le canvas doit donner une sensation physique de manipulation.

---

## 5.3 Ajout de médias

Utilisateur peut ajouter :

Images :
- upload
- redimensionnement
- rotation
- position libre

Vidéos :
- upload ou lien
- lecture intégrée
- redimensionnement

Texte :
- zones texte libres
- styles variés
- rotation

Stickers :
- bibliothèque stickers
- ajout libre
- redimensionnement

Dessin libre (optionnel V1.1)

---

## 5.4 Manipulation éléments

Chaque élément peut :
- être déplacé
- être redimensionné
- être tourné
- passer devant/derrière
- être supprimé

Interactions fluides obligatoires.

---

## 5.5 Organisation

Navigation :
- bibliothèque de classeurs
- pages multiples
- mini-map canvas (optionnel)

---

# 6. Expérience utilisateur

SCRAPPI doit :
- être intuitif immédiatement
- fonctionner sans tutoriel complexe
- donner plaisir à manipuler
- rester fluide même chargé

Pas de surcharge UI.
Pas d’options inutiles.

---

# 7. Direction artistique

Ambiance :
- carnet créatif
- scrapbook moderne
- collage visuel

Palette :
- tons chauds
- fond clair doux
- mode sombre possible

Éléments visuels :
- ombres douces
- effets papier
- profondeur légère
- micro animations naturelles

---

## Stitch Instructions

Get the images and code for the following Stitch project's screens:

## Project
Title: Infinite Creative Canvas
ID: 10675117144020122266

## Screens:
1. Scrapbook Library Overview
    ID: 03128fa29ed248419017e714bafb21c1

2. Infinite Creative Canvas
    ID: 256ae6794edf484fb103bbf232b6b9db

3. Scrapbook Library Overview
    ID: d7d7d5b3dee64781b3089bde2ba6e025

4. Vintage Sticker Selector Tray
    ID: a802d8cbae1c46fb9f1934e433577a4e

5. Vintage Sticker Selector Tray
    ID: 775f7e186ebb42d2bbb345a40381eb85

6. Vintage Sticker Selector Tray
    ID: ea2d7d1314e64210b7024355323b72ac

Use a utility like `curl -L` to download the hosted URLs.

# 8. Architecture technique

Frontend :
- Next.js
- Canvas HTML / Konva / Fabric.js
- Tailwind

Backend :
- Supabase ou Node backend

Stockage :
- images
- vidéos
- projets utilisateurs

---

# 9. Contraintes techniques

- fluidité canvas essentielle
- drag & drop performant
- zoom fluide
- sauvegarde auto
- responsive desktop/mobile

---

# 10. MVP V1

Inclus :
- création classeur
- canvas
- ajout images
- ajout texte
- déplacement libre
- resize
- sauvegarde

Exclus V1 :
- collaboration
- social
- marketplace stickers
- export avancé

---

# 11. Roadmap

Phase 1 : base canvas
Phase 2 : médias
Phase 3 : polish UX
Phase 4 : optimisation perf

---

# 12. Critères de réussite

- expérience fluide
- sensation de liberté
- utilisation intuitive
- aucune frustration de placement
- visuellement satisfaisant

---

FIN DU DOCUMENT

