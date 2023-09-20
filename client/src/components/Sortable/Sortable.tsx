import { Dispatch, FC, ForwardRefExoticComponent, SetStateAction } from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  MouseSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";

interface SortableProps {
  items: UniqueIdentifier[];
  setItems: Dispatch<SetStateAction<UniqueIdentifier[]>>;
}

export const Sortable: FC<SortableProps> = ({ items, setItems, children }) => {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);

      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      sensors={sensors}
    >
      <SortableContext items={items} strategy={horizontalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
};

interface SortableItemProps<P> {
  id: UniqueIdentifier;
  Item: ForwardRefExoticComponent<P>;
}

export const SortableItem = <P,>(props: SortableItemProps<P> & P) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id });

  return (
    <props.Item
      ref={setNodeRef}
      style={{
        position: "relative",
        zIndex: isDragging ? 1 : undefined,
        transform: transform
          ? CSS.Transform.toString({ ...transform, scaleX: 1 })
          : undefined,
        transition,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      isDragging={isDragging}
      {...attributes}
      {...listeners}
      {...props}
    />
  );
};

export interface SortableItemProvidedProps {
  isDragging: boolean;
}
