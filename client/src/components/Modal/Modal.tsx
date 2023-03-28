import { FC, useCallback, useEffect, useRef } from "react";
import styled, { css } from "styled-components";

import Button, { ButtonProps } from "../Button";
import useModal from "./useModal";
import { Close } from "../Icons";
import { PROJECT_NAME } from "../../constants";
import { useOnKey } from "../../hooks";

interface ModalProps {
  /** Modal title to show. If true, default is "Solana Playground" */
  title?: boolean | string;
  /** Whether to show a close button on top-right */
  closeButton?: boolean;
  /** Modal's submit button props */
  buttonProps?: ButtonProps & {
    /** Button text to show */
    text: string;
    /** Callback function to run on submit */
    onSubmit: () => void;
    /** Whether the close the modal when user submits */
    closeOnSubmit?: boolean;
  };
}

const Modal: FC<ModalProps> = ({
  title,
  buttonProps,
  closeButton,
  children,
}) => {
  const { close } = useModal();

  const handleSubmit = useCallback(() => {
    if (!buttonProps) return;

    buttonProps.onSubmit();
    if (buttonProps.closeOnSubmit) close();
  }, [buttonProps, close]);

  // Submit on Enter
  useOnKey("Enter", handleSubmit);

  // Take away the focus of other buttons when modal is mounted
  const focusButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    focusButtonRef.current?.focus();
  }, []);

  return (
    <Wrapper>
      <TopWrapper>
        {title && <Title>{title === true ? PROJECT_NAME : title}</Title>}
        {closeButton && (
          <CloseButtonWrapper hasTitle={!!title}>
            <Button kind="icon" onClick={close}>
              <Close />
            </Button>
          </CloseButtonWrapper>
        )}
      </TopWrapper>

      {children}

      {buttonProps && (
        <ButtonWrapper>
          <Button onClick={close} kind="transparent">
            Cancel
          </Button>
          <Button
            {...buttonProps}
            onClick={handleSubmit}
            size={buttonProps.size ?? "medium"}
            kind={buttonProps.kind ?? "primary-transparent"}
          >
            {buttonProps.text}
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

const TopWrapper = styled.div`
  position: relative;
`;

const Title = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  padding: 0.75rem 0 0.5rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.default.borderColor};
`;

const CloseButtonWrapper = styled.div<{ hasTitle: boolean }>`
  ${({ hasTitle }) =>
    hasTitle
      ? css`
          position: absolute;
          top: 0.25rem;
          right: 0.5rem;
        `
      : css`
          width: 100%;
          display: flex;
          justify-content: flex-end;
          margin-top: 0.5rem;
        `}
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

export default Modal;
