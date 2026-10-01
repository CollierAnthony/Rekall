import { useActionState, useEffect, useRef } from 'react';
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

type ReportSheetProps = {
  readonly cardId: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (report: CardReport) => Promise<void>;
};

/**
 * Feuille modale pour signaler une carte. Le <dialog> natif gère le focus, la touche Échap
 * et le fond assombri ; un clic sur ce fond ferme aussi la feuille.
 */
export function ReportSheet({ cardId, isOpen, onClose, onSubmit }: ReportSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="sheet"
      aria-labelledby="report-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="sheet__content">
        <span className="sheet__grabber" aria-hidden="true" />
        <ReportForm key={cardId} cardId={cardId} onSubmit={onSubmit} onCancel={onClose} />
      </div>
    </dialog>
  );
}

type ReportFormProps = {
  readonly cardId: string;
  readonly onSubmit: (report: CardReport) => Promise<void>;
  readonly onCancel: () => void;
};

function ReportForm({ cardId, onSubmit, onCancel }: ReportFormProps) {
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
      <div className="sheet__body" role="status">
        <h2 id="report-title" className="sheet__title">
          Merci
        </h2>
        <p className="sheet__lead">Signalement enregistré. La carte sera corrigée.</p>
        <button type="button" className="button button--primary button--block" onClick={onCancel}>
          Fermer
        </button>
      </div>
    );
  }

  return (
    <form className="sheet__body" action={submitAction}>
      <div>
        <h2 id="report-title" className="sheet__title">
          Signaler cette carte
        </h2>
        <p className="sheet__lead">Claude relit les signalements pour corriger les cartes.</p>
      </div>
      <fieldset className="options">
        <legend className="options__legend">Qu’est-ce qui ne va pas ?</legend>
        {REASONS.map((reason) => (
          <label key={reason.value} className="option">
            <input type="radio" name="reason" value={reason.value} defaultChecked={reason.value === 'wrong'} />
            {reason.label}
          </label>
        ))}
      </fieldset>
      <div className="field">
        <label className="field__label" htmlFor="report-comment">
          Précise si besoin
        </label>
        <textarea id="report-comment" name="comment" className="field__input" rows={3} />
      </div>
      {status === 'failed' && (
        <p className="form-error" role="alert">
          Le signalement n’a pas été enregistré. Réessaie dans un instant.
        </p>
      )}
      <div className="sheet__actions">
        <SubmitReportButton />
        <button type="button" className="button button--ghost button--block" onClick={onCancel}>
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
    <button type="submit" className="button button--primary button--block" disabled={pending}>
      {pending ? 'Envoi…' : 'Envoyer le signalement'}
    </button>
  );
}
