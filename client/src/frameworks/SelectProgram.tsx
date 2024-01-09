import { FC, useState } from "react";
import styled, { css } from "styled-components";

import Modal from "../components/Modal";
import Text from "../components/Text";
import { Info } from "../components/Icons";

interface SelectProgramProps {
  /** Program names to select from */
  programNames: string[];
}

export const SelectProgram: FC<SelectProgramProps> = ({ programNames }) => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Modal
      title="Select the program to import"
      buttonProps={{
        text: "Select",
        onSubmit: () => selected,
      }}
    >
      <Content>
        <Text icon={<Info color="info" />}>
          Multiple programs have been found but playground currently supports
          one program per project.
        </Text>

        <ProgramsWrapper>
          {programNames.map((name) => (
            <Program
              key={name}
              isSelected={name === selected}
              onClick={() => setSelected((s) => (s === name ? null : name))}
            >
              {name}
            </Program>
          ))}
        </ProgramsWrapper>
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  max-width: 32rem;
`;

const ProgramsWrapper = styled.div`
  margin-top: 1rem;
`;

const Program = styled.div<{ isSelected: boolean }>`
  ${({ theme, isSelected }) => css`
    margin: 0.75rem 0;
    padding: 0.5rem 1rem;
    border: 1px solid ${theme.colors.default.border};
    border-radius: ${theme.default.borderRadius};
    color: ${theme.colors.default.textSecondary};
    font-weight: bold;
    transition: all ${theme.default.transition.duration.medium}
      ${theme.default.transition.type};

    &:hover {
      cursor: pointer;
      border-color: ${!isSelected && theme.colors.default.textPrimary};
      color: ${theme.colors.default.textPrimary};
    }

    ${isSelected &&
    `
      border-color: ${theme.colors.default.primary};
      color: ${theme.colors.default.textPrimary};
      `}
  `}
`;
