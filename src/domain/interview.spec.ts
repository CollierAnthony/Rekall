import { describe, expect, it } from 'vitest';
import type { Card } from './deck';
import { drawInterviewCards, gradeFromCoveredIndexes, INTERVIEW_UNLOCK_THRESHOLD, isInterviewUnlocked } from './interview';

const aCard = (name: string, keyPoints: string[] = ['Point clé']): Card => ({
  id: `react.${name}`,
  moduleId: 'effects-refs',
  kind: 'recall',
  question: 'Question',
  answer: 'Réponse',
  keyPoints,
  source: { title: 'Doc', url: 'https://react.dev' },
  difficulty: 1,
});

const ids = (cards: readonly Card[]): string[] => cards.map((card) => card.id);

describe('isInterviewUnlocked', () => {
  it('débloque le mode entretien à partir du seuil de cartes vues', () => {
    expect(isInterviewUnlocked(INTERVIEW_UNLOCK_THRESHOLD - 1)).toBe(false);
    expect(isInterviewUnlocked(INTERVIEW_UNLOCK_THRESHOLD)).toBe(true);
  });
});

describe('drawInterviewCards', () => {
  const cards = ['a', 'b', 'c', 'd', 'e'].map((name) => aCard(name));
  const seen = new Set(['react.a', 'react.b', 'react.c', 'react.d']);

  it('ne tire que des cartes déjà vues, sans doublon, dans la limite demandée', () => {
    const drawn = drawInterviewCards(cards, seen, 3, Math.random);

    expect(drawn).toHaveLength(3);
    expect(new Set(ids(drawn)).size).toBe(3);
    expect(ids(drawn).every((id) => seen.has(id))).toBe(true);
  });

  it('mélange selon la source de hasard fournie', () => {
    const alwaysFirst = () => 0;

    expect(ids(drawInterviewCards(cards, seen, 4, alwaysFirst))).toEqual(['react.b', 'react.c', 'react.d', 'react.a']);
  });

  it('renvoie moins de cartes que demandé quand trop peu ont été vues', () => {
    expect(drawInterviewCards(cards, new Set(['react.e']), 5, Math.random)).toHaveLength(1);
  });
});

describe('gradeFromCoveredIndexes', () => {
  const card = aCard('cleanup', ['Arrête le setup', 'Avant chaque ré-exécution', 'À l’unmount']);

  it('répartit les points clés entre couverts et manqués', () => {
    expect(gradeFromCoveredIndexes(card, [0, 2], 'Il manque le moment.', 'Réponse modèle')).toEqual({
      coveredKeyPoints: ['Arrête le setup', 'À l’unmount'],
      missedKeyPoints: ['Avant chaque ré-exécution'],
      comment: 'Il manque le moment.',
      modelAnswer: 'Réponse modèle',
    });
  });

  it('ignore les numéros invalides ou en double renvoyés par le correcteur', () => {
    const grade = gradeFromCoveredIndexes(card, [1, 1, 7, -1, 0.5], '', 'Réponse modèle');

    expect(grade.coveredKeyPoints).toEqual(['Avant chaque ré-exécution']);
    expect(grade.missedKeyPoints).toEqual(['Arrête le setup', 'À l’unmount']);
  });
});
