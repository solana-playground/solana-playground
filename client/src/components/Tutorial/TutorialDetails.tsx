import { FC } from "react";
import styled, { css } from "styled-components";

import Link from "../Link";
import Tag from "../Tag";
import { Arrayable, TutorialDetailKey } from "../../utils/pg";
import { useDifferentBackground } from "../../hooks";

interface TutorialDetailsProps {
  details: ClickableTutorialDetailProps[];
}

const TutorialDetails: FC<TutorialDetailsProps> = ({ details }) => {
  const { ref } = useDifferentBackground();

  return (
    <TutorialDetailsWrapper ref={ref}>
      {details.map(({ kind, data }) => {
        return (
          data && (
            <TutorialDetailSection key={kind}>
              <TutorialDetailName>{kind}</TutorialDetailName>

              <TutorialDetailWrapper>
                {Array.isArray(data) ? (
                  data.map((data) => (
                    <ClickableTutorialDetail
                      key={data}
                      kind={kind}
                      data={data}
                    />
                  ))
                ) : (
                  <ClickableTutorialDetail kind={kind} data={data} />
                )}
              </TutorialDetailWrapper>
            </TutorialDetailSection>
          )
        );
      })}
    </TutorialDetailsWrapper>
  );
};

const TutorialDetailsWrapper = styled.div`
  ${({ theme }) => css`
    padding: 1rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    column-gap: 2rem;
    row-gap: 1rem;
    border-radius: ${theme.default.borderRadius};
  `}
`;

const TutorialDetailSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TutorialDetailName = styled.span`
  ${({ theme }) => css`
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    font-size: ${theme.font.other.size.small};
  `}
`;

const TutorialDetailWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

interface ClickableTutorialDetailProps {
  kind: TutorialDetailKey;
  data: Arrayable<string> | undefined;
}

const ClickableTutorialDetail: FC<ClickableTutorialDetailProps> = ({
  data,
  ...props
}) => (
  <Link href={`/tutorials?${props.kind}=${data}`}>
    <Tag {...props} value={data} />
  </Link>
);

export default TutorialDetails;
