import {
  Dispatch,
  ForwardRefExoticComponent,
  SetStateAction,
  useState,
} from "react";
import { DragEndEvent, DragStartEvent, UniqueIdentifier } from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  rectSortingStrategy,
  rectSwappingStrategy,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import DndContext from "../Context";

interface SortableProps<P, I extends UniqueIdentifier> {
  items: I[];
  setItems: Dispatch<SetStateAction<I[]>>;
  Item: ForwardRefExoticComponent<P>;
  getItemProps: (item: I, index: number) => P;
  strategy?: SortStrategy;
}

type SortStrategy =
  | "rect-sorting"
  | "rect-swapping"
  | "horizontal"
  | "vertical";

const Sortable = <P, I extends UniqueIdentifier>({
  items,
  setItems,
  Item,
  getItemProps,
  strategy = "rect-sorting",
}: SortableProps<P, I>) => {
  const [activeItemProps, setActiveItemProps] = useState<P | null>(null);

  const handleDragStart = (ev: DragStartEvent) => {
    const data = ev.active.data.current as any;
    if (data.sortable.index === -1) {
      // If an item is recently added to the `items` list, the internal DND
      // context state doesn't get updated sometimes. To solve this, we
      // override the internal state `data.sortable` from the most up-to-date
      // values.
      data.sortable.index = items.findIndex((item) => item === data.id);

      // Due to how the internals of `SortableContext` works, we set each value
      // one-by-one because directly setting `data.sortable.items = items`
      // doesn't work
      for (const [key, value] of Object.entries(items)) {
        data.sortable.items[key] = value;
      }
    }
    setActiveItemProps(data);
  };

  const handleDragEnd = (ev: DragEndEvent) => {
    const { active, over } = ev;
    if (!over || active.id === over.id) return;

    setItems((items) => {
      const oldIndex = items.indexOf(active.id as I);
      const newIndex = items.indexOf(over.id as I);

      return arrayMove(items, oldIndex, newIndex);
    });

    setActiveItemProps(null);
  };

  return (
    <DndContext
      dragOverlay={{
        Element: activeItemProps && <Item isDragOverlay {...activeItemProps} />,
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={getSortingStrategy(strategy)}>
        {items.map((item, i) => (
          <SortableItem
            key={item}
            id={item}
            Item={Item}
            {...getItemProps(item, i)}
          />
        ))}
      </SortableContext>
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
        transform: CSS.Translate.toString(transform),
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

const getSortingStrategy = (strategy: SortStrategy) => {
  switch (strategy) {
    case "rect-sorting":
      return rectSortingStrategy;
    case "rect-swapping":
      return rectSwappingStrategy;
    case "horizontal":
      return horizontalListSortingStrategy;
    case "vertical":
      return verticalListSortingStrategy;
  }
};

export interface SortableItemProvidedProps {
  isDragging: boolean;
  isDragOverlay: boolean;
}

export default Sortable;
