import { useMemo, useState } from 'react';
import type { AppContext } from '../composition-root';
import { summarizeDeckProgress } from '../domain/deck-progress';
import { isInterviewUnlocked } from '../domain/interview';
import { countReviewedToday, startOfReviewDay } from '../domain/today-queue';
import { HomeScreen } from './home/HomeScreen';
import { InterviewScreen } from './interview/InterviewScreen';
import { buildCardContexts } from './today/card-contexts';
import { ReviewSession } from './today/ReviewSession';
import { useReloadOnNewReviewDay } from './today/useReloadOnNewReviewDay';
import { useTodaySession } from './today/useTodaySession';

type Screen = 'home' | 'review' | 'interview';

/**
 * Racine de l'appli chargée. La session du jour vit ici, au-dessus des écrans, pour que
 * l'accueil, la session et l'entretien partagent la même progression sans rechargement.
 */
export function Rekall({ todayReview, interviewPractice, storageMode, snapshot, loadedAt, newCardsPerDay }: AppContext) {
  const session = useTodaySession(todayReview, snapshot, loadedAt);
  useReloadOnNewReviewDay(loadedAt);
  const [screen, setScreen] = useState<Screen>('home');
  const cardContexts = useMemo(() => buildCardContexts(snapshot.decks), [snapshot.decks]);

  const interviewUnlocked = isInterviewUnlocked(session.seenCardCount);
  const reviewedToday = countReviewedToday(session.progressByCardId, loadedAt);

  function show(next: Screen): void {
    setScreen(next);
    window.scrollTo({ top: 0 });
  }

  if (screen === 'review') {
    return (
      <ReviewSession
        session={session}
        todayReview={todayReview}
        cardContexts={cardContexts}
        reviewedToday={reviewedToday}
        newCardsPerDay={newCardsPerDay}
        interviewUnlocked={interviewUnlocked}
        onExit={() => show('home')}
        onStartInterview={() => show('interview')}
      />
    );
  }

  if (screen === 'interview' && interviewUnlocked) {
    return (
      <InterviewScreen
        interviewPractice={interviewPractice}
        cards={session.cards}
        progressByCardId={session.progressByCardId}
        cardContexts={cardContexts}
        onExit={() => show('home')}
      />
    );
  }

  return (
    <HomeScreen
      reviewDay={startOfReviewDay(loadedAt)}
      storageMode={storageMode}
      today={{
        remainingReviewCount: session.remainingReviewCount,
        remainingNewCount: session.remainingNewCount,
        reviewedToday,
        dueTomorrow: session.dueTomorrow,
      }}
      interviewUnlocked={interviewUnlocked}
      seenCardCount={session.seenCardCount}
      deckProgress={summarizeDeckProgress(snapshot.decks, session.progressByCardId)}
      onStartSession={() => show('review')}
      onStartInterview={() => show('interview')}
    />
  );
}
