import {
  ChangeEvent,
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import Modal from "../../../../../../../components/Modal";
import useModal from "../../../../../../../components/Modal/useModal";
import Input from "../../../../../../../components/Input";
import { explorerAtom } from "../../../../../../../state";
import {
  Framework as FrameworkType,
  FRAMEWORKS,
} from "../../../../../../../utils/pg";

export const NewWorkspace = () => {
  const [explorer] = useAtom(explorerAtom);

  const { close } = useModal();

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle user input
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setError("");
  };

  const disableCond = !name || !selected || !explorer;

  const newWorkspace = async () => {
    if (disableCond) return;

    try {
      const { files, defaultOpenFile } = FRAMEWORKS.find(
        (f) => f.name === selected
      )!;

      await explorer.newWorkspace(name, {
        files,
        defaultOpenFile,
      });
      close();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Modal
      buttonProps={{
        text: "Create",
        onSubmit: newWorkspace,
        disabled: disableCond,
      }}
    >
      <Content>
        <WorkspaceNameWrapper>
          <MainText>Project name</MainText>
          <Input
            ref={inputRef}
            onChange={handleChange}
            value={name}
            error={error}
            placeholder="my first project..."
          />
        </WorkspaceNameWrapper>
        <FrameworkSectionWrapper>
          <MainText>Choose a framework</MainText>
          <FrameworksWrapper>
            {FRAMEWORKS.map((f, i) => (
              <Framework
                key={i}
                isSelected={selected === f.name}
                setSelected={setSelected}
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
  setSelected: Dispatch<SetStateAction<string>>;
}

const Framework: FC<FrameworkProps> = ({
  name,
  language,
  src,
  circleImage,
  isSelected,
  setSelected,
}) => (
  <FrameworkWrapper
    isSelected={isSelected}
    onClick={() => setSelected((s) => (s === name ? "" : name))}
  >
    <FrameworkImageWrapper circle={circleImage}>
      <img src={src} alt={name} />
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
