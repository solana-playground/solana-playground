import {
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import styled, { css } from "styled-components";

import Button from "../Button";
import Input, { InputProps } from "../Input";
import { Close, PointedArrow, Search } from "../Icons";
import { useKeybind, useOnClickOutside } from "../../hooks";
import { Arrayable, Getable, PgCommon } from "../../utils/pg";

export interface SearchBarProps extends InputProps {
  items?: Item[] | null;
  initialSelectedItems?: Arrayable<Item>;
  labelToSelectOnPaste?: string;
  showSearchOnMount?: boolean;
  searchButton?: {
    position?: "left" | "right";
    width?: string;
  };
  onSearch?: (ev: { input: InputProps["value"]; item: NormalizedItem }) => void;
  filter?: (args: {
    input: InputProps["value"];
    item: NormalizedItem;
    items: NormalizedItem[];
  }) => boolean;
  setSelectedItems?: Dispatch<SetStateAction<NormalizedItem[]>>;
}

type Item = string | (CommonItemProps & (NestableItem | DropdownableItem));

type CommonItemProps = {
  label: string;
  matches?: string[];
  element?: ReactNode;
  onSelect?: (item: Item) => void;
};

type NestableItem = {
  value?: Getable<string> | { current: true };
  data?: any;
  items?: Item[] | null;
  DropdownComponent?: never;
};

type DropdownableItem = {
  value?: never;
  data?: never;
  items?: never;
  DropdownComponent: (props: DropdownProps) => JSX.Element;
};

export type DropdownProps = {
  search: (item: Item) => void;
};

export type NormalizedItem = Exclude<Item, string> & { isSelected?: boolean };

const SearchBar: FC<SearchBarProps> = ({
  items,
  searchButton,
  onSearch,
  filter,
  setSelectedItems: _setSelectedItems,
  showSearchOnMount,
  initialSelectedItems,
  labelToSelectOnPaste,
  onClick,
  onPaste,
  ...props
}) => {
  const searchButtonPosition = searchButton?.position ?? "left";
  const searchButtonWidth = searchButton?.width ?? "2rem";

  const inputRef = useRef<HTMLInputElement>(null);
  const setInputValue = (value: string, opts?: { focus: boolean }) => {
    const input = inputRef.current!;
    PgCommon.changeInputValue(input, value);

    if (opts?.focus) input.focus();
  };

  const [isVisible, setIsVisible] = useState(showSearchOnMount);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reset = () => {
    // Hide search results
    setIsVisible(false);

    // Reset back to the original items
    setItemState({ items, isInSubSearch: false });
  };
  useOnClickOutside(wrapperRef, reset);
  useKeybind("Escape", () => {
    if (document.activeElement === inputRef.current) reset();
  });

  const [itemState, setItemState] = useState<{
    items: typeof items;
    isInSubSearch: boolean;
    Component?: (props: DropdownProps) => JSX.Element;
  }>({
    items,
    isInSubSearch: false,
  });
  const [selectedItems, setSelectedItems] = useState<{
    pending: NormalizedItem[];
    completed: NormalizedItem[];
  }>({
    pending: [],
    completed: PgCommon.toArray(initialSelectedItems ?? []).map(normalizeItem),
  });

  // Sync changes
  useEffect(() => {
    setItemState((itemState) => {
      if (itemState.isInSubSearch) return itemState;
      return { ...itemState, items };
    });
  }, [items]);
  useEffect(() => {
    _setSelectedItems?.(selectedItems.completed);
  }, [selectedItems, _setSelectedItems]);

  const normalizedItems =
    isVisible &&
    itemState.items?.map(normalizeItem).map((item) => {
      const isSelected = selectedItems.completed.some((selectedItem) => {
        return normalizeItem(selectedItem).label === item.label;
      });

      return { ...item, isSelected };
    });
  const filteredItems = normalizedItems
    ? filter
      ? normalizedItems.filter((item) =>
          filter({
            input: props.value,
            item,
            items: normalizedItems,
          })
        )
      : normalizedItems.filter((item) => {
          const matches = item.matches ?? [item.label];
          const lowerCaseValue = props.value.toLowerCase();
          return matches.some((item) =>
            item.toLowerCase().includes(lowerCaseValue)
          );
        })
    : null;

  const searchCommon = (_item: Item) => {
    const item = normalizeItem(_item);

    let noReset = false;
    let isCompleted = false;

    if (item.items) {
      setInputValue("", { focus: true });
      setItemState({ items: item.items, isInSubSearch: true });
      noReset = true;
    } else if (item.DropdownComponent) {
      setItemState({
        items: null,
        isInSubSearch: true,
        Component: item.DropdownComponent,
      });
      noReset = true;
    } else {
      setInputValue(
        item.value !== undefined
          ? typeof item.value === "string"
            ? item.value
            : typeof item.value === "function"
            ? item.value()
            : inputRef.current!.value
          : item.label
      );
      isCompleted = true;
    }

    item.onSelect?.(item);

    if (isCompleted) {
      setSelectedItems((items) => {
        if (!items.pending.length) return { ...items, completed: [item] };
        return { completed: [...items.pending, item], pending: [] };
      });
      onSearch?.({ input: props.value, item });
    } else {
      setSelectedItems((items) => ({ ...items, pending: [item] }));
    }

    if (!noReset) reset();
  };
  const searchTopResult = () => {
    if (filteredItems) {
      const selectedItem = selectedItems.completed.at(
        itemState.isInSubSearch ? -1 : 0
      );
      const selectedItemLabel =
        selectedItem && normalizeItem(selectedItem).label;
      const resultItem =
        filteredItems.find(
          (filteredItem) => filteredItem.label === selectedItemLabel
        ) ?? filteredItems.at(0);

      if (resultItem) searchCommon(resultItem);
    } else setIsVisible(true);
  };
  useKeybind("Enter", () => {
    if (document.activeElement === inputRef.current) searchTopResult();
  });

  return (
    <Wrapper ref={wrapperRef}>
      <SearchInputWrapper width={searchButtonWidth}>
        <SearchInput
          ref={inputRef}
          position={searchButtonPosition}
          autoFocus={showSearchOnMount}
          onClick={(ev) => {
            onClick?.(ev);
            setIsVisible(true);
          }}
          onPaste={(ev) => {
            onPaste?.(ev);

            // Default to the pasted text if the label to select is not specified
            const clipboardText = ev.clipboardData.getData("text");

            // Intentionally use `itemState.items` instead of `filteredItems`
            //`normalizedItems` because they could be in an invalid state
            // when the paste events, e.g. `normalizedItems` values only
            // exist when `isVisible` is truthy.
            const item = itemState.items?.find((item) => {
              const { label } = normalizeItem(item);
              return label === labelToSelectOnPaste || label === clipboardText;
            });
            if (item) {
              // `item.value` can be an empty string because it's not updated as
              // soon as `onPaste` executes.
              if (typeof item === "object") item.value ||= clipboardText;

              // Include a timeout otherwise the pasted text is appended to the
              // value we set instead of overriding it
              setTimeout(() => searchCommon(item));
            }
          }}
          {...props}
        />

        {props.value && (
          <CloseButton
            kind="no-border"
            onClick={() => {
              setInputValue("", { focus: true });
              setSelectedItems({ completed: [], pending: [] });
              setIsVisible(true);
            }}
            position={searchButtonPosition}
          >
            <Close />
          </CloseButton>
        )}

        <SearchButton
          kind="icon"
          onClick={searchTopResult}
          position={searchButtonPosition}
        >
          <Search />
        </SearchButton>
      </SearchInputWrapper>

      {(filteredItems || itemState.Component) && (
        <DropdownWrapper>
          {itemState.isInSubSearch && (
            <GoBackButton
              onClick={() => {
                setItemState({ items, isInSubSearch: false });
                setSelectedItems((items) => ({ ...items, pending: [] }));
              }}
              kind="no-border"
            >
              <PointedArrow rotate="180deg" />
            </GoBackButton>
          )}

          {itemState.Component ? (
            <itemState.Component search={searchCommon} />
          ) : filteredItems?.length ? (
            filteredItems.map((item) => (
              <DropdownItem
                key={item.label}
                onClick={() => searchCommon(item)}
                isSelected={item.isSelected}
              >
                {item.element ?? item.label}
              </DropdownItem>
            ))
          ) : (
            <NoMatch>No match</NoMatch>
          )}
        </DropdownWrapper>
      )}
    </Wrapper>
  );
};

const normalizeItem = (item: Item): NormalizedItem => {
  return typeof item === "object" ? item : { label: item };
};

type SearchButtonProps = NonNullable<SearchBarProps["searchButton"]>;
type SearchButtonPosition = Pick<SearchButtonProps, "position">;
type SearchButtonPositionWidth = Pick<SearchButtonProps, "width">;

const Wrapper = styled.div``;

const SearchInputWrapper = styled.div<SearchButtonPositionWidth>`
  display: flex;
  position: relative;

  --search-button-width: ${({ width }) => width};
`;

const SearchInput = styled(Input)<SearchButtonPosition>`
  padding: 0.5rem;
  ${({ position }) => {
    return position === "left"
      ? `padding-left: var(--search-button-width);
    padding-right: var(--search-button-width);`
      : `padding-right: calc(2 * var(--search-button-width))`;
  }}
`;

const CloseButton = styled(Button)<SearchButtonPosition>`
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto;
  padding: 0.25rem;
  right: ${({ position }) => {
    return position === "left"
      ? "0.25rem"
      : "calc(var(--search-button-width) + 0.25rem)";
  }};
`;

const SearchButton = styled(Button)<SearchButtonPosition>`
  position: absolute;
  width: var(--search-button-width);
  height: 100%;
  ${({ position }) => {
    const opposite = position === "left" ? "right" : "left";
    return `${position}: 0;
    border-top-${opposite}-radius: 0;
    border-bottom-${opposite}-radius: 0;`;
  }}
`;

const DropdownWrapper = styled.div`
  ${({ theme }) => css`
    flex: 1;
    padding: 0.5rem 0;
    background: ${theme.components.input.bg};
    border-radius: ${theme.default.borderRadius};
    outline: 1px solid
      ${theme.colors.default.primary + theme.default.transparency.medium};
    user-select: none;
  `}
`;

const GoBackButton = styled(Button)`
  margin-left: 0.5rem;
  margin-bottom: 0.25rem;

  & svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const DropdownItem = styled.div<{ isSelected: boolean }>`
  ${({ isSelected, theme }) => css`
    padding: 0.5rem 1rem;
    color: ${theme.colors.default.textSecondary};
    font-weight: bold;
    transition: all ${theme.default.transition.type}
      ${theme.default.transition.duration.short};

    &:hover {
      background: ${theme.colors.state.hover.bg};
      color: ${theme.colors.default.primary};
      cursor: pointer;
    }

    ${isSelected && `color:${theme.colors.default.primary}`};
  `}
`;

const NoMatch = styled.div`
  padding: 0.5rem;
  text-align: center;
`;

export default SearchBar;
