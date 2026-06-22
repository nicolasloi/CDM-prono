# CDM Prono ⚽️🏆

Le classement **Coupe du Monde 2026** de l'équipe **Marvelous Digital**, en plus beau.
Site statique qui scrape le jeu de pronostics [RTS](https://pronostics.rts.ch/) et l'affiche avec des stats, des courbes et les pronos de chacun.

**→ En ligne : https://nicolasloi.github.io/CDM-prono/**

---

## Ce qu'on y trouve

- **Classement** live (podium, points, sparklines, couleur signature par joueur).
- **« C'est moi »** : marque ton nom → ta ligne et ta courbe sont mises en avant (mémorisé sur ton appareil).
- **Évolution des places** : un *bump chart* montrant qui était à quelle place, jour par jour.
- **Fiche joueur** (clic sur un nom) : tous ses pronos match par match + ses stats (exacts, % de réussite).
- **Matchs** : tous les matchs récents avec **qui a misé quoi**, badge « en cours » dès le coup d'envoi, 👑 sur le meilleur prono.
- **Prochain match + compte à rebours** et **joueur en forme** (gain sur 24h).
- **Installable** sur mobile (PWA) : icône sur l'écran d'accueil, plein écran, hors-ligne.

## Comment ça marche

Aucune base de données, aucun serveur, aucun identifiant — tout est **public et gratuit**.

```
GitHub Actions (cron)
  └─ scripts/scrape.mjs
       ├─ classement : fetch du HTML public de la communauté RTS
       ├─ pronos par joueur : Playwright (rendus en JS) sur les profils publics
       └─ écrit data/*.json  (seulement si quelque chose a changé)
  └─ commit (cdm-bot) → build Astro → déploiement GitHub Pages
```

- Les pronos d'un joueur ne sont publics qu'**au coup d'envoi** ; on **accumule** l'historique au fil des relevés.
- Rafraîchissement : **toutes les 5 min pendant les matchs** (18h–09h), **toutes les heures** sinon.
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
| `snapshots/` | relevés immuables du classement |

---

*Site non officiel, fait par et pour l'équipe. Données issues du jeu de pronostics RTS.*
