import { describe, expect, it } from 'vitest';
import { buildCardSearchIndex, searchCards } from './card-search';
import type { Card } from './deck';

const aCard = (id: string, question: string, answer = 'Réponse', keyPoints: string[] = ['Point clé']): Card => ({
  id,
  moduleId: 'm',
  kind: 'recall',
  question,
  answer,
  keyPoints,
  source: { title: 'Doc', url: 'https://example.com' },
  difficulty: 1,
});

const ids = (cards: readonly Card[]): string[] => cards.map((card) => card.id);

describe('searchCards', () => {
  const cards = [
    aCard('react.memo', 'À quoi sert React.memo ?', 'Saute le re-render si les props sont inchangées.'),
    aCard('react.cleanup', 'À quoi sert la fonction retournée par un useEffect ?', 'C’est la cleanup function.', ['Appelée avant chaque ré-exécution']),
    aCard('react.deps', 'Comment fonctionne le tableau de dépendances ?', 'Comparé avec Object.is à chaque rendu, comme dans useEffect.'),
  ];
  const index = buildCardSearchIndex(cards);

  it('renvoie toutes les cartes quand la recherche est vide', () => {
    expect(ids(searchCards(index, '   '))).toEqual(['react.memo', 'react.cleanup', 'react.deps']);
  });

  it('ignore la casse et les accents', () => {
    expect(ids(searchCards(index, 'RE-EXECUTION'))).toEqual(['react.cleanup']);
  });

  it('exige tous les mots, dans n’importe quel champ', () => {
    expect(ids(searchCards(index, 'props inchangees'))).toEqual(['react.memo']);
    expect(ids(searchCards(index, 'props cleanup'))).toEqual([]);
  });

  it('place en tête les cartes dont la question contient la recherche', () => {
    expect(ids(searchCards(index, 'useeffect'))).toEqual(['react.cleanup', 'react.deps']);
  });
});
