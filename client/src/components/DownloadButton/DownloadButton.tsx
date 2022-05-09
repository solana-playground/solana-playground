import { FC } from "react";
import Button, { ButtonKind } from "../Button";

interface DownloadButtonProps {
  href: string;
  download: string;
  buttonKind?: ButtonKind;
}

const DownloadButton: FC<DownloadButtonProps> = ({
  href,
  download,
  buttonKind = "outline",
  children,
}) => (
  <a href={href} download={download}>
    <Button kind={buttonKind}>{children}</Button>
  </a>
);

export default DownloadButton;
