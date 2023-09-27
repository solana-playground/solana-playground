import { FC } from "react";
import {
  DndContext,
  MouseSensor,
  useSensor,
  useSensors,
  DndContextProps,
} from "@dnd-kit/core";

const Context: FC<DndContextProps> = ({ children, ...props }) => {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  return (
    <DndContext sensors={sensors} {...props}>
      {children}
    </DndContext>
  );
};

export default Context;
