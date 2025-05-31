import { FC, ReactNode, useState } from "react";
import styled, { css } from "styled-components";

import Foldable from "../../../../../components/Foldable";
import BuildFlags from "./BuildFlags";
import IDL from "./IDL";
import ProgramBinary from "./ProgramBinary";
import ProgramID from "./ProgramID";
import { useAsyncEffect } from "../../../../../hooks";
import { PgFramework } from "../../../../../utils/pg";

/** All program settings */
const DEFAULT_PROGRAM_SETTINGS: ProgramSettingProps[] = [
  {
    title: "Program ID",
    description:
      "Import/export program keypair or input a public key for the program",
    element: <ProgramID />,
    isOpen: true,
  },
  {
    title: "Program binary",
    description: "Import your program and deploy without failure",
    element: <ProgramBinary />,
  },
];

const ProgramSettings = () => {
  const [settings, setSettings] = useState<ProgramSettingProps[] | null>(null);

  useAsyncEffect(async () => {
    const framework = await PgFramework.getFromFiles();
    switch (framework?.name) {
      case "Anchor":
      case "Seahorse": {
        const anchorSettings: ProgramSettingProps[] = [
          {
            title: "IDL",
            description: "Anchor IDL interactions",
            element: <IDL />,
          },
        ];
        if (process.env.NODE_ENV !== "production") {
          anchorSettings.unshift({
            title: "Build flags",
            description: "Anchor build flags",
            element: <BuildFlags />,
          });
        }

        setSettings(DEFAULT_PROGRAM_SETTINGS.concat(anchorSettings));
        break;
      }
      case "Native":
        setSettings(DEFAULT_PROGRAM_SETTINGS);
        break;
      default:
        setSettings(null);
    }
  }, []);

  if (!settings) return null;

  return (
    <Wrapper>
      {settings.map((setting) => (
        <ProgramSetting key={setting.title} {...setting} />
      ))}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.default.border};
`;

interface ProgramSettingProps {
  /** Title text that will be shown as a foldable title */
  title: string;
  /** Description of the setting that will be shown after unfolding */
  description: string;
  /** Component that will be shown inside the foldable and under the description */
  element: ReactNode;
  /** Whether the foldable is open by default */
  isOpen?: boolean;
}

const ProgramSetting: FC<ProgramSettingProps> = ({
  title,
  description,
  element,
  isOpen,
}) => (
  <ProgramSettingWrapper>
    <Foldable
      isOpen={isOpen}
      element={<ProgramSettingTitle>{title}</ProgramSettingTitle>}
    >
      <ProgramSettingsInside>
        <ProgramSettingDescription>{description}</ProgramSettingDescription>
        <ProgramSettingContent>{element}</ProgramSettingContent>
      </ProgramSettingsInside>
    </Foldable>
  </ProgramSettingWrapper>
);

const ProgramSettingWrapper = styled.div`
  margin-top: 1rem;
`;

const ProgramSettingTitle = styled.span``;

const ProgramSettingsInside = styled.div`
  padding: 0 0.5rem;
`;

const ProgramSettingDescription = styled.div`
  ${({ theme }) => css`
    color: ${theme.colors.default.textSecondary};
    font-size: ${theme.font.code.size.small};
  `}
`;

const ProgramSettingContent = styled.div`
  margin-top: 0.5rem;
`;

export default ProgramSettings;
