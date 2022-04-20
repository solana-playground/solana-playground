import { FC } from "react";
import styled from "styled-components";

import { PgWallet } from "../../../../../utils/pg/wallet";
import { Warning } from "../../../../Icons";
import ModalInside from "../../../../Modal/ModalInside";
import useModal from "../../../../Modal/useModal";
import Text from "../../../../Text";

interface SetupProps {
  onSubmit: () => void;
}

const Setup: FC<SetupProps> = ({ onSubmit }) => {
  const { close } = useModal();

  const handleSetup = () => {
    PgWallet.updateLs({ setupCompleted: true });
    close();
    onSubmit();
  };

  return (
    <ModalInside
      title
      buttonProps={{ name: "Continue", close, onSubmit: handleSetup }}
    >
      <Content>
        <Text type="Warning">
          <Warning />
          Playground Wallet is intended for development purposes only.
        </Text>
      </Content>
    </ModalInside>
  );
};

const Content = styled.div`
  margin: 1rem 0;

  & div {
    display: flex;
    align-items: center;

    & svg {
      width: 2rem;
      height: 2rem;
      margin-right: 0.75rem;
    }
  }
`;

export default Setup;
