import { FC, MouseEvent, Ref, useEffect, useMemo, useRef } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import { explorerAtom, refreshExplorerAtom } from "../../../../../state";
import { Arrow } from "../../../../Icons";
import ContextMenu from "./ContextMenu";
import { ClassNames } from "../../../../../constants/";
import LangIcon from "../../../../LangIcon";
import { PgExplorer } from "../../../../../utils/pg/explorer";

const Folders = () => {
  const [explorer] = useAtom(explorerAtom);
  useAtom(refreshExplorerAtom); // to re-render on demand

  // Initial folder state on mount
  useEffect(() => {
    if (!explorer.getTabs().length) return;

    const curFile = explorer.getCurrentFile();
    if (!curFile) return;

    // Open if it's parents are not opened
    PgExplorer.openAllParents(curFile.path);

    // Change selected
    const newEl = PgExplorer.getElFromPath(curFile.path);
    if (newEl) PgExplorer.setSelectedEl(newEl);
  }, [explorer]);

  const explorerRef = useRef<HTMLDivElement>(null);

  // No need to memoize here
  const root = explorer.getFolderContent("/");

  // Only update local storage if we haven't rendered in 5s
  useEffect(() => {
    let timeOutId: NodeJS.Timeout;

    timeOutId = setTimeout(() => {
      explorer.saveLs();
    }, 5000);

    return () => {
      clearTimeout(timeOutId);
    };
  });

  return (
    <>
      <div
        ref={explorerRef}
        id="root-dir"
        data-path="/"
        style={{ paddingLeft: "0.5rem" }}
      >
        {root.folders
          .sort((x, y) => x.localeCompare(y))
          .map((f, i) => {
            const path = "/" + f + "/";
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
      </div>
      <ContextMenu explorerRef={explorerRef} />
    </>
  );
};

interface FolderProps {
  path: string;
  folders: string[];
  files: string[];
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
      explorer.changeCurrentFile(
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
        className={ClassNames.FOLDER}
      />

      <FolderInsideWrapper ref={folderInsideRef} className={ClassNames.HIDDEN}>
        {folders
          .sort((x, y) => x.localeCompare(y))
          .map((folderName, i) => {
            const insideFolderPath = path + folderName + "/";
            const folder = explorer.getFolderContent(insideFolderPath);
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
              className={ClassNames.FILE}
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

const FolderInsideWrapper = styled.div`
  margin-left: 1rem;

  &.hidden {
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

  &.open svg {
    transform: rotate(90deg);
  }
`;

const StyledFile = styled(File)`
  & img {
    width: 1rem;
    height: 1rem;
    filter: ${({ theme }) => (theme.isDark ? "invert(0.6)" : "invert(0.4)")};
    margin-left: 0.125rem;
  }

  & span {
    color: ${({ theme }) => theme.colors.default.textPrimary};
    margin-left: 0.375rem;
  }
`;

export default Folders;
