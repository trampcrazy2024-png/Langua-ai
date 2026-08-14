import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { APP_NAME, APP_VERSION } from '@lingua/shared';
import './styles.css';
import {
  checkLocalAI,
  type LocalAIStatus
} from './services/localAIService';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

function App() {
  const [status, setStatus] = useState<LocalAIStatus | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! How can I help you today?'
    }
  ]);

  useEffect(() => {
    void checkLocalAI().then(setStatus);
  }, []);

  function sendMessage() {
    const text = input.trim();

    if (!text) {
      return;
    }

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: text
    };

    setMessages((current) => [
      ...current,
      userMessage
    ]);

    setInput('');

    const assistantMessage: Message = {
      id: `${Date.now()}-assistant`,
      role: 'assistant',
      content: status?.available
        ? `Local AI (${status.engine}) is ready.`
        : 'Local AI is currently unavailable.'
    };

    setMessages((current) => [
      ...current,
      assistantMessage
    ]);
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <main className="app">
      <section className="assistant">
        <header className="header">
          <div>
            <h1>{APP_NAME}</h1>
            <p>Offline-first AI Assistant</p>
          </div>

          <span className="version">
            v{APP_VERSION}
          </span>
        </header>

        <div className="ai-status">
          <span
            className={
              status?.available
                ? 'status-dot online'
                : 'status-dot'
            }
          />

          <span>
            {status === null
              ? 'Checking Local AI...'
              : status.available
                ? `Local AI · ${status.engine}`
                : 'Local AI unavailable'}
          </span>
        </div>

        <section className="messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.role}`}
            >
              {message.content}
            </div>
          ))}
        </section>

        <footer className="composer">
          <textarea
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Ask something..."
            rows={1}
            aria-label="Message"
          />

          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim()}
          >
            Send
          </button>
        </footer>
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
