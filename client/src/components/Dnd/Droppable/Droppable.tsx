import { CSSProperties, FC, useEffect } from "react";
import { UniqueIdentifier, useDroppable } from "@dnd-kit/core";

interface DroppableProps {
  id: UniqueIdentifier;
  overStyle?: CSSProperties;
  onDragOver?: (ref: HTMLElement) => void;
}

const Droppable: FC<DroppableProps> = ({
  id,
  overStyle,
  onDragOver,
  children,
}) => {
  const { isOver, node, setNodeRef } = useDroppable({ id });

  useEffect(() => {
    if (isOver && node.current) onDragOver?.(node.current);
  }, [isOver, node, onDragOver]);

  return (
    <div ref={setNodeRef} style={isOver ? overStyle : undefined}>
      {children}
    </div>
  );
};

export default Droppable;
