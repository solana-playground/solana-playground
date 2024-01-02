import { Component, ErrorInfo, ReactNode } from "react";

import Fallback from "./Fallback";

interface Props {
  /** Node to render as children */
  children?: ReactNode;
  /** Fallback node when there is an error */
  fallback?: ReactNode;
}

interface State {
  /** Error that was thrown */
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  /**
   * Derive the state from the given error.
   *
   * @param error error that was thrown
   * @returns the state
   */
  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { error };
  }

  /** State of the component */
  state: State = { error: null };

  /**
   * Callback to run when an error is caught.
   *
   * @param error error that was thrown
   * @param info information about the error, e.g. stack trace
   */
  componentDidCatch(error: Error, info: ErrorInfo) {
    // Example `info.componentStack`:
    //   in ComponentThatThrows (created by App)
    //   in ErrorBoundary (created by App)
    //   in div (created by App)
    //   in App
    // There is no need to log the error because it's logged automatically
  }

  /** Render `fallback` if there is an error, `children` otherwise. */
  render() {
    if (this.state.error) {
      return this.props.fallback ?? <Fallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
