import { FC } from "react";
import styled, { css } from "styled-components";

import Img from "../../../../components/Img";
import Link from "../../../../components/Link";
import Markdown from "../../../../components/Markdown";
import Tag from "../../../../components/Tag";
import Tooltip from "../../../../components/Tooltip";
import { Github } from "../../../../components/Icons";
import {
  Arrayable,
  PgTheme,
  TutorialData,
  TutorialDetailKey,
} from "../../../../utils/pg";

export type ProgramCardProps = {
  /** Program name */
  name: string;
  /** Program description */
  description: string;
  /** Repository URL */
  repo: string;
  /**
   * Theoratically we should be able to get the icon URL from the repository
   * URL e.g. "https://github.com/solana-playground.png", but unfortunately
   * github.com doesn't respond with CORS headers so we can't use it with the
   * following request headers:
   * ```
   * "Cross-Origin-Embedder-Policy": "require-corp",
   * "Cross-Origin-Opener-Policy": "same-origin"
   * ```
   */
  icon: string;
} & Required<Pick<TutorialData, "framework" | "categories">>;

const ProgramCard: FC<ProgramCardProps> = ({
  name,
  description,
  repo,
  icon,
  framework,
  categories,
}) => (
  <Wrapper>
    <Header>
      <HeaderLeft>
        <Link href={`/${repo}`}>
          <ProgramImg src={icon} />
        </Link>
        <Title href={`/${repo}`}>{name}</Title>
      </HeaderLeft>

      <HeaderRight>
        <Tooltip element="View in GitHub">
          <Link href={repo}>
            <Github />
          </Link>
        </Tooltip>
      </HeaderRight>
    </Header>

    <Description>{description}</Description>

    <Tags>
      <ClickableTag kind="framework" value={framework} />

      {categories
        .sort((a, b) => a.localeCompare(b))
        .map((category) => (
          <ClickableTag key={category} kind="categories" value={category} />
        ))}
    </Tags>
  </Wrapper>
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.main.primary.programs.main.content.card
    )};
  `}
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;

  & > div {
    display: flex;
    align-items: center;
  }
`;

const HeaderLeft = styled.div``;

const HeaderRight = styled.div``;

const ProgramImg = styled(Img)`
  ${({ theme }) => css`
    border-radius: ${theme.default.borderRadius};
    width: 2rem;
    height: 2rem;
  `}
`;

const Title = styled(Link)`
  ${({ theme }) => css`
    font-size: ${theme.font.other.size.medium};
    margin-left: 0.75rem;
    font-weight: bold;
    color: inherit;
  `}
`;

const Description = styled(Markdown)`
  ${({ theme }) => css`
    height: 3rem;
    color: ${theme.colors.default.textSecondary};
    ${PgTheme.getClampLinesCSS(2)};
  `}
`;

const Tags = styled.div`
  display: flex;
  gap: 1rem;
`;

interface ClickableTagProps {
  kind: TutorialDetailKey;
  value: Arrayable<string> | undefined;
}

const ClickableTag: FC<ClickableTagProps> = (props) => (
  <Link href={`/programs?${props.kind}=${props.value}`}>
    <Tag {...props} />
  </Link>
);

export default ProgramCard;
