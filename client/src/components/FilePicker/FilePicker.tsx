import {
  ChangeEvent,
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import styled, { css } from "styled-components";

import Checkbox from "../Checkbox";
import LangIcon from "../LangIcon";
import { PgCommon, PgExplorer } from "../../utils/pg";
import { useDifferentBackground } from "../../hooks";

interface FilePickerProps {
  path: string;
  filePaths: string[];
  setFilePaths: Dispatch<SetStateAction<string[]>>;
}

const FilePicker: FC<FilePickerProps> = ({ path, filePaths, setFilePaths }) => {
  const { ref } = useDifferentBackground();

  // Handle checkbox `checked`
  useEffect(() => {
    const checkboxes = ref.current!.getElementsByTagName("input");
    for (const checkbox of checkboxes) {
      const dataPath = PgExplorer.getItemPathFromEl(checkbox);
      if (!dataPath) continue;

      const checked = filePaths.some((path) => path.startsWith(dataPath));
      checkbox.checked = checked;
    }
  }, [filePaths, ref]);

  return (
    <Wrapper ref={ref}>
      <RecursiveFolder path={path} setFilePaths={setFilePaths} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  padding: 0.5rem 0;
  border-radius: ${({ theme }) => theme.default.borderRadius};
`;

type RecursiveFolderProps = Omit<FilePickerProps, "filePaths">;

const RecursiveFolder: FC<RecursiveFolderProps> = ({ path, setFilePaths }) => {
  const folderName = useMemo(
    () => PgExplorer.getItemNameFromPath(path),
    [path]
  );

  const depth = useMemo(
    () => PgExplorer.getRelativePath(path).split("/").length - 1,
    [path]
  );

  const { files, folders } = useMemo(
    () => PgExplorer.getFolderContent(path),
    [path]
  );

  const toggleCheck = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      const paths: string[] = [];
      const startEl = PgExplorer.getItemTypeFromEl(ev.target)?.file
        ? ev.target.parentElement!.parentElement!
        : wrapperRef.current!;

      const recursivelyGetPaths = (el: Element) => {
        for (const childEl of el.children) {
          if (childEl.getAttribute("type") === "checkbox") {
            const path = PgExplorer.getItemPathFromEl(childEl);
            if (path) paths.push(path);
          } else {
            recursivelyGetPaths(childEl);
          }
        }
      };
      recursivelyGetPaths(startEl);

      setFilePaths((previousPaths) => {
        const filePaths = paths.filter(
          (path) => PgExplorer.getItemTypeFromPath(path).file
        );
        if (ev.target.checked) return [...previousPaths, ...filePaths];
        return previousPaths.filter((path) => !filePaths.includes(path));
      });
    },
    [setFilePaths]
  );

  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <Folder ref={wrapperRef}>
      <FolderName>
        <StyledCheckbox
          depth={depth}
          label={folderName}
          onChange={toggleCheck}
          defaultChecked
          data-path={path}
        />
      </FolderName>

      {folders
        .sort((a, b) => {
          // Prioritize `src` dir
          if (b === PgExplorer.PATHS.SRC_DIRNAME) return 1;
          return a.localeCompare(b);
        })
        .map((name) => (
          <RecursiveFolder
            key={name}
            path={PgCommon.joinPaths(path, name, "/")}
            setFilePaths={setFilePaths}
          />
        ))}

      {files
        .sort((a, b) => a.localeCompare(b))
        .map((name) => (
          <File key={name}>
            <StyledCheckbox
              depth={depth + 1}
              label={
                <FileNameWrapper>
                  <LangIcon fileName={name} />
                  <FileName>{name}</FileName>
                </FileNameWrapper>
              }
              onChange={toggleCheck}
              defaultChecked
              data-path={PgCommon.joinPaths(path, name)}
            />
          </File>
        ))}
    </Folder>
  );
};

const Folder = styled.div`
  ${({ theme }) => css`
    & label {
      width: 100%;
      transition: all ${theme.default.transition.duration.short}
        ${theme.default.transition.type};

      &:hover {
        background: ${theme.colors.state.hover.bg};
      }
    }
  `}
`;

const FolderName = styled.div`
  display: flex;
`;

const File = styled.div`
  display: flex;
  align-items: center;
`;

const FileNameWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const FileName = styled.span`
  margin-left: 0.25rem;
`;

const StyledCheckbox = styled(Checkbox)<{ depth: number }>`
  margin-left: ${({ depth }) => depth + 1}rem;
  padding: 0.375rem 0.5rem;
  height: 2rem;
`;

export default FilePicker;
