import type { FC } from "react";
import styled from "styled-components";

import Button from "../../../../components/Button";
import Text from "../../../../components/Text";
import { Error as ErrorIcon } from "../../../../components/Icons";
import { PgRouter } from "../../../../utils";

interface ErrorProps {
  text: string;
  navigate?: {
    name: string;
    path: RoutePath;
  };
}

const Error: FC<ErrorProps> = ({ text, navigate }) => (
  <Wrapper>
    <Text kind="error" icon={<ErrorIcon />}>
      {text}
    </Text>

    <ButtonsWrapper>
      {navigate && (
        <Button
          kind="primary-transparent"
          onClick={() => PgRouter.navigate(navigate.path)}
        >
          {navigate.name}
        </Button>
      )}

      <Button onClick={() => PgRouter.navigate()}>Go home</Button>
    </ButtonsWrapper>
  </Wrapper>
);

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  gap: 1rem;
`;

export default Error;
