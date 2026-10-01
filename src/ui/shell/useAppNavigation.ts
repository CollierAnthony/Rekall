import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export type Tab = 'today' | 'library';

/** Écran ouvert par-dessus les onglets, en mode focus. */
export type Overlay =
  | { readonly kind: 'review' }
  | { readonly kind: 'interview' }
  | { readonly kind: 'card'; readonly cardId: string };

const OVERLAY_ENTRY = 'rekall-overlay';

function isOverlayEntry(state: unknown): boolean {
  return typeof state === 'object' && state !== null && (state as Record<string, unknown>)[OVERLAY_ENTRY] === true;
}

/**
 * Navigation de l'appli : un onglet courant, et au plus un écran ouvert par-dessus.
 *
 * - Ouvrir un écran ajoute une entrée d'historique : le bouton ou le geste retour du téléphone
 *   referme l'écran au lieu de quitter l'appli. Fermer depuis l'interface passe par
 *   history.back(), donc par le même chemin (l'événement popstate) que le bouton retour.
 * - Chaque onglet retrouve sa position de défilement ; un écran ouvert part du haut.
 */
export function useAppNavigation() {
  const [tab, setTab] = useState<Tab>('today');
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const scrollByTab = useRef(new Map<Tab, number>());

  const viewKey = overlay === null ? `tab:${tab}` : `overlay:${overlay.kind}:${overlay.kind === 'card' ? overlay.cardId : ''}`;

  // Après le rendu du nouvel écran, avant qu'il soit peint : pas de saut visible.
  useLayoutEffect(() => {
    window.scrollTo(0, overlay === null ? (scrollByTab.current.get(tab) ?? 0) : 0);
  }, [viewKey]); // viewKey résume tab et overlay : on ne défile qu'au changement d'écran

  useEffect(() => {
    const closeOnBack = () => setOverlay(null);
    window.addEventListener('popstate', closeOnBack);
    return () => window.removeEventListener('popstate', closeOnBack);
  }, []);

  /** À appeler avant de quitter un onglet : après, la page a déjà changé de hauteur. */
  function rememberTabScroll(): void {
    if (overlay === null) scrollByTab.current.set(tab, window.scrollY);
  }

  function showTab(next: Tab): void {
    if (next === tab) return;
    rememberTabScroll();
    setTab(next);
  }

  /** Ouvre un écran ; depuis un autre écran ouvert, le remplace sans nouvelle entrée d'historique. */
  function openOverlay(next: Overlay): void {
    if (overlay === null) {
      rememberTabScroll();
      try {
        window.history.pushState({ [OVERLAY_ENTRY]: true }, '');
      } catch {
        // Historique indisponible (page encadrée restreinte) : l'écran s'ouvre quand même, sans retour navigateur.
      }
    }
    setOverlay(next);
  }

  function closeOverlay(): void {
    if (isOverlayEntry(window.history.state)) window.history.back();
    else setOverlay(null);
  }

  return { tab, overlay, showTab, openOverlay, closeOverlay };
}
