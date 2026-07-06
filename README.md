# CDM Prono ⚽️🏆

Le classement **Coupe du Monde 2026** de l'équipe **Marvelous Digital**, en plus beau.
Site statique qui scrape le jeu de pronostics [RTS](https://pronostics.rts.ch/) et l'affiche avec des stats, des courbes et les pronos de chacun.

**→ En ligne : https://nicolasloi.github.io/CDM-prono/**

---

## Ce qu'on y trouve

- **Classement** live (podium, points, sparklines, couleur signature par joueur).
- **« C'est moi »** : marque ton nom → ta ligne et ta courbe sont mises en avant (mémorisé sur ton appareil).
- **Évolution des places** : un *bump chart* montrant qui était à quelle place, jour par jour.
- **Fiche joueur** (clic sur un nom) : tous ses pronos match par match + ses stats (exacts, % de réussite), plus ses **pronostics d'avant-tournoi** (champion, parcours de la Suisse, etc.) avec la valeur réelle en regard et un flag sur ceux déjà mathématiquement perdus.
- **Matchs** : tous les matchs récents avec **qui a misé quoi**, badge « en cours » dès le coup d'envoi, 👑 sur le meilleur prono, onglet **« À venir »** qui couvre toute la phase finale restante (8es → finale), même les tours dont les équipes ne sont pas encore connues.
- **Tableau** : bracket interactif des 16es à la finale façon BBC — vainqueurs qui avancent automatiquement dans la case suivante, tirs au but pris en compte, dates officielles.
- **Prochain match + compte à rebours** et **joueur en forme** (gain sur 24h).
- **Installable** sur mobile (PWA) : icône sur l'écran d'accueil, plein écran, hors-ligne.

## Comment ça marche

Aucune base de données, aucun serveur, aucun identifiant — tout est **public et gratuit**.

```
Ping externe (cron-job.org, ~10 min) ─┐
GitHub Actions workflow_dispatch  ←────┘   (filet de secours natif : 1×/heure)
  └─ scripts/scrape.mjs
       ├─ classement : fetch du HTML public de la communauté RTS
       ├─ pronos par joueur : Playwright (rendus en JS) sur les profils publics
       ├─ pronostics d'avant-tournoi : idem, une seule fois par joueur (figés après le 11 juin)
       └─ écrit data/*.json  (seulement si quelque chose a changé)
  └─ commit (cdm-bot) → build Astro → déploiement GitHub Pages (avec re-essais automatiques)
```

- Les pronos d'un joueur ne sont publics qu'**au coup d'envoi** ; on **accumule** l'historique au fil des relevés.
- Rafraîchissement : le cron natif GitHub (`schedule:`) s'étant montré peu fiable pour un rythme soutenu (retards de 30 min à plus d'1h, voire passages sautés), le déclenchement se fait via un **ping externe gratuit toutes les ~10 min** (appel à l'API `workflow_dispatch`, qui n'est pas soumis à ce bridage) ; un filet de secours natif tourne en plus, 1×/heure.
- Le déploiement GitHub Pages réessaie automatiquement (jusqu'à 3 fois) en cas de panne transitoire côté GitHub.
- Le bot **s'arrête tout seul** après la finale (cf. `scripts/lib/season.mjs`).

## Stack

[Astro](https://astro.build/) (sortie statique) · pnpm · graphes **SVG faits main** · [Playwright](https://playwright.dev/) pour le scraping · tests `node:test` · GitHub Actions + GitHub Pages.

## Développement

```bash
pnpm install
pnpm approve-builds        # une fois : autorise esbuild + sharp
pnpm exec playwright install chromium   # pour lancer le scraper en local

pnpm dev                   # serveur local
pnpm test                  # tests unitaires (parsing, agrégation, scoring…)
pnpm run build             # build de production
node scripts/scrape.mjs    # lance un scrape réel (écrit data/)
```

## Données (`data/`)

| Fichier | Contenu |
|---|---|
| `latest.json` | classement courant (rang, points, deltas) |
| `timeseries.json` | historique points/position par joueur (pour les courbes) |
| `predictions.json` | pronos par joueur, match par match |
| `matches.json` | pivot par match : qui a misé quoi |
| `fixtures.json` | prochains matchs (calendrier) |
| `pretournament.json` | pronostics d'avant-tournoi (5 questions bonus) + valeurs réelles à jour |
| `snapshots/` | relevés immuables du classement |

---

*Site non officiel, fait par et pour l'équipe. Données issues du jeu de pronostics RTS.*
