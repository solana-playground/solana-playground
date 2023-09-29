import { FC } from "react";
import ReactDOM from "react-dom";
import {
  DndContext,
  MouseSensor,
  useSensor,
  useSensors,
  DndContextProps,
  DragOverlayProps,
  DragOverlay,
} from "@dnd-kit/core";

interface ContextProps extends DndContextProps {
  dragOverlay?: DragOverlayProps & {
    Element: JSX.Element | null;
    portalContainer?: Element | null;
  };
}

const Context: FC<ContextProps> = ({ dragOverlay, children, ...props }) => {
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

      {dragOverlay &&
        (dragOverlay.portalContainer ? (
          ReactDOM.createPortal(
            <DragOverlay {...dragOverlay}>{dragOverlay.Element}</DragOverlay>,
            dragOverlay.portalContainer
          )
        ) : (
          <DragOverlay {...dragOverlay}>{dragOverlay.Element}</DragOverlay>
        ))}
    </DndContext>
  );
};

export default Context;
