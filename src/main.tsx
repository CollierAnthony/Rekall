import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { startApp } from './composition-root';
import { App } from './ui/App';
import './ui/styles.css';

const rootElement = document.getElementById('root');
if (rootElement === null) throw new Error('Élément #root introuvable dans la page');

// La promesse est créée une seule fois, hors du rendu, puis lue avec use() dans App.
createRoot(rootElement).render(
  <StrictMode>
    <App appContext={startApp()} />
  </StrictMode>,
);
