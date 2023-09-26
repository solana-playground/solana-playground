import { CSSProperties, FC, useEffect } from "react";
import { UniqueIdentifier, useDroppable } from "@dnd-kit/core";
import { Fn } from "../../../utils/pg";

interface DroppableProps {
  id: UniqueIdentifier;
  overStyle?: CSSProperties;
  onDragOver?: Fn;
}

const Droppable: FC<DroppableProps> = ({
  id,
  overStyle,
  onDragOver,
  children,
}) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  useEffect(() => {
    if (isOver) onDragOver?.();
  }, [isOver, onDragOver]);

  return (
    <div ref={setNodeRef} style={isOver ? overStyle : undefined}>
      {children}
    </div>
  );
};

export default Droppable;
