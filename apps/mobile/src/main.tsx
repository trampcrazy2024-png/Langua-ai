import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { APP_NAME, APP_VERSION } from '@lingua/shared';
import './styles.css';
import {
  checkLocalAI,
  sendToLocalAI,
  type LocalAIStatus,
} from './services/localAIService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [status, setStatus] = useState<LocalAIStatus | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void checkLocalAI().then(setStatus);
  }, []);

  async function handleSend() {
    const message = input.trim();

    if (!message || sending) {
      return;
    }

    setInput('');
    setMessages((current) => [
      ...current,
      {
        role: 'user',
        content: message,
      },
    ]);

    setSending(true);

    try {
      const result = await sendToLocalAI(message);

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: result.response,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content:
            error instanceof Error
              ? error.message
              : 'Local AI request failed.',
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleSend();
    }
  }

  return (
    <main className="app">
      <section className="card">
        <header>
          <h1>{APP_NAME}</h1>
          <p>Offline-First AI Assistant</p>
          <span>{APP_VERSION}</span>

          <div className="status">
            <strong>Local AI</strong>
            <p>
              {status === null
                ? 'Checking...'
                : status.available
                  ? `Online — ${status.engine}`
                  : 'Unavailable'}
            </p>
          </div>
        </header>

        <section className="chat">
          {messages.length === 0 && (
            <div className="empty">
              <h2>How can I help?</h2>
              <p>
                Send a message to test the local AI connection.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`message ${message.role}`}
            >
              <strong>
                {message.role === 'user' ? 'You' : 'Local AI'}
              </strong>
              <p>{message.content}</p>
            </div>
          ))}
        </section>

        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend();
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something..."
            disabled={sending}
            autoComplete="off"
          />

          <button
            type="submit"
            disabled={sending || !input.trim()}
          >
            {sending ? '...' : 'Send'}
          </button>
        </form>
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
