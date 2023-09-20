import {
  Dispatch,
  ForwardRefExoticComponent,
  SetStateAction,
  useState,
} from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
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

interface SortableProps<P> {
  items: UniqueIdentifier[];
  setItems: Dispatch<SetStateAction<UniqueIdentifier[]>>;

  Item: ForwardRefExoticComponent<P>;
  getItemProps: (item: UniqueIdentifier, index: number) => P;
}

const Sortable = <P,>({
  items,
  setItems,
  Item,
  getItemProps,
}: SortableProps<P>) => {
  const [activeItemProps, setActiveItemProps] = useState<any | null>(null);

  const handleDragStart = (ev: DragStartEvent) => {
    setActiveItemProps(ev.active.data.current);
  };

  const handleDragEnd = (ev: DragEndEvent) => {
    const { active, over } = ev;
    if (!over || active.id === over.id) return;

    setItems((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);

      return arrayMove(items, oldIndex, newIndex);
    });

    setActiveItemProps(null);
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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
      sensors={sensors}
      modifiers={[restrictToHorizontalAxis]}
    >
      <SortableContext items={items} strategy={horizontalListSortingStrategy}>
        {items.map((item, i) => (
          <SortableItem
            key={item}
            id={item}
            Item={Item}
            {...getItemProps(item, i)}
          />
        ))}
      </SortableContext>

      {activeItemProps && (
        <DragOverlay>
          <Item {...activeItemProps} />
        </DragOverlay>
      )}
    </DndContext>
  );
};

interface SortableItemProps<P> {
  id: UniqueIdentifier;
  Item: ForwardRefExoticComponent<P>;
}

const SortableItem = <P,>(props: SortableItemProps<P> & P) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id, data: props });

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
        cursor: isDragging ? "grabbing" : "pointer",
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

export default Sortable;
