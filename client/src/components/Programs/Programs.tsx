import { useSearchParams } from "react-router-dom";
import { FC } from "react";
import styled, { css } from "styled-components";

import Link from "../Link";
import SearchBar from "../SearchBar";
import Tag from "../Tag";
import Tooltip from "../Tooltip";
import { Github } from "../Icons";
import { filterQuery, FILTERS } from "./filters";
import {
  Arrayable,
  PgTheme,
  TutorialData,
  TutorialDetailKey,
} from "../../utils/pg";

const SEARCH_PARAM = "search";

const PROGRAMS: ProgramProps[] = [];

export const Programs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get(SEARCH_PARAM) ?? "";

  const filters = FILTERS.map((f) => ({
    key: f.param,
    value: searchParams.getAll(f.param),
  }));
  const filteredPrograms = PROGRAMS.filter((p) => {
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      filters.every((f) => filterQuery(f.value, p[f.key]))
    );
  }).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Wrapper>
      <TopSection>
        <Title>Programs</Title>
        <SearchBar
          placeholder="Search programs"
          value={search}
          onChange={(ev) => {
            const value = ev.target.value;
            if (!value) searchParams.delete(SEARCH_PARAM);
            else searchParams.set(SEARCH_PARAM, value);

            setSearchParams(searchParams, { replace: true });
          }}
          searchButton={{ position: "right", width: "2.5rem" }}
        />
      </TopSection>
      <MainSection>
        {filteredPrograms.map((program) => (
          <Program key={program.name} {...program} />
        ))}
      </MainSection>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.views.programs.default)};
  `}
`;

const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;

  /** Search bar */
  & > div {
    width: max(12rem, 50%);
  }
`;

const Title = styled.h1``;

const MainSection = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.views.programs.main.default)};
  `}
`;

type ProgramProps = {
  name: string;
  description: string;
  repo: string;
} & Required<Pick<TutorialData, "framework" | "languages" | "categories">>;

const Program: FC<ProgramProps> = ({
  name,
  description,
  repo,
  framework,
  languages,
  categories,
}) => (
  <ProgramWrapper>
    <ProgramHeader>
      <ProgramHeaderLeft>
        <ProgramTitle href={`/github/${repo}`}>{name}</ProgramTitle>
      </ProgramHeaderLeft>

      <ProgramHeaderRight>
        <Tooltip element="View in GitHub">
          <Link href={repo}>
            <Github />
          </Link>
        </Tooltip>
      </ProgramHeaderRight>
    </ProgramHeader>

    <ProgramDescription>{description}</ProgramDescription>

    <ProgramTags>
      <ClickableTag kind="framework" value={framework} />

      {languages.map((lang) => (
        <ClickableTag key={lang} kind="languages" value={lang} />
      ))}

      {categories.map((category) => (
        <ClickableTag key={category} kind="categories" value={category} />
      ))}
    </ProgramTags>
  </ProgramWrapper>
);

const ProgramWrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.views.programs.main.card)};
  `}
`;

const ProgramHeader = styled.div`
  display: flex;
  justify-content: space-between;

  & > div {
    display: flex;
    align-items: center;
  }
`;

const ProgramHeaderLeft = styled.div``;

const ProgramHeaderRight = styled.div``;

const ProgramTitle = styled(Link)`
  ${({ theme }) => css`
    font-size: ${theme.font.other.size.medium};
    font-weight: bold;
    color: inherit;
  `}
`;

const ProgramDescription = styled.div`
  ${({ theme }) => css`
    color: ${theme.colors.default.textSecondary};
  `}
`;

const ProgramTags = styled.div`
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
