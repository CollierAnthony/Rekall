import { describe, expect, it } from 'vitest';
import { AnswerGradingError } from '../../../src/application/ports/answer-grader';
import type { Card } from '../../../src/domain/deck';
import type { ArtifactSample } from '../../../src/infrastructure/artifact-runtime/artifact-runtime';
import { buildGradingPrompt, ClaudeAnswerGrader } from '../../../src/infrastructure/grading/claude-answer-grader';

const card: Card = {
  id: 'react.useEffect.cleanup',
  moduleId: 'effects-refs',
  kind: 'recall',
  question: 'À quoi sert la fonction retournée par un useEffect ?',
  answer: 'Elle arrête ou annule ce que le setup a mis en place.',
  keyPoints: ['Arrête le setup', 'Avant chaque ré-exécution', 'À l’unmount'],
  source: { title: 'useEffect', url: 'https://react.dev/reference/react/useEffect' },
  difficulty: 1,
};

const sampleReplying = (reply: () => Promise<unknown>): ArtifactSample & { prompts: string[] } => {
  const prompts: string[] = [];
  return { prompts, json: async (input) => (prompts.push(input), reply()) };
};

async function failureOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof AnswerGradingError) return error.failure;
    throw error;
  }
  throw new Error('La correction aurait dû échouer');
}

describe('ClaudeAnswerGrader', () => {
  it('rapporte les numéros renvoyés par Claude aux points clés de la carte', async () => {
    const sample = sampleReplying(async () => ({ coveredKeyPointIndexes: [0], comment: ' Il manque le moment. ', modelAnswer: 'La cleanup…' }));

    const grade = await new ClaudeAnswerGrader(sample).grade(card, 'Ça nettoie ce que le setup a fait');

    expect(grade).toEqual({
      coveredKeyPoints: ['Arrête le setup'],
      missedKeyPoints: ['Avant chaque ré-exécution', 'À l’unmount'],
      comment: 'Il manque le moment.',
      modelAnswer: 'La cleanup…',
    });
    expect(sample.prompts[0]).toContain('Ça nettoie ce que le setup a fait');
  });

  it('signale un échec ponctuel quand la réponse de Claude n’a pas la forme attendue', async () => {
    const sample = sampleReplying(async () => ({ covered: 'tout' }));

    expect(await failureOf(new ClaudeAnswerGrader(sample).grade(card, 'Réponse'))).toBe('failed');
  });

  it('rend la correction indisponible quand l’utilisateur refuse l’accès à Claude', async () => {
    const sample = sampleReplying(() => Promise.reject({ code: 'not_granted', message: 'declined' }));

    expect(await failureOf(new ClaudeAnswerGrader(sample).grade(card, 'Réponse'))).toBe('unavailable');
  });

  it('permet de réessayer après une limite de débit', async () => {
    const sample = sampleReplying(() => Promise.reject({ code: 'rate_limited', message: 'slow down' }));

    expect(await failureOf(new ClaudeAnswerGrader(sample).grade(card, 'Réponse'))).toBe('failed');
  });
});

describe('buildGradingPrompt', () => {
  it('numérote les points clés à partir de 0 et inclut la réponse de référence', () => {
    const prompt = buildGradingPrompt(card, 'Ma réponse');

    expect(prompt).toContain('0. Arrête le setup\n1. Avant chaque ré-exécution\n2. À l’unmount');
    expect(prompt).toContain(`Réponse de référence : ${card.answer}`);
  });
});
