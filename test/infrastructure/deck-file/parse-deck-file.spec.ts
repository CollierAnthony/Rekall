import { describe, expect, it } from 'vitest';
import { InvalidDeckFileError } from '../../../src/infrastructure/deck-file/invalid-deck-file-error';
import { parseDeckFile } from '../../../src/infrastructure/deck-file/parse-deck-file';

const aRawCard = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'react.useEffect.cleanup',
  moduleId: 'effects-refs',
  kind: 'recall',
  question: 'À quoi sert la fonction retournée par un useEffect ?',
  answer: 'Elle arrête ou annule ce que le setup a mis en place.',
  keyPoints: ['Appelée avant chaque ré-exécution', "Appelée à l'unmount"],
  source: { title: 'useEffect', url: 'https://react.dev/reference/react/useEffect' },
  difficulty: 1,
  ...overrides,
});

const aRawDeck = (cards: unknown[] = [aRawCard()]): Record<string, unknown> => ({
  id: 'react',
  title: 'React',
  version: '19.3',
  modules: [{ id: 'effects-refs', title: 'Effets & refs' }],
  cards,
});

function issuesOf(content: unknown): readonly string[] {
  try {
    parseDeckFile(content, 'react.json');
  } catch (error) {
    if (error instanceof InvalidDeckFileError) return error.issues;
    throw error;
  }
  throw new Error('parseDeckFile aurait dû rejeter ce contenu');
}

const pathsOf = (issues: readonly string[]): string[] => issues.map((issue) => issue.split(' : ')[0] ?? '');

describe('parseDeckFile', () => {
  it('convertit un deck valide en Deck du domaine', () => {
    const deck = parseDeckFile(aRawDeck(), 'react.json');

    expect(deck.modules).toEqual([{ id: 'effects-refs', title: 'Effets & refs' }]);
    expect(deck.cards[0]).toMatchObject({ id: 'react.useEffect.cleanup', kind: 'recall', difficulty: 1 });
  });

  it('signale tous les champs invalides d’une carte en une fois, avec leur chemin', () => {
    const issues = issuesOf(aRawDeck([aRawCard({ question: ' ', difficulty: 4, keyPoints: [] })]));

    expect(pathsOf(issues)).toEqual(
      expect.arrayContaining(['cards[0].question', 'cards[0].keyPoints', 'cards[0].difficulty']),
    );
    expect(issues).toHaveLength(3);
  });

  it('refuse une clé inconnue, pour qu’une faute de frappe ne fasse pas disparaître un champ', () => {
    const issues = issuesOf(aRawDeck([aRawCard({ pitfals: ['piège'] })]));

    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('pitfals');
  });

  it('refuse un type de carte inconnu', () => {
    const issues = issuesOf(aRawDeck([aRawCard({ kind: 'qcm' })]));

    expect(pathsOf(issues)).toEqual(['cards[0].kind']);
  });

  it('refuse une source qui n’est pas une URL https', () => {
    const issues = issuesOf(aRawDeck([aRawCard({ source: { title: 'useEffect', url: 'http://react.dev' } })]));

    expect(pathsOf(issues)).toEqual(['cards[0].source.url']);
  });

  it('exige un extrait de code pour une carte "code"', () => {
    const issues = issuesOf(aRawDeck([aRawCard({ kind: 'code' })]));

    expect(pathsOf(issues)).toEqual(['cards[0].code']);
  });

  it('signale les incohérences du deck une fois la forme valide', () => {
    const issues = issuesOf(
      aRawDeck([
        aRawCard(),
        aRawCard(),
        aRawCard({ id: 'vue.watch.cleanup' }),
        aRawCard({ id: 'react.useRef.dom', moduleId: 'refs' }),
      ]),
    );

    expect(issues).toEqual([
      'carte "react.useEffect.cleanup" présente plusieurs fois',
      'carte "vue.watch.cleanup" : l\'id doit commencer par "react."',
      'carte "react.useRef.dom" : module "refs" non déclaré',
    ]);
  });
});
