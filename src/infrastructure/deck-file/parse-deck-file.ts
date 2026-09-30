import { findDeckInconsistencies, type Deck } from '../../domain/deck';
import { deckFileSchema, formatSchemaIssues } from './deck-file-schemas';
import { InvalidDeckFileError } from './invalid-deck-file-error';

/**
 * Convertit le contenu JSON d'un fichier de deck en Deck du domaine.
 * @throws InvalidDeckFileError avec la liste complète des problèmes de forme,
 * ou à défaut des incohérences du deck.
 */
export function parseDeckFile(content: unknown, fileName: string): Deck {
  const result = deckFileSchema.safeParse(content);
  if (!result.success) throw new InvalidDeckFileError(fileName, formatSchemaIssues(result.error));

  // Le domaine ne dépend pas de Zod. Cette affectation fait le lien à la compilation :
  // si le schéma ne produit plus un Deck valide, le projet ne compile plus.
  const deck: Deck = result.data;

  const inconsistencies = findDeckInconsistencies(deck);
  if (inconsistencies.length > 0) throw new InvalidDeckFileError(fileName, inconsistencies);

  return deck;
}
