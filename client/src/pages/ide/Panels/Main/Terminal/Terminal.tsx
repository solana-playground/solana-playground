import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled, { css, useTheme } from "styled-components";
import "xterm/css/xterm.css";

import Button from "../../../../../components/Button";
import ProgressBar from "../../../../../components/ProgressBar";
import Resizable from "../../../../../components/Resizable";
import { COMMANDS } from "../../../../../commands";
import {
  Clear,
  Close,
  DoubleArrow,
  Tick,
} from "../../../../../components/Icons";
import {
  PgCommandManager,
  PgCommon,
  PgEditor,
  PgTerm,
  PgTerminal,
  PgTheme,
} from "../../../../../utils/pg";
import { EventName } from "../../../../../constants";
import {
  useExposeStatic,
  useKeybind,
  useSetStatic,
} from "../../../../../hooks";

const Terminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);

  const theme = useTheme();

  // Create xterm
  const term = useMemo(() => {
    const xterm = theme.components.terminal.xterm;

    // Set the available commands
    PgCommandManager.commands = COMMANDS;

    return new PgTerm(PgCommandManager, {
      convertEol: true,
      rendererType: "dom",
      fontFamily: theme.font.code.family,
      fontSize: 14,
      cursorBlink: xterm.cursor.blink,
      cursorStyle: xterm.cursor.kind,
      tabStopWidth: 4,
      theme: {
        foreground: xterm.textPrimary,
        brightBlack: xterm.textSecondary,
        black: xterm.textSecondary,
        brightMagenta: xterm.primary,
        brightCyan: xterm.secondary,
        brightGreen: xterm.success,
        brightRed: xterm.error,
        brightYellow: xterm.warning,
        brightBlue: xterm.info,
        selection: xterm.selectionBg,
        cursor: xterm.cursor.color,
        cursorAccent: xterm.cursor.accentColor,
      },
    });
  }, [theme]);

  useExposeStatic(term, EventName.TERMINAL_STATIC);

  // Open terminal
  useEffect(() => {
    if (terminalRef.current) {
      if (terminalRef.current.hasChildNodes()) {
        terminalRef.current.removeChild(terminalRef.current.childNodes[0]);
      }

      term.open(terminalRef.current);
    }
  }, [term]);

  // Resize
  const [height, setHeight] = useState(PgTerminal.DEFAULT_HEIGHT);
  useSetStatic(setHeight, EventName.TERMINAL_HEIGHT_SET);

  const termRef = useRef<HTMLDivElement>(null);

  // Handle resize
  useEffect(() => {
    const termEl = termRef.current!;
    const observer = new ResizeObserver(
      PgCommon.throttle(() => term.fit(), 200)
    );
    observer.observe(termEl);
    return () => observer.unobserve(termEl);
  }, [term]);

  const handleResizeStop = useCallback((_e, _dir, _ref, d) => {
    setHeight((h) => {
      const result = h + d.height;
      if (result > PgTerminal.MAX_HEIGHT) return PgTerminal.MAX_HEIGHT;
      return result;
    });
  }, []);

  // Buttons
  const clear = useCallback(() => {
    term.clear();
  }, [term]);

  const toggleMaximize = useCallback(() => {
    setHeight((h) =>
      h === PgTerminal.MAX_HEIGHT
        ? PgTerminal.DEFAULT_HEIGHT
        : PgTerminal.MAX_HEIGHT
    );
  }, []);

  const toggleMinimize = useCallback(() => {
    setHeight((h) =>
      h === PgTerminal.MIN_HEIGHT
        ? PgTerminal.DEFAULT_HEIGHT
        : PgTerminal.MIN_HEIGHT
    );
  }, []);

  // Keybinds
  useKeybind(
    [
      {
        keybind: "Ctrl+L",
        handle: () => {
          if (PgTerminal.isFocused()) clear();
        },
      },
      {
        keybind: "Ctrl+`",
        handle: () => {
          if (PgTerminal.isFocused()) {
            toggleMinimize();
            PgEditor.focus();
          } else {
            if (height === PgTerminal.MIN_HEIGHT) toggleMinimize(); // Minimized
            term.focus();
          }
        },
      },
      {
        keybind: "Ctrl+M",
        handle: toggleMaximize,
      },
      {
        keybind: "Ctrl+J",
        handle: () => {
          toggleMinimize();
          if (height === PgTerminal.MIN_HEIGHT) term.focus();
          else PgEditor.focus();
        },
      },
    ],
    [term, height, clear, toggleMinimize, toggleMaximize]
  );

  return (
    <Resizable
      size={{ height, width: "100%" }}
      minWidth="100%"
      minHeight={PgTerminal.MIN_HEIGHT}
      onResizeStop={handleResizeStop}
      enable="top"
    >
      <Wrapper ref={termRef}>
        <Topbar>
          <TerminalProgress />
          <ButtonsWrapper>
            <Button
              kind="icon"
              title={PgCommon.getKeybindTextOS("Clear (Ctrl+L)")}
              onClick={clear}
            >
              <Clear />
            </Button>
            <Button
              kind="icon"
              title={PgCommon.getKeybindTextOS("Toggle Maximize (Ctrl+M)")}
              onClick={toggleMaximize}
            >
              {height === PgTerminal.MAX_HEIGHT &&
              PgTerminal.MAX_HEIGHT !== PgTerminal.DEFAULT_HEIGHT ? (
                <DoubleArrow rotate="180deg" />
              ) : (
                <DoubleArrow />
              )}
            </Button>
            <Button
              kind="icon"
              title={PgCommon.getKeybindTextOS("Toggle Close (Ctrl+`)")}
              onClick={toggleMinimize}
            >
              {height === PgTerminal.MIN_HEIGHT ? <Tick /> : <Close />}
            </Button>
          </ButtonsWrapper>
        </Topbar>
        <TerminalWrapper ref={terminalRef} />
      </Wrapper>
    </Resizable>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.getScrollbarCSS({ allChildren: true })};
    ${PgTheme.convertToCSS(theme.components.terminal.default)};
  `}
`;

const TerminalProgress = () => {
  const [progress, setProgress] = useState(0);
  useSetStatic(setProgress, EventName.TERMINAL_PROGRESS_SET);
  return <ProgressBar value={progress} />;
};

const Topbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: ${PgTerminal.MIN_HEIGHT}px;
  padding: 0 1rem;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  margin-left: 0.5rem;

  & button {
    margin-left: 0.25rem;
  }

  & button.down svg {
    transform: rotate(180deg);
  }
`;

// `minHeight` fixes text going below too much which made bottom text invisible
const TerminalWrapper = styled.div`
  height: calc(100% - ${PgTerminal.MIN_HEIGHT}px);
  margin-left: 1rem;

  & .xterm-viewport {
    background: inherit !important;
    width: 100% !important;
  }
`;

export default Terminal;
