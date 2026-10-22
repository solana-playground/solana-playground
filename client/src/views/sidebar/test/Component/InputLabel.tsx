import { FC } from "react";
import styled, { css } from "styled-components";

interface InputLabelProps {
  name: string;
  type: string;
  writable?: boolean;
  signer?: boolean;
}

const InputLabel: FC<InputLabelProps> = ({ name, type, writable, signer }) => (
  <Wrapper>
    <NameWrapper>
      <Name>{name}:</Name>
    </NameWrapper>

    <TypesWrapper>
      <Type>{type}</Type>
      {writable && <Type writable>mut</Type>}
      {signer && <Type signer>signer</Type>}
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

const Type = styled.span<Pick<InputLabelProps, "writable" | "signer">>`
  ${({ theme, writable, signer }) => css`
    color: ${writable
      ? theme.highlight.modifier.color
      : signer
      ? theme.colors.state.success.color
      : theme.highlight.typeName.color};
  `}
`;

export default InputLabel;
