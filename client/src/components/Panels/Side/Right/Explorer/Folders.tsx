import { FC, MouseEvent, Ref, useEffect, useMemo, useRef } from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import LangIcon from "../../../../LangIcon";
import ExplorerContextMenu from "./ExplorerContextMenu";
import useExplorerContextMenu from "./useExplorerContextMenu";
import { Arrow } from "../../../../Icons";
import { ClassName, Id } from "../../../../../constants";
import { explorerAtom, refreshExplorerAtom } from "../../../../../state";
import { Folder as FolderType, PgExplorer } from "../../../../../utils/pg";

const Folders = () => {
  const [explorer] = useAtom(explorerAtom);
  useAtom(refreshExplorerAtom); // to re-render on demand

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

  // Only update local storage if we haven't rendered in 5s
  useEffect(() => {
    let timeOutId: NodeJS.Timeout;

    timeOutId = setTimeout(() => {
      explorer?.saveTabs().catch();
    }, 5000);

    return () => {
      clearTimeout(timeOutId);
    };
  });

  const ctxMenu = useExplorerContextMenu();

  if (!explorer) return null;

  // No need to memoize here
  const workspaceDir = explorer.getFolderContent(explorer.currentWorkspacePath);

  return (
    <RootWrapper
      id={Id.ROOT_DIR}
      data-path={explorer.currentWorkspacePath}
      onContextMenu={ctxMenu.handleMenu}
    >
      {workspaceDir?.folders
        .sort((x, y) => x.localeCompare(y))
        .map((f, i) => {
          const path = explorer.currentWorkspacePath + f + "/";
          const folder = explorer.getFolderContent(path);

          if (!folder) return null;

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
  const [, refresh] = useAtom(refreshExplorerAtom);

  const folderName = useMemo(() => {
    return PgExplorer.getItemNameFromPath(path);
  }, [path]);

  // No need useCallback here
  const toggle = (e: MouseEvent<HTMLDivElement>) => {
    // Set selected
    PgExplorer.setSelectedEl(e.currentTarget);

    if (PgExplorer.getItemTypeFromEl(e.currentTarget)?.folder) {
      PgExplorer.toggleFolder(e.currentTarget);
    } else {
      explorer?.changeCurrentFile(
        PgExplorer.getItemPathFromEl(e.currentTarget)!
      );
      refresh();
    }
  };

  const folderRef = useRef<HTMLDivElement>(null);
  const folderInsideRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <StyledFolder
        path={path}
        name={folderName ?? ""}
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

const File: FC<FileOrFolderProps> = ({ path, name, onClick, className }) => {
  return (
    <div className={className} onClick={onClick} data-path={path + name}>
      <LangIcon fileName={name} />
      <span>{name}</span>
    </div>
  );
};

const RootWrapper = styled.div`
  ${({ theme }) => css`
& .${ClassName.FOLDER}, & .${ClassName.FILE} {
  display: flex;
  padding: 0.25rem 0;
  cursor: pointer;
  border: 1px solid transparent;

  &.${ClassName.SELECTED} {
    background-color: ${theme.colors.default.primary + theme.transparency?.low};
  }

  &.${ClassName.CTX_SELECTED} {
    background-color: ${
      theme.colors.default.primary + theme.transparency?.medium
    };
    border-color: ${theme.colors.default.primary};
    border-radius: ${theme.borderRadius};
  }

  &:hover {
    background-color: ${
      theme.colors.default.primary + theme.transparency?.medium
    };
  }
`}
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
