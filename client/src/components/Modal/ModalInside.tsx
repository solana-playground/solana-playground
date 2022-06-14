import { FC, useCallback, useEffect } from "react";
import styled, { css } from "styled-components";

import Button from "../Button";
import useModal from "./useModal";
import { PROJECT_NAME } from "../../constants";

interface ModalInsideProps {
  title?: boolean | string;
  buttonProps?: {
    name: string;
    onSubmit: () => void;
    disabled?: boolean;
  };
  closeOnSubmit?: boolean;
}

const ModalInside: FC<ModalInsideProps> = ({
  title,
  buttonProps,
  closeOnSubmit = true,
  children,
}) => {
  const { close } = useModal();

  const handleSubmit = useCallback(() => {
    if (!buttonProps) return;

    buttonProps.onSubmit();
    if (closeOnSubmit) close();
  }, [buttonProps, closeOnSubmit, close]);

  // Submit on Enter
  useEffect(() => {
    const handleEnter = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Enter") handleSubmit();
    };

    document.addEventListener("keydown", handleEnter);
    return () => document.removeEventListener("keydown", handleEnter);
  }, [handleSubmit]);

  return (
    <Wrapper>
      {title && <Title>{title === true ? PROJECT_NAME : title}</Title>}
      {children}
      {buttonProps && (
        <ButtonWrapper>
          <Button onClick={close}>Cancel</Button>
          <Button
            onClick={handleSubmit}
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
    background-color: ${theme.colors.default.bgSecondary + "EE"};
    max-width: max(40%, 20rem);
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
