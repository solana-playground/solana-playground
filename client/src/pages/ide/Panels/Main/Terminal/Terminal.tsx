import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import styled, { css, useTheme } from "styled-components";
import { Resizable } from "re-resizable";
import "xterm/css/xterm.css";

import Button from "../../../../../components/Button";
import ProgressBar from "../../../../../components/ProgressBar";
import { COMMANDS } from "../../../../../commands";
import {
  Clear,
  Close,
  DoubleArrow,
  Tick,
} from "../../../../../components/Icons";
import { terminalProgressAtom } from "../../../../../state";
import {
  PgCommandExecutor,
  PgCommon,
  PgEditor,
  PgTerm,
  PgTerminal,
  PgTheme,
} from "../../../../../utils/pg";
import { EventName } from "../../../../../constants";
import { useTerminal } from "./useTerminal";
import { useExposeStatic } from "../../../../../hooks";

const Terminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useTerminal();

  const theme = useTheme();

  // Create xterm
  const term = useMemo(() => {
    const xterm = theme.components.terminal.xterm;

    // Set the available commands
    PgCommandExecutor.commands = COMMANDS;

    return new PgTerm(PgCommandExecutor.execute, {
      convertEol: true,
      rendererType: "dom",
      fontFamily: theme.font.code.family,
      fontSize: 14,
      cursorBlink: xterm.cursor.blink,
      cursorStyle: xterm.cursor.kind,
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

  const maxButtonRef = useRef<HTMLButtonElement>(null);

  const toggleMaximize = useCallback(() => {
    setHeight((h) => {
      if (h === PgTerminal.MAX_HEIGHT) {
        maxButtonRef.current?.classList.remove("down");
        return PgTerminal.DEFAULT_HEIGHT;
      }
      maxButtonRef.current?.classList.add("down");
      return PgTerminal.MAX_HEIGHT;
    });
  }, []);

  const [isClosed, setIsClosed] = useState(false);

  const toggleClose = useCallback(() => {
    setIsClosed((c) => !c);
    setHeight((h) => {
      if (h === 0) return PgTerminal.DEFAULT_HEIGHT;
      return 0;
    });
  }, []);

  // Keybinds
  useEffect(() => {
    const handleKeybinds = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (PgCommon.isKeyCtrlOrCmd(e)) {
        switch (key) {
          case "L":
            e.preventDefault();
            if (PgTerminal.isFocused()) {
              clear();
            }
            break;

          case "`":
            e.preventDefault();
            if (PgTerminal.isFocused()) {
              toggleClose();
              PgEditor.focus();
            } else if (!height) {
              // Terminal is minimized
              toggleClose();
              term.focus();
            } else term.focus();

            break;

          case "M":
            e.preventDefault();
            toggleMaximize();
            break;

          case "J":
            e.preventDefault();
            toggleClose();
            if (!height) term.focus();
            else PgEditor.focus();

            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeybinds);
    return () => document.removeEventListener("keydown", handleKeybinds);
  }, [term, height, clear, toggleClose, toggleMaximize]);

  return (
    <Resizable
      size={{ height, width: "100%" }}
      minWidth="100%"
      minHeight={PgTerminal.MIN_HEIGHT}
      onResizeStop={handleResizeStop}
      enable={{
        top: true,
        right: false,
        bottom: false,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
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
              ref={maxButtonRef}
            >
              <DoubleArrow />
            </Button>
            <Button
              kind="icon"
              title={PgCommon.getKeybindTextOS("Toggle Close (Ctrl+`)")}
              onClick={toggleClose}
            >
              {isClosed ? <Tick /> : <Close />}
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
    height: 100%;
    ${PgTheme.convertToCSS(theme.components.terminal.default)};

    /* Scrollbar */
    /* Chromium */
    & ::-webkit-scrollbar {
      width: 0.5rem;
    }

    & ::-webkit-scrollbar-track {
      background-color: transparent;
    }

    & ::-webkit-scrollbar-thumb {
      border: 0.25rem solid transparent;
      border-radius: ${theme.default.borderRadius};
      background-color: ${theme.default.scrollbar.thumb.color};
    }

    & ::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.default.scrollbar.thumb.hoverColor};
    }

    /* Firefox */
    & * {
      scrollbar-color: ${theme.default.scrollbar.thumb.color};
    }
  `}
`;

const TerminalProgress = () => {
  const [progress] = useAtom(terminalProgressAtom);
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
