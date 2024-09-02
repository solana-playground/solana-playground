import { ChangeEvent, FC, useState } from "react";
import styled, { css } from "styled-components";

import Button from "../../../../../components/Button";
import Img from "../../../../../components/Img";
import Input from "../../../../../components/Input";
import Link from "../../../../../components/Link";
import Modal from "../../../../../components/Modal";
import Text from "../../../../../components/Text";
import {
  Eye,
  Github,
  ImportWorkspace,
  Info,
} from "../../../../../components/Icons";
import {
  Framework,
  PgCommon,
  PgFramework,
  PgGithub,
  PgRouter,
  PgView,
} from "../../../../../utils/pg";

export const ImportGithub = () => {
  // Handle user input
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const input = ev.target.value;
    setUrl(input);

    if (!input.includes("github.com")) setError("The URL must be a GitHub URL");
    else setError("");
  };

  const importFromGithub = () => PgCommon.transition(PgGithub.import(url));

  return (
    <Modal
      title
      buttonProps={{
        text: "Import",
        onSubmit: importFromGithub,
        disabled: !url,
        btnLoading: { text: "Importing..." },
        rightIcon: <ImportWorkspace />,
      }}
      error={error}
      setError={setError}
    >
      <Wrapper>
        <GithubUrlWrapper>
          <GithubUrlInputLabel>GitHub URL</GithubUrlInputLabel>
          <Input
            autoFocus
            onChange={handleChange}
            value={url}
            validator={PgGithub.isValidUrl}
            setError={setError}
            placeholder="https://github.com/..."
          />
        </GithubUrlWrapper>

        <Description>
          Projects can be imported or viewed from their GitHub URL.
        </Description>

        <ExamplesSectionWrapper>
          <ExamplesTitle>Examples</ExamplesTitle>
          <ExamplesWrapper>
            {PgFramework.frameworks.map((framework) => (
              <Example key={framework.name} framework={framework} />
            ))}
          </ExamplesWrapper>
        </ExamplesSectionWrapper>

        <Text icon={<Info color="info" />}>
          <p>
            Program repositories can be viewed in playground by combining the
            playground URL with their GitHub URL. For example, from{" "}
            <Link href={GITHUB_PROGRAM_URL}>this repository</Link>:
          </p>

          <p style={{ wordBreak: "break-all" }}>
            <Link href={VIEW_URL}>{VIEW_URL}</Link>
          </p>
        </Text>
      </Wrapper>
    </Modal>
  );
};

const GITHUB_PROGRAM_URL =
  "https://github.com/solana-developers/program-examples/tree/main/basics/create-account/anchor";

const VIEW_URL = PgCommon.getPathUrl(GITHUB_PROGRAM_URL);

const Wrapper = styled.div`
  max-width: 39rem;
`;

const GithubUrlWrapper = styled.div``;

const GithubUrlInputLabel = styled.div`
  margin-bottom: 0.5rem;
  font-weight: bold;
`;

const Description = styled.div`
  ${({ theme }) => css`
    margin: 1rem 0;
    font-size: ${theme.font.code.size.small};
    color: ${theme.colors.default.textSecondary};
    word-break: break-all;
  `}
`;

const ExamplesSectionWrapper = styled.div`
  margin: 1rem 0;
`;

const ExamplesTitle = styled.div`
  font-weight: bold;
`;

const ExamplesWrapper = styled.div`
  margin-top: 0.5rem;
`;

interface ExampleProps {
  framework: Framework;
}

const Example: FC<ExampleProps> = ({ framework }) => (
  <ExampleWrapper>
    <FrameworkWrapper>
      <FrameworkImage src={framework.icon} $circle={framework.circleImage} />
      <FrameworkName>
        {framework.name} - {framework.githubExample.name}
      </FrameworkName>
    </FrameworkWrapper>

    <ExampleButtonsWrapper>
      <Button
        onClick={async () => {
          await PgGithub.import(framework.githubExample.url);
          PgView.closeModal();
        }}
        rightIcon={<ImportWorkspace />}
      >
        Import
      </Button>

      <Button
        onClick={async () => {
          await PgRouter.navigate("/" + framework.githubExample.url);
          PgView.closeModal();
        }}
        rightIcon={<Eye />}
      >
        Open
      </Button>

      <Link href={framework.githubExample.url}>
        <Button rightIcon={<Github />}>Open in GitHub</Button>
      </Link>
    </ExampleButtonsWrapper>
  </ExampleWrapper>
);

const ExampleWrapper = styled.div`
  margin: 1rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ExampleButtonsWrapper = styled.div`
  display: flex;

  & > * {
    margin-left: 1.5rem;
  }
`;

const FrameworkWrapper = styled.div`
  ${({ theme }) => css`
    padding: 0.5rem 1rem;
    width: fit-content;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${theme.default.borderRadius};
  `}
`;

const FrameworkImage = styled(Img)<{ $circle?: boolean }>`
  ${({ $circle }) => css`
    width: 1rem;
    height: 1rem;
    border-radius: ${$circle && "50%"};
  `}
`;

const FrameworkName = styled.span`
  margin-left: 0.5rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.default.textSecondary};
`;
