import {
  ChangeEvent,
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled, { css } from "styled-components";

import Checkbox from "../../../../../components/Checkbox";
import CopyButton from "../../../../../components/CopyButton";
import Input from "../../../../../components/Input";
import LangIcon from "../../../../../components/LangIcon";
import Link from "../../../../../components/Link";
import Modal from "../../../../../components/Modal";
import Text from "../../../../../components/Text";
import { Checkmark, Sad } from "../../../../../components/Icons";
import { CLIENT_URL } from "../../../../../constants";
import { PgCommon, PgExplorer, PgShare, PgView } from "../../../../../utils/pg";
import { useDifferentBackground } from "../../../../../hooks";

export const Share = () => {
  const [filePaths, setFilePaths] = useState(Object.keys(PgExplorer.files));
  const [disabled, setDisabled] = useState(!filePaths.length);

  const { ref: filePickerRef } = useDifferentBackground();

  // Sync disabled state
  useEffect(() => setDisabled(!filePaths.length), [filePaths]);

  // Handle checkbox `checked`
  useEffect(() => {
    const checkboxes = filePickerRef.current!.getElementsByTagName("input");
    for (const checkbox of checkboxes) {
      const dataPath = checkbox.getAttribute("data-path");
      if (!dataPath) continue;

      const checked = filePaths.some((path) => path.startsWith(dataPath));
      checkbox.checked = checked;
    }
  }, [filePaths, filePickerRef]);

  const share = async () => {
    try {
      const shareId = await PgCommon.transition(PgShare.new(filePaths));
      PgView.setModal(<SuccessPage shareId={shareId} />);
    } catch (e: any) {
      console.log("SHARE ERROR:", e.message);
      PgView.setModal(<ErrorPage message={e.message} />);
    }
  };

  return (
    <Modal
      title
      buttonProps={{
        text: "Share",
        onSubmit: share,
        disabled,
        noCloseOnSubmit: true,
      }}
    >
      <SelectFilesText>Select which files you'd like to share.</SelectFilesText>

      <FilePickerWrapper ref={filePickerRef}>
        <RecursiveFolder
          path={PgExplorer.getProjectRootPath()}
          setFilePaths={setFilePaths}
        />
      </FilePickerWrapper>
    </Modal>
  );
};

const SelectFilesText = styled.div``;

const FilePickerWrapper = styled.div`
  ${({ theme }) => css`
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    border-radius: ${theme.default.borderRadius};
  `}
`;

interface RecursiveFolderProps {
  path: string;
  setFilePaths: Dispatch<SetStateAction<string[]>>;
}

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

  const wrapperRef = useRef<HTMLDivElement>(null);

  const toggleCheck = useCallback(
    (ev: ChangeEvent<HTMLInputElement>) => {
      const paths: string[] = [];
      const startEl = PgExplorer.getItemTypeFromEl(ev.target)?.file
        ? ev.target.parentElement!.parentElement!
        : wrapperRef.current!;

      const recursivelyGetPaths = (el: Element) => {
        for (const childEl of el.children) {
          if (childEl.getAttribute("type") === "checkbox") {
            const path = childEl.getAttribute("data-path");
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

  return (
    <Folder ref={wrapperRef}>
      <FolderName style={{ paddingLeft: `${depth}rem` }}>
        <Checkbox
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
            path={PgCommon.joinPaths([path, name, "/"])}
            setFilePaths={setFilePaths}
          />
        ))}

      {files
        .sort((a, b) => a.localeCompare(b))
        .map((name) => (
          <File key={name} style={{ paddingLeft: `${depth + 1}rem` }}>
            <Checkbox
              label={
                <FileNameWrapper>
                  <LangIcon fileName={name} />
                  <FileName>{name}</FileName>
                </FileNameWrapper>
              }
              onChange={toggleCheck}
              defaultChecked
              data-path={PgCommon.joinPaths([path, name])}
            />
          </File>
        ))}
    </Folder>
  );
};

const Folder = styled.div`
  & label {
    width: 100%;
  }
`;

const FolderName = styled.div``;

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

interface ErrorPageProps {
  message: string;
}

const ErrorPage: FC<ErrorPageProps> = ({ message }) => (
  <Modal title buttonProps={{ text: "Continue" }}>
    <Text kind="error" IconEl={<Sad />}>
      Share error: {message}
    </Text>
  </Modal>
);

interface SuccessPageProps {
  shareId: string;
}

const SuccessPage: FC<SuccessPageProps> = ({ shareId }) => {
  const shareLink = `${CLIENT_URL}/${shareId}`;

  return (
    <Modal title buttonProps={{ text: "Continue" }}>
      <SuccessWrapper>
        <Text kind="success" IconEl={<Checkmark color="success" />}>
          Successfully shared the project.
        </Text>

        <SuccessInputWrapper>
          <Input value={shareLink} readOnly />
          <CopyButton copyText={shareLink} />
        </SuccessInputWrapper>
        <SuccessLinkWrapper>
          <Link href={shareLink}>Go to the link</Link>
        </SuccessLinkWrapper>
      </SuccessWrapper>
    </Modal>
  );
};

const SuccessWrapper = styled.div`
  min-width: 24rem;
`;

const SuccessInputWrapper = styled.div`
  display: flex;
  margin-top: 1rem;
`;

const SuccessLinkWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: 0.75rem;
  margin-left: 0.25rem;

  & a,
  & svg {
    color: ${({ theme }) => theme.colors.state.info.color};
  }
`;
