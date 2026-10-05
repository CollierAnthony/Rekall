import { describe, expect, it } from 'vitest';
import type { CardProgress } from '../../../src/domain/review';
import { inMemoryStorage } from '../../../src/infrastructure/browser-storage';
import { LocalStorageProgressRepository } from '../../../src/infrastructure/progress/local-storage-progress-repository';

const aProgress = (cardId: string, dueAt: string): CardProgress => ({
  cardId,
  introducedAt: new Date('2026-10-01T08:00:00Z'),
  lastReviewedAt: new Date('2026-10-01T08:00:00Z'),
  dueAt: new Date(dueAt),
  reviewCount: 1,
  lapseCount: 0,
  schedulerState: { algorithm: 'fsrs', phase: 'learning' },
});

describe('LocalStorageProgressRepository', () => {
  it('relit la progression enregistrée, dates comprises, et garde la dernière version de chaque carte', async () => {
    const repository = new LocalStorageProgressRepository(inMemoryStorage());

    await repository.save(aProgress('react.memo.purpose', '2026-10-01T08:10:00Z'));
    await repository.save(aProgress('react.memo.purpose', '2026-10-09T08:00:00Z'));
    await repository.save(aProgress('react.useRef.vsState', '2026-10-02T08:00:00Z'));

    expect(await repository.loadAll()).toEqual([
      aProgress('react.memo.purpose', '2026-10-09T08:00:00Z'),
      aProgress('react.useRef.vsState', '2026-10-02T08:00:00Z'),
    ]);
  });

  it('ignore un stockage corrompu au lieu de planter', async () => {
    const storage = inMemoryStorage();
    storage.setItem('revisions-tech:progress:v1', '{"react.memo.purpose": {"dueAt": "demain"}}');

    expect(await new LocalStorageProgressRepository(storage).loadAll()).toEqual([]);
  });
});
