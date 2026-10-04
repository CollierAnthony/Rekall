# Rekall

Appli de révision tech par répétition espacée (FSRS), pour retrouver ses réflexes en entretien.
React 19 + TypeScript, publiée comme artefact claude.ai.

- **Architecture** : [`docs/architecture.html`](docs/architecture.html) (à ouvrir dans un navigateur), aussi publiée en [artefact](https://claude.ai/artifact/LpPRoJKnYuNGF9hVdP48C9).
- **Décisions, format des cartes, programme** : [`brief-revisions-tech.md`](brief-revisions-tech.md).

## Lancer

Node 22 (développé avec 22.23).

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # Vitest
npm run typecheck    # tsc --noEmit
npm run build:artifact   # build + page unique dans artifact/ pour la publication
```

En local, l'appli n'a pas le runtime de l'artefact : la progression va dans `localStorage`
(« sur cet appareil ») et l'entretien se corrige avec la grille des points clés au lieu de Claude.
C'est `src/composition-root.ts` qui fait ce choix au démarrage.

## Structure

```
src/
  domain/           règles pures : file du jour, statut d'une carte, recherche, entretien
  application/      cas d'usage (TodayReview, InterviewPractice) + ports/ (interfaces)
  infrastructure/   adaptateurs : FSRS, base de l'artefact, localStorage, decks JSON, correcteur Claude
  ui/               React : shell (onglets, navigation), today, library, interview, home
  composition-root.ts   seul fichier qui connaît tout : choisit les adaptateurs, crée les cas d'usage
public/decks/       contenu : un JSON par techno + index.json (ordre d'introduction)
scripts/            build-artifact-page.mjs (assemble la page publiée)
```

Règle de dépendance : `domain` n'importe que `domain` ; `application` ne connaît que le domaine et ses ports ;
seul `composition-root.ts` importe l'infrastructure.

## Ajouter un deck

1. Écrire `public/decks/<techno>.json` (même format que `react.json`, validé par Zod au chargement).
2. L'ajouter dans `public/decks/index.json` : l'ordre du tableau est l'ordre d'introduction des nouvelles cartes.

Aucun code à toucher. Ne jamais changer l'`id` d'une carte existante : c'est la clé de la progression.
