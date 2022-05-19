import { FC } from "react";
import styled from "styled-components";

import ModalInside from "../../Modal/ModalInside";

interface ApproveProps {}

// TODO:
const Approve: FC<ApproveProps> = ({}) => {
  const handleApprove = () => {};

  return (
    <ModalInside
      title
      buttonProps={{ name: "Approve", onSubmit: handleApprove }}
    >
      <Content>Approve tx</Content>
    </ModalInside>
  );
};

const Content = styled.div``;

export default Approve;
