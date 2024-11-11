import type { FC } from "react";
import styled from "styled-components";

import Button from "../../../../components/Button";
import Text from "../../../../components/Text";
import { Error } from "../../../../components/Icons";
import { PgRouter } from "../../../../utils/pg";

interface NotFoundProps {
  path: string;
}

export const NotFound: FC<NotFoundProps> = ({ path }) => (
  <Wrapper>
    <Text kind="error" icon={<Error />}>
      Invalid URL path: {path}
    </Text>
    <Button kind="primary-transparent" onClick={() => PgRouter.navigate()}>
      Go home
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
