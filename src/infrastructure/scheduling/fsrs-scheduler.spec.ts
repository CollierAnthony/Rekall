import { createEmptyCard, fsrs, Rating } from 'ts-fsrs';
import { describe, expect, it } from 'vitest';
import type { CardProgress } from '../../domain/review';
import { FsrsScheduler } from './fsrs-scheduler';

const minutes = (count: number): number => count * 60_000;
const days = (count: number): number => count * 86_400_000;

describe('FsrsScheduler', () => {
  const scheduler = new FsrsScheduler();
  const start = new Date('2026-10-01T08:00:00Z');

  it('fait revenir une nouvelle carte notée Bon dix minutes plus tard, en phase d’apprentissage', () => {
    const progress = scheduler.previewOutcomes('react.memo.purpose', undefined, start).good;

    expect(progress.dueAt.getTime() - start.getTime()).toBe(minutes(10));
    expect(progress).toMatchObject({ introducedAt: start, lastReviewedAt: start, reviewCount: 1, lapseCount: 0 });
    expect(progress.schedulerState).toMatchObject({ algorithm: 'fsrs', phase: 'learning' });
  });

  it('fait passer une nouvelle carte notée Facile directement en révision espacée', () => {
    const progress = scheduler.previewOutcomes('react.memo.purpose', undefined, start).easy;

    expect(progress.dueAt.getTime() - start.getTime()).toBeGreaterThanOrEqual(days(1));
    expect(progress.schedulerState).toMatchObject({ phase: 'review' });
  });

  it('garde la date d’introduction et compte un oubli quand une carte en révision est ratée', () => {
    const learnt = scheduler.previewOutcomes('react.memo.purpose', undefined, start).easy;
    const later = new Date(learnt.dueAt);

    const forgotten = scheduler.previewOutcomes('react.memo.purpose', learnt, later).again;

    expect(forgotten).toMatchObject({ introducedAt: start, lastReviewedAt: later, lapseCount: 1, reviewCount: 2 });
    expect(forgotten.schedulerState).toMatchObject({ phase: 'relearning' });
  });

  it('reprend exactement les calculs de ts-fsrs à partir de l’état stocké', () => {
    const reference = fsrs();
    let referenceCard = createEmptyCard(start);
    let progress: CardProgress | undefined;
    const reviews = [
      { at: start, rating: 'good', grade: Rating.Good },
      { at: new Date('2026-10-01T08:10:00Z'), rating: 'good', grade: Rating.Good },
      { at: new Date('2026-10-04T08:00:00Z'), rating: 'hard', grade: Rating.Hard },
      { at: new Date('2026-10-12T08:00:00Z'), rating: 'again', grade: Rating.Again },
    ] as const;

    for (const review of reviews) {
      referenceCard = reference.next(referenceCard, review.at, review.grade).card;
      progress = scheduler.previewOutcomes('react.memo.purpose', progress, review.at)[review.rating];
      expect(progress.dueAt).toEqual(referenceCard.due);
      expect(progress.schedulerState).toMatchObject({ stability: referenceCard.stability, difficulty: referenceCard.difficulty });
    }
  });

  it('refuse un état stocké qui ne vient pas de FSRS', () => {
    const corrupted: CardProgress = {
      cardId: 'react.memo.purpose',
      introducedAt: start,
      lastReviewedAt: start,
      dueAt: start,
      reviewCount: 1,
      lapseCount: 0,
      schedulerState: { algorithm: 'sm2', interval: 3 },
    };

    expect(() => scheduler.previewOutcomes('react.memo.purpose', corrupted, start)).toThrow();
  });
});
