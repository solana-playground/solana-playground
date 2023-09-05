/** Separate file in order to lazy load `Markdown` component */
import { FC } from "react";

import Markdown from "../../../../../components/Markdown";
import Modal from "../../../../../components/Modal";

interface ExportWorkspaceInstructionsProps {
  /** Markdown text */
  text: string;
}

export const ExportWorkspaceInstructions: FC<
  ExportWorkspaceInstructionsProps
> = ({ text }) => (
  <Modal title buttonProps={{ text: "Continue" }}>
    <Markdown>{text}</Markdown>
  </Modal>
);
