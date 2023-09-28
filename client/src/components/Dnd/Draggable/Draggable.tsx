import { ForwardRefExoticComponent } from "react";
import {
  UniqueIdentifier,
  useDraggable,
  UseDraggableArguments,
} from "@dnd-kit/core";

interface DraggableProps<P> {
  Item: ForwardRefExoticComponent<P>;
  itemProps: P;
  id: UniqueIdentifier;
}

const Draggable = <P,>({ Item, itemProps, id }: DraggableProps<P>) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: itemProps as UseDraggableArguments["data"],
  });

  return (
    <Item
      ref={setNodeRef}
      style={{ cursor: isDragging ? "grabbing" : "pointer" }}
      {...listeners}
      {...attributes}
      {...itemProps}
    />
  );
};

export default Draggable;
