# Brief — Appli de révision tech (React d'abord)

Document de référence du Projet « Révisions tech ». À lire avant toute proposition.

## Le problème à résoudre

J'ai raté un entretien sur des questions de **rappel** (« à quoi sert React.memo ? », « à quoi sert le return d'un useEffect ? ») : des choses que j'ai déjà pratiquées, mais après un an sans les utiliser, je n'arrivais plus à retrouver la réponse. Le but : pouvoir réviser toutes les notions d'une techno, sur la base de la doc officielle et des librairies les plus utilisées, et que ça reste en mémoire.

Principe retenu : **rappel actif + répétition espacée**. Pas de QCM comme format principal : il entraîne la reconnaissance, alors qu'en entretien il faut produire la réponse de zéro, à l'oral.

## Décisions prises

- **Modes** : révision du jour (cartes + répétition espacée), mode entretien, défis de code. Pas de QCM pour l'instant.
- **Correction** : auto-évaluation au quotidien (raté / difficile / bon / facile) ; Claude corrige en mode entretien.
- **Support** : téléphone et ordinateur, progression synchronisée.
- **Langue des cartes** : explications en français, termes techniques en anglais (cleanup, re-render, deps…).
- **Livrable** : un artefact publié (page web), avec les capacités `db` (progression côté serveur, privée), `user` (identifiant) et `sample` (correction par Claude).
- **Source de vérité** : le dossier local `App Revisions` (code de l'appli + decks). L'artefact est publié à partir de ce dossier.
- **Ordre de travail** (décidé le 30/09/2026) : le contenu d'abord, l'outil ensuite. Le deck React v1 est utilisable dès le premier jour sans appli, via « interroge-moi » dans le chat du Projet, qui tient lieu de mode entretien avec correction.
- **Périmètre du MVP** : uniquement l'écran « Aujourd'hui » + « Signaler une carte ». Mode entretien dans l'appli et écran Progression : plus tard, une fois que je révise régulièrement. La progression est stockée dès le premier jour, donc rien n'est perdu.
- **Maquette** : au plus une esquisse rapide de l'écran « Aujourd'hui ».

## Architecture

Le contenu est séparé du moteur. Ajouter une techno = ajouter un fichier de deck et une ligne dans l'index, sans toucher au code.

- **Index des decks** : `public/decks/index.json` liste les fichiers de deck. L'UI le lit pour savoir quels decks charger : rien n'est codé en dur.
- **Decks** : un fichier JSON par techno (`public/decks/react.json`, `public/decks/tanstack-query.json`…), copié tel quel dans le build et publié avec la page. Un test fait passer chaque deck listé dans le même parseur que l'appli.
- **Moteur de répétition espacée** : FSRS via la librairie `ts-fsrs` (dépendance npm bundlée par Vite, à installer au MVP) ; à défaut, un SM-2 simplifié maison. Il ne sait rien de React.
- **Progression** : par carte, stockée dans `db` (échéance, stabilité, difficulté FSRS, révisions, oublis), clé = `id` de la carte.
- **UI** : ne dépend que du format des cartes.

### Ports du domaine

Le domaine (quelles cartes sortent aujourd'hui, limite de nouvelles cartes par jour, application d'une note) ne dépend ni de `db`, ni de `sample`, ni de `ts-fsrs`. Ces dépendances passent par des ports, parce que le brief prévoit déjà des solutions de repli pour chacune : ce sont des adaptateurs interchangeables, et le domaine se teste sans le runtime de l'artefact.

- `Scheduler` : calcule la prochaine échéance à partir d'une note. Adaptateurs : FSRS (`ts-fsrs`), SM-2 maison.
- `ProgressRepository` : lit et écrit l'état de révision par carte. Adaptateurs : `db`, mémoire (tests / dev).
- `DeckSource` : charge l'index et les decks (JSON publiés avec la page).
- `AnswerGrader` (quand le mode entretien arrivera dans l'appli) : corrige une réponse. Adaptateurs : Claude via `sample`, checklist des `keyPoints`.

### Format des decks

Types du domaine : `src/domain/deck.ts`. Parseur des fichiers : `src/infrastructure/deck-file/`.

```ts
// public/decks/index.json
type DeckIndexFile = {
  deckFiles: string[];    // ex. ["react.json"] — le fichier doit s'appeler <id du deck>.json
};

// public/decks/<id>.json
type Deck = {
  id: string;             // "react"
  title: string;          // "React"
  version: string;        // version de la techno couverte, ex. "19.2"
  modules: { id: string; title: string }[];  // déclarés ici, dans l'ordre d'affichage
  cards: Card[];          // l'ordre du tableau = ordre d'introduction des nouvelles cartes (classiques d'entretien en tête)
};

type Card = {
  id: string;             // stable, préfixé par l'id du deck, ex. "react.useEffect.cleanup" — clé de progression, ne jamais le changer
  moduleId: string;       // référence un module déclaré dans le deck
  kind: "recall" | "code" | "compare";
  question: string;
  code?: string;          // obligatoire si kind = "code" (union discriminée côté domaine)
  answer: string;         // réponse courte, 2 à 4 phrases, dicible à l'oral
  details?: string;       // pour creuser
  keyPoints: string[];    // checklist d'auto-évaluation + grille de correction pour Claude
  pitfalls?: string[];
  source: { title: string; url: string };  // page de doc d'origine
  since?: string;         // ex. "React 19"
  deprecated?: { since: string; replacement?: string };  // API dépréciée ou annoncée comme telle
  difficulty: 1 | 2 | 3;
};
```

Règle de contenu : les cartes sont écrites **à partir des vraies pages de doc** (lues au moment de la rédaction), pas de mémoire, et chacune cite sa source. Doc à jour : React 19.3 (sortie le 9 septembre 2026) et React Compiler 1.0.

### Outillage

- Vite 8, Vitest 5, TypeScript 7 (strict, `noUncheckedIndexedAccess`). Vite+ écarté pour l'instant (1.0 sortie le 28/09/2026, installe un CLI global qui gère aussi Node et le gestionnaire de paquets) ; migration possible plus tard.
- Git dans le dossier, commits locaux autorisés pour Claude, jamais de push.
- `node_modules` du dossier = celui de Windows (`npm install` côté Windows). Claude installe et lance les tests dans une copie Linux séparée, pour ne pas mélanger les binaires des deux plateformes.

## Les écrans

1. **Aujourd'hui** (MVP) : cartes à réviser + quelques nouvelles (10 max par jour, réglable), ~15 min. Question → je réponds à voix haute → je révèle → j'évalue.
2. **Signaler une carte** (MVP) : fausse ou floue, stocké côté serveur pour que Claude la corrige ensuite.
3. **Mode entretien** (après le MVP) : questions au hasard parmi les cartes déjà vues, chrono de 60 s, réponse à l'oral, puis je tape ou dicte (dictée du clavier du téléphone) l'essentiel. Claude corrige avec les `keyPoints` : points couverts, points manqués, et une réponse modèle de 30 s. Sans Claude : checklist des points clés à cocher. En attendant : « interroge-moi » dans le chat.
4. **Progression** (après le MVP) : taux de rétention par module, liste des points faibles à retravailler.

## Programme React (deck 1)

Estimation : 150 à 200 cartes au total. **Deck v1 : ~60 cartes, les classiques d'entretien en priorité.**

- **Fondamentaux** : JSX, composants purs, props, rendu conditionnel, listes et `key`.
- **État** : `useState` (snapshot, batching, updater function), structure de l'état, lifting state up, préserver / réinitialiser l'état (reset par `key`), `useReducer`, Context.
- **Effets & refs** : `useRef`, `useEffect` (deps, **cleanup**, StrictMode), « You might not need an effect », `useLayoutEffect`, `useEffectEvent`, custom hooks.
- **Performance** : rendu et réconciliation, **`React.memo`**, `useMemo` / `useCallback`, **React Compiler** (et ses bail-outs), `lazy` + Suspense, `useTransition` / `useDeferredValue`, Profiler.
- **React 19** : Actions, `useActionState`, `useFormStatus`, `useOptimistic`, `use()`, ref as a prop, `<Activity>`, metadata ; 19.3 : `<ViewTransition>` et `addTransitionType`, Fragment Refs.
- **Server** : Server Components, `'use client'` / `'use server'`, hydration ; 19.3 : `use(browser())` pour sortir du server rendering, `<Context>` rendu directement dans un Server Component.
- **Patterns** : composition et `children`, contrôlé vs non contrôlé, error boundaries, portals.
- **Tests** : principes de Testing Library.

Decks suivants : TanStack Query (query keys, `staleTime` vs `gcTime`, invalidation, mutations, optimistic updates, infinite queries, Suspense), puis TanStack Router, Table, Form, puis React Hook Form, Zod, Zustand. Ensuite d'autres technos (Vue, TypeScript, NestJS…).

## Garde-fou

L'appli est un moyen, pas le but : sortir le MVP en une ou deux sessions, puis enrichir les decks au fil de l'eau, plutôt que de peaufiner l'outil au lieu de réviser.

## Prochaines étapes

1. Deck React v1 (~60 cartes) dans `public/decks/react.json`, révisable tout de suite via « interroge-moi ». Fait : module Effets & refs (12 cartes, 01/10/2026).
2. MVP : moteur + écran « Aujourd'hui » + « Signaler une carte », publié en artefact.
3. Compléter React, puis TanStack Query. Mode entretien et Progression dans l'appli quand je révise régulièrement.
