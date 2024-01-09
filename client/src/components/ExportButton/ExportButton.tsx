import { FC } from "react";
import styled from "styled-components";

import Button, { ButtonKind } from "../Button";
import { PgCommon } from "../../utils/pg";

interface ExportButtonProps {
  href: string | object;
  fileName: string;
  buttonKind?: ButtonKind;
  noButton?: boolean;
}

const ExportButton: FC<ExportButtonProps> = ({
  href,
  fileName,
  buttonKind = "outline",
  noButton = false,
  children,
}) => (
  <Wrapper href={PgCommon.getDataUrl(href)} download={fileName}>
    {noButton ? (
      <div>{children}</div>
    ) : (
      <Button kind={buttonKind}>{children}</Button>
    )}
  </Wrapper>
);

const Wrapper = styled.a`
  width: fit-content;
`;

export default ExportButton;
