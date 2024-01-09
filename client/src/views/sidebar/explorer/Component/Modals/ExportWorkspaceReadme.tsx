/** Separate file in order to lazy load `Markdown` component */
import { FC } from "react";

import Markdown from "../../../../../components/Markdown";
import Modal from "../../../../../components/Modal";

interface ExportWorkspaceReadmeProps {
  /** Markdown text */
  text: string;
}

export const ExportWorkspaceReadme: FC<ExportWorkspaceReadmeProps> = ({
  text,
}) => (
  <Modal title buttonProps={{ text: "Continue" }}>
    <Markdown>{text}</Markdown>
  </Modal>
);
