import { FC, MouseEvent, Ref, useEffect, useMemo, useRef } from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import LangIcon from "../../../../LangIcon";
import ExplorerContextMenu from "./ExplorerContextMenu";
import useExplorerContextMenu from "./useExplorerContextMenu";
import { Arrow, RunAll, Triangle, Wrench } from "../../../../Icons";
import { ClassName, Id } from "../../../../../constants";
import { explorerAtom, refreshExplorerAtom } from "../../../../../state";
import { Folder as FolderType, PgExplorer } from "../../../../../utils/pg";
import Button from "../../../../Button";

const Folders = () => {
  const [explorer] = useAtom(explorerAtom);
  useAtom(refreshExplorerAtom); // to re-render on demand

  const rootRef = useRef<HTMLDivElement>(null);

  // Initial folder state on mount
  useEffect(() => {
    if (!explorer?.getTabs().length) return;

    const curFile = explorer.getCurrentFile();
    if (!curFile) return;

    // Open if current file's parents are not opened
    PgExplorer.openAllParents(curFile.path);

    // Change selected
    const newEl = PgExplorer.getElFromPath(curFile.path);
    if (newEl) PgExplorer.setSelectedEl(newEl);
  }, [explorer]);

  // Handle ctx selected if user clicks outside of the root element
  useEffect(() => {
    const handleClick = (e: globalThis.MouseEvent) => {
      if (e.target && !rootRef.current?.contains(e.target as Node)) {
        PgExplorer.removeCtxSelectedEl();
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const ctxMenu = useExplorerContextMenu();

  if (!explorer) return null;

  // No need to memoize here
  const relativeRootPath = !explorer.isShared
    ? explorer.currentWorkspacePath
    : "/";
  const relativeRootDir = explorer.getFolderContent(relativeRootPath);

  return (
    <RootWrapper
      id={Id.ROOT_DIR}
      data-path={relativeRootPath}
      ref={rootRef}
      onContextMenu={ctxMenu.handleMenu}
    >
      <SectionTopWrapper>
        <SectionHeader>Program</SectionHeader>
        <Button onClick={ctxMenu.runBuild} kind="icon" title="Build">
          <Wrench />
          <BuildButtonText>Build</BuildButtonText>
        </Button>
      </SectionTopWrapper>
      {relativeRootDir.folders
        .filter((f) => f === PgExplorer.SRC_DIRNAME)
        .map((f, i) => {
          const path = relativeRootPath + f + "/";
          const folder = explorer.getFolderContent(path);

          return (
            <RFolder
              key={i}
              path={path}
              folders={folder.folders}
              files={folder.files}
            />
          );
        })}

      {relativeRootDir.folders.length > 1 && (
        <SectionTopWrapper>
          <SectionHeader>Client</SectionHeader>
          {relativeRootDir.folders.includes(PgExplorer.CLIENT_DIRNAME) && (
            <Button
              onClick={ctxMenu.runClientFolder}
              kind="icon"
              title="Run All (in client dir)"
            >
              <Triangle rotate="90deg" />
              <span>Run</span>
            </Button>
          )}
          {relativeRootDir.folders.includes(PgExplorer.TESTS_DIRNAME) && (
            <Button
              onClick={ctxMenu.runTestFolder}
              kind="icon"
              title="Test All (in tests dir)"
            >
              <RunAll />
              <span>Test</span>
            </Button>
          )}
        </SectionTopWrapper>
      )}
      {relativeRootDir.folders
        .sort((x, y) => x.localeCompare(y))
        .filter((f) => f !== PgExplorer.SRC_DIRNAME)
        .map((f, i) => {
          const path = relativeRootPath + f + "/";
          const folder = explorer.getFolderContent(path);

          return (
            <RFolder
              key={i}
              path={path}
              folders={folder.folders}
              files={folder.files}
            />
          );
        })}

      <ExplorerContextMenu {...ctxMenu} />
    </RootWrapper>
  );
};

interface FolderProps extends FolderType {
  path: string;
}

// RFolder = Recursive Folder
const RFolder: FC<FolderProps> = ({ path, folders, files }) => {
  const [explorer] = useAtom(explorerAtom);

  const folderName = useMemo(() => {
    return PgExplorer.getItemNameFromPath(path);
  }, [path]);

  // No need useCallback here
  const toggle = (e: MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    // Set selected
    PgExplorer.setSelectedEl(el);
    PgExplorer.setCtxSelectedEl(el);

    if (PgExplorer.getItemTypeFromEl(el)?.folder) {
      PgExplorer.toggleFolder(el);
    } else {
      explorer?.changeCurrentFile(PgExplorer.getItemPathFromEl(el)!);
    }
  };

  const folderRef = useRef<HTMLDivElement>(null);
  const folderInsideRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <StyledFolder
        path={path}
        name={folderName}
        reff={folderRef}
        onClick={toggle}
        className={ClassName.FOLDER}
      />

      <FolderInsideWrapper ref={folderInsideRef} className={ClassName.HIDDEN}>
        {folders
          .sort((x, y) => x.localeCompare(y))
          .map((folderName, i) => {
            const insideFolderPath = path + folderName + "/";
            const folder = explorer?.getFolderContent(insideFolderPath);

            if (!folder) return null;

            return (
              <RFolder
                key={i}
                path={insideFolderPath}
                folders={folder.folders}
                files={folder.files}
              />
            );
          })}

        {files
          .sort((x, y) => x.localeCompare(y))
          .map((fileName, i) => (
            <StyledFile
              key={i}
              path={path}
              name={fileName}
              onClick={toggle}
              className={ClassName.FILE}
            />
          ))}
      </FolderInsideWrapper>
    </>
  );
};

interface FileOrFolderProps {
  path: string;
  name: string;
  onClick?: (e: any) => void;
  className?: string;
  reff?: Ref<HTMLDivElement>;
}

const Folder: FC<FileOrFolderProps> = ({
  path,
  name,
  reff,
  onClick,
  className,
}) => (
  <div className={className} ref={reff} onClick={onClick} data-path={path}>
    {name && (
      <>
        <Arrow />
        <span>{name}</span>
      </>
    )}
  </div>
);

const File: FC<FileOrFolderProps> = ({ path, name, onClick, className }) => (
  <div className={className} onClick={onClick} data-path={path + name}>
    <LangIcon fileName={name} />
    <span>{name}</span>
  </div>
);

const RootWrapper = styled.div`
  ${({ theme }) => css`
  & .${ClassName.FOLDER}, & .${ClassName.FILE} {
    display: flex;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    border: 1px solid transparent;

    &.${ClassName.SELECTED} {
      background-color: ${
        theme.colors.default.primary + theme.transparency?.low
      };
    }

    &.${ClassName.CTX_SELECTED} {
      background-color: ${
        theme.colors.default.primary + theme.transparency?.low
      };
      border-color: ${
        theme.colors.default.primary + theme.transparency?.medium
      };
      border-radius: ${theme.borderRadius};
    }

    &:hover {
      background-color: ${
        theme.colors.default.primary + theme.transparency?.low
      };
    }
`}
`;

const SectionTopWrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    margin-left: 1rem;
    margin-bottom: 0.25rem;
    color: ${theme.colors.default.textSecondary};

    &:not(:first-child) {
      margin-top: 1rem;
    }

    & > button {
      margin-left: 0.5rem;
    }
  `}
`;

const SectionHeader = styled.div``;

const BuildButtonText = styled.span`
  margin-left: 0.5rem !important;
`;

const FolderInsideWrapper = styled.div`
  margin-left: 1rem;

  &.${ClassName.HIDDEN} {
    display: none;
  }
`;

const StyledFolder = styled(Folder)`
  & span {
    color: ${({ theme }) => theme.colors.default.primary};
    margin-left: 0.5rem;
  }

  & svg {
    width: 1rem;
    height: 1rem;
  }

  &.${ClassName.OPEN} svg {
    transform: rotate(90deg);
  }
`;

const StyledFile = styled(File)`
  & img {
    margin-left: 0.125rem;
  }

  & span {
    color: ${({ theme }) => theme.colors.default.textPrimary};
    margin-left: 0.375rem;
  }
`;

export default Folders;
