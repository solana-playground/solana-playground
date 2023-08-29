import styled, { css } from "styled-components";

import Button from "../../../../../components/Button";
import { Endpoint } from "../../../../../constants";
import { PgCommand } from "../../../../../utils/pg";

export const NonLocal = () => (
  <Wrapper>
    <HelpTextWrapper>
      <HelpTextTitle>Switch to localnet?</HelpTextTitle>
      <HelpTextDescription>
        Current endpoint is not responsive.
      </HelpTextDescription>
    </HelpTextWrapper>

    <ButtonsWrapper>
      <Button
        onClick={() => {
          return PgCommand.solana.run(`config set -u ${Endpoint.LOCALHOST}`);
        }}
        kind="secondary-transparent"
        size="small"
      >
        Yes
      </Button>
      <Button kind="no-border" size="small">
        No
      </Button>
    </ButtonsWrapper>
  </Wrapper>
);

const Wrapper = styled.div``;

const HelpTextWrapper = styled.div``;

const HelpTextTitle = styled.div``;

const HelpTextDescription = styled.div`
  ${({ theme }) => css`
    margin-top: 0.25rem;
    color: ${theme.colors.default.textSecondary};
    font-size: ${theme.font.code.size.small};
  `}
`;

const ButtonsWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;

  & > button {
    margin-left: 1rem;
  }
`;
