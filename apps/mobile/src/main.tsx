import React from 'react';
import ReactDOM from 'react-dom/client';
import { APP_NAME, APP_VERSION } from '@lingua/shared';
import './styles.css';

function App() {
  return (
    <main className="app">
      <section className="card">
        <h1>{APP_NAME}</h1>
        <p>Offline-first AI Assistant</p>
        <span>v{APP_VERSION}</span>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
