# Brief — Rekall, appli d'apprentissage tech personnelle

Document de référence du Projet « Révisions tech ». À lire avant toute proposition.

## Vision (01/10/2026)

Rekall ne sert pas qu'à réviser des cartes : c'est une **application complète d'apprentissage, pour mon usage personnel**. J'ai plusieurs heures par jour à y consacrer dans les jours qui viennent ; les 15 minutes de cartes quotidiennes ne suffisent pas. Pas d'entretien prévu pour l'instant.

Deux axes, séparés :
- **Catégories** (React, JavaScript, TypeScript, Node, NestJS, Next.js, tests, architecture, entretiens…) : du **contenu**. On en ajoute librement, sans toucher au code, via l'index du contenu.
- **Types de contenu** : du **code**, écrit une fois, qui sert toutes les catégories.
  - **Cartes** : répétition espacée (existant).
  - **Bibliothèque** : parcourir et chercher toutes les cartes par catégorie, sans attendre qu'elles sortent en révision.
  - **Pratique** : exercices et mini-projets réalistes (inspirés de mes projets pro, logistique et transport), avec un énoncé, les cartes liées, un statut, mes notes et une code review par Claude. Les projets restent privés (pas de GitHub public nécessaire).
  - **Guides** : un concept complet expliqué d'un bloc, avec des vérifications en cours de route.
  - **Entretien** : existant.
  - **Progression** : plus tard.
- **Navigation** : barre en bas sur téléphone (Aujourd'hui, Bibliothèque, Pratique, Guides).
- **Ordre** :
  - UX/UI : refonte en cours, maquettée avec Claude Design (« quelque chose de beau qui tienne la route »), puis implémentée.
  - Contenu : deck JavaScript, puis TypeScript, puis Node.
  - Sections : Bibliothèque, puis Pratique et Guides.

## Le problème à résoudre

J'ai raté un entretien sur des questions de **rappel** (« à quoi sert React.memo ? », « à quoi sert le return d'un useEffect ? ») : des choses que j'ai déjà pratiquées, mais après un an sans les utiliser, je n'arrivais plus à retrouver la réponse. Le but : pouvoir réviser toutes les notions d'une techno, sur la base de la doc officielle et des librairies les plus utilisées, et que ça reste en mémoire.

Principe retenu : **rappel actif + répétition espacée**. Pas de QCM comme format principal : il entraîne la reconnaissance, alors qu'en entretien il faut produire la réponse de zéro, à l'oral.

## Décisions prises

- **Modes** : révision du jour (cartes + répétition espacée), mode entretien, puis Bibliothèque, Pratique et Guides (voir Vision). Pas de QCM pour l'instant.
- **Correction** : auto-évaluation au quotidien (raté / difficile / bon / facile) ; Claude corrige en mode entretien.
- **Support** : téléphone et ordinateur, progression synchronisée.
- **Langue des cartes** : explications en français, termes techniques en anglais (cleanup, re-render, deps…).
- **Livrable** : un artefact publié (page web), avec les capacités `db` (progression côté serveur, privée), `user` (identifiant) et `sample` (correction par Claude).
- **Source de vérité** : le dossier local `App Revisions` (code de l'appli + decks). L'artefact est publié à partir de ce dossier.
- **Ordre de travail** (décidé le 30/09/2026) : le contenu d'abord, l'outil ensuite. Le deck React v1 est utilisable dès le premier jour sans appli, via « interroge-moi » dans le chat du Projet, qui tient lieu de mode entretien avec correction.
- **Périmètre du MVP** : uniquement l'écran « Aujourd'hui » + « Signaler une carte ». Mode entretien dans l'appli et écran Progression : plus tard, une fois que je révise régulièrement. La progression est stockée dès le premier jour, donc rien n'est perdu.
- **Maquette** : V1 sans maquette (design utilitaire). Depuis le 01/10/2026, refonte maquettée dans Claude Design, validée avant implémentation.

## Architecture

Le contenu est séparé du moteur. Ajouter une techno = ajouter un fichier de deck et une ligne dans l'index, sans toucher au code.

- **Index des decks** : `public/decks/index.json` liste les fichiers de deck. L'UI le lit pour savoir quels decks charger : rien n'est codé en dur.
- **Decks** : un fichier JSON par techno (`public/decks/react.json`, `public/decks/tanstack-query.json`…), copié tel quel dans le build et publié avec la page. Un test fait passer chaque deck listé dans le même parseur que l'appli.
- **Moteur de répétition espacée** : FSRS via la librairie `ts-fsrs` (dépendance npm bundlée par Vite, à installer au MVP) ; à défaut, un SM-2 simplifié maison. Il ne sait rien de React.
- **Progression** : par carte, stockée dans `db` (échéance, stabilité, difficulté FSRS, révisions, oublis), clé = `id` de la carte. Chemin : `data/users/<id>/progress/cards/<cardId>` (privé par utilisateur ; `data/users/me/...` avec ArtifactData). L'état FSRS est opaque pour le domaine (`schedulerState`).
- **Signalements** : collection partagée `reports` (`cardId`, `reason` wrong | unclear | other, `comment`, `reportedAt`), lue par Claude pour corriger les cartes.
- **Sans base** (dev local, déconnecté) : mêmes données dans le localStorage, l'écran affiche « Sur cet appareil ».
- **Nouvelles cartes** : 15 par jour, deck par deck, puis par difficulté croissante et dans l'ordre du fichier.
- **Journée de révision** : commence à 4 h, heure locale (`REVIEW_DAY_START_HOUR`, comme Anki) ; une révision faite avant 4 h compte pour la veille. Au retour sur la page un autre jour de révision, la session se recharge.
- **Nom de l'appli** : Rekall (titre de la page et de l'icône d'écran d'accueil). Usage mobile : ouvrir le lien dans le navigateur connecté à claude.ai et l'ajouter à l'écran d'accueil ; l'appli mobile Claude ne liste pas ce type d'artefact (bug connu).
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
- React 19.3 pour l'UI (sans React Compiler pour l'instant), ts-fsrs 5 pour la répétition espacée.
- Publication : `npm run build:artifact` produit `artifact/index.html` (CSS et JS en ligne) et `artifact/decks/`, publiés sur l'artefact https://claude.ai/artifact/NB1xrVepkDfbXNsCdWVY8a (capacités `db`, `user` et `sample` ; republier en passant les trois si on redéclare les capacités). Republier sur cette URL pour garder la progression.
- Zod 4 valide les fichiers de deck, uniquement dans l'infrastructure (`src/infrastructure/deck-file/`) : le domaine n'en dépend pas.
- Git dans le dossier, commits locaux autorisés pour Claude, jamais de push. Claude peut ajouter une dépendance s'il la juge pertinente, en expliquant son rôle.
- `node_modules` du dossier = celui de Windows (`npm install` côté Windows). Claude installe et lance les tests dans une copie Linux séparée, pour ne pas mélanger les binaires des deux plateformes.

## Les écrans

1. **Aujourd'hui** (MVP) : cartes à réviser + quelques nouvelles (10 max par jour, réglable), ~15 min. Question → je réponds à voix haute → je révèle → j'évalue.
2. **Signaler une carte** (MVP) : fausse ou floue, stocké côté serveur pour que Claude la corrige ensuite.
3. **Mode entretien** (fait le 01/10/2026) : onglet caché qui apparaît à partir de 20 cartes vues (`INTERVIEW_UNLOCK_THRESHOLD`). 5 questions au hasard parmi les cartes déjà vues, chrono de 60 s, réponse à l'oral, puis je tape ou dicte (dictée du clavier du téléphone) l'essentiel. Claude corrige via la capacité `sample` (port `AnswerGrader`, adaptateur `ClaudeAnswerGrader`) : points couverts, points manqués, commentaire, réponse modèle de 30 s. Sans Claude : grille des points clés à cocher. N'a aucun effet sur la répétition espacée, rien n'est stocké.
4. **Progression** (après le MVP) : taux de rétention par module, liste des points faibles à retravailler.

### Refonte Studio (01/10/2026)

Maquette : artefact Design « Rekall — Refonte UX/UI », page Studio (directions A Bristol et B Nocturne écartées, gardées sur une page à part). Implémentée et publiée (version 6 de l'artefact).

- **Look** : grands chiffres, tuiles franches, Bricolage Grotesque (titres), Atkinson Hyperlegible Next (texte), JetBrains Mono (code). Accent bleu = révision, orange = entretien. Thème clair et sombre suivant le système.
- **Accueil** : session du jour (nombre de cartes, à revoir / nouvelles, Commencer ou Reprendre), tuile Entretien (verrouillée : progression vers les 20 cartes vues), Demain, Catégories (cartes vues par deck).
- **Mode focus** pour la session et l'entretien : pas de navigation, une croix pour sortir (Échap sur ordinateur), compteur et barre d'avancement. Notation fixée en bas de l'écran sur téléphone ; sur ordinateur, deux colonnes (réponse à gauche, points clés et notation à droite) et raccourcis Espace, 1 à 4, Échap.
- **Signalement** : feuille modale (`<dialog>` natif), depuis le drapeau de l'en-tête ou le lien en bas de la réponse.
- **Navigation basse** (Aujourd'hui, Bibliothèque, Pratique, Guides) : pas encore affichée ; elle apparaîtra avec la Bibliothèque, chaque onglet seulement quand sa section existe.
- À décider plus tard : une couleur par catégorie (champ `color` dans le deck), coloration syntaxique du code.

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

Decks suivants (décidé le 01/10/2026) : les bases avant les librairies annexes. **JavaScript** (source MDN), puis **TypeScript** (typescriptlang.org), puis **Node**. Ensuite NestJS, Next.js, tests, architecture ; TanStack, React Hook Form, Zod, Zustand passent après.

Plusieurs decks (en place depuis le 01/10/2026) :
- les nouvelles cartes sont introduites deck par deck (ordre de l'index, puis difficulté, puis ordre du fichier) : JavaScript commence quand React est entièrement vu ;
- la progression d'une carte qui n'existe plus n'est plus comptée (cartes vues, échéances de demain) ;
- quota : 15 nouvelles cartes par jour.

## Garde-fou

L'appli est un moyen, pas le but. Recalibré le 01/10/2026 avec la vision « appli complète » : chaque section sort **avec son contenu**, jamais comme une coquille vide, et je révise en parallèle de chaque chantier sur l'outil.

## V1 (01/10/2026)

Retours de la première utilisation, traités :
- **Terme « commit »** : conservé (vocabulaire officiel de React), défini entre parenthèses à sa première apparition dans chaque carte ; carte `react.rendering.renderAndCommit` en tête du deck (61 cartes).
- **Intervalles des boutons** : les étapes d'apprentissage FSRS (1 et 10 min) s'affichent « dans la session », la révision espacée « dans 8 j ».
- Progression de test remise à zéro ; V1 publiée (version 3 de l'artefact).

## Prochaines étapes

1. ~~Deck React v1 (~60 cartes)~~ Fait le 01/10/2026 : 60 cartes dans `public/decks/react.json` (Effets & refs 12, Performance 9, État 9, Fondamentaux 8, React 19 9, Patterns 5, Server 5, Tests 3), révisables via « interroge-moi ».
2. ~~MVP : moteur + écran « Aujourd'hui » + « Signaler une carte », publié en artefact.~~ Fait le 01/10/2026.
3. ~~Mode entretien dans l'appli.~~ Fait le 01/10/2026.
4. ~~Refonte UX/UI : maquette dans Claude Design, puis implémentation.~~ Faite le 01/10/2026 (voir Refonte Studio).
5. ~~Deck JavaScript~~ fait le 01/10/2026 : 60 cartes, 8 modules, sources MDN, ES2026. Puis deck TypeScript.
6. Section Bibliothèque (avec la navigation basse), puis Pratique et Guides.
