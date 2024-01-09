import styled, { css } from "styled-components";

import Button from "../../../../../components/Button";
import Modal from "../../../../../components/Modal";
import Text from "../../../../../components/Text";
import { ExportFile, Info } from "../../../../../components/Icons";
import { PgFramework, PgView } from "../../../../../utils/pg";

export const ExportWorkspace = () => {
  const convertAndExport = async () => {
    try {
      const { readme } = await PgFramework.exportWorkspace({ convert: true });
      const { ExportWorkspaceReadme } = await import("./ExportWorkspaceReadme");
      await PgView.setModal(<ExportWorkspaceReadme text={readme!} />);
    } catch (e) {
      console.error("Convert and export error:", e);
      await exportWithoutChanges();
    }
  };

  const exportWithoutChanges = async () => {
    await PgFramework.exportWorkspace();
    PgView.closeModal();
  };

  return (
    <Modal title="Export project">
      <Content>
        <Question>Convert the project layout?</Question>

        <Description>
          Playground uses a different layout than the framework's default
          layout.
        </Description>

        <Description>
          To make the project work locally, playground can make the necessary
          conversion before exporting.
        </Description>

        <InfoText icon={<Info color="info" />}>
          Conversion may involve modifying JS/TS code to make the code work in
          local Node environment.
        </InfoText>

        <ButtonsWrapper>
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
        </ButtonsWrapper>
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  max-width: 26rem;
`;

const Question = styled.p`
  font-weight: bold;
`;

const Description = styled.p`
  ${({ theme }) => css`
    color: ${theme.colors.default.textSecondary};
    font-size: ${theme.font.code.size.small};
    margin-top: 1rem;
  `}
`;

const InfoText = styled(Text)`
  margin-top: 1rem;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  margin-top: 1rem;

  & > * {
    margin-right: 1rem;
  }
`;
