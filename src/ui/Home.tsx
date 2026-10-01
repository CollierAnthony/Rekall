import { useMemo, useState } from 'react';
import type { AppContext } from '../composition-root';
import { isInterviewUnlocked } from '../domain/interview';
import { startOfReviewDay } from '../domain/today-queue';
import { formatDay } from './format';
import { InterviewScreen } from './interview/InterviewScreen';
import { buildCardContexts } from './today/card-contexts';
import { StorageStatus } from './today/StorageStatus';
import { TodayScreen } from './today/TodayScreen';
import { useReloadOnNewReviewDay } from './today/useReloadOnNewReviewDay';
import { useTodaySession } from './today/useTodaySession';

type Tab = 'today' | 'interview';

const TABS: readonly Tab[] = ['today', 'interview'];
const TAB_TITLES: Readonly<Record<Tab, string>> = { today: 'Aujourd’hui', interview: 'Entretien' };

/**
 * Écran principal. Il porte l'état de la session du jour, pour que les cartes revues
 * débloquent l'onglet Entretien en direct, sans rechargement.
 */
export function Home({ todayReview, interviewPractice, storageMode, snapshot, loadedAt, newCardsPerDay }: AppContext) {
  const session = useTodaySession(todayReview, snapshot, loadedAt);
  useReloadOnNewReviewDay(loadedAt);
  const [selectedTab, setSelectedTab] = useState<Tab>('today');
  const cardContexts = useMemo(() => buildCardContexts(snapshot.decks), [snapshot.decks]);

  const interviewUnlocked = isInterviewUnlocked(session.seenCardCount);
  const tab: Tab = interviewUnlocked ? selectedTab : 'today';

  return (
    <main className="home">
      <header className="home__header">
        <div>
          <p className="home__date">{formatDay(startOfReviewDay(loadedAt))}</p>
          <h1 className="home__title">{TAB_TITLES[tab]}</h1>
        </div>
        <StorageStatus mode={storageMode} />
      </header>

      {interviewUnlocked && (
        <nav className="tabs" aria-label="Mode de révision">
          {TABS.map((value) => (
            <button key={value} type="button" className="tabs__tab" aria-pressed={tab === value} onClick={() => setSelectedTab(value)}>
              {TAB_TITLES[value]}
            </button>
          ))}
        </nav>
      )}

      {tab === 'today' ? (
        <TodayScreen session={session} todayReview={todayReview} cardContexts={cardContexts} newCardsPerDay={newCardsPerDay} />
      ) : (
        <InterviewScreen
          interviewPractice={interviewPractice}
          cards={session.cards}
          progressByCardId={session.progressByCardId}
          cardContexts={cardContexts}
        />
      )}
    </main>
  );
}
