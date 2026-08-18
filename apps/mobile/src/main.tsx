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
  const [modelLoading, setModelLoading] = useState(false);
  const [error, setError] = useState('');
  const [importedModel, setImportedModel] = useState<{
    path: string;
    name: string;
    size: number;
  } | null>(null);

  useEffect(() => {
    void refreshStatus();
  }, []);

  async function refreshStatus() {
    const nextStatus = await checkLocalAI();
    setStatus(nextStatus);
  }

  async function importModel() {
    if (modelLoading || loading) {
      return;
    }

    setError('');
    setResponse('');
    setModelLoading(true);

    try {
      /*
       * IMPORTANT:
       * This step ONLY imports/copies the GGUF file.
       *
       * It intentionally does NOT call nativeLoadModel().
       * This lets us determine whether the Android crash happens
       * during file import or during llama.cpp model loading.
       */
      const selected = await LocalAI.pickModel();

      if (!selected.ok || !selected.path) {
        throw new Error('No model was selected.');
      }

      setImportedModel({
        path: selected.path,
        name: selected.name || selected.path.split('/').pop() || 'model.gguf',
        size: selected.size || 0
      });

      await refreshStatus();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to import the model.'
      );
    } finally {
      setModelLoading(false);
    }
  }

  async function loadImportedModel() {
    if (modelLoading || loading || !importedModel) {
      return;
    }

    setError('');
    setResponse('');
    setModelLoading(true);

    try {
      /*
       * This is now the ONLY place where nativeLoadModel()
       * can be called from the UI.
       */
      const loaded = await LocalAI.loadModel({
        path: importedModel.path
      });

      if (!loaded.ok || !loaded.loaded) {
        throw new Error('Failed to load the selected model.');
      }

      await refreshStatus();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load the model.'
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
    setResponse('');
    setModelLoading(true);

    try {
      await LocalAI.unloadModel();
      await refreshStatus();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to unload the model.'
      );
    } finally {
      setModelLoading(false);
    }
  }

  async function sendMessage() {
    const text = message.trim();

    if (!text || loading || !status?.modelLoaded) {
      return;
    }

    setLoading(true);
    setResponse('');
    setError('');

    try {
      const result = await LocalAI.chat({
        message: text
      });

      setResponse(result.value || '');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Local AI request failed.'
      );
    } finally {
      setLoading(false);
    }
  }

  const isModelLoaded = status?.modelLoaded === true;

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
            <>
              <p>
                {status.available
                  ? `Ready — ${status.engine}`
                  : 'Unavailable'}
              </p>

              <p>
                Model:{' '}
                {isModelLoaded
                  ? status.modelPath
                    ? status.modelPath.split('/').pop()
                    : 'Loaded'
                  : 'No local model is loaded'}
              </p>
            </>
          )}

          {importedModel && !isModelLoaded && (
            <p>
              Imported:{' '}
              <strong>{importedModel.name}</strong>
            </p>
          )}
        </div>

        <div className="model-controls">
          <button
            type="button"
            onClick={() => void importModel()}
            disabled={
              modelLoading ||
              loading ||
              !status?.available
            }
          >
            {modelLoading
              ? 'Importing...'
              : 'Import GGUF Model'}
          </button>

          {importedModel && !isModelLoaded && (
            <button
              type="button"
              onClick={() => void loadImportedModel()}
              disabled={modelLoading || loading}
            >
              {modelLoading
                ? 'Loading...'
                : 'Load Model'}
            </button>
          )}

          {isModelLoaded && (
            <button
              type="button"
              onClick={() => void unloadModel()}
              disabled={modelLoading || loading}
            >
              Unload Model
            </button>
          )}
        </div>

        <div className="chat">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
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
              modelLoading ||
              !isModelLoaded ||
              !message.trim()
            }
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>

          {error && (
            <div className="response">
              <strong>Error:</strong>
              <p>{error}</p>
            </div>
          )}

          {response && (
            <div className="response">
              <strong>Local AI:</strong>
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
