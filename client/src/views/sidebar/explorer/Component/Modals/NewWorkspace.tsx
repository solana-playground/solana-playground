import { ChangeEvent, FC, useState } from "react";
import styled, { css } from "styled-components";

import Img from "../../../../../components/Img";
import Input from "../../../../../components/Input";
import Modal from "../../../../../components/Modal";
import {
  Fn,
  Framework as FrameworkType,
  PgExplorer,
  PgFramework,
} from "../../../../../utils/pg";

export const NewWorkspace = () => {
  // Handle user input
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setName(ev.target.value);
    setError("");
  };

  const newWorkspace = async () => {
    const { importFiles, defaultOpenFile } = PgFramework.frameworks.find(
      (f) => f.name === selected
    )!;
    const { files } = await importFiles();

    await PgExplorer.newWorkspace(name, {
      files,
      defaultOpenFile,
    });
  };

  return (
    <Modal
      buttonProps={{
        text: "Create",
        onSubmit: newWorkspace,
        disabled: !name || !selected,
      }}
      error={error}
      setError={setError}
    >
      <Content>
        <WorkspaceNameWrapper>
          <MainText>Project name</MainText>
          <Input
            autoFocus
            onChange={handleChange}
            value={name}
            error={error}
            setError={setError}
            validator={PgExplorer.isWorkspaceNameValid}
            placeholder="my project..."
          />
        </WorkspaceNameWrapper>

        <FrameworkSectionWrapper>
          <MainText>Choose a framework</MainText>
          <FrameworksWrapper>
            {PgFramework.frameworks.map((f) => (
              <Framework
                key={f.name}
                isSelected={selected === f.name}
                select={() =>
                  setSelected((s) => (s === f.name ? null : f.name))
                }
                {...f}
              />
            ))}
          </FrameworksWrapper>
        </FrameworkSectionWrapper>
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const WorkspaceNameWrapper = styled.div``;

const MainText = styled.div`
  margin-bottom: 0.5rem;
  font-weight: bold;
  font-size: ${({ theme }) => theme.font.code.size.large};
`;

const FrameworkSectionWrapper = styled.div`
  margin: 1rem 0 0.5rem 0;
`;

const FrameworksWrapper = styled.div`
  display: flex;
  gap: 2rem;
`;

interface FrameworkProps extends FrameworkType {
  isSelected: boolean;
  select: Fn;
}

const Framework: FC<FrameworkProps> = ({
  name,
  language,
  icon,
  circleImage,
  isSelected,
  select,
}) => (
  <FrameworkWrapper isSelected={isSelected} onClick={select}>
    <FrameworkImageWrapper circle={circleImage}>
      <Img src={icon} alt={name} />
    </FrameworkImageWrapper>
    <FrameworkName>
      {name}({language})
    </FrameworkName>
  </FrameworkWrapper>
);

const FrameworkWrapper = styled.div<{ isSelected?: boolean }>`
  ${({ theme, isSelected }) => css`
    width: fit-content;
    padding: 1rem;
    border: 1px solid ${theme.colors.default.border};
    border-radius: ${theme.default.borderRadius};
    transition: all ${theme.default.transition.duration.medium}
      ${theme.default.transition.type};
    border-color: ${isSelected && theme.colors.default.primary};
    & div:nth-child(2) {
      color: ${isSelected && theme.colors.default.textPrimary};
    }

    &:hover {
      cursor: pointer;
      border-color: ${!isSelected && theme.colors.default.textPrimary};

      & div:nth-child(2) {
        color: ${theme.colors.default.textPrimary};
      }
    }
  `}
`;

const FrameworkImageWrapper = styled.div<{ circle?: boolean }>`
  ${({ circle }) => css`
    width: 8rem;
    height: 8rem;
    display: flex;
    align-items: center;

    & > img {
      width: 100%;
      border-radius: ${circle && "50%"};
    }
  `}
`;

const FrameworkName = styled.div`
  margin-top: 0.75rem;
  text-align: center;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.default.textSecondary};
`;
