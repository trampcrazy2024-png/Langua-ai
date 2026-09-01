import React from "react";

interface Props {
  children: React.ReactNode;
  /** Shown in the recovery message so the learner knows what broke. */
  label: string;
}

interface State {
  error: Error | null;
}

/**
 * Crash Recovery at the UI level: wraps each tab's content so a runtime
 * error thrown while rendering (e.g. an unexpected shape back from a
 * native plugin or the gateway) shows a recoverable screen with a "try
 * again" button instead of taking down the whole app. This is a
 * complement to, not a replacement for, the try/catch error handling
 * already in ChatTab.tsx etc. around individual async calls - those
 * catch expected failures (network down, model not loaded); this catches
 * unexpected ones during rendering itself.
 */
export class TabErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[TabErrorBoundary:${this.props.label}]`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 m-4 text-center space-y-2">
          <p className="text-sm font-black text-red-400">⚠️ خطایی در بخش «{this.props.label}» رخ داد</p>
          <p className="text-[11px] text-[#94A3B8]">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="text-[11px] font-black bg-red-500 text-white px-3 py-1.5 rounded-lg"
          >
            تلاش دوباره
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
