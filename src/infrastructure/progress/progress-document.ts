import { z } from 'zod';
import type { CardProgress } from '../../domain/review';

/** Forme stockée d'une progression (base de l'artefact ou localStorage) : dates en ISO 8601. */
const progressDocumentSchema = z.strictObject({
  cardId: z.string().min(1),
  introducedAt: z.iso.datetime(),
  lastReviewedAt: z.iso.datetime(),
  dueAt: z.iso.datetime(),
  reviewCount: z.int().nonnegative(),
  lapseCount: z.int().nonnegative(),
  schedulerState: z.record(z.string(), z.unknown()),
});

export type ProgressDocument = z.infer<typeof progressDocumentSchema>;

export function toProgressDocument(progress: CardProgress): ProgressDocument {
  return {
    cardId: progress.cardId,
    introducedAt: progress.introducedAt.toISOString(),
    lastReviewedAt: progress.lastReviewedAt.toISOString(),
    dueAt: progress.dueAt.toISOString(),
    reviewCount: progress.reviewCount,
    lapseCount: progress.lapseCount,
    schedulerState: { ...progress.schedulerState },
  };
}

/** null pour un document illisible : il est ignoré et la carte redevient nouvelle. */
export function fromProgressDocument(content: unknown): CardProgress | null {
  const result = progressDocumentSchema.safeParse(content);
  if (!result.success) {
    console.warn('Progression illisible ignorée', result.error.issues);
    return null;
  }
  const document = result.data;
  return {
    cardId: document.cardId,
    introducedAt: new Date(document.introducedAt),
    lastReviewedAt: new Date(document.lastReviewedAt),
    dueAt: new Date(document.dueAt),
    reviewCount: document.reviewCount,
    lapseCount: document.lapseCount,
    schedulerState: document.schedulerState,
  };
}
