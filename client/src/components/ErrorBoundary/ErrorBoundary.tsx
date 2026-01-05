import { Component, ErrorInfo, ReactNode } from "react";
import styled, { css } from "styled-components";

import Button from "../Button";
import Tooltip from "../Tooltip";
import Fallback from "./Fallback";
import ThrowError from "./ThrowError";
import { Refresh } from "../Icons";

interface Props {
  /** Node to render as children */
  children?: ReactNode | ChildrenError;
  /** Fallback node when there is an error */
  Fallback?: (props: { error: Error }) => JSX.Element;
}

interface State {
  /** Error that was thrown */
  error: Error | null;
}

interface ChildrenError {
  /** Error that was thrown */
  error: Error;
  /** Refresh the component (need to change the `children`) */
  refresh: () => Promise<unknown>;
}

class ErrorBoundary extends Component<Props, State> {
  /**
   * Extract `props.children` error props with proper type support.
   *
   * @param prop children error prop
   * @param props props to check
   * @returns
   */
  extractChildrenErrorProp<P extends keyof ChildrenError>(
    prop: P,
    props = this.props
  ) {
    return (props.children as Partial<ChildrenError>)?.[prop];
  }

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
  state: State = { error: this.extractChildrenErrorProp("error") ?? null };

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

  /** Update the state with an error the first time props have an error */
  componentDidUpdate(prevProps: Readonly<Props>) {
    const prevErr = this.extractChildrenErrorProp("error", prevProps);
    const curErr = this.extractChildrenErrorProp("error");
    if (!prevErr && curErr) this.setState((s) => ({ ...s, error: curErr }));
  }

  /** Render `fallback` if there is an error, `children` otherwise. */
  render() {
    if (this.state.error) {
      const FbComponent = this.props.Fallback ?? Fallback;
      const FbElement = <FbComponent error={this.state.error} />;

      // Reset the state (without the error) in order to re-render
      const refresh = () => this.setState((s) => ({ ...s, error: null }));

      if (this.props.Fallback) {
        return (
          <Wrapper iconOnly>
            {FbElement}

            <Tooltip element="Refresh">
              <Button kind="icon" onClick={refresh}>
                <Refresh color="error" />
              </Button>
            </Tooltip>
          </Wrapper>
        );
      }

      return (
        <Wrapper>
          {FbElement}

          <Button
            kind="secondary-transparent"
            leftIcon={<Refresh />}
            onClick={refresh}
          >
            Refresh
          </Button>
        </Wrapper>
      );
    }

    const refresh = this.extractChildrenErrorProp("refresh");
    if (refresh) return <ThrowError refresh={refresh} />;

    return this.props.children;
  }
}

const Wrapper = styled.div<{ iconOnly?: boolean }>`
  ${({ iconOnly }) => css`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: ${iconOnly ? "row-reverse" : "column"};
    gap: ${iconOnly ? "0.25rem" : "1rem"};
  `}
`;

export default ErrorBoundary;
