// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Rekall } from '../../src/ui/Rekall';
import { stubMissingDomApis } from './support/dom-stubs';
import { aCard, aDeck, createTestAppContext, seenLastWeek } from './support/test-app-context';

// Parcours utilisateur de bout en bout, sur l'appli entière avec des adaptateurs en mémoire.
// On interagit par rôles et libellés, comme un utilisateur : pas de sélecteur CSS, pas d'état interne.
// Les requêtes par rôle ignorent les onglets masqués par <Activity>, qui restent montés dans le DOM.

beforeEach(() => {
  stubMissingDomApis();
  window.history.replaceState(null, '');
});

// Fermer un écran passe par history.back(), dont le popstate arrive de façon asynchrone :
// on le laisse retomber avant le test suivant, sinon il fermerait l'écran que ce test vient d'ouvrir.
afterEach(async () => {
  cleanup();
  await new Promise((resolve) => setTimeout(resolve, 20));
});

const cleanupCard = aCard('cleanup');
const depsCard = aCard('deps');

describe('Session de révision', () => {
  it('révèle, note et enchaîne les cartes jusqu’au bilan, en enregistrant chaque note', async () => {
    const user = userEvent.setup();
    const { context, saved } = await createTestAppContext({ decks: [aDeck([cleanupCard, depsCard])] });
    render(<Rekall {...context} />);

    await user.click(screen.getByRole('button', { name: /Commencer/ }));
    expect(screen.getByRole('heading', { name: cleanupCard.question })).toBeDefined();
    expect(screen.queryByText(cleanupCard.answer)).toBeNull();

    await user.click(screen.getByRole('button', { name: /Afficher la réponse/ }));
    expect(screen.getByText(cleanupCard.answer)).toBeDefined();
    await user.click(screen.getByRole('button', { name: /Bon/ }));

    // Deuxième carte au clavier : Espace pour révéler, 4 pour « Facile ».
    expect(await screen.findByRole('heading', { name: depsCard.question })).toBeDefined();
    await user.keyboard(' ');
    expect(screen.getByText(depsCard.answer)).toBeDefined();
    await user.keyboard('4');

    expect(await screen.findByRole('heading', { name: 'Session terminée' })).toBeDefined();
    expect(saved.map((progress) => progress.cardId)).toEqual([cleanupCard.id, depsCard.id]);

    await user.click(screen.getByRole('button', { name: /Retour à l’accueil/ }));
    expect(await screen.findByText('Reviens demain pour la suite.')).toBeDefined();
  });

  it('remet en fin de session une carte notée « Raté »', async () => {
    const user = userEvent.setup();
    const { context } = await createTestAppContext({ decks: [aDeck([cleanupCard, depsCard])] });
    render(<Rekall {...context} />);

    await user.click(screen.getByRole('button', { name: /Commencer/ }));
    await user.click(screen.getByRole('button', { name: /Afficher la réponse/ }));
    await user.click(screen.getByRole('button', { name: /Raté/ }));
    await user.click(await screen.findByRole('button', { name: /Afficher la réponse/ }));
    await user.click(screen.getByRole('button', { name: /Bon/ }));

    expect(await screen.findByRole('heading', { name: cleanupCard.question })).toBeDefined();
  });

  it('garde la carte affichée et prévient quand la note n’a pas pu être enregistrée', async () => {
    const user = userEvent.setup();
    const { context } = await createTestAppContext({ decks: [aDeck([cleanupCard])], failSaves: true });
    render(<Rekall {...context} />);
    const consoleError = console.error;
    console.error = () => {}; // l'appli journalise l'échec : attendu ici

    try {
      await user.click(screen.getByRole('button', { name: /Commencer/ }));
      await user.click(screen.getByRole('button', { name: /Afficher la réponse/ }));
      await user.click(screen.getByRole('button', { name: /Bon/ }));

      expect((await screen.findByRole('alert')).textContent).toMatch(/pas été enregistrée/);
      expect(screen.getByText(cleanupCard.answer)).toBeDefined();
    } finally {
      console.error = consoleError;
    }
  });
});

describe('Bibliothèque', () => {
  it('cherche une carte, ouvre sa fiche, et la referme avec Échap ou le retour navigateur sans perdre la recherche', async () => {
    const user = userEvent.setup();
    const { context } = await createTestAppContext({
      decks: [aDeck([cleanupCard, depsCard, aCard('keys', { question: 'Pourquoi une key stable dans une liste ?' })])],
    });
    render(<Rekall {...context} />);

    await user.click(screen.getByRole('button', { name: /Bibliothèque/ }));
    await user.type(screen.getByRole('searchbox', { name: 'Rechercher une carte' }), 'key stable');
    expect(screen.getByText('1 résultat')).toBeDefined();

    await user.click(screen.getByRole('button', { name: /Pourquoi une key stable/ }));
    expect(screen.getByRole('button', { name: 'Retour à la bibliothèque' })).toBeDefined();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.getByRole('searchbox', { name: 'Rechercher une carte' })).toHaveProperty('value', 'key stable'));

    await user.click(screen.getByRole('button', { name: /Pourquoi une key stable/ }));
    act(() => window.history.back());
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Retour à la bibliothèque' })).toBeNull());
    expect(screen.getByText('1 résultat')).toBeDefined();
  });
});

describe('Entretien', () => {
  it('sans Claude, se corrige avec la grille des points clés et la réponse de référence', async () => {
    const user = userEvent.setup();
    const now = new Date();
    const cards = Array.from({ length: 20 }, (_, index) => aCard(`card${index}`));
    const { context } = await createTestAppContext({ decks: [aDeck(cards)], progress: cards.map((card) => seenLastWeek(card, now)) });
    render(<Rekall {...context} />);

    await user.click(screen.getByRole('button', { name: /Entretien/ }));
    await user.click(screen.getByRole('button', { name: 'Commencer l’entretien' }));
    await user.click(screen.getByRole('button', { name: 'J’ai fini' }));

    expect(screen.queryByRole('button', { name: /Faire corriger par Claude/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Me corriger avec la grille' }));

    const keyPoints = screen.getByRole('heading', { name: 'Points clés' }).closest('section');
    expect(keyPoints).not.toBeNull();
    await user.click(within(keyPoints as HTMLElement).getByRole('checkbox'));
    expect(within(keyPoints as HTMLElement).getByRole('checkbox')).toHaveProperty('checked', true);
    expect(screen.getByRole('heading', { name: 'Réponse de référence' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Question suivante' })).toBeDefined();
  });
});
