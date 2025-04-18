import type { FC } from "react";
import styled from "styled-components";

import Button from "../../../../components/Button";
import Text from "../../../../components/Text";
import { Error } from "../../../../components/Icons";
import { PgRouter } from "../../../../utils/pg";

interface NotFoundProps {
  text?: string;
  navigate?: {
    name: string;
    path: RoutePath;
  };
}

const NotFound: FC<NotFoundProps> = ({ text, navigate }) => (
  <Wrapper>
    <Text kind="error" icon={<Error />}>
      {text ?? `URL path not found: ${PgRouter.location.pathname}`}
    </Text>
    <Button
      kind="primary-transparent"
      onClick={() => PgRouter.navigate(navigate?.path)}
    >
      {navigate?.name ?? "Go home"}
    </Button>
  </Wrapper>
);

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
`;

export default NotFound;
