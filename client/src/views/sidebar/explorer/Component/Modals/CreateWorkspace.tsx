import { FC, useEffect, useMemo, useState } from "react";
import styled, { css } from "styled-components";

import Img from "../../../../../components/Img";
import Input from "../../../../../components/Input";
import Modal from "../../../../../components/Modal";
import ResponsiveItems from "../../../../../components/ResponsiveItems";
import Select, { findSelectOption } from "../../../../../components/Select";
import {
  Fn,
  Framework as FrameworkType,
  PgCommon,
  PgExplorer,
  PgFramework,
  PgSettings,
} from "../../../../../utils";
import { useRenderOnChange } from "../../../../../hooks";

export const CreateWorkspace = () => {
  const experimentalUnstable = useRenderOnChange(
    PgSettings.onDidChangeExperimentalUnstable
  );

  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [frameworkName, setFrameworkName] = useState<FrameworkName | null>(
    null
  );
  const [version, setVersion] = useState<string | null>(null);

  const versionOpts = useMemo(() => {
    if (!PgSettings.experimental.unstable || !frameworkName) return [];
    return [...PgFramework.get(frameworkName).versions]
      .sort((a, b) => PgCommon.compareVersion(b, a))
      .map((ver, i) => ({ label: i ? ver : `${ver} (latest)`, value: ver }));
  }, [frameworkName]);

  const versionOpt = useMemo(
    () => findSelectOption(versionOpts, version),
    [versionOpts, version]
  );

  // Sync `version` and `versionOpt`
  useEffect(
    () => setVersion(versionOpt?.value ? versionOpt.value : null),
    [versionOpt]
  );

  const createWorkspace = async () => {
    const framework = PgFramework.get(frameworkName!);
    let files;
    if (PgSettings.experimental.unstable) {
      if (!version) throw new Error("Version not specified");

      const templateFiles = await framework.getTemplateFiles(version);
      const { convertToPlayground } = await framework.import();
      files = await convertToPlayground(templateFiles);
    } else {
      if (!framework.legacy) {
        throw new Error(
          "New frameworks require enabling the `experimental.unstable` setting"
        );
      }

      files = (await framework.legacy.getFiles()).files;
    }

    await PgExplorer.createWorkspace(name, {
      files,
      defaultOpenFile: framework.defaultOpenFile,
    });
  };

  return (
    <Modal
      buttonProps={{
        text: "Create",
        onSubmit: createWorkspace,
        disabled: !!error || !frameworkName,
      }}
    >
      <Content>
        <Row>
          <MainText>Project name</MainText>
          <Input
            autoFocus
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            validator={PgExplorer.isWorkspaceNameValid}
            error={error}
            setError={setError}
            placeholder="my project..."
          />
        </Row>

        <Row>
          <MainText>Framework</MainText>
          <ResponsiveItems minItemWidth="6.5rem" gap="1rem" maxItems={5}>
            {PgFramework.all.map((f) => (
              <Framework
                key={f.name}
                isSelected={frameworkName === f.name}
                select={() => {
                  setFrameworkName((s) => (s === f.name ? null : f.name));
                }}
                {...f}
              />
            ))}
          </ResponsiveItems>
        </Row>

        {experimentalUnstable && (
          <Row>
            <MainText>Version</MainText>
            <Select
              options={versionOpts}
              value={versionOpt}
              onChange={(opt) => setVersion(opt.value)}
            />
          </Row>
        )}
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
`;

const Row = styled.div``;

const MainText = styled.div`
  margin-bottom: 0.5rem;
  font-weight: bold;
  font-size: ${({ theme }) => theme.font.code.size.large};
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
      {name} ({language})
    </FrameworkName>
  </FrameworkWrapper>
);

const FrameworkWrapper = styled.div<{ isSelected?: boolean }>`
  ${({ theme, isSelected }) => css`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
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
    width: 3rem;
    height: 3rem;
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
