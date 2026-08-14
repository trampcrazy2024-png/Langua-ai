import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { APP_NAME, APP_VERSION } from '@lingua/shared';
import './styles.css';
import LocalAI from './services/localAI';
import {
  checkLocalAI,
  type LocalAIStatus
} from './services/localAIService';

function App() {
  const [status, setStatus] = useState<LocalAIStatus | null>(null);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void checkLocalAI().then(setStatus);
  }, []);

  async function sendMessage() {
    const text = message.trim();

    if (!text || loading) {
      return;
    }

    setLoading(true);
    setResponse('');

    try {
      const result = await LocalAI.chat({
        message: text
      });

      setResponse(result.response);
    } catch (error) {
      setResponse(
        error instanceof Error
          ? error.message
          : 'Local AI request failed.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app">
      <section className="card">
        <h1>{APP_NAME}</h1>

        <p>Offline-first AI Assistant</p>

        <span>{APP_VERSION}</span>

        <div className="status">
          <strong>Local AI:</strong>

          {status === null && <p>Checking...</p>}

          {status !== null && (
            <p>
              {status.available
                ? `Ready — ${status.engine}`
                : 'Unavailable'}
            </p>
          )}
        </div>

        <div className="chat">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask something..."
            rows={4}
            disabled={loading}
          />

          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={loading || !message.trim()}
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>

          {response && (
            <div className="response">
              <strong>Local AI</strong>
              <p>{response}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
