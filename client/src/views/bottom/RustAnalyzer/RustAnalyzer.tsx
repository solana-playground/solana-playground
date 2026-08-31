import styled from "styled-components";

import Tooltip from "../../../components/Tooltip";
import { useRenderOnChange } from "../../../hooks";
import { PgEditor } from "../../../utils";

export const RustAnalyzer = () => {
  const status = useRenderOnChange(PgEditor.onDidChangeRustAnalyzerStatus);

  // Only show while Rust Analyzer is initializing
  if (!status) return null;

  return (
    <Tooltip element="Rust Analyzer is getting initialized">
      <StatusText>{`Rust Analyzer: ${status}`}</StatusText>
    </Tooltip>
  );
};

const StatusText = styled.span``;
