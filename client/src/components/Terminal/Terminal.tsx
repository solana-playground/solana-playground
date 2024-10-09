import { FC, useEffect, useMemo, useRef } from "react";
import styled, { css, useTheme } from "styled-components";
import "xterm/css/xterm.css";

import { EventName } from "../../constants";
import { useExposeStatic, useKeybind } from "../../hooks";
import {
  CommandManager,
  PgCommon,
  PgTerm,
  PgTerminal,
  PgTheme,
} from "../../utils/pg";

interface TerminalProps {
  cmdManager: CommandManager;
}

const Terminal: FC<TerminalProps> = ({ cmdManager }) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  const theme = useTheme();

  // Create xterm
  const term = useMemo(() => {
    const xterm = theme.components.terminal.xterm;

    return new PgTerm(cmdManager, {
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
  }, [theme, cmdManager]);

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

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Handle resize
  useEffect(() => {
    const wrapperEl = wrapperRef.current!;
    const observer = new ResizeObserver(
      PgCommon.throttle(() => term.fit(), 200)
    );
    observer.observe(wrapperEl);
    return () => observer.unobserve(wrapperEl);
  }, [term]);

  useKeybind("Ctrl+L", () => {
    if (PgTerminal.isFocused()) term.clear();
  });

  return (
    <Wrapper ref={wrapperRef}>
      <TerminalWrapper ref={terminalRef} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.getScrollbarCSS({ allChildren: true })};
    ${PgTheme.convertToCSS(theme.components.terminal.default)};
  `}
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
