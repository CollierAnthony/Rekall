import { TodayReview, type TodaySnapshot } from './application/today-review';
import { connectArtifactStorage } from './infrastructure/artifact-runtime/artifact-runtime';
import { browserStorage } from './infrastructure/browser-storage';
import { ArtifactDbCardReportRepository } from './infrastructure/card-report/artifact-db-card-report-repository';
import { LocalStorageCardReportRepository } from './infrastructure/card-report/local-storage-card-report-repository';
import { FetchDeckSource } from './infrastructure/deck-file/fetch-deck-source';
import { ArtifactDbProgressRepository } from './infrastructure/progress/artifact-db-progress-repository';
import { LocalStorageProgressRepository } from './infrastructure/progress/local-storage-progress-repository';
import { FsrsScheduler } from './infrastructure/scheduling/fsrs-scheduler';

const NEW_CARDS_PER_DAY = 10;

/** synced : base de l'artefact, partagée entre appareils ; this-device : navigateur uniquement. */
export type StorageMode = 'synced' | 'this-device';

export type AppContext = {
  readonly todayReview: TodayReview;
  readonly storageMode: StorageMode;
  readonly snapshot: TodaySnapshot;
  readonly loadedAt: Date;
  readonly newCardsPerDay: number;
};

/** Seul endroit qui choisit les adaptateurs : base de l'artefact si disponible, sinon le navigateur. */
export async function startApp(): Promise<AppContext> {
  const artifactStorage = await connectArtifactStorage();
  const localStorage = browserStorage();

  const todayReview = new TodayReview({
    deckSource: new FetchDeckSource(new URL('decks/', document.baseURI)),
    scheduler: new FsrsScheduler(),
    policy: { newCardsPerDay: NEW_CARDS_PER_DAY },
    progressRepository:
      artifactStorage === null ? new LocalStorageProgressRepository(localStorage) : new ArtifactDbProgressRepository(artifactStorage),
    cardReportRepository:
      artifactStorage === null ? new LocalStorageCardReportRepository(localStorage) : new ArtifactDbCardReportRepository(artifactStorage),
  });

  const loadedAt = new Date();
  return {
    todayReview,
    storageMode: artifactStorage === null ? 'this-device' : 'synced',
    snapshot: await todayReview.loadToday(loadedAt),
    loadedAt,
    newCardsPerDay: NEW_CARDS_PER_DAY,
  };
}
