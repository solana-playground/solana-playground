import { useEffect, useState } from "react";
import styled, { css } from "styled-components";

import Button from "../../Button";
import Link from "../../Link";
import { Close } from "../../Icons";
import { PgNoti } from "../../../utils/pg";

const Noti = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      if (PgNoti.isEnabled()) setShow(true);
    }, 2000);
  }, []);

  if (!show) return null;

  const closeNoti = () => {
    setShow(false);
    PgNoti.disable();
  };

  return (
    <Wrapper>
      Don't know where to get started? Here are some great starting points:
      <Link href="https://book.anchor-lang.com/">Anchor Book</Link>
      <Comma>,</Comma>
      <Link href="https://solanacookbook.com/">Solana Cook Book</Link>
      <Comma>,</Comma>
      <Link href="https://soldev.app/">Soldev</Link>
      <Button kind="icon" onClick={closeNoti} title="Close">
        <Close />
      </Button>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    position: relative;
    height: 1.5rem;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${theme.colors.default.primary};
    color: ${theme.colors.contrast?.primary && theme.colors.contrast.color};

    & a {
      font-weight: bold;

      &:first-child {
        margin-left: 0.25rem;
      }
    }

    & button {
      position: absolute;
      right: 0rem;
      margin: 0 0.25rem 0 0.5rem;
      color: ${theme.colors.default.textPrimary};

      & svg {
        width: 1rem;
        height: 1rem;
      }
    }
  `}
`;

const Comma = styled.span`
  margin-right: 0.25rem;
`;

export default Noti;
