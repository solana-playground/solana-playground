import { useEffect, useState } from "react";
import styled, { css, keyframes } from "styled-components";

import Tooltip from "../../../components/Tooltip";
import {
  getTemplate,
  onDidChangeStatus,
  onDidPulseActivity,
  requestRestart,
} from "../../../components/Editor/Monaco/languages/rust/lsp";
import type { LspStatus } from "../../../components/Editor/Monaco/languages/rust/lsp";
import { useRenderOnChange } from "../../../hooks";
import { PgSettings } from "../../../utils";

export const RustAnalyzer = () => {
  const status = useRenderOnChange(onDidChangeStatus);
  const backend = useRenderOnChange(PgSettings.onDidChangeEditorRustAnalyzer);

  // Each socket message replays the dot's pulse animation via the `key` prop
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const { dispose } = onDidPulseActivity(() => setPulse((p) => p + 1));
    return dispose;
  }, []);

  if (backend !== "server" || !status || status === "off") return null;

  const clickable = status === "disconnected";
  return (
    <Tooltip element={getTooltip(status)}>
      <StatusWrapper
        onClick={clickable ? requestRestart : undefined}
        $clickable={clickable}
      >
        <StatusDot key={pulse} $status={status} $animate={pulse > 0} />
        rust-analyzer
      </StatusWrapper>
    </Tooltip>
  );
};

const getTooltip = (status: LspStatus) => {
  switch (status) {
    case "connected":
      return `Rust Analyzer connected — ${
        getTemplate() ?? "unknown template"
      } (${PgSettings.server.endpoint})`;
    case "connecting":
      return "Rust Analyzer connecting...";
    default:
      return "Rust Analyzer disconnected — click to reconnect";
  }
};

const StatusWrapper = styled.div<{ $clickable: boolean }>`
  ${({ $clickable }) => css`
    display: flex;
    align-items: center;
    gap: 0.375rem;
    cursor: ${$clickable ? "pointer" : "default"};
  `}
`;

const pulseAnimation = keyframes`
  from {
    box-shadow: 0 0 0 0 currentColor;
    opacity: 0.5;
  }
  to {
    box-shadow: 0 0 0 0.25rem transparent;
    opacity: 1;
  }
`;

const StatusDot = styled.span<{ $status: LspStatus; $animate: boolean }>`
  ${({ theme, $status, $animate }) => css`
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    color: ${$status === "connected"
      ? theme.colors.state.success.color
      : $status === "connecting"
      ? theme.colors.state.warning.color
      : theme.colors.state.error.color};
    background: currentColor;
    ${$animate &&
    css`
      animation: ${pulseAnimation} 0.4s ease-out;
    `}
  `}
`;
