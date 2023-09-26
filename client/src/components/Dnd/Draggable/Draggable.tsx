import { ForwardRefExoticComponent } from "react";
import {
  UniqueIdentifier,
  useDraggable,
  UseDraggableArguments,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface DraggableProps<P> {
  Item: ForwardRefExoticComponent<P>;
  itemProps: P;
  id: UniqueIdentifier;
}

const Draggable = <P,>({ Item, itemProps, id }: DraggableProps<P>) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data: itemProps as UseDraggableArguments["data"],
  });

  return (
    <Item
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      {...itemProps}
    />
  );
};

export default Draggable;
