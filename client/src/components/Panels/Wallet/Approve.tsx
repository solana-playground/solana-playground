import { FC } from "react";
import styled from "styled-components";

import Modal from "../../Modal/Modal";

interface ApproveProps {}

// TODO:
const Approve: FC<ApproveProps> = ({}) => {
  const handleApprove = () => {};

  return (
    <Modal title buttonProps={{ name: "Approve", onSubmit: handleApprove }}>
      <Content>Approve tx</Content>
    </Modal>
  );
};

const Content = styled.div``;

export default Approve;
