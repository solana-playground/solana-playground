import styled, { css } from "styled-components";

import Tooltip from "../../../components/Tooltip";
import {
  onDidChangeStatus,
  requestRestart,
} from "../../../components/Editor/Monaco/languages/rust/lsp/status";
import type { LspStatus } from "../../../components/Editor/Monaco/languages/rust/lsp/status";
import { useRenderOnChange } from "../../../hooks";
import { PgSettings } from "../../../utils";

export const RustAnalyzer = () => {
  const status = useRenderOnChange(onDidChangeStatus);
  const backend = useRenderOnChange(PgSettings.onDidChangeEditorRustAnalyzer);

  if (backend !== "server" || !status || status === "off") return null;

  const clickable = status === "disconnected";
  return (
    <Tooltip element={getTooltip(status)}>
      <StatusWrapper
        onClick={clickable ? requestRestart : undefined}
        $clickable={clickable}
      >
        <StatusDot $status={status} />
        rust-analyzer
      </StatusWrapper>
    </Tooltip>
  );
};

const getTooltip = (status: LspStatus) => {
  switch (status) {
    case "connected":
      return `Rust Analyzer connected (${PgSettings.server.endpoint})`;
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

const StatusDot = styled.span<{ $status: LspStatus }>`
  ${({ theme, $status }) => css`
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: ${$status === "connected"
      ? theme.colors.state.success.color
      : $status === "connecting"
      ? theme.colors.state.warning.color
      : theme.colors.state.error.color};
  `}
`;
