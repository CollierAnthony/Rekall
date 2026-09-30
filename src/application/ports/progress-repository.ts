import type { CardProgress } from '../../domain/review';

/** Progression de l'utilisateur courant. */
export interface ProgressRepository {
  loadAll(): Promise<readonly CardProgress[]>;
  save(progress: CardProgress): Promise<void>;
}
