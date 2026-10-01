import { Icon, type IconName } from '../shared/Icon';
import type { Tab } from './useAppNavigation';

/** Un onglet n'apparaît que quand sa section existe, avec son contenu (Pratique et Guides viendront ensuite). */
const TABS: readonly { readonly id: Tab; readonly label: string; readonly icon: IconName }[] = [
  { id: 'today', label: 'Aujourd’hui', icon: 'calendar' },
  { id: 'library', label: 'Bibliothèque', icon: 'library' },
];

type TabBarProps = {
  readonly current: Tab;
  readonly onSelect: (tab: Tab) => void;
};

/** Barre flottante en bas sur téléphone, colonne latérale avec le nom de l'appli sur ordinateur. */
export function TabBar({ current, onSelect }: TabBarProps) {
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      <p className="tabbar__brand">
        <span className="tabbar__logo" aria-hidden="true" />
        Rekall
      </p>
      <ul className="tabbar__list">
        {TABS.map((tab) => (
          <li key={tab.id}>
            <button type="button" className="tabbar__item" aria-current={tab.id === current ? 'page' : undefined} onClick={() => onSelect(tab.id)}>
              <Icon name={tab.icon} />
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
