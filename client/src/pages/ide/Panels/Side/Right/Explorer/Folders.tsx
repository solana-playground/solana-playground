import { FC, MouseEvent, useCallback, useEffect, useMemo } from "react";
import styled, { css } from "styled-components";

import Button from "../../../../../../components/Button";
import LangIcon from "../../../../../../components/LangIcon";
import ExplorerContextMenu from "./ExplorerContextMenu";
import { useExplorerContextMenu } from "./useExplorerContextMenu";
import {
  Arrow,
  TestTube,
  Triangle,
  Wrench,
} from "../../../../../../components/Icons";
import { ClassName, Id } from "../../../../../../constants";
import {
  Folder as FolderType,
  PgCommon,
  PgExplorer,
} from "../../../../../../utils/pg";

const Folders = () => {
  // Handle folder state
  useEffect(() => {
    const switchWorkspace = PgExplorer.onDidSwitchWorkspace(() => {
      // Reset folder open/closed state
      PgExplorer.collapseAllFolders();
    });

    const openParentsAndSelectEl = (path: string) => {
      // Open if current file's parents are not opened
      PgExplorer.openAllParents(path);

      // Change selected element
      const newEl = PgExplorer.getElFromPath(path);
      if (newEl) PgExplorer.setSelectedEl(newEl);
    };

    const switchFile = PgExplorer.onDidSwitchFile(async (file) => {
      if (!file) return;

      openParentsAndSelectEl(file.path);

      // Sleep before opening parents because switching workspace collapses
      // all folders after file switching
      await PgCommon.sleep(300);
      openParentsAndSelectEl(file.path);
    });

    return () => {
      switchWorkspace.dispose();
      switchFile.dispose();
    };
  }, []);

  const ctxMenu = useExplorerContextMenu();

  // No need to memoize here
  const relativeRootPath = !PgExplorer.isShared
    ? PgExplorer.currentWorkspacePath
    : "/";
  const relativeRootDir = PgExplorer.getFolderContent(relativeRootPath);
  const otherFolders = relativeRootDir.folders.filter(
    (f) =>
      f !== PgExplorer.PATHS.SRC_DIRNAME &&
      f !== PgExplorer.PATHS.CLIENT_DIRNAME &&
      f !== PgExplorer.PATHS.TESTS_DIRNAME
  );

  return (
    <ExplorerContextMenu {...ctxMenu}>
      <RootWrapper id={Id.ROOT_DIR} data-path={relativeRootPath}>
        {/* Program */}
        <SectionTopWrapper>
          <SectionHeader>Program</SectionHeader>
          <Button onClick={ctxMenu.runBuild} kind="icon">
            <Wrench />
            <BuildButtonText>Build</BuildButtonText>
          </Button>
        </SectionTopWrapper>
        <FolderGroup
          folders={relativeRootDir.folders.filter(
            (f) => f === PgExplorer.PATHS.SRC_DIRNAME
          )}
          relativeRootPath={relativeRootPath}
        />

        {/* Client and tests */}
        {(relativeRootDir.folders.includes(PgExplorer.PATHS.CLIENT_DIRNAME) ||
          relativeRootDir.folders.includes(PgExplorer.PATHS.TESTS_DIRNAME)) && (
          <SectionTopWrapper>
            <SectionHeader>Client</SectionHeader>
            {relativeRootDir.folders.includes(
              PgExplorer.PATHS.CLIENT_DIRNAME
            ) && (
              <Button
                onClick={ctxMenu.runClientFolder}
                kind="icon"
                title="Run All (in client dir)"
              >
                <Triangle rotate="90deg" />
                <span>Run</span>
              </Button>
            )}
            {relativeRootDir.folders.includes(
              PgExplorer.PATHS.TESTS_DIRNAME
            ) && (
              <Button
                onClick={ctxMenu.runTestFolder}
                kind="icon"
                title="Test All (in tests dir)"
              >
                <TestTube />
                <span>Test</span>
              </Button>
            )}
          </SectionTopWrapper>
        )}
        <FolderGroup
          folders={relativeRootDir.folders.filter(
            (f) =>
              f === PgExplorer.PATHS.CLIENT_DIRNAME ||
              f === PgExplorer.PATHS.TESTS_DIRNAME
          )}
          relativeRootPath={relativeRootPath}
        />

        {/* Other */}
        {otherFolders.length > 0 && (
          <SectionTopWrapper>
            <SectionHeader>Other</SectionHeader>
          </SectionTopWrapper>
        )}
        <FolderGroup
          folders={otherFolders}
          relativeRootPath={relativeRootPath}
        />
      </RootWrapper>
    </ExplorerContextMenu>
  );
};

interface FolderGroupProps {
  folders: string[];
  relativeRootPath: string;
}

const FolderGroup: FC<FolderGroupProps> = ({ folders, relativeRootPath }) => {
  return (
    <>
      {folders
        .sort((x, y) => x.localeCompare(y))
        .map((f, i) => {
          const path = relativeRootPath + f + "/";
          const folder = PgExplorer.getFolderContent(path);

          return (
            <RFolder
              key={i}
              path={path}
              folders={folder.folders}
              files={folder.files}
            />
          );
        })}
    </>
  );
};

interface FolderProps extends FolderType {
  path: string;
}

// RFolder = Recursive Folder
const RFolder: FC<FolderProps> = ({ path, folders, files }) => {
  const folderName = useMemo(
    () => PgExplorer.getItemNameFromPath(path),
    [path]
  );

  const depth = useMemo(() => {
    return (
      PgExplorer.getRelativePath(path).split("/").length -
      (PgExplorer.isShared ? 3 : 2)
    );
  }, [path]);

  const toggle = useCallback((ev: MouseEvent<HTMLDivElement>) => {
    const el = ev.currentTarget;
    // Set selected
    PgExplorer.setSelectedEl(el);
    PgExplorer.setCtxSelectedEl(el);

    if (PgExplorer.getItemTypeFromEl(el)?.folder) {
      PgExplorer.toggleFolder(el);
    } else {
      PgExplorer.changeCurrentFile(PgExplorer.getItemPathFromEl(el)!);
    }
  }, []);

  return (
    <>
      <StyledFolder
        path={path}
        name={folderName}
        depth={depth}
        onClick={toggle}
        className={ClassName.FOLDER}
      />

      <FolderInsideWrapper
        className={`${ClassName.FOLDER_INSIDE} ${ClassName.HIDDEN}`}
      >
        {folders
          .sort((x, y) => x.localeCompare(y))
          .map((folderName, i) => {
            const insideFolderPath = path + folderName + "/";
            const folder = PgExplorer.getFolderContent(insideFolderPath);

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
              depth={depth + 1}
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
  depth: number;
  onClick?: (e: any) => void;
  className?: string;
}

const Folder: FC<FileOrFolderProps> = ({
  path,
  name,
  depth,
  onClick,
  className,
}) => (
  <div className={className} onClick={onClick} data-path={path}>
    <PaddingLeft depth={depth} />
    <Arrow />
    <span>{name}</span>
  </div>
);

const File: FC<FileOrFolderProps> = ({
  path,
  name,
  depth,
  onClick,
  className,
}) => (
  <div className={className} onClick={onClick} data-path={path + name}>
    <PaddingLeft depth={depth} />
    <LangIcon fileName={name} />
    <span>{name}</span>
  </div>
);

const RootWrapper = styled.div`
  ${({ theme }) => css`
  & .${ClassName.FOLDER}, & .${ClassName.FILE} {
    display: flex;
    padding: 0.25rem 1rem;
    cursor: pointer;
    border: 1px solid transparent;
    font-size: ${theme.font.code.size.small};

    &.${ClassName.SELECTED} {
      background: ${
        theme.colors.default.primary + theme.default.transparency.low
      };
    }

    &.${ClassName.CTX_SELECTED} {
      background: ${
        theme.colors.default.primary + theme.default.transparency.low
      };
      border-color: ${
        theme.colors.default.primary + theme.default.transparency.medium
      };
      border-radius: ${theme.default.borderRadius};
    }

    &:hover {
      background: ${
        theme.colors.default.primary + theme.default.transparency.low
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

    & > button:nth-child(2) {
      margin-left: 0.75rem;
    }
  `}
`;

const SectionHeader = styled.div`
  font-size: ${({ theme }) => theme.font.code.size.large};
`;

const BuildButtonText = styled.span`
  margin-left: 0.5rem !important;
`;

const FolderInsideWrapper = styled.div`
  &.${ClassName.HIDDEN} {
    display: none;
  }
`;

const StyledFolder = styled(Folder)`
  ${({ theme }) => css`
    & span {
      color: ${theme.colors.default.primary};
      margin-left: 0.5rem;
    }

    & svg {
      width: 0.875rem;
      height: 0.875rem;
      transition: transform ${theme.default.transition.duration.short}
        ${theme.default.transition.type};
    }

    &.${ClassName.OPEN} svg {
      transform: rotate(90deg);
    }
  `}
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

const PaddingLeft = styled.div<{ depth: number }>`
  width: ${({ depth }) => depth}rem;
  height: 100%;
`;

export default Folders;
