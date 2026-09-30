import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { CardReport, CardReportReason } from '../../domain/card-report';

type ReportStatus = 'idle' | 'sent' | 'failed';

const REASONS: readonly { readonly value: CardReportReason; readonly label: string }[] = [
  { value: 'wrong', label: 'Réponse fausse ou dépassée' },
  { value: 'unclear', label: 'Question ou réponse floue' },
  { value: 'other', label: 'Autre' },
];

function toReason(value: FormDataEntryValue | null): CardReportReason {
  return REASONS.find((reason) => reason.value === value)?.value ?? 'other';
}

type ReportCardFormProps = {
  readonly cardId: string;
  readonly onSubmit: (report: CardReport) => Promise<void>;
};

export function ReportCardForm({ cardId, onSubmit }: ReportCardFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, submitAction] = useActionState(async (_previous: ReportStatus, formData: FormData): Promise<ReportStatus> => {
    const comment = formData.get('comment');
    try {
      await onSubmit({
        cardId,
        reason: toReason(formData.get('reason')),
        comment: typeof comment === 'string' ? comment.trim() : '',
        reportedAt: new Date(),
      });
      return 'sent';
    } catch (error) {
      console.error('Signalement impossible', error);
      return 'failed';
    }
  }, 'idle');

  if (status === 'sent') {
    return (
      <p className="report__done" role="status">
        Signalement enregistré. La carte sera corrigée.
      </p>
    );
  }

  if (!isOpen) {
    return (
      <button type="button" className="link-button" onClick={() => setIsOpen(true)}>
        Signaler cette carte
      </button>
    );
  }

  return (
    <form className="report" action={submitAction}>
      <fieldset className="report__reasons">
        <legend className="report__legend">Qu’est-ce qui ne va pas ?</legend>
        {REASONS.map((reason) => (
          <label key={reason.value} className="report__reason">
            <input type="radio" name="reason" id={`report-reason-${reason.value}`} value={reason.value} defaultChecked={reason.value === 'wrong'} />
            <span>{reason.label}</span>
          </label>
        ))}
      </fieldset>
      <label className="report__label" htmlFor="report-comment">
        Précise si besoin
      </label>
      <textarea id="report-comment" name="comment" className="report__comment" rows={3} />
      {status === 'failed' && (
        <p className="report__error" role="alert">
          Le signalement n’a pas été enregistré. Réessaie dans un instant.
        </p>
      )}
      <div className="report__actions">
        <SubmitReportButton />
        <button type="button" className="button button--quiet" onClick={() => setIsOpen(false)}>
          Annuler
        </button>
      </div>
    </form>
  );
}

/** useFormStatus lit l'envoi du <form> parent : il doit vivre dans un composant enfant du formulaire. */
function SubmitReportButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button button--secondary" disabled={pending}>
      {pending ? 'Envoi…' : 'Envoyer le signalement'}
    </button>
  );
}
