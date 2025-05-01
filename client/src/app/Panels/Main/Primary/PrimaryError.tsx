import { FC } from "react";
import styled from "styled-components";

import Button from "../../../../components/Button";
import Text from "../../../../components/Text";
import { Refresh, Sad } from "../../../../components/Icons";

interface PrimaryErrorProps {
  error: Error;
  retry: () => void;
}

const PrimaryError: FC<PrimaryErrorProps> = ({ error, retry }) => {
  return (
    <Wrapper>
      <Text kind="error" icon={<Sad />}>
        <div>There was an unexpected error!</div>
        {error.message && <div>Reason: {error.message}</div>}
      </Text>

      <Button
        kind="secondary-transparent"
        leftIcon={<Refresh />}
        onClick={retry}
      >
        Retry
      </Button>
    </Wrapper>
  );
};

const Wrapper = styled.div<{ iconOnly?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1rem;
`;

export default PrimaryError;
