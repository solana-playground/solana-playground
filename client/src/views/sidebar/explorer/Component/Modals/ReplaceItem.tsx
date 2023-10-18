import { FC } from "react";
import styled, { css } from "styled-components";

import Modal from "../../../../../components/Modal";
import { Warning } from "../../../../../components/Icons";
import { PgExplorer } from "../../../../../utils/pg";

interface ReplaceItemProps {
  fromPath: string;
  toPath: string;
}

export const ReplaceItem: FC<ReplaceItemProps> = ({ fromPath, toPath }) => {
  const itemName = PgExplorer.getItemNameFromPath(toPath);

  const replaceItem = async () => {
    await PgExplorer.renameItem(fromPath, toPath, {
      skipNameValidation: true,
      override: true,
    });
  };

  return (
    <Modal
      title
      buttonProps={{
        text: "Replace",
        onSubmit: replaceItem,
      }}
    >
      <Content>
        <Icon>
          <Warning color="warning" />
        </Icon>
        <ContentText>
          <Main>'{itemName}' already exists. Do you want to replace it?</Main>
          <Desc>This action is irreversable.</Desc>
        </ContentText>
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Icon = styled.div`
  width: 2rem;
  height: 2rem;

  & > svg {
    width: 100%;
    height: 100%;
  }
`;

const ContentText = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 1rem;
`;

const Main = styled.span`
  font-weight: bold;
`;

const Desc = styled.span`
  ${({ theme }) => css`
    margin-top: 0.5rem;
    font-size: ${theme.font.code.size.small};
    color: ${theme.colors.default.textSecondary};
  `}
`;
