import { FC, useEffect } from "react";
import styled, { css } from "styled-components";

import Button from "../../../../../components/Button";
import { Endpoint } from "../../../../../constants";
import { PgCommand, PgConnection, PgView } from "../../../../../utils/pg";
import type { ToastChildProps } from "../../../../../components/Toast";

export const NonLocal: FC<ToastChildProps> = ({ id }) => {
  // Close the toast if the user changes the cluster
  useEffect(() => {
    let isInitial = true;
    let prevCluster = PgConnection.cluster;
    const changeCluster = PgConnection.onDidChangeCluster((cluster) => {
      // Only close the toast if it's not initial and it's a different cluster
      if (!isInitial && prevCluster !== cluster) PgView.closeToast(id);
      isInitial = false;
      prevCluster = cluster;
    });

    const changeIsClusterDown = PgConnection.onDidChangeIsClusterDown(
      (isClusterDown) => {
        // Anything other than `isClusterDown === false` means either the cluster
        // is down, or there is a connection error, which means we don't need to
        // close the toast.
        if (!isInitial && isClusterDown === false) PgView.closeToast(id);
      }
    );

    return () => {
      changeCluster.dispose();
      changeIsClusterDown.dispose();
    };
  }, [id]);

  return (
    <Wrapper>
      <HelpTextWrapper>
        <HelpTextTitle>Switch to localnet?</HelpTextTitle>
        <HelpTextDescription>
          Current endpoint is not responsive.
        </HelpTextDescription>
      </HelpTextWrapper>

      <ButtonsWrapper>
        <Button
          onClick={() => {
            return PgCommand.solana.run(
              "config",
              "set",
              "-u",
              Endpoint.LOCALHOST
            );
          }}
          kind="secondary-transparent"
          size="small"
        >
          Yes
        </Button>
        <Button kind="no-border" size="small">
          No
        </Button>
      </ButtonsWrapper>
    </Wrapper>
  );
};

const Wrapper = styled.div``;

const HelpTextWrapper = styled.div``;

const HelpTextTitle = styled.div``;

const HelpTextDescription = styled.div`
  ${({ theme }) => css`
    margin-top: 0.25rem;
    color: ${theme.colors.default.textSecondary};
    font-size: ${theme.font.code.size.small};
  `}
`;

const ButtonsWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;

  & > button {
    margin-left: 1rem;
  }
`;
