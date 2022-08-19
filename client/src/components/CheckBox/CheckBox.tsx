import { ChangeEventHandler, FC } from "react";
import styled from "styled-components";

interface CheckBoxProps {
  onChange: ChangeEventHandler<HTMLInputElement>;
  checkedOnMount?: boolean;
  name?: string;
}

const CheckBox: FC<CheckBoxProps> = ({ onChange, checkedOnMount, name }) => {
  return (
    <Wrapper>
      <StyledInput
        type="checkbox"
        id={name}
        onChange={onChange}
        defaultChecked={checkedOnMount}
      />
      {name && <label htmlFor={name}>{name}</label>}
    </Wrapper>
  );
};

const Wrapper = styled.div``;

const StyledInput = styled.input`
  accent-color: ${({ theme }) => theme.colors.default.primary};
`;

export default CheckBox;
