import { ComponentPropsWithoutRef, FC, forwardRef, ReactNode } from "react";
import styled, { css } from "styled-components";

interface CheckBoxProps extends ComponentPropsWithoutRef<"input"> {
  /** Checkbox `label` to show */
  label?: ReactNode;
}

const Checkbox: FC<CheckBoxProps> = forwardRef<HTMLInputElement, CheckBoxProps>(
  ({ onChange, defaultChecked, label, ...props }, ref) => (
    <Label>
      <StyledCheckbox
        ref={ref}
        type="checkbox"
        onChange={onChange}
        defaultChecked={defaultChecked}
        {...props}
      />
      {label && <LabelText>{label}</LabelText>}
    </Label>
  )
);

const Label = styled.label`
  ${({ theme }) => css`
    user-select: none;
    width: fit-content;
    display: flex;
    align-items: center;
    color: ${theme.colors.default.textSecondary};
    font-size: ${theme.font.code.size.small};
    transition: all ${theme.default.transition.type}
      ${theme.default.transition.duration.short};

    &:hover {
      cursor: pointer;
      color: ${theme.colors.default.textPrimary};
    }

    &:has(> input[type="checkbox"]:checked) {
      color: ${theme.colors.default.textPrimary};
    }

    &:hover,
    &:has(> input[type="checkbox"]:checked) {
      & * {
        color: inherit;
      }
    }
  `}
`;

const StyledCheckbox = styled.input`
  accent-color: ${({ theme }) => theme.colors.default.primary};

  &:hover {
    cursor: pointer;
  }
`;

const LabelText = styled.span`
  ${({ theme }) => css`
    margin-left: 0.5rem;
    transition: all ${theme.default.transition.type}
      ${theme.default.transition.duration.short};
  `}
`;

export default Checkbox;
