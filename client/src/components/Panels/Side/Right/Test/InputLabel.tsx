import { FC } from "react";
import styled, { css, DefaultTheme } from "styled-components";
import { IdlAccount, IdlType } from "@project-serum/anchor/dist/cjs/idl";

interface InputLabelProps {
  label: string;
  type: IdlType;
  account?: IdlAccount;
}

const InputLabel: FC<InputLabelProps> = ({ label, account, type }) => {
  return (
    <Wrapper>
      <Label>{label}:</Label>
      <TypesWrapper>
        <Type>{type}</Type>
        {account?.isMut && <Type>Mut</Type>}
        {account?.isSigner && <Type>Signer</Type>}
      </TypesWrapper>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  width: 100%;
`;

const Label = styled.span``;

const TypesWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  & span {
    margin-left: 0.75rem;
    font-size: ${({ theme }) => theme.font?.size.small};
  }
`;

const Type = styled.span`
  ${({ theme, children }) => getTypeStyles(theme, children as IdlType)}
`;

const getTypeStyles = (
  theme: DefaultTheme,
  type: IdlType | "Mut" | "Signer"
) => {
  let color;

  if (type === "Mut") color = theme.colors.default.secondary;
  else if (type === "Signer") color = theme.colors.state.success.color;
  else color = theme.colors.state.info.color;

  return css`
    color: ${color};
  `;
};

export default InputLabel;
