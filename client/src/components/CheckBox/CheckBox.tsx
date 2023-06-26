import { ChangeEventHandler, FC } from "react";
import styled from "styled-components";

interface CheckBoxProps {
  onChange: ChangeEventHandler<HTMLInputElement>;
  checkedOnMount?: boolean;
  label?: string;
}

const CheckBox: FC<CheckBoxProps> = ({ onChange, checkedOnMount, label }) => (
  <Wrapper>
    <StyledInput
      type="checkbox"
      id={label}
      onChange={onChange}
      defaultChecked={checkedOnMount}
    />
    {label && <Label htmlFor={label}>{label}</Label>}
  </Wrapper>
);

const Wrapper = styled.div`
  display: flex;
  align-items: center;

  & > input,
  & > label {
    cursor: pointer;
  }
`;

const Label = styled.label`
  padding-left: 0.5rem;
  font-size: ${({ theme }) => theme.font.code.size.small};
`;

const StyledInput = styled.input`
  accent-color: ${({ theme }) => theme.colors.default.primary};
`;

export default CheckBox;
