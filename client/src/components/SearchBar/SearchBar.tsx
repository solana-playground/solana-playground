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
import { SpinnerWithBg } from "../Loading";
import { useKeybind, useOnClickOutside } from "../../hooks";
import { Arrayable, Getable, PgCommon, PgTheme } from "../../utils/pg";

export interface SearchBarProps extends InputProps {
  items?: Item[] | null;
  initialSelectedItems?: Arrayable<Item>;
  showSearchOnMount?: boolean;
  labelToSelectOnPaste?: string;
  restoreIfNotSelected?: boolean;
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

export type NormalizedItem = Exclude<Item, string> & { isSelected?: boolean };
type Item = string | (CommonItemProps & (NestableItem | DropdownableItem));

type CommonItemProps = {
  label: string;
  matches?: Array<string | RegExp> | ((value: string) => boolean);
  onlyShowIfValid?: boolean;
  closeButton?: boolean;
  element?: ReactNode;
  onSelect?: (item: Item) => void;
};

type NestableItem = {
  value?: string | ((value: string) => string) | { current: true };
  data?: any;
  items?: Getable<Item[]> | (() => Promise<Item[]>) | null;
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

const SearchBar: FC<SearchBarProps> = ({
  items,
  initialSelectedItems,
  showSearchOnMount,
  labelToSelectOnPaste,
  restoreIfNotSelected,
  searchButton,
  onSearch,
  filter,
  setSelectedItems: _setSelectedItems,
  onClick,
  onPaste,
  ...props
}) => {
  const searchButtonPosition = searchButton?.position ?? "left";
  const searchButtonWidth = searchButton?.width ?? "2rem";

  const inputRef = useRef<HTMLInputElement>(null);
  const lastValue = useRef(props.value);
  const setInputValue = (value: string, opts?: { focus: boolean }) => {
    const input = inputRef.current!;
    PgCommon.changeInputValue(input, value);

    // Last value should only be updated when `setInputValue` function runs and
    // not when `onChange` callback runs because we want to restore to the last
    // valid value when the user clicks outside of the search bar.
    lastValue.current = value;

    if (opts?.focus) input.focus();
  };
  const getItemValue = (item: NormalizedItem) => {
    const currentValue = inputRef.current?.value ?? props.value;
    return item.value !== undefined
      ? typeof item.value === "string"
        ? item.value
        : typeof item.value === "function"
        ? item.value(currentValue)
        : currentValue
      : item.label;
  };

  const [isVisible, setIsVisible] = useState(showSearchOnMount);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reset = () => {
    // Hide search results
    setIsVisible(false);

    // Reset back to the original items
    setItemState({ items, isInSubSearch: false });

    // Reset the input to its last saved value
    if (restoreIfNotSelected) setInputValue(lastValue.current);
  };
  useKeybind("Escape", () => {
    if (document.activeElement === inputRef.current) reset();
  });

  const [itemState, setItemState] = useState<{
    items: typeof items;
    isInSubSearch: boolean;
    closeButton?: boolean;
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
  const selectedItemRef = useRef<HTMLDivElement>(null);

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
        return selectedItem.label === item.label;
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
          if (item.onlyShowIfValid) {
            return props.validator?.(getItemValue(item));
          }

          // Show all optinos if the input is valid
          if (props.validator?.(props.value)) return true;

          if (typeof item.matches === "function") {
            return item.matches(props.value);
          }

          const matches = item.matches ?? [item.label];
          const lowerCaseValue = props.value.toLowerCase();
          return matches.some((match) => {
            return typeof match === "string"
              ? match.toLowerCase().includes(lowerCaseValue)
              : match.test(lowerCaseValue);
          });
        })
    : null;

  const [loading, setLoading] = useState(false);
  const searchCommon = async (_item: Item) => {
    const item = normalizeItem(_item);

    let isInSubSearch = false;
    let isCompleted = false;

    if (item.items) {
      setLoading(true);
      try {
        setItemState({
          items: await PgCommon.callIfNeeded(item.items),
          isInSubSearch: true,
          closeButton: item.closeButton,
        });
        isInSubSearch = true;
      } catch (e: any) {
        console.log("Failed to get items:", e.message);
        return;
      } finally {
        setLoading(false);
      }

      setInputValue("", { focus: true });
    } else if (item.DropdownComponent) {
      setItemState({
        items: null,
        isInSubSearch: true,
        closeButton: item.closeButton,
        Component: item.DropdownComponent,
      });
      isInSubSearch = true;
    } else {
      setInputValue(getItemValue(item));
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

    if (isInSubSearch) {
      setKeyboardSelectionIndex(null);
      selectedItemRef.current?.scrollIntoView({ block: "center" });
    } else reset();
  };
  const searchTopResult = () => {
    if (filteredItems && keyboardSelectionIndex !== null) {
      const selectedItem = filteredItems.at(keyboardSelectionIndex);
      if (selectedItem) searchCommon(selectedItem);
    } else setIsVisible(true);
  };
  useKeybind("Enter", {
    handle: () => {
      if (document.activeElement === inputRef.current) searchTopResult();
    },
    opts: { noPreventDefault: true },
  });

  // Keyboard navigation
  const [keyboardSelectionIndex, setKeyboardSelectionIndex] = useState<
    number | null
  >(null);

  // Handle the keyboard selection index
  useEffect(() => {
    if (!filteredItems) {
      // No `filteredItems` means dropdown is not visible so the keyboard
      // selection should not exist
      setKeyboardSelectionIndex(null);
    } else if (keyboardSelectionIndex === null) {
      // If the selection index was set to `null`, it means the dropdown has
      // just got mounted, therefore, either set the selection index to the
      // actual selected item, or if the selected item doesn't exist, select
      // the first item
      const index = filteredItems.findIndex((item) => item.isSelected);
      setKeyboardSelectionIndex(index === -1 ? 0 : index);
    } else {
      // If there is a selection, check whether the selected item exists in the
      // `filteredItems`, if it doesn't exist, select the first item
      const keyboardSelectedItem = filteredItems.at(keyboardSelectionIndex);
      if (!keyboardSelectedItem) setKeyboardSelectionIndex(0);
    }
  }, [filteredItems, keyboardSelectionIndex]);

  useKeybind(
    [
      {
        keybind: "ArrowDown",
        handle: () => {
          if (!filteredItems?.length) {
            if (document.activeElement === inputRef.current) setIsVisible(true);
            return;
          }

          setKeyboardSelectionIndex((i) => {
            if (i === null || !filteredItems.length) return null;
            if (i === filteredItems.length - 1) return 0;
            return i + 1;
          });
        },
      },
      {
        keybind: "ArrowUp",
        handle: () => {
          if (!filteredItems?.length) {
            if (document.activeElement === inputRef.current) setIsVisible(true);
            return;
          }

          setKeyboardSelectionIndex((i) => {
            if (i === null || !filteredItems.length) return null;
            if (i === 0) return filteredItems.length - 1;
            return i - 1;
          });
        },
      },
    ],
    [filteredItems?.length]
  );

  // Close on outside click
  useOnClickOutside(wrapperRef, reset, isVisible && !itemState.closeButton);

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
          <InputCloseButton
            kind="no-border"
            onClick={() => {
              setInputValue("", { focus: true });
              setSelectedItems({ completed: [], pending: [] });
              setIsVisible(true);
            }}
            position={searchButtonPosition}
          >
            <Close />
          </InputCloseButton>
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
        <DropdownWrapper isCustomComponent={!!itemState.Component}>
          {
            <SpinnerWithBg loading={loading}>
              {itemState.isInSubSearch && (
                <SubSearchTopWrapper>
                  <GoBackButton
                    onClick={() => {
                      setItemState({ items, isInSubSearch: false });
                      setSelectedItems((items) => ({ ...items, pending: [] }));
                      inputRef.current?.focus();
                    }}
                    kind="no-border"
                  >
                    <PointedArrow rotate="180deg" />
                  </GoBackButton>

                  {itemState.closeButton && (
                    <SubSearchCloseButton kind="icon" onClick={reset}>
                      <Close />
                    </SubSearchCloseButton>
                  )}
                </SubSearchTopWrapper>
              )}

              {itemState.Component ? (
                <itemState.Component search={searchCommon} />
              ) : filteredItems?.length ? (
                filteredItems.map((item, i) => (
                  <DropdownItem
                    key={item.label}
                    ref={item.isSelected ? selectedItemRef : null}
                    onClick={() => searchCommon(item)}
                    onMouseEnter={() => setKeyboardSelectionIndex(i)}
                    isSelected={item.isSelected}
                    isKeyboardSelected={keyboardSelectionIndex === i}
                  >
                    {item.element ?? item.label}
                  </DropdownItem>
                ))
              ) : (
                <NoMatch>No match</NoMatch>
              )}
            </SpinnerWithBg>
          }
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
  ${({ theme, position }) => css`
    padding: ${theme.components.input.padding};
    ${position === "left"
      ? `padding-left: var(--search-button-width);
    padding-right: var(--search-button-width);`
      : `padding-right: calc(2 * var(--search-button-width))`}
  `}
`;

const InputCloseButton = styled(Button)<SearchButtonPosition>`
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

const DropdownWrapper = styled.div<{ isCustomComponent: boolean }>`
  ${({ isCustomComponent, theme }) => css`
    flex: 1;
    padding: 0.5rem 0;
    background: ${theme.components.input.bg};
    border-radius: ${theme.default.borderRadius};
    outline: 1px solid
      ${theme.colors.default.primary + theme.default.transparency.medium};
    user-select: none;

    ${!isCustomComponent &&
    `
      max-height: 15rem;
      overflow: auto;
      ${PgTheme.getScrollbarCSS({ width: "0.25rem" })};
    `};
  `}
`;

const SubSearchTopWrapper = styled.div`
  ${({ theme }) => css`
    position: sticky;
    top: -0.5rem;
    padding: 0.25rem 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: ${theme.components.input.bg};
  `}
`;

const GoBackButton = styled(Button)`
  & svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const SubSearchCloseButton = styled(Button)``;

const DropdownItem = styled.div<{
  isSelected: boolean;
  isKeyboardSelected: boolean;
}>`
  ${({ isSelected, isKeyboardSelected, theme }) => css`
    padding: 0.5rem 1rem;
    color: ${theme.colors.default.textSecondary};
    font-weight: bold;
    transition: all ${theme.default.transition.type}
      ${theme.default.transition.duration.short};

    &:hover {
      background: ${theme.colors.state.hover.bg};
      color: ${theme.colors.default.textPrimary};
      cursor: pointer;
    }

    ${isKeyboardSelected &&
    `background: ${theme.colors.state.hover.bg}; color: ${theme.colors.default.textPrimary}`};
    ${isSelected && `color: ${theme.colors.default.primary} !important`};
  `}
`;

const NoMatch = styled.div`
  padding: 0.5rem;
  text-align: center;
`;

export default SearchBar;
