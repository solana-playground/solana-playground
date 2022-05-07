import { FC } from "react";
import styled, { css } from "styled-components";

import { PROJECT_NAME } from "../../constants";
import Button from "../Button";

interface ModalInsideProps {
  title?: boolean;
  buttonProps?: {
    name: string;
    onSubmit: () => void;
    close: () => void;
    disabled?: boolean;
  };
}

const ModalInside: FC<ModalInsideProps> = ({
  title,
  buttonProps,
  children,
}) => {
  return (
    <Wrapper>
      {title && <Title>{PROJECT_NAME}</Title>}
      {children}
      {buttonProps && (
        <ButtonWrapper>
          <Button onClick={buttonProps.close}>Cancel</Button>
          <Button
            onClick={buttonProps.onSubmit}
            disabled={buttonProps.disabled}
            kind="primary-transparent"
          >
            {buttonProps.name}
          </Button>
        </ButtonWrapper>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    padding: 0.25rem 1.5rem;
    border: 1px solid ${theme.colors.default.borderColor};
    border-radius: ${theme.borderRadius};
    background-color: ${(theme.colors.right?.bg ?? theme.colors.default.bg) +
    "EE"};
  `}
`;

const Title = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  padding: 0.75rem 0 0.5rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.default.borderColor};
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.75rem;

  & button:nth-child(2) {
    margin-left: 1rem;
  }
`;

export default ModalInside;
