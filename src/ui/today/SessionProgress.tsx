import { plural } from '../format';

type SessionProgressProps = {
  readonly reviewedCount: number;
  readonly remainingReviewCount: number;
  readonly remainingNewCount: number;
};

export function SessionProgress({ reviewedCount, remainingReviewCount, remainingNewCount }: SessionProgressProps) {
  const remaining = remainingReviewCount + remainingNewCount;
  const total = reviewedCount + remaining;
  const percent = total === 0 ? 100 : Math.round((reviewedCount / total) * 100);

  return (
    <section className="progress" aria-label="Avancement de la session">
      <div className="progress__counts">
        <span>
          <strong>{reviewedCount}</strong> {reviewedCount > 1 ? 'faites' : 'faite'}
        </span>
        <span>
          {plural(remainingReviewCount, 'à revoir', 'à revoir')} · {plural(remainingNewCount, 'nouvelle', 'nouvelles')}
        </span>
      </div>
      <div className="progress__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <div className="progress__fill" style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}
