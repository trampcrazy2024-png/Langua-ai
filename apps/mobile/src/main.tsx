import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { APP_NAME, APP_VERSION } from '@lingua/shared';
import './styles.css';
import {
  checkLocalAI,
  type LocalAIStatus
} from './services/localAIService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [status, setStatus] = useState<LocalAIStatus | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    void checkLocalAI().then(setStatus);
  }, []);

  async function sendMessage() {
    const text = input.trim();

    if (!text || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: text
    };

    setMessages((current) => [
      ...current,
      userMessage
    ]);

    setInput('');
    setIsSending(true);

    try {
      let response = 'Local AI is not available yet.';

      if (status?.available) {
        response = `Local AI (${status.engine}) is ready.`;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 300)
      );

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: response
      };

      setMessages((current) => [
        ...current,
        assistantMessage
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <main className="app">
      <section className="card">
        <header>
          <h1>{APP_NAME}</h1>

          <p>
            Offline-first AI Assistant
          </p>

          <span>{APP_VERSION}</span>
        </header>

        <div className="status">
          <strong>Local AI</strong>

          {status === null && (
            <p>Checking...</p>
          )}

          {status !== null && (
            <p>
              {status.available
                ? `Online — ${status.engine}`
                : 'Unavailable'}
            </p>
          )}
        </div>

        <section className="chat">
          {messages.length === 0 && (
            <div className="welcome">
              <h2>How can I help?</h2>

              <p>
                Ask anything. Your conversation
                starts here.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <article
              key={message.id}
              className={`message ${message.role}`}
            >
              <strong>
                {message.role === 'user'
                  ? 'You'
                  : APP_NAME}
              </strong>

              <p>{message.content}</p>
            </article>
          ))}
        </section>

        <div className="composer">
          <textarea
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Ask something..."
            rows={2}
            disabled={isSending}
          />

          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={
              isSending || input.trim().length === 0
            }
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
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
