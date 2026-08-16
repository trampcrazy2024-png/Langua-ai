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
  const [modelName, setModelName] = useState('');
  const [modelPath, setModelPath] = useState('');
  const [modelSize, setModelSize] = useState(0);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void checkLocalAI().then(setStatus);
  }, []);

  async function selectModel() {
    if (modelLoading || loading) {
      return;
    }

    setError('');
    setResponse('');
    setModelLoading(true);

    try {
      const result = await LocalAI.pickModel();

      if (!result.ok || !result.path) {
        throw new Error('Model selection failed.');
      }

      setModelName(result.name);
      setModelPath(result.path);
      setModelSize(result.size);

      const loaded = await LocalAI.loadModel({
        path: result.path
      });

      if (!loaded.loaded) {
        throw new Error('Model could not be loaded.');
      }

      setStatus({
        available: true,
        native: true,
        modelLoaded: loaded.loaded,
        modelPath: loaded.path,
        engine: loaded.engine || 'llama.cpp'
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to select or load model.'
      );
    } finally {
      setModelLoading(false);
    }
  }

  async function unloadModel() {
    if (modelLoading || loading) {
      return;
    }

    setError('');

    try {
      await LocalAI.unloadModel();

      setModelName('');
      setModelPath('');
      setModelSize(0);

      const nextStatus = await checkLocalAI();
      setStatus(nextStatus);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to unload model.'
      );
    }
  }

  async function sendMessage() {
    const text = message.trim();

    if (!text || loading) {
      return;
    }

    setLoading(true);
    setResponse('');
    setError('');

    try {
      const result = await LocalAI.chat({
        message: text
      });

      setResponse(result.value);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Local AI request failed.'
      );
    } finally {
      setLoading(false);
    }
  }

  function formatSize(bytes: number): string {
    if (!bytes) {
      return '';
    }

    const units = ['B', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unit = 0;

    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit += 1;
    }

    return `${value.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
  }

  const isModelLoaded = Boolean(modelPath);

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

        <div className="model">
          <h2>Local Model</h2>

          {!isModelLoaded && (
            <button
              type="button"
              onClick={() => void selectModel()}
              disabled={modelLoading || loading}
            >
              {modelLoading
                ? 'Selecting model...'
                : 'Select GGUF Model'}
            </button>
          )}

          {isModelLoaded && (
            <>
              <p>
                <strong>{modelName}</strong>
              </p>

              {modelSize > 0 && (
                <p>Size: {formatSize(modelSize)}</p>
              )}

              <button
                type="button"
                onClick={() => void unloadModel()}
                disabled={modelLoading || loading}
              >
                Unload Model
              </button>
            </>
          )}
        </div>

        <div className="chat">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              isModelLoaded
                ? 'Ask something...'
                : 'Load a GGUF model first...'
            }
            rows={4}
            disabled={loading || !isModelLoaded}
          />

          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={
              loading ||
              !isModelLoaded ||
              !message.trim()
            }
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>

          {response && (
            <div className="response">
              <strong>Local AI:</strong>
              <p>{response}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="error">
            <strong>Error:</strong>
            <p>{error}</p>
          </div>
        )}
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
