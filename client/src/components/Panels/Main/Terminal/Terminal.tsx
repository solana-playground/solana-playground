import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import styled, { css, useTheme } from "styled-components";
import { Resizable } from "re-resizable";
import { Terminal as XTerm } from "xterm";
import "xterm/css/xterm.css";
import { FitAddon } from "xterm-addon-fit";

import { terminalAtom } from "../../../../state";
import { PgTerminal } from "../../../../utils/pg/terminal";
import { PROJECT_NAME, DEFAULT_CURSOR } from "../../../../constants";
import { Clear, Close, DoubleArrow, Tick } from "../../../Icons";
import Button from "../../../Button";

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
        // fontFamily: theme.font?.family,
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

  // Resize
  const [height, setHeight] = useState(PgTerminal.DEFAULT_HEIGHT);

  useEffect(() => {
    fitAddon.fit();
  }, [fitAddon, height]);

  const handleResize = useCallback(() => {
    fitAddon.fit();
  }, [fitAddon]);

  const handleResizeStop = useCallback(
    (_e, _dir, _ref, d) => {
      setHeight((h) => h + d.height);
    },
    [setHeight]
  );

  // Buttons
  const clear = useCallback(() => {
    term.clear();
  }, [term]);

  const maxButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const toggleMaximize = useCallback(() => {
    setHeight((h) => {
      if (h === "100%") {
        maxButtonRef.current?.classList.remove("down");
        return PgTerminal.DEFAULT_HEIGHT;
      }

      maxButtonRef.current?.classList.add("down");
      return "100%";
    });
  }, [setHeight]);

  const [isClosed, setIsClosed] = useState(false);

  const toggleClose = useCallback(() => {
    setIsClosed((c) => !c);
    setHeight((h) => {
      if (h === "0%") return PgTerminal.DEFAULT_HEIGHT;
      return "0%";
    });
  }, [setHeight, setIsClosed]);

  // Keybinds
  useEffect(() => {
    const handleKeybinds = (e: globalThis.KeyboardEvent) => {
      // TODO: Focus terminal
      if (e.ctrlKey) {
        if (e.key === "l") {
          e.preventDefault();
          clear();
        } else if (e.key === "`") {
          e.preventDefault();
          toggleClose();
        } else if (e.key === "j") {
          e.preventDefault();
          toggleClose();
        } else if (e.key === "m") {
          e.preventDefault();
          toggleMaximize();
        }
      }
    };

    document.addEventListener("keydown", handleKeybinds);
    return () => document.removeEventListener("keydown", handleKeybinds);
  }, [clear, toggleClose, toggleMaximize]);

  return (
    <Resizable
      size={{ height, width: "100%" }}
      minWidth={"100%"}
      minHeight={PgTerminal.MIN_HEIGHT}
      onResizeStop={handleResizeStop}
      onResize={handleResize}
      handleStyles={{
        topLeft: DEFAULT_CURSOR,
        topRight: DEFAULT_CURSOR,
        right: DEFAULT_CURSOR,
        bottomRight: DEFAULT_CURSOR,
        bottom: DEFAULT_CURSOR,
        bottomLeft: DEFAULT_CURSOR,
        left: DEFAULT_CURSOR,
      }}
    >
      <Wrapper>
        <TerminalTopbar minHeight={PgTerminal.MIN_HEIGHT}>
          <Button kind="icon" title="Clear(Ctrl+L)" onClick={clear}>
            <Clear />
          </Button>
          <Button
            kind="icon"
            title="Toggle Maximize(Ctrl+M)"
            onClick={toggleMaximize}
            ref={maxButtonRef}
          >
            <DoubleArrow />
          </Button>
          <Button
            kind="icon"
            title="Toggle Close(Ctrl+`)"
            onClick={toggleClose}
            ref={closeButtonRef}
          >
            {isClosed ? <Tick /> : <Close />}
          </Button>
        </TerminalTopbar>
        <TerminalWrapper ref={terminalRef} minHeight={PgTerminal.MIN_HEIGHT} />
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
  `}
`;

const TerminalTopbar = styled.div<{ minHeight: number }>`
  ${({ minHeight }) =>
    css`
      display: flex;
      justify-content: flex-end;
      align-items: center;
      height: ${minHeight}px;
      margin-right: 1.5rem;

      & button {
        margin-left: 0.25rem;
        height: fit-content;
      }

      & button.down svg {
        transform: rotate(180deg);
      }
    `}
`;

// minHeight fixes text going below too much which made bottom text invisible
const TerminalWrapper = styled.div<{ minHeight: number }>`
  ${({ theme, minHeight }) => css`
    height: calc(100% - ${minHeight}px);
    margin-left: 1rem;

    & .xterm-viewport {
      background-color: inherit !important;
    }

    & .xterm-rows {
      font-family: ${theme.font?.family} !important;
      font-size: ${theme.font?.size.medium} !important;
      color: ${theme.colors.terminal?.color ??
      theme.colors.default.textPrimary} !important;
    }

    /* TODO: */
    & .xterm.xterm-cursor-block,
    .xterm .xterm-cursor-block {
      display: none;
    }
  `}
`;

export default Terminal;
