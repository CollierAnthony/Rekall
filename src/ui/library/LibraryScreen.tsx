import { useDeferredValue, useMemo, useState } from 'react';
import { buildCardSearchIndex, searchCards } from '../../domain/card-search';
import { cardStatus } from '../../domain/card-status';
import type { Deck } from '../../domain/deck';
import type { CardProgress } from '../../domain/review';
import { plural } from '../format';
import { Icon } from '../shared/Icon';
import type { CardContext } from '../today/card-contexts';
import { CardRow } from './CardRow';

const ALL_DECKS = 'all';

type LibraryScreenProps = {
  readonly decks: readonly Deck[];
  readonly progressByCardId: ReadonlyMap<string, CardProgress>;
  readonly cardContexts: ReadonlyMap<string, CardContext>;
  readonly now: Date;
  readonly onOpenCard: (cardId: string) => void;
};

/**
 * Toutes les cartes, sans attendre qu'elles sortent en révision : par catégorie et par module,
 * ou à plat quand on cherche. Les catégories viennent de l'index des decks, rien n'est codé en dur.
 */
export function LibraryScreen({ decks, progressByCardId, cardContexts, now, onOpenCard }: LibraryScreenProps) {
  const [query, setQuery] = useState('');
  const [deckFilter, setDeckFilter] = useState<string>(ALL_DECKS);
  // La liste se recalcule après la frappe : le champ reste fluide même avec beaucoup de cartes.
  const deferredQuery = useDeferredValue(query);
  const searchIndex = useMemo(() => buildCardSearchIndex(decks.flatMap((deck) => deck.cards)), [decks]);

  const visibleDecks = deckFilter === ALL_DECKS ? decks : decks.filter((deck) => deck.id === deckFilter);
  const visibleCardIds = new Set(visibleDecks.flatMap((deck) => deck.cards.map((card) => card.id)));
  const isSearching = deferredQuery.trim() !== '';
  const results = isSearching ? searchCards(searchIndex, deferredQuery).filter((card) => visibleCardIds.has(card.id)) : [];

  return (
    <main className="library">
      <header className="library__header">
        <h1 className="page-title">Bibliothèque</h1>
        <div className="search">
          <label htmlFor="library-search" className="visually-hidden">
            Rechercher une carte
          </label>
          <Icon name="search" />
          <input
            id="library-search"
            className="search__input"
            type="search"
            placeholder="Rechercher une carte"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
          />
        </div>
        {decks.length > 1 && (
          <div className="filter-chips" role="group" aria-label="Catégorie">
            {[{ id: ALL_DECKS, title: 'Tout' }, ...decks].map((option) => (
              <button
                key={option.id}
                type="button"
                className="filter-chip"
                aria-pressed={deckFilter === option.id}
                onClick={() => setDeckFilter(option.id)}
              >
                {option.title}
              </button>
            ))}
          </div>
        )}
        <p className="library__summary" aria-live="polite">
          {isSearching ? plural(results.length, 'résultat', 'résultats') : plural(visibleCardIds.size, 'carte', 'cartes')}
        </p>
      </header>

      {isSearching ? (
        results.length === 0 ? (
          <p className="library__empty">Aucune carte ne contient « {deferredQuery.trim()} ».</p>
        ) : (
          <ul className="card-list">
            {results.map((card) => (
              <li key={card.id}>
                <CardRow
                  card={card}
                  status={cardStatus(progressByCardId.get(card.id), now)}
                  now={now}
                  context={cardContexts.get(card.id)}
                  onOpen={onOpenCard}
                />
              </li>
            ))}
          </ul>
        )
      ) : (
        visibleDecks.map((deck) => (
          <DeckSection
            key={deck.id}
            deck={deck}
            showTitle={visibleDecks.length > 1}
            progressByCardId={progressByCardId}
            now={now}
            onOpenCard={onOpenCard}
          />
        ))
      )}
    </main>
  );
}

type DeckSectionProps = {
  readonly deck: Deck;
  readonly showTitle: boolean;
  readonly progressByCardId: ReadonlyMap<string, CardProgress>;
  readonly now: Date;
  readonly onOpenCard: (cardId: string) => void;
};

/** Les modules d'un deck, repliés : on voit d'un coup d'œil ce qu'il contient et ce qui a été vu. */
function DeckSection({ deck, showTitle, progressByCardId, now, onOpenCard }: DeckSectionProps) {
  const titleId = `deck-${deck.id}`;

  return (
    <section className="deck-section" aria-labelledby={showTitle ? titleId : undefined} aria-label={showTitle ? undefined : deck.title}>
      {showTitle && (
        <h2 id={titleId} className="section-title">
          {deck.title}
        </h2>
      )}
      {deck.modules.map((deckModule) => {
        const cards = deck.cards.filter((card) => card.moduleId === deckModule.id);
        if (cards.length === 0) return null;
        const seenCount = cards.filter((card) => progressByCardId.has(card.id)).length;
        return (
          <details key={deckModule.id} className="module">
            <summary className="module__summary">
              <span className="module__heading">
                <span className="module__title">{deckModule.title}</span>
                <span className="module__count">
                  {plural(cards.length, 'carte', 'cartes')} · {plural(seenCount, 'vue', 'vues')}
                </span>
              </span>
              <Icon name="chevronDown" />
            </summary>
            <ul className="card-list card-list--in-module">
              {cards.map((card) => (
                <li key={card.id}>
                  <CardRow card={card} status={cardStatus(progressByCardId.get(card.id), now)} now={now} onOpen={onOpenCard} />
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </section>
  );
}
