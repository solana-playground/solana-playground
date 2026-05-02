import { FC } from "react";

import MultipleModal, { MultipleModalProps } from "./MultipleModal";
import SingleModal, { SingleModalProps } from "./SingleModal";

type ModalProps =
  | ({
      /** Single page modal */
      multiple?: false;
    } & SingleModalProps)
  | ({
      /** Multiple page modal */
      multiple: true;
    } & MultipleModalProps);

const Modal: FC<ModalProps> = (props) => {
  if (props.multiple) return <MultipleModal {...props} />;
  return <SingleModal {...props} />;
};

export default Modal;
