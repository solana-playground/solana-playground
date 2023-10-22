import { FC, useRef } from "react";
import styled from "styled-components";

import Button from "../Button";
import Input, { InputProps } from "../Input";
import { Close, Search } from "../Icons";

interface SearchBarProps extends InputProps {
  onSearch?: (input: string) => void;
}

const SearchBar: FC<SearchBarProps> = ({
  placeholder = "Search",
  onSearch,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Wrapper>
      <SearchInput ref={inputRef} placeholder={placeholder} {...props} />

      {props.value && (
        <CloseButton
          kind="icon"
          onClick={() => {
            const input = inputRef.current!;
            input.value = "";
            // @ts-ignore
            props.onChange?.({ target: input });
          }}
        >
          <Close />
        </CloseButton>
      )}

      <SearchButton
        kind="icon"
        onClick={() => onSearch?.(props.value as string)}
      >
        <Search />
      </SearchButton>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  position: relative;
  width: max(12rem, 50%);

  --search-button-width: 2.5rem;
`;

const SearchInput = styled(Input)`
  padding-right: var(--search-button-width);
`;

const CloseButton = styled(Button)`
  position: absolute;
  top: 0;
  bottom: 0;
  right: var(--search-button-width);
  margin: auto;
`;

const SearchButton = styled(Button)`
  position: absolute;
  right: 0;
  height: 100%;
  width: var(--search-button-width);
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
`;

export default SearchBar;
