import { FC, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Keypair } from "@solana/web3.js";

import FromSeed from "./FromSeed";
import Label from "../InputLabel";
import CopyButton from "../../../../../components/CopyButton";
import SearchBar, {
  SearchBarItem,
  SearchBarProps,
} from "../../../../../components/SearchBar";
import { PgCommon, PgWallet } from "../../../../../utils/pg";
import {
  GeneratableInstruction,
  Idl,
  IdlType,
  InstructionValueGenerator,
  PgProgramInteraction,
} from "../../../../../utils/pg/program-interaction";
import { useInstruction } from "./InstructionProvider";
import { useIdl } from "../IdlProvider";

type InstructionValues = GeneratableInstruction["values"];
type InstructionInputAccount = InstructionValues["accounts"][number];
type InstructionInputArg = InstructionValues["args"][number];

export type InstructionInputProps = {
  prefix: "accounts" | "args" | "seed";
  updateInstruction: (props: {
    updateGenerator: (
      data: Pick<InstructionInputArg, "generator" | "error">
    ) => void;
    updateRefs: (
      data: Omit<InstructionInputArg, "type">,
      refGeneratorType: Extract<
        InstructionValueGenerator["type"],
        "Accounts" | "Arguments"
      >
    ) => void;
    checkErrors: () => boolean;
  }) => void;
  noLabel?: boolean;
  searchBarProps?: Omit<SearchBarProps, "value">;
} & InstructionInputArg &
  Partial<InstructionInputAccount>;

const InstructionInput: FC<InstructionInputProps> = ({
  prefix,
  updateInstruction,
  name,
  type,
  generator,
  error: initialError,
  searchBarProps,
  noLabel,
  ...labelProps
}) => {
  const { instruction, setInstruction } = useInstruction();
  const { idl } = useIdl();

  const initialValue = useMemo(
    () => PgProgramInteraction.generateValue(generator, instruction.values),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(initialError);
  const [selectedItems, setSelectedItems] = useState<SearchBarItem[]>([]);

  // Handle syncing with transaction context without re-render
  useEffect(() => {
    setInstruction((instruction) => {
      updateInstruction({
        updateGenerator: (data) => {
          const generator = PgProgramInteraction.createGenerator(
            selectedItems,
            value
          );
          // Only update the generator if there is a generator otherwise the
          // existing generator can be overridden
          if (generator) data.generator = generator;
          data.error = error;
        },
        updateRefs: (data, refGeneratorType) => {
          if (!value) return;

          for (const key of ["accounts", "args"] as const) {
            // Default ref
            for (const instructionValue of instruction.values[key]) {
              if (
                instructionValue.generator.type === refGeneratorType &&
                instructionValue.generator.name === data.name
              ) {
                const inputEl = document.getElementById(
                  instruction.name + key + instructionValue.name
                ) as HTMLInputElement;
                PgCommon.changeInputValue(inputEl, value);
              }

              // From seed
              if (
                instructionValue.generator.type === "From seed" &&
                instructionValue.generator.seeds.some(
                  (seed) =>
                    seed.generator.type === refGeneratorType &&
                    seed.generator.name === data.name
                )
              ) {
                const inputEl = document.getElementById(
                  instruction.name + key + instructionValue.name
                ) as HTMLInputElement;
                try {
                  const newValue = PgProgramInteraction.generateValue(
                    instructionValue.generator,
                    instruction.values
                  );
                  PgCommon.changeInputValue(inputEl, newValue);
                } catch (e: any) {
                  console.log("Failed to generate value:", e.message);
                }
              }
            }
          }
        },
        checkErrors: () => {
          return Object.values(instruction.values).reduce((acc, value) => {
            if (Array.isArray(value)) {
              acc ||= value.some(
                (v) =>
                  v.error ||
                  (v.generator.type === "Custom" && v.generator.value === "")
              );
            }

            return acc;
          }, false);
        },
      });

      return instruction;
    });
  }, [value, error, selectedItems, updateInstruction, setInstruction]);

  const { displayType } = useMemo(
    () => PgProgramInteraction.getIdlType(type, idl),
    [type, idl]
  );

  return (
    <Wrapper>
      {!noLabel && (
        <Row>
          <Label name={name} type={displayType} {...labelProps} />
        </Row>
      )}

      <Row>
        <InputWithCopyButtonWrapper>
          <SearchBar
            id={instruction.name + prefix + name}
            value={value}
            onChange={(ev) => setValue(ev.target.value)}
            error={error}
            setError={setError}
            setSelectedItems={setSelectedItems}
            labelToSelectOnPaste="Custom"
            {...getSearchBarProps(name, type, generator, instruction, idl)}
            {...searchBarProps}
          />
          <CopyButtonWrapper>
            <CopyButton copyText={value} />
          </CopyButtonWrapper>
        </InputWithCopyButtonWrapper>
      </Row>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
`;

const InputWithCopyButtonWrapper = styled.div`
  width: 100%;
  display: flex;

  & > *:first-child {
    flex: 1;
    margin-right: 0.25rem;
  }
`;

const CopyButtonWrapper = styled.div`
  height: 2rem;
  display: flex;
  align-items: center;
`;

const getSearchBarProps = (
  name: string,
  type: IdlType,
  generator: InstructionValueGenerator & { name?: string; value?: string },
  instruction: GeneratableInstruction,
  idl: Idl
) => {
  const customizable = PgProgramInteraction.getIdlType(type, idl);
  const searchBarProps: Omit<SearchBarProps, "value"> & {
    noCustomOption?: boolean;
  } = {};

  // Items
  searchBarProps.items = [
    {
      label: "Random",
      value: customizable.generateRandom,
    },
  ];

  if (customizable.displayType === "bool") {
    searchBarProps.items = ["false", "true"];
    searchBarProps.noCustomOption = true;
  } else if (customizable.displayType === "publicKey") {
    if (PgWallet.current) {
      // Handle "Random" for "publicKey" differently in order to be able to
      // sign the transaction later with the generated key
      searchBarProps.items[0] = {
        label: "Random",
        data: Keypair.generate(),
        get value() {
          return (this as { data: Keypair }).data.publicKey.toBase58();
        },
      };

      searchBarProps.items.push({
        label: "Current wallet",
        value: PgWallet.current.publicKey.toBase58(),
      });

      // Only show all wallets if there are multiple wallets
      if (PgWallet.accounts.length > 1) {
        searchBarProps.items.push({
          label: "All wallets",
          items: PgWallet.accounts.map((acc) => ({
            label: acc.name,
            value: PgWallet.createWallet(acc).publicKey.toBase58(),
          })),
        });
      }
    }

    searchBarProps.items.push({
      label: "From seed",
      DropdownComponent: FromSeed,
    });
  } else {
    // Handle enum
    const definedType = idl.types?.find(
      (t) => t.name === customizable.displayType
    )?.type;
    if (definedType?.kind === "enum") {
      const enumItems = definedType.variants.map((variant) => {
        const camelCaseName = PgCommon.toCamelCase(variant.name);
        // Unit
        if (!variant.fields?.length) return camelCaseName;

        // Named
        if ((variant.fields[0] as { name?: string }).name) {
          return {
            label: camelCaseName,
            value: `{ ${camelCaseName}: {...} }`,
          };
        }

        // Tuple
        return {
          label: camelCaseName,
          value: `{ ${camelCaseName}: [...] }`,
        };
      });
      searchBarProps.items.push(...enumItems);
      searchBarProps.noCustomOption = true;
    }
  }

  // Add custom value after type overrides to get `noCustomOption`
  if (!searchBarProps.noCustomOption) {
    searchBarProps.items.unshift({
      label: "Custom",
      value: { current: true },
    });
  }

  // Add argument refs
  const values = instruction.values;
  const argRefs = values.args.filter(
    (arg) => arg.name !== name && PgCommon.isEqual(arg.type, type)
  );
  if (argRefs.length) {
    searchBarProps.items.push({
      label: "Arguments",
      items: argRefs.map((arg) => ({
        label: arg.name,
        value: () => PgProgramInteraction.generateValue(arg.generator, values),
      })),
    });
  }

  // Add account refs
  const accRefs = values.accounts.filter(
    (acc) => acc.name !== name && type === "publicKey"
  );
  if (accRefs.length) {
    searchBarProps.items.push({
      label: "Accounts",
      items: accRefs.map((acc) => ({
        label: acc.name,
        value: () => PgProgramInteraction.generateValue(acc.generator, values),
      })),
    });
  }

  // Validator
  searchBarProps.validator = (...args) => {
    try {
      customizable.parse(...args);
      return true;
    } catch {
      return false;
    }
  };

  // Filter
  searchBarProps.filter = ({ input, item }) => {
    // Show all options if the input is valid
    if (searchBarProps.validator!(input)) return true;

    return (
      item.label !== "Custom" &&
      item.label.toLowerCase().includes(input.toLowerCase())
    );
  };

  // Initial items to select
  searchBarProps.initialSelectedItems = searchBarProps.noCustomOption
    ? generator.type === "Custom"
      ? generator.value === ""
        ? []
        : generator.value
      : generator.type
    : generator.name
    ? [generator.type, generator.name]
    : generator.type;

  return searchBarProps;
};

export default InstructionInput;
