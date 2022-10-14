import { FC, useCallback, useEffect, useRef } from "react";
import styled, { css } from "styled-components";

import Button, { ButtonSize } from "../Button";
import useModal from "./useModal";
import { PROJECT_NAME } from "../../constants";

interface ModalInsideProps {
  buttonProps?: {
    name: string;
    disabled?: boolean;
    loading?: {
      state?: boolean;
      text?: string;
    };
    size?: ButtonSize;
    onSubmit: () => void;
    closeOnSubmit?: boolean;
  };
  title?: boolean | string;
}

const ModalInside: FC<ModalInsideProps> = ({
  title,
  buttonProps,
  children,
}) => {
  const { close } = useModal();

  const handleSubmit = useCallback(() => {
    if (!buttonProps) return;

    buttonProps.onSubmit();
    if (buttonProps.closeOnSubmit) close();
  }, [buttonProps, close]);

  // Submit on Enter
  useEffect(() => {
    const handleEnter = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Enter") handleSubmit();
    };

    document.addEventListener("keydown", handleEnter);
    return () => document.removeEventListener("keydown", handleEnter);
  }, [handleSubmit]);

  const focusButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    focusButtonRef.current?.focus();
  }, []);

  const buttonText = buttonProps?.loading?.state
    ? buttonProps.loading?.text
      ? buttonProps?.loading.text
      : buttonProps.name
    : buttonProps?.name;

  return (
    <Wrapper>
      {title && <Title>{title === true ? PROJECT_NAME : title}</Title>}
      {children}
      {buttonProps && (
        <ButtonWrapper>
          <Button onClick={close}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={buttonProps.disabled || buttonProps.loading?.state}
            btnLoading={buttonProps.loading?.state}
            kind="primary-transparent"
            size={buttonProps.size ?? "medium"}
          >
            {buttonText}
          </Button>
        </ButtonWrapper>
      )}
      <FocusButton ref={focusButtonRef} />
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
    min-width: min-content;
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
  margin: 0.75rem 0;

  & button:nth-child(2) {
    margin-left: 1rem;
  }
`;

const FocusButton = styled.button`
  opacity: 0;
  position: absolute;
`;

export default ModalInside;
