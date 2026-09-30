export type CardDifficulty = 1 | 2 | 3;

export type CardSource = {
  readonly title: string;
  readonly url: string;
};

export type Deprecation = {
  readonly since: string;
  readonly replacement?: string;
};

type CardCommonFields = {
  /** Stable : sert de clé à la progression. Préfixé par l'id du deck (ex. "react.useEffect.cleanup"). */
  readonly id: string;
  readonly moduleId: string;
  readonly question: string;
  /** Réponse courte, 2 à 4 phrases, dicible à l'oral. */
  readonly answer: string;
  readonly details?: string;
  /** Checklist d'auto-évaluation et grille de correction. */
  readonly keyPoints: readonly string[];
  readonly pitfalls?: readonly string[];
  readonly source: CardSource;
  readonly since?: string;
  readonly deprecated?: Deprecation;
  readonly difficulty: CardDifficulty;
};

/** Une carte "code" (défi de code) a toujours un extrait ; c'est optionnel pour les autres. */
export type Card =
  | (CardCommonFields & { readonly kind: 'recall' | 'compare'; readonly code?: string })
  | (CardCommonFields & { readonly kind: 'code'; readonly code: string });

export type CardKind = Card['kind'];

export type DeckModule = {
  readonly id: string;
  readonly title: string;
};

export type Deck = {
  readonly id: string;
  readonly title: string;
  /** Version de la techno couverte, ex. "19.3". */
  readonly version: string;
  /** Dans l'ordre d'affichage. */
  readonly modules: readonly DeckModule[];
  /** L'ordre du tableau est l'ordre d'introduction des nouvelles cartes. */
  readonly cards: readonly Card[];
};

/**
 * Invariants d'un deck, indépendants de son format de stockage.
 * Retourne la liste des incohérences, vide si le deck est cohérent.
 */
export function findDeckInconsistencies(deck: Deck): string[] {
  const declaredModuleIds = new Set<string>();
  const seenCardIds = new Set<string>();
  const inconsistencies: string[] = [];

  for (const { id } of deck.modules) {
    if (declaredModuleIds.has(id)) inconsistencies.push(`module "${id}" déclaré plusieurs fois`);
    declaredModuleIds.add(id);
  }

  for (const card of deck.cards) {
    if (seenCardIds.has(card.id)) inconsistencies.push(`carte "${card.id}" présente plusieurs fois`);
    seenCardIds.add(card.id);
    // La progression est indexée par id de carte, tous decks confondus : le préfixe évite les collisions.
    if (!card.id.startsWith(`${deck.id}.`)) {
      inconsistencies.push(`carte "${card.id}" : l'id doit commencer par "${deck.id}."`);
    }
    if (!declaredModuleIds.has(card.moduleId)) {
      inconsistencies.push(`carte "${card.id}" : module "${card.moduleId}" non déclaré`);
    }
  }

  return inconsistencies;
}
