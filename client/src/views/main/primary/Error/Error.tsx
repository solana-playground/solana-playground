import type { FC } from "react";
import styled from "styled-components";

import Button from "../../../../components/Button";
import Text from "../../../../components/Text";
import { Error as ErrorIcon } from "../../../../components/Icons";
import { PgRouter } from "../../../../utils";

interface ErrorProps {
  text: string;
  navigation?: {
    name: string;
    path: RoutePath;
  };
}

const Error: FC<ErrorProps> = ({ text, navigation }) => (
  <Wrapper>
    <Text kind="error" icon={<ErrorIcon />}>
      {text}
    </Text>

    <ButtonsWrapper>
      {navigation && (
        <Button
          kind="primary-transparent"
          onClick={() => PgRouter.navigate(navigation.path)}
        >
          {navigation.name}
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
