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

import ModalInside from "../../../../../Modal/ModalInside";
import useModal from "../../../../../Modal/useModal";
import Input, { defaultInputProps } from "../../../../../Input";
import { explorerAtom } from "../../../../../../state";
import {
  Framework as FrameworkType,
  FRAMEWORKS,
} from "../../../../../../utils/pg/explorer";

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
  const [selected, setSelected] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const newWorkspace = async () => {
    if (!name || !selected || !explorer) return;

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
      console.log(e.message);
    }
  };

  return (
    <ModalInside
      buttonProps={{
        name: "Create",
        onSubmit: newWorkspace,
        disabled: !name || !selected,
      }}
      closeOnSubmit={false}
    >
      <Content>
        <WorkspaceNameWrapper>
          <MainText>Workspace name</MainText>
          <Input
            ref={inputRef}
            onChange={handleChange}
            value={name}
            {...defaultInputProps}
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
    </ModalInside>
  );
};

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 1rem;
`;

const WorkspaceNameWrapper = styled.div`
  & > input {
    font-size: ${({ theme }) => theme.font?.size.medium};
    padding: 0.375rem 0.5rem;
  }
`;

const MainText = styled.div`
  margin: 1rem 0 0.5rem 0;
  font-weight: bold;
  font-size: ${({ theme }) => theme.font?.size.large};
`;

const FrameworkSectionWrapper = styled.div`
  margin-bottom: 1rem;
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
    border: 1px solid ${theme.colors.default.borderColor};
    border-radius: ${theme.borderRadius};
    transition: all ${theme.transition?.duration.medium}
      ${theme.transition?.type};
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
