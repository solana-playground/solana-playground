import { Component, CSSProperties, ErrorInfo, ReactNode } from "react";

import Button from "../Button";
import Tooltip from "../Tooltip";
import Fallback from "./Fallback";
import { Refresh } from "../Icons";

interface Props {
  /** Node to render as children */
  children?: ReactNode;
  /** Fallback node when there is an error */
  Fallback?: (props: { error: Error }) => JSX.Element;
  /** If truthy, add a refresh button to re-render the component */
  refreshButton?: boolean | CSSProperties;
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
      const FbComponent = this.props.Fallback ?? Fallback;
      const FbElement = <FbComponent error={this.state.error} />;

      if (this.props.refreshButton) {
        // Reset the state (without the error) in order to re-render
        const refresh = () => this.setState((s) => ({ ...s, error: null }));
        const style = {
          ...(typeof this.props.refreshButton === "object"
            ? this.props.refreshButton
            : {}),
        };

        if (this.props.Fallback) {
          return (
            <div>
              <Tooltip element="Refresh">
                <Button kind="icon" onClick={refresh} style={style}>
                  <Refresh color="error" />
                </Button>
              </Tooltip>

              {FbElement}
            </div>
          );
        }

        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column-reverse",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
            }}
          >
            <Button
              kind="secondary-transparent"
              leftIcon={<Refresh />}
              onClick={refresh}
              style={style}
            >
              Refresh
            </Button>

            {FbElement}
          </div>
        );
      }

      return FbElement;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
