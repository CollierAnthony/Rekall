import type { ProgressRepository } from '../../application/ports/progress-repository';
import type { CardProgress } from '../../domain/review';
import type { ArtifactCollectionReference, ArtifactStorage } from '../artifact-runtime/artifact-runtime';
import { fromProgressDocument, toProgressDocument } from './progress-document';

/**
 * Progression dans la base de l'artefact, synchronisée entre appareils.
 * `data/users/<id>/` est privé à chaque utilisateur ; un document par carte,
 * sous data/users/<id>/progress/cards/<cardId>.
 */
export class ArtifactDbProgressRepository implements ProgressRepository {
  readonly #cards: ArtifactCollectionReference;

  constructor(storage: ArtifactStorage) {
    this.#cards = storage.db.doc(`data/users/${storage.userId}/progress`).collection('cards');
  }

  async loadAll(): Promise<readonly CardProgress[]> {
    const snapshot = await this.#cards.get();
    return snapshot.docs.flatMap((document) => {
      const progress = document.exists ? fromProgressDocument(document.data()) : null;
      return progress === null ? [] : [progress];
    });
  }

  async save(progress: CardProgress): Promise<void> {
    await this.#cards.doc(progress.cardId).set(toProgressDocument(progress));
  }
}
