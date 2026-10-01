import { Activity, useMemo, type ReactNode } from 'react';
import type { AppContext } from '../composition-root';
import type { Card } from '../domain/deck';
import { summarizeDeckProgress } from '../domain/deck-progress';
import { isInterviewUnlocked } from '../domain/interview';
import { countReviewedToday, startOfReviewDay } from '../domain/today-queue';
import { HomeScreen } from './home/HomeScreen';
import { InterviewScreen } from './interview/InterviewScreen';
import { CardDetail } from './library/CardDetail';
import { LibraryScreen } from './library/LibraryScreen';
import { TabBar } from './shell/TabBar';
import { useAppNavigation, type Overlay } from './shell/useAppNavigation';
import { buildCardContexts } from './today/card-contexts';
import { ReviewSession } from './today/ReviewSession';
import { useReloadOnNewReviewDay } from './today/useReloadOnNewReviewDay';
import { useTodaySession } from './today/useTodaySession';

/**
 * Racine de l'appli chargée. La session du jour vit ici, au-dessus des écrans, pour que
 * l'accueil, la bibliothèque, la session et l'entretien partagent la même progression.
 *
 * Les onglets restent montés dans des <Activity> masquées : la bibliothèque garde sa recherche
 * et ses modules dépliés quand on ouvre une fiche ou qu'on passe par l'accueil.
 */
export function Rekall({ todayReview, interviewPractice, storageMode, snapshot, loadedAt, newCardsPerDay }: AppContext) {
  const session = useTodaySession(todayReview, snapshot, loadedAt);
  useReloadOnNewReviewDay(loadedAt);
  const { tab, overlay, showTab, openOverlay, closeOverlay } = useAppNavigation();
  const cardContexts = useMemo(() => buildCardContexts(snapshot.decks), [snapshot.decks]);
  const cardsById = useMemo(
    () => new Map(snapshot.decks.flatMap((deck) => deck.cards.map((card): [string, Card] => [card.id, card]))),
    [snapshot.decks],
  );

  const interviewUnlocked = isInterviewUnlocked(session.seenCardCount);
  const reviewedToday = countReviewedToday(session.progressByCardId, loadedAt);

  function renderOverlay(current: Overlay): ReactNode {
    switch (current.kind) {
      case 'review':
        return (
          <ReviewSession
            session={session}
            todayReview={todayReview}
            cardContexts={cardContexts}
            reviewedToday={reviewedToday}
            newCardsPerDay={newCardsPerDay}
            interviewUnlocked={interviewUnlocked}
            onExit={closeOverlay}
            onStartInterview={() => openOverlay({ kind: 'interview' })}
          />
        );
      case 'interview':
        if (!interviewUnlocked) return null;
        return (
          <InterviewScreen
            interviewPractice={interviewPractice}
            cards={session.cards}
            progressByCardId={session.progressByCardId}
            cardContexts={cardContexts}
            onExit={closeOverlay}
          />
        );
      case 'card': {
        const card = cardsById.get(current.cardId);
        const context = cardContexts.get(current.cardId);
        if (card === undefined || context === undefined) return null;
        return (
          <CardDetail
            card={card}
            context={context}
            progress={session.progressByCardId.get(card.id)}
            now={loadedAt}
            onBack={closeOverlay}
            onReport={(report) => todayReview.report(report)}
          />
        );
      }
    }
  }

  const overlayScreen = overlay === null ? null : renderOverlay(overlay);

  return (
    <>
      <Activity mode={overlayScreen === null ? 'visible' : 'hidden'}>
        <div className="shell">
          <TabBar current={tab} onSelect={showTab} />
          <div className="shell__content">
            <Activity mode={tab === 'today' ? 'visible' : 'hidden'}>
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
                onStartSession={() => openOverlay({ kind: 'review' })}
                onStartInterview={() => openOverlay({ kind: 'interview' })}
              />
            </Activity>
            <Activity mode={tab === 'library' ? 'visible' : 'hidden'}>
              <LibraryScreen
                decks={snapshot.decks}
                progressByCardId={session.progressByCardId}
                cardContexts={cardContexts}
                now={loadedAt}
                onOpenCard={(cardId) => openOverlay({ kind: 'card', cardId })}
              />
            </Activity>
          </div>
        </div>
      </Activity>
      {overlayScreen}
    </>
  );
}
