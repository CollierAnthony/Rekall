import { plural } from '../format';

type SessionSummaryProps = {
  readonly reviewedCount: number;
  readonly dueTomorrow: number;
  readonly unseenCount: number;
  readonly newCardsPerDay: number;
};

export function SessionSummary({ reviewedCount, dueTomorrow, unseenCount, newCardsPerDay }: SessionSummaryProps) {
  const upcomingNew = Math.min(unseenCount, newCardsPerDay);

  return (
    <section className="summary" aria-live="polite">
      <h2 className="summary__title">{reviewedCount > 0 ? 'Session terminée' : 'Rien à réviser pour l’instant'}</h2>
      {reviewedCount > 0 && <p className="summary__lead">{plural(reviewedCount, 'révision', 'révisions')} aujourd’hui.</p>}
      <dl className="summary__facts">
        <div>
          <dt>Demain</dt>
          <dd>{plural(dueTomorrow, 'carte à revoir', 'cartes à revoir')}</dd>
        </div>
        <div>
          <dt>Nouvelles</dt>
          <dd>{upcomingNew > 0 ? `jusqu’à ${upcomingNew} par jour, ${unseenCount} en réserve` : 'toutes les cartes ont été vues'}</dd>
        </div>
      </dl>
      <p className="summary__next">Pour t’entraîner à l’oral, dis « interroge-moi » à Claude dans le Projet Révisions Tech.</p>
    </section>
  );
}
