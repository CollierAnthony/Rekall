import { Suspense, use } from 'react';
import type { AppContext } from '../composition-root';
import { ErrorBoundary } from './ErrorBoundary';
import { Home } from './Home';

type AppProps = {
  readonly appContext: Promise<AppContext>;
};

export function App({ appContext }: AppProps) {
  return (
    <div className="app">
      <ErrorBoundary fallback={(error) => <LoadFailure error={error} />}>
        <Suspense fallback={<p className="app__status" role="status">Chargement de tes cartes…</p>}>
          <LoadedApp appContext={appContext} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

function LoadedApp({ appContext }: AppProps) {
  const context = use(appContext);
  return <Home {...context} />;
}

function LoadFailure({ error }: { readonly error: Error }) {
  return (
    <div className="app__failure" role="alert">
      <h1 className="app__failure-title">Impossible de charger les cartes</h1>
      <p>{error.message}</p>
      <p>Recharge la page. Si le problème persiste, un fichier de deck est sans doute invalide.</p>
    </div>
  );
}
