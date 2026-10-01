import { z } from 'zod';
import { AnswerGradingError, type AnswerGrader } from '../../application/ports/answer-grader';
import type { Card } from '../../domain/deck';
import { gradeFromCoveredIndexes, type AnswerGrade } from '../../domain/interview';
import type { ArtifactSample } from '../artifact-runtime/artifact-runtime';

// Réponse d'un LLM : validée comme n'importe quelle donnée externe.
const gradingReplySchema = z.object({
  coveredKeyPointIndexes: z.array(z.number()),
  comment: z.string(),
  modelAnswer: z.string().trim().min(1),
});

/** Codes de la capacité `sample` qui rendent la correction impossible pour toute la visite. */
const UNAVAILABLE_CODES: ReadonlySet<string> = new Set([
  'not_granted',
  'sampling_disabled',
  'not_declared',
  'capability_disabled',
  'capability_removed',
  'session_expired',
]);

/** Correction par Claude via la capacité `sample` de l'artefact (sur le compte Claude de l'utilisateur). */
export class ClaudeAnswerGrader implements AnswerGrader {
  readonly #sample: ArtifactSample;

  constructor(sample: ArtifactSample) {
    this.#sample = sample;
  }

  async grade(card: Card, answer: string): Promise<AnswerGrade> {
    let reply: unknown;
    try {
      reply = await this.#sample.json(buildGradingPrompt(card, answer), { modelTier: 'default' });
    } catch (error) {
      const code = sampleErrorCode(error);
      const failure = code !== null && UNAVAILABLE_CODES.has(code) ? 'unavailable' : 'failed';
      throw new AnswerGradingError(failure, `Correction impossible (${code ?? 'erreur inconnue'})`);
    }

    const parsed = gradingReplySchema.safeParse(reply);
    if (!parsed.success) throw new AnswerGradingError('failed', 'Réponse de Claude illisible');

    const { coveredKeyPointIndexes, comment, modelAnswer } = parsed.data;
    return gradeFromCoveredIndexes(card, coveredKeyPointIndexes, comment.trim(), modelAnswer);
  }
}

export function buildGradingPrompt(card: Card, answer: string): string {
  const keyPoints = card.keyPoints.map((keyPoint, index) => `${index}. ${keyPoint}`).join('\n');
  return [
    'Tu es un recruteur technique exigeant mais bienveillant. Tu corriges la réponse orale d’un candidat en entretien, à partir de ce qu’il a noté ou dicté juste après avoir répondu.',
    '',
    `Question : ${card.question}`,
    ...(card.code === undefined ? [] : ['', 'Code montré au candidat :', card.code]),
    '',
    'Points clés attendus, numérotés à partir de 0 :',
    keyPoints,
    '',
    `Réponse de référence : ${card.answer}`,
    '',
    'Réponse du candidat :',
    '"""',
    answer,
    '"""',
    '',
    'Consignes :',
    '- Un point clé est couvert si le candidat l’exprime clairement, même avec d’autres mots ; une allusion vague ne suffit pas.',
    '- Ne juge que les points clés listés ; ne pénalise ni la forme ni les fautes de dictée.',
    '- Écris en français, en gardant les termes techniques en anglais (render, cleanup, re-render…).',
    '- comment : une ou deux phrases sur ce qui manquait de plus important, ou sur ce qui était faux. Si tout est couvert, dis-le simplement.',
    '- modelAnswer : la réponse qu’un bon candidat donnerait à l’oral en 30 secondes environ (60 à 90 mots), en phrases complètes.',
    '',
    'Réponds uniquement avec un objet JSON de cette forme :',
    '{"coveredKeyPointIndexes": [0, 2], "comment": "…", "modelAnswer": "…"}',
  ].join('\n');
}

function sampleErrorCode(error: unknown): string | null {
  return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : null;
}
