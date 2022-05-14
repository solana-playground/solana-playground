import { FC } from "react";
import styled from "styled-components";

import ModalInside from "../../Modal/ModalInside";
import useModal from "../../Modal/useModal";

interface ApproveProps {}

// TODO:
const Approve: FC<ApproveProps> = ({}) => {
  const { close } = useModal();

  const handleApprove = () => {
    close();
  };

  return (
    <ModalInside
      title
      buttonProps={{ name: "Approve", close, onSubmit: handleApprove }}
    >
      <Content>Approve tx</Content>
    </ModalInside>
  );
};

const Content = styled.div``;

export default Approve;
