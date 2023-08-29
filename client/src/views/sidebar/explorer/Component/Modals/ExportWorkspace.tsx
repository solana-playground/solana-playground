import { Dispatch, FC, SetStateAction, useState } from "react";
import styled, { css } from "styled-components";

import Button from "../../../../../components/Button";
import Markdown from "../../../../../components/Markdown";
import Modal from "../../../../../components/Modal";
import Text from "../../../../../components/Text";
import { ExportFile, Info } from "../../../../../components/Icons";
import { PgFramework, PgView } from "../../../../../utils/pg";

export const ExportWorkspace = () => {
  const [readme, setReadme] = useState<string>();

  return (
    <Modal title>
      {readme ? (
        <InstructionsPage readme={readme} />
      ) : (
        <ConversionPage setReadme={setReadme} />
      )}
    </Modal>
  );
};

interface ConversionPageProps {
  setReadme: Dispatch<SetStateAction<string | undefined>>;
}

const ConversionPage: FC<ConversionPageProps> = ({ setReadme }) => {
  const convertAndExport = async () => {
    const { readme } = await PgFramework.exportWorkspace({ convert: true });
    setReadme(readme);
  };

  const exportWithoutChanges = async () => {
    await PgFramework.exportWorkspace();
    await PgView.setModal(null);
  };

  return (
    <ConversionContent>
      <ConversionQuestion>Convert the project layout?</ConversionQuestion>

      <ConversionDescription>
        Playground uses a different layout than the framework's default layout.
      </ConversionDescription>

      <ConversionDescription>
        To make the project work locally, playground can make the necessary
        conversion before exporting.
      </ConversionDescription>

      <ConversionText IconEl={<Info color="info" />}>
        Conversion may involve modifying JS/TS code to make the code work in
        local Node environment.
      </ConversionText>

      <ConversionButtonsWrapper>
        <Button
          onClick={convertAndExport}
          kind="primary-transparent"
          rightIcon={<ExportFile />}
        >
          Convert and export
        </Button>
        <Button onClick={exportWithoutChanges} rightIcon={<ExportFile />}>
          Export without changes
        </Button>
      </ConversionButtonsWrapper>
    </ConversionContent>
  );
};

const ConversionContent = styled.div`
  max-width: 26rem;
`;

const ConversionQuestion = styled.p`
  font-weight: bold;
`;

const ConversionDescription = styled.p`
  ${({ theme }) => css`
    color: ${theme.colors.default.textSecondary};
    font-size: ${theme.font.code.size.small};
    margin-top: 1rem;
  `}
`;

const ConversionText = styled(Text)`
  margin-top: 1rem;
`;

const ConversionButtonsWrapper = styled.div`
  display: flex;
  margin-top: 1rem;

  & > * {
    margin-right: 1rem;
  }
`;

interface InstructionPageProps {
  readme: string;
}

const InstructionsPage: FC<InstructionPageProps> = ({ readme }) => (
  <>
    <Markdown>{readme}</Markdown>
    <InstructionsButtonWrapper>
      <Button onClick={() => PgView.setModal(null)}>Continue</Button>
    </InstructionsButtonWrapper>
  </>
);

const InstructionsButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
`;
