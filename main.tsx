import React from 'react';
import ReactDOM from 'react-dom/client';
import { APP_NAME, APP_VERSION } from '@lingua/shared';
import { initializeDatabase } from './services/database';
import './styles.css';

async function bootstrap(): Promise<void> {
  await initializeDatabase();

  ReactDOM.createRoot(
    document.getElementById('root')!
  ).render(
    <React.StrictMode>
      <main className="app">
        <section className="card">
          <h1>{APP_NAME}</h1>
          <p>Offline-first AI Assistant</p>
          <span>v{APP_VERSION}</span>
          <small>SQLite initialized</small>
        </section>
      </main>
    </React.StrictMode>
  );
}

bootstrap().catch((error: unknown) => {
  console.error('Application bootstrap failed:', error);

  const root = document.getElementById('root');

  if (root) {
    root.innerHTML = `
      <main class="app">
        <section class="card">
          <h1>Database Error</h1>
          <p>Unable to initialize local database.</p>
        </section>
      </main>
    `;
  }
});
