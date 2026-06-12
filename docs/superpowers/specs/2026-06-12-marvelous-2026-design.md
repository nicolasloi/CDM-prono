# Marvelous 2026 — Spec de conception

**Date :** 2026-06-12
**Auteur :** Nicolas L. + Claude
**Statut :** Validé (design) → en attente de relecture avant plan d'implémentation

---

## 1. Objectif

Un site web public, beau et autonome, qui affiche le **classement du groupe « Marvelous 🎰🏆⚽️ »** (communauté 484) du jeu de pronostics RTS pour la **Coupe du Monde FIFA 2026**, enrichi de statistiques et de data-viz, plus une page de **pronostics analysés par l'IA**.

Le lien est destiné à être **partagé à toute l'équipe** : l'affichage est **neutre** (centré sur personne en particulier).

### Critères de succès
- Le classement reflète fidèlement les données RTS, mis à jour automatiquement sans intervention.
- Le site fonctionne **toujours**, même si une fonctionnalité « bonus » (détails par match) n'est pas disponible.
- Le design est distinctif (identité CDM 2026), pas un template générique ni un « look IA ».
- Hébergement **gratuit** et **auto-géré** (zéro serveur, zéro maintenance manuelle récurrente).
- Lisible et agréable sur **mobile** (les collègues ouvriront sur téléphone).

---

## 2. Contexte & source de données

### Plateforme
- Jeu : **PRONOS Coupe du Monde FIFA 2026** sur `pronostics.rts.ch` (RTS / SRG SSR).
- Communauté cible : **484** → `https://pronostics.rts.ch/communities/484` (« Marvelous 🎰🏆⚽️ »).
- Membres connus (snapshot du 2026-06-12) : Vitor Pinto (18), Joao M (14), Mehdi M *admin* (11), Nicolas L (11), Cayan F (11), Thomas M (7), Mica P (6).

### Découvertes de faisabilité (vérifiées)
- La page communauté est **rendue côté serveur** : le classement (rang, nom, points totaux, points de groupe) est présent dans le HTML public → **scrapable sans login ni API** (`rankingItem` ×60 dans le HTML).
- La page affiche aussi : **classement des autres groupes** (Sebulba Lalas 19, 9vp1 19, Family Team 19, Jeunesse Bramoisienne 19, Batraciens 18…) et les **scores des experts RTS** (12 / 16 / 18 pts).
- Les **profils joueurs sont publics** : `https://pronostics.rts.ch/users/<id>` (ex. `9Nz1`) renvoie HTTP 200 sans connexion, avec points, rang global, groupes.
- **Contrainte clé** : *« Les pronostics pour les matchs à venir ne sont affichés que lorsque le compte à rebours est terminé. »* → les pronos individuels d'un membre n'apparaissent qu'**au coup d'envoi** de chaque match.

### Conséquences sur le périmètre
- **Fondations fiables (toujours dispo)** : classement membres, points totaux, points de groupe, rang, classement des autres groupes, scores experts.
- **Bonus (au fil du tournoi)** : pronos détaillés par membre et par match — récupérables uniquement après chaque coup d'envoi ; l'extraction exacte du HTML profil est à confirmer en implémentation. Le site ne doit **jamais** dépendre de ce bonus pour fonctionner.
- **Aucun login, aucun secret, aucun identifiant** n'est requis ou stocké.

---

## 3. Architecture & pipeline de données

```
GitHub Actions (cron)
  └─ scrape.mjs
       ├─ fetch HTML public (communauté + profils membres)
       ├─ parse → objet structuré
       ├─ écrit data/snapshots/<ISO>.json   (immuable, historique)
       ├─ recalcule data/latest.json        (état courant)
       └─ recalcule data/timeseries.json    (séries temporelles dérivées)
  └─ git commit + push des fichiers data/
        └─ déclenche le workflow de build Astro
              └─ build statique → déploiement GitHub Pages
```

### Modèle de données (esquisse)
- `snapshots/<ISO>.json` : `{ takenAt, members:[{id,name,rank,totalPoints,groupPoints,isAdmin}], otherGroups:[{name,points}], experts:[12,16,18] }`
- `latest.json` : dernier snapshot + deltas calculés (`movementSinceLast`, `momentum`).
- `timeseries.json` : par membre, série `[{takenAt, totalPoints, rank}]` pour les graphes.
- Les pronos IA vivent séparément en **Markdown** (voir §6), pas dans le pipeline scrapé.

### Pourquoi rebuild à chaque commit data
Astro produit un site statique ; à chaque commit de `data/`, le workflow rebuild + redéploie (quelques secondes). Pas de fetch client-side fragile : la donnée est figée au build, le site reste rapide et toujours en ligne.

### Robustesse
- Le scraper est **défensif** : si le HTML RTS change ou qu'un champ manque, il loggue et **n'écrase pas** `latest.json` avec des données vides (garde le dernier snapshot valide).
- Chaque snapshot est immuable → l'historique (et donc les courbes) ne peut pas être corrompu par un run raté.

---

## 4. Fréquence de rafraîchissement

Fenêtre suisse (CEST = UTC+2 ; la CDM 2026 se déroule entièrement en CEST).

- **Toutes les heures de 18h → 6h** (soirées de matchs).
- **Toutes les 3h de 6h → 18h**.

Crons GitHub Actions (UTC) :
- `0 16-23 * * *` + `0 0-4 * * *` → horaire, 18:00→06:00 CEST.
- `0 7,10,13 * * *` → toutes les 3h en journée (les bornes 04:00/16:00 UTC sont déjà couvertes).

> Caveat : les crons GitHub Actions sont en UTC et peuvent être **légèrement retardés** en cas de charge (pas de garantie à la minute). Acceptable ici.

Le scraper rafraîchit **classement + résultats**. Les pronos IA (§6) sont rédigés par Claude par lots ; mais comme les **résultats réels** sont scrapés, le statut ✓/✗ de chaque prono IA se met à jour automatiquement.

---

## 5. Pages & fonctionnalités

Mobile-first, en **français**. Lien **« Tableau officiel RTS »** visible dans le header et le footer (vers `communities/484`).

### Page 1 — Classement (accueil)
- **Podium top 3** : trophée SVG or, médailles, rubans tricolores animés en fond.
- Lignes (pills fluides) : rang · nom · **points totaux** · points de groupe · **mini-sparkline** d'évolution · **flèche ▲▼** (delta depuis le dernier snapshot).
- Ligne repère **« Experts RTS »** (12/16/18) intégrée pour situer qui bat les experts.
- Bouton discret **« c'est moi »** : surligne la ligne de l'utilisateur, mémorisé en `localStorage` (n'altère pas l'affichage pour les autres).
- Badge **« LIVE »** pendant les fenêtres de match + mentions « dernière MAJ » et « prochain refresh ».

### Page 2 — Le Mag (stats & data-viz)
- **Course en tête** : graphe animé de l'évolution des points de tous les membres (à partir de `timeseries.json`). Pièce maîtresse.
- **Bump chart** : évolution des rangs dans le temps.
- **Plus gros grimpeur / plus grosse chute**, momentum, séries (« n snapshots de suite en hausse »).
- **Head-to-head** : sélection de 2 membres, comparaison directe.
- **Marvelous vs autres groupes** (classement inter-communautés).
- **Badges fun** auto-attribués : « La Remontada », « Le Régulier », « Roi du week-end », etc.

### Page 3 — Pronos de l'IA *(nav : « Pronos IA » · titre « L'Oracle 🤖 »)*
> Nommage explicite : ce sont les pronostics de **l'IA (Claude)**, pas ceux des membres.
- Organisés **par journée** : J1 → J2 → J3 (groupes), puis 8es, quarts, demies, finale.
- Par match : **drapeaux**, **score prédit**, **jauge de confiance**, **courte analyse** (forme, historique, infos web).
- Après le match : **✓/✗ automatique** vs résultat réel + **précision cumulée**.
- **Joueur fantôme « Claude »** : calcul du score que rapporteraient les pronos IA, inséré à titre indicatif dans le classement → « si l'IA jouait, elle serait Xe ».
- **Bracket prédictif** pour les phases finales.

### Page 4 — Matchs (calendrier)
- Calendrier des matchs avec heures de coup d'envoi et le prono IA associé.
- **Bonus** (si extraction confirmée) : après le coup d'envoi, ce que **chaque membre Marvelous** a pronostiqué — « qui a osé le 3-0 ? ». Dégrade proprement si indisponible.

---

## 6. Système de pronostics IA

- **Contenu en Markdown**, un fichier par lot/journée (ex. `content/pronos/groupe-j1.md`), avec front-matter structuré par match (équipes, score prédit, confiance, analyse).
- Génération **par lots** : Claude rédige J1, puis J2, puis J3, puis chaque tour final, en ré-analysant avec la forme/les infos les plus récentes avant chaque round.
- **Recherche** : forme récente, historique des confrontations, actualités (blessures, compositions) via recherche web au moment de la rédaction de chaque lot.
- Le **scoring ✓/✗** et la **position du joueur fantôme** sont recalculés au build à partir des résultats réels scrapés (barème RTS à confirmer/reproduire en implémentation).

---

## 7. Identité visuelle — « Tri-Streak Noir » (verrouillée)

- Fond nuit `#0a0e1a`, accent or `#e8c66a`.
- **Rubans tricolores** 🇨🇦🇲🇽🇺🇸 (rouge `#e3342f` / vert `#00a85a` / bleu `#2b6fff`) animés en SVG, repris de l'identité officielle 2026.
- « **26** » en filigrane (numéro-emblème officiel).
- Lignes en **pills fluides** (rien de carré/rigide), typo géométrique sans-serif avec tension diagonale.
- Trophée SVG or, **micro-confettis** au changement de leader, **image OG** pour le partage.
- Inspirations officielles : système tricolore des 3 pays hôtes + or/noir/blanc, couleurs néon des villes hôtes en accents ponctuels.

---

## 8. Stack technique

- **Astro** (sortie statique pour GitHub Pages ; content collections Markdown pour les pronos IA ; îlots interactifs pour les graphes).
- **Graphes SVG faits main** (pas de lib de charts générique → look signature, pas de vibe IA). Canvas seulement si nécessaire pour une animation lourde.
- **Node** pour `scrape.mjs` (fetch + parsing HTML, ex. `cheerio` ou regex robustes).
- **GitHub Actions** : un workflow `scrape` (cron) + un workflow `deploy` (build Astro + Pages) déclenché sur push de `data/`.
- **GitHub Pages** : hébergement statique gratuit.

---

## 9. Déploiement & mise en place

- Repo **public** GitHub (minutes Actions illimitées, pas de secret requis).
- Étape manuelle unique de Nicolas : créer le repo sur son compte GitHub et pousser (Claude prépare tout le contenu/les workflows). Ensuite : 100% automatique.
- Activer GitHub Pages (source = workflow / branche de déploiement).

---

## 10. Hors périmètre (YAGNI)

- Aucun compte utilisateur, login, base de données serveur.
- Pas de saisie de pronostics sur notre site (on ne remplace pas RTS, on le sublime).
- Pas de notifications push / emails (peut être envisagé plus tard).
- Pas de multi-langue (FR uniquement pour l'instant).

---

## 11. Risques & questions ouvertes

- **Structure HTML RTS instable** : le scraping peut casser si RTS change son markup → scraper défensif + snapshots immuables atténuent l'impact.
- **Barème de points RTS** : à reproduire fidèlement pour le scoring du joueur fantôme IA (à confirmer en implémentation — combien de points pour score exact vs bon résultat).
- **Extraction des pronos par membre** : à confirmer (rendu SSR vs hydraté JS) ; traité comme bonus dégradable.
- **IDs des profils membres** : besoin de mapper chaque membre du groupe à son `user id` (ex. Vitor Pinto = `9Nz1`) — récupérables depuis les liens de la page communauté.
- **Compte GitHub de Nicolas** : à confirmer (création gratuite si besoin).
- **Identité du joueur courant** : le scrape montre « Nicolas L » ; à relier au bouton « c'est moi » (purement local).
