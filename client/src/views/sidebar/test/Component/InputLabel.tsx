import { FC } from "react";
import styled, { css } from "styled-components";

interface InputLabelProps {
  name: string;
  type: string;
  isMut?: boolean;
  isSigner?: boolean;
}

const InputLabel: FC<InputLabelProps> = ({ name, type, isMut, isSigner }) => (
  <Wrapper>
    <NameWrapper>
      <Name>{name}:</Name>
    </NameWrapper>

    <TypesWrapper>
      <Type>{type}</Type>
      {isMut && <Type isMut>mut</Type>}
      {isSigner && <Type isSigner>signer</Type>}
    </TypesWrapper>
  </Wrapper>
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    margin-bottom: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: ${theme.font.code.size.small};
  `}
`;

const NameWrapper = styled.div``;

const Name = styled.span`
  ${({ theme }) => css`
    color: ${theme.colors.default.textSecondary};
  `}
`;

const TypesWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Type = styled.span<Pick<InputLabelProps, "isMut" | "isSigner">>`
  ${({ theme, isMut, isSigner }) => css`
    color: ${isMut
      ? theme.highlight.modifier.color
      : isSigner
      ? theme.colors.state.success.color
      : theme.highlight.typeName.color};
  `}
`;

export default InputLabel;
