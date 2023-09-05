/** Separate file in order to lazy load `Markdown` component */
import { FC } from "react";
import styled from "styled-components";

import Button from "../../../../../components/Button";
import Markdown from "../../../../../components/Markdown";
import Modal from "../../../../../components/Modal";
import { PgView } from "../../../../../utils/pg";

interface ExportWorkspaceInstructionsProps {
  /** Markdown text */
  text: string;
}

export const ExportWorkspaceInstructions: FC<
  ExportWorkspaceInstructionsProps
> = ({ text }) => (
  <Modal title>
    <Markdown>{text}</Markdown>
    <ButtonWrapper>
      <Button onClick={() => PgView.setModal(null)}>Continue</Button>
    </ButtonWrapper>
  </Modal>
);

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
`;
