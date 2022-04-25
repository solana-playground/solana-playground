import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAtom } from "jotai";
import styled, { css, useTheme } from "styled-components";
import { Resizable } from "re-resizable";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";

import { terminalAtom } from "../../../../state";
import { DEFAULT_CURSOR } from "../../../../constants/common";
import { PgTerminal } from "../../../../utils/pg/terminal";
import { PROJECT_NAME } from "../../../../constants";

const Terminal = () => {
  const [terminal] = useAtom(terminalAtom);

  const terminalRef = useRef<HTMLDivElement>(null);

  const theme = useTheme();

  const [term, fitAddon] = useMemo(() => {
    const state = theme.colors.state;

    return [
      new XTerm({
        convertEol: true,
        rendererType: "dom",
        fontFamily: "Hack",
        fontSize: 14,
        theme: {
          brightGreen: state.success.color,
          brightRed: state.error.color,
          brightYellow: state.warning.color,
          brightBlue: state.info.color,
        },
      }),
      new FitAddon(),
    ];
  }, [theme]);

  useEffect(() => {
    if (term && terminalRef.current) {
      const hasChild = terminalRef.current.hasChildNodes();
      if (hasChild)
        terminalRef.current.removeChild(terminalRef.current.childNodes[0]);

      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();

      // TODO: Welcome text
      term.writeln(`Welcome to ${PgTerminal.bold(PROJECT_NAME)}`);
      if (hasChild) term.writeln("");
    }
  }, [term, fitAddon]);

  // New output
  useEffect(() => {
    if (terminalRef.current) {
      term.writeln(PgTerminal.colorText(terminal));
      term.scrollToBottom();
    }
  }, [terminal, term]);

  const handleResize = useCallback(() => {
    fitAddon.fit();
  }, [fitAddon]);

  return (
    <Resizable
      defaultSize={{ height: 200, width: "100%" }}
      minWidth={"100%"}
      handleStyles={{
        topLeft: DEFAULT_CURSOR,
        topRight: DEFAULT_CURSOR,
        right: DEFAULT_CURSOR,
        bottomRight: DEFAULT_CURSOR,
        bottom: DEFAULT_CURSOR,
        bottomLeft: DEFAULT_CURSOR,
        left: DEFAULT_CURSOR,
      }}
      onResize={handleResize}
    >
      <Wrapper>
        <TerminalWrapper ref={terminalRef} id="terminal" />
      </Wrapper>
    </Resizable>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    height: 100%;
    overflow: hidden;
    background-color: ${theme.colors.terminal?.bg ?? "inherit"};
    color: ${theme.colors.terminal?.color ?? "inherit"};
    border-top: 1px solid ${theme.colors.default.primary};
    padding: 1rem 0 0 1rem;
  `}
`;

const TerminalWrapper = styled.div`
  height: 100%;

  & .xterm {
    position: relative;
    user-select: none;
    -ms-user-select: none;
    -webkit-user-select: none;
    cursor: text;
  }

  & .xterm.focus,
  & .xterm:focus {
    outline: none;
  }

  & .xterm .xterm-helpers {
    position: absolute;
    top: 0;
    /**
   * The z-index of the helpers must be higher than the canvases in order for
   * IMEs to appear on top.
   */
    z-index: 5;
  }

  & .xterm .xterm-helper-textarea {
    padding: 0;
    border: 0;
    margin: 0;
    /* Move textarea out of the screen to the far left, so that the cursor is not visible */
    position: absolute;
    opacity: 0;
    left: -9999em;
    top: 0;
    width: 0;
    height: 0;
    z-index: -5;
    /** Prevent wrapping so the IME appears against the textarea at the correct position */
    white-space: nowrap;
    overflow: hidden;
    resize: none;
  }

  & .xterm .composition-view {
    display: none;
    position: absolute;
    white-space: nowrap;
    z-index: 1;
  }

  & .xterm .composition-view.active {
    display: block;
  }

  & .xterm .xterm-viewport {
    background-color: inherit !important;
    overflow-y: scroll;
    cursor: default;
    position: absolute;
    right: 0;
    left: 0;
    top: 0;
    bottom: 0;
  }

  & .xterm .xterm-screen {
    position: relative;
  }

  & .xterm .xterm-screen canvas {
    position: absolute;
    left: 0;
    top: 0;
  }

  & .xterm .xterm-scroll-area {
    visibility: hidden;
  }

  & .xterm-char-measure-element {
    display: inline-block;
    visibility: hidden;
    position: absolute;
    top: 0;
    left: -9999em;
    line-height: normal;
  }

  & .xterm.enable-mouse-events {
    /* When mouse events are enabled (eg. tmux), revert to the standard pointer cursor */
    cursor: default;
  }

  & .xterm.xterm-cursor-pointer,
  .xterm .xterm-cursor-pointer {
    cursor: pointer;
  }

  & .xterm.column-select.focus {
    /* Column selection mode */
    cursor: crosshair;
  }

  & .xterm .xterm-accessibility,
  & .xterm .xterm-message {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
    z-index: 10;
    color: transparent;
  }

  & .xterm .live-region {
    position: absolute;
    left: -9999px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  & .xterm-dim {
    opacity: 0.5;
  }

  & .xterm-underline {
    text-decoration: underline;
  }

  & .xterm-strikethrough {
    text-decoration: line-through;
  }

  & .xterm-screen .xterm-decoration-container .xterm-decoration {
    z-index: 6;
    position: absolute;
  }

  & .xterm-decoration-overview-ruler {
    z-index: 7;
    position: absolute;
    top: 0;
    right: 0;
  }

  /* TODO: */
  & .xterm.xterm-cursor-block,
  .xterm .xterm-cursor-block {
    display: none;
  }

  /* Fixes weird spacing */
  & .xterm-dom-renderer-owner-1 .xterm-rows span {
    display: inline;
  }
`;

export default Terminal;
