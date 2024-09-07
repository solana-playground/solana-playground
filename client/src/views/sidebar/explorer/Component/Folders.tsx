import {
  ComponentPropsWithoutRef,
  CSSProperties,
  FC,
  forwardRef,
  MouseEvent,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import styled, { css, useTheme } from "styled-components";

import ExplorerButtons from "./ExplorerButtons";
import Button, { ButtonProps } from "../../../../components/Button";
import Dnd, { DragStartEvent, DragEndEvent } from "../../../../components/Dnd";
import LangIcon from "../../../../components/LangIcon";
import { ExplorerContextMenu } from "./ExplorerContextMenu";
import { ReplaceItem } from "./Modals";
import {
  Plus,
  Rocket,
  ShortArrow,
  TestTube,
  Triangle,
  Wrench,
} from "../../../../components/Icons";
import { ClassName, Id, ItemError } from "../../../../constants";
import { PgCommon, PgExplorer, PgView } from "../../../../utils/pg";
import { useExplorerContextMenu } from "./useExplorerContextMenu";
import { useHandleItemState } from "./useHandleItemState";
import { useNewItem } from "./useNewItem";
import { useKeybind } from "../../../../hooks";

const Folders = () => {
  useHandleItemState();

  const ctxMenu = useExplorerContextMenu();
  const { newItem } = useNewItem();

  useKeybind(
    [
      { keybind: "Alt+N", handle: newItem },
      { keybind: "F2", handle: ctxMenu.renameItem },
      { keybind: "Delete", handle: ctxMenu.deleteItem },
    ],
    []
  );

  // No need to memoize here
  const relativeRootPath = PgExplorer.getProjectRootPath();
  const { folders } = PgExplorer.getFolderContent(relativeRootPath);
  const otherFolders = folders.filter(
    (f) =>
      f !== PgExplorer.PATHS.SRC_DIRNAME &&
      f !== PgExplorer.PATHS.CLIENT_DIRNAME &&
      f !== PgExplorer.PATHS.TESTS_DIRNAME
  );

  return (
    <>
      <ExplorerButtons />

      <ExplorerDndContext>
        <ExplorerContextMenu {...ctxMenu}>
          <RootWrapper id={Id.ROOT_DIR} data-path={relativeRootPath}>
            {/* Program */}
            <SectionTopWrapper>
              <SectionHeader>Program</SectionHeader>
              {folders.includes(PgExplorer.PATHS.SRC_DIRNAME) ? (
                <>
                  <SectionButton
                    onClick={ctxMenu.runBuild}
                    icon={<Wrench />}
                    addTextMargin
                  >
                    Build
                  </SectionButton>
                  <SectionButton
                    onClick={ctxMenu.runDeploy}
                    icon={<Rocket />}
                    addTextMargin
                    disabled={ctxMenu.deployState !== "ready"}
                  >
                    Deploy
                  </SectionButton>
                </>
              ) : (
                <SectionButton onClick={ctxMenu.addProgram} icon={<Plus />}>
                  Add
                </SectionButton>
              )}
            </SectionTopWrapper>
            <FolderGroup
              folders={folders.filter(
                (f) => f === PgExplorer.PATHS.SRC_DIRNAME
              )}
              relativeRootPath={relativeRootPath}
            />

            {/* Client and tests */}
            <SectionTopWrapper>
              <SectionHeader>Client</SectionHeader>
              {folders.includes(PgExplorer.PATHS.CLIENT_DIRNAME) ? (
                <SectionButton
                  onClick={ctxMenu.runClientFolder}
                  icon={<Triangle rotate="90deg" />}
                  title="Run All (in client dir)"
                  addTextMargin
                >
                  Run
                </SectionButton>
              ) : (
                <SectionButton onClick={ctxMenu.addClient} icon={<Plus />}>
                  Add client
                </SectionButton>
              )}

              {folders.includes(PgExplorer.PATHS.TESTS_DIRNAME) ? (
                <SectionButton
                  onClick={ctxMenu.runTestFolder}
                  icon={<TestTube />}
                  title="Test All (in tests dir)"
                >
                  Test
                </SectionButton>
              ) : (
                <SectionButton onClick={ctxMenu.addTests} icon={<Plus />}>
                  Add tests
                </SectionButton>
              )}
            </SectionTopWrapper>
            <FolderGroup
              folders={folders.filter(
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
      </ExplorerDndContext>
    </>
  );
};

const ExplorerDndContext: FC = ({ children }) => {
  const [activeItemProps, setActiveItemProps] = useState<any>(null);
  const [parentFolderEl, setParentFolderEl] = useState<HTMLElement | null>(
    null
  );

  const handleDragStart = useCallback((ev: DragStartEvent) => {
    const props: any = ev.active.data.current;
    const el = PgExplorer.getElFromPath(props.path);
    if (!el) return;

    // Get the class name from the element to persist the folder open state
    setActiveItemProps({ ...props, className: el.className });
    setParentFolderEl(el.parentElement!);
  }, []);

  const handleDragEnd = useCallback(async (ev: DragEndEvent) => {
    const { active, over } = ev;
    if (!over) return;

    const fromPath = active.id as string;
    const toPath = over.id as string;
    if (PgCommon.isPathsEqual(fromPath, toPath)) return;

    // Destination should be a folder
    const isToPathFolder = PgExplorer.getItemTypeFromPath(toPath).folder;
    if (!isToPathFolder) return;

    // Should not be able to move parent dir into child
    const isFromPathFolder = PgExplorer.getItemTypeFromPath(fromPath).folder;
    if (isFromPathFolder && toPath.startsWith(fromPath)) return;

    const itemName = PgExplorer.getItemNameFromPath(fromPath);
    const newPath = PgExplorer.getCanonicalPath(
      PgCommon.joinPaths(toPath, itemName)
    );
    if (PgCommon.isPathsEqual(fromPath, newPath)) return;

    try {
      await PgExplorer.renameItem(fromPath, newPath, {
        skipNameValidation: true,
      });
    } catch (e: any) {
      if (e.message === ItemError.ALREADY_EXISTS) {
        await PgView.setModal(
          <ReplaceItem fromPath={fromPath} toPath={newPath} />
        );
      }
    }
  }, []);

  const Item = activeItemProps
    ? PgExplorer.getItemTypeFromPath(activeItemProps.path).file
      ? StyledFile
      : StyledFolder
    : null;

  return (
    <Dnd.Context
      dragOverlay={{
        Element: Item && <Item {...activeItemProps} />,
        portalContainer: parentFolderEl,
        dropAnimation: null,
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
    </Dnd.Context>
  );
};

interface SectionButtonProps extends ButtonProps {
  icon: ReactNode;
  addTextMargin?: boolean;
}

const SectionButton: FC<SectionButtonProps> = ({
  onClick,
  icon,
  addTextMargin,
  children,
  ...props
}) => (
  <Button onClick={onClick} kind="icon" {...props}>
    {icon}
    <SectionButtonText addTextMargin={addTextMargin}>
      {children}
    </SectionButtonText>
  </Button>
);

const SectionButtonText = styled.span<
  Pick<SectionButtonProps, "addTextMargin">
>`
  ${({ addTextMargin }) => css`
    margin: 0 0.25rem;
    ${addTextMargin && "margin-left: 0.50rem"};
  `}
`;

interface FolderGroupProps {
  folders: string[];
  relativeRootPath: string;
}

const FolderGroup: FC<FolderGroupProps> = ({ folders, relativeRootPath }) => (
  <>
    {folders
      .sort((a, b) => a.localeCompare(b))
      .map((folderName) => (
        <RecursiveFolder
          key={folderName}
          path={PgCommon.appendSlash(
            PgCommon.joinPaths(relativeRootPath, folderName)
          )}
        />
      ))}
  </>
);

interface RecursiveFolderProps {
  path: string;
}

const RecursiveFolder: FC<RecursiveFolderProps> = ({ path }) => {
  const folderName = useMemo(
    () => PgExplorer.getItemNameFromPath(path),
    [path]
  );

  const depth = useMemo(
    () => PgExplorer.getRelativePath(path).split("/").length - 2,
    [path]
  );

  // Intentionally don't memoize in order to re-render
  const { files, folders } = PgExplorer.getFolderContent(path);

  const toggle = useCallback((ev: MouseEvent<HTMLDivElement>) => {
    const el = ev.currentTarget;
    // Set selected
    PgExplorer.setSelectedEl(el);
    PgExplorer.setCtxSelectedEl(el);

    if (PgExplorer.getItemTypeFromEl(el)?.folder) {
      PgExplorer.toggleFolder(el);
    } else {
      PgExplorer.openFile(PgExplorer.getItemPathFromEl(el)!);
    }
  }, []);

  // Open the folder on drag over
  const handleDragOver = useCallback((el) => {
    PgExplorer.openFolder(el.firstChild);
  }, []);

  const theme = useTheme();
  const overStyle: CSSProperties = useMemo(
    () => ({
      background: theme.colors.default.primary + theme.default.transparency.low,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme.name]
  );

  return (
    <Dnd.Droppable id={path} onDragOver={handleDragOver} overStyle={overStyle}>
      <Dnd.Draggable
        id={path}
        Item={StyledFolder}
        itemProps={{
          path,
          name: folderName,
          depth,
          onClick: toggle,
          className: ClassName.FOLDER,
        }}
      />

      <FolderInsideWrapper
        className={`${ClassName.FOLDER_INSIDE} ${ClassName.HIDDEN}`}
      >
        {folders
          .sort((a, b) => a.localeCompare(b))
          .map((folderName) => (
            <RecursiveFolder
              key={folderName}
              path={PgCommon.appendSlash(PgCommon.joinPaths(path, folderName))}
            />
          ))}

        {files
          .sort((a, b) => a.localeCompare(b))
          .map((fileName) => (
            <Dnd.Draggable
              key={fileName}
              id={PgCommon.joinPaths(path, fileName)}
              Item={StyledFile}
              itemProps={{
                path: PgCommon.joinPaths(path, fileName),
                name: fileName,
                depth: depth + 1,
                onClick: toggle,
                className: ClassName.FILE,
              }}
            />
          ))}
      </FolderInsideWrapper>
    </Dnd.Droppable>
  );
};

interface FileOrFolderProps {
  path: string;
  name: string;
  depth: number;
}

type FolderProps = FileOrFolderProps & ComponentPropsWithoutRef<"div">;

const Folder = forwardRef<HTMLDivElement, FolderProps>(
  ({ path, name, depth, ...props }, ref) => (
    <div ref={ref} data-path={path} {...props}>
      <PaddingLeft depth={depth} />
      <ShortArrow color="textSecondary" />
      <span>{name}</span>
    </div>
  )
);

type FileProps = FileOrFolderProps & ComponentPropsWithoutRef<"div">;

const File = forwardRef<HTMLDivElement, FileProps>(
  ({ path, name, depth, ...props }, ref) => (
    <div ref={ref} data-path={path} {...props}>
      <PaddingLeft depth={depth} />
      <LangIcon fileName={name} />
      <span>{name}</span>
    </div>
  )
);

const RootWrapper = styled.div`
  ${({ theme }) => css`
  padding: 0.375rem 0;

  & .${ClassName.FOLDER}, & .${ClassName.FILE} {
    display: flex;
    align-items: center;
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
