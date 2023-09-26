import { FC } from "react";
import {
  closestCenter,
  DndContext as DndKitContext,
  MouseSensor,
  useSensor,
  useSensors,
  DndContextProps,
} from "@dnd-kit/core";

const DndContext: FC<DndContextProps> = ({ children, ...props }) => {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  return (
    <DndKitContext
      collisionDetection={closestCenter}
      sensors={sensors}
      {...props}
    >
      {children}
    </DndKitContext>
  );
};

export default DndContext;
