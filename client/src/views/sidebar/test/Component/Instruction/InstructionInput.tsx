import { FC, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";

import FromSeed from "./FromSeed";
import Label from "../InputLabel";
import CopyButton from "../../../../../components/CopyButton";
import SearchBar, {
  SearchBarItem,
  SearchBarProps,
} from "../../../../../components/SearchBar";
import { PgCommon, PgWallet, PgWeb3 } from "../../../../../utils/pg";
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

type InstructionInputProps = {
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
  searchBarProps,
  noLabel,
  ...accountProps
}) => {
  const { instruction, setInstruction } = useInstruction();
  const { idl } = useIdl();

  const { displayType, parse } = useMemo(
    () => PgProgramInteraction.getIdlType(type, idl),
    [type, idl]
  );
  const initialValue = useMemo(
    () => generateValueOrDefault(generator, instruction.values),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const initialError = useMemo(() => {
    // Don't show errors when the initial input is empty
    if (!initialValue) return false;

    try {
      parse(initialValue);
      return false;
    } catch {
      return true;
    }
  }, [initialValue, parse]);

  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(initialError);
  const [selectedItems, setSelectedItems] = useState<SearchBarItem[]>([]);

  // Handle syncing with transaction context without re-render
  const lastValue = useRef({ value, error, selectedItems });
  useEffect(() => {
    const newValue = { value, error, selectedItems };
    if (PgCommon.isEqual(newValue, lastValue.current)) return;
    lastValue.current = newValue;

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
                const newValue = generateValueOrDefault(
                  instructionValue.generator,
                  instruction.values
                );
                PgCommon.changeInputValue(inputEl, newValue);
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

  return (
    <Wrapper>
      {!noLabel && (
        <Row>
          <Label name={name} type={displayType} {...accountProps} />
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
            restoreIfNotSelected
            labelToSelectOnPaste="Custom"
            {...getSearchBarProps(
              name,
              type,
              generator,
              accountProps,
              instruction,
              idl
            )}
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
  accountProps: Partial<Pick<InstructionInputAccount, "isMut" | "isSigner">>,
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

  // Generate values via `generateValueOrDefault` method and push to items.
  const pushGeneratorItem = (
    generator:
      | (Pick<Exclude<InstructionValueGenerator, { name: string }>, "type"> & {
          names?: never;
        })
      | (Pick<Extract<InstructionValueGenerator, { name: string }>, "type"> & {
          names: string[];
        })
  ) => {
    if (!searchBarProps.items) return;

    if (!generator.names) {
      searchBarProps.items.push({
        label: generator.type,
        value: generateValueOrDefault(
          generator as InstructionValueGenerator,
          instruction.values
        ),
      });
    } else if (generator.names.length) {
      searchBarProps.items.push({
        label: generator.type,
        items: generator.names.map((name) => ({
          label: name,
          value: generateValueOrDefault(
            { ...generator, name },
            instruction.values
          ),
        })),
      });
    }
  };

  if (customizable.displayType === "bool") {
    searchBarProps.items.push("false", "true");
    searchBarProps.noCustomOption = true;
  } else if (customizable.displayType === "publicKey") {
    // Handle "Random" for "publicKey" differently in order to be able to
    // sign the transaction later with the generated key
    searchBarProps.items[0] = {
      label: "Random",
      data: Array.from(PgWeb3.Keypair.generate().secretKey),
      get value() {
        return PgWeb3.Keypair.fromSecretKey(
          Uint8Array.from((this as { data: number[] }).data)
        ).publicKey.toBase58();
      },
    };

    // Wallet(s)
    if (PgWallet.current) {
      pushGeneratorItem({ type: "Current wallet" });

      if (PgWallet.accounts.length > 1) {
        pushGeneratorItem({
          type: "All wallets",
          names: PgWallet.accounts.map((acc) => acc.name),
        });
      }
    }

    // From seed
    searchBarProps.items.push({
      label: "From seed",
      DropdownComponent: (props) => <FromSeed {...props} name={name} />,
      closeButton: true,
    });

    // Programs
    if (!(accountProps.isMut || accountProps.isSigner)) {
      pushGeneratorItem({
        type: "All programs",
        names: PgProgramInteraction.getPrograms().map((p) => p.name),
      });
    }

    // Pyth
    if (!(accountProps.isMut || accountProps.isSigner)) {
      searchBarProps.items.push({
        label: "Pyth",
        items: async () => {
          const accounts = await PgProgramInteraction.getOrInitPythAccounts();
          return Object.entries(accounts).map(([label, value]) => ({
            label,
            value,
          }));
        },
      });
    }
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

        const lowerCaseName = camelCaseName.toLowerCase();
        const createValue = (value: string, defaultValue: string) => {
          if (value.toLowerCase().includes(lowerCaseName)) return value;
          return defaultValue;
        };
        const matches = (value: string) => {
          if (!value) return true;

          const lowerCaseValue = value.toLowerCase();
          if (lowerCaseName.includes(lowerCaseValue)) return true;

          return new RegExp(lowerCaseName).test(lowerCaseValue);
        };

        // Named
        if ((variant.fields[0] as { name?: string }).name) {
          return {
            label: camelCaseName,
            value: (v: string) => createValue(v, `{ ${camelCaseName}: {...} }`),
            matches,
          };
        }

        // Tuple
        return {
          label: camelCaseName,
          value: (v: string) => createValue(v, `{ ${camelCaseName}: [...] }`),
          matches,
        };
      });
      searchBarProps.items.push(...enumItems);
      searchBarProps.noCustomOption = true;
    }
  }

  // Add argument refs
  pushGeneratorItem({
    type: "Arguments",
    names: instruction.values.args
      .filter((arg) => arg.name !== name && PgCommon.isEqual(arg.type, type))
      .map((arg) => arg.name),
  });

  // Add account refs
  pushGeneratorItem({
    type: "Accounts",
    names: instruction.values.accounts
      .filter((acc) => acc.name !== name && type === "publicKey")
      .map((acc) => acc.name),
  });

  // Add custom value after type overrides to get `noCustomOption`
  if (!searchBarProps.noCustomOption) {
    searchBarProps.items.unshift({
      label: "Custom",
      value: { current: true },
      onlyShowIfValid: true,
    });
  }

  // Initial items to select
  searchBarProps.initialSelectedItems = searchBarProps.noCustomOption
    ? generator.type === "Custom"
      ? generator.value === ""
        ? []
        : generator.value
      : generator.type
    : generator.name
    ? [generator.type, generator.name]
    : generator.type === "Random"
    ? { label: generator.type, data: generator.data }
    : generator.type;

  // Validator
  searchBarProps.validator = (...args) => {
    try {
      customizable.parse(...args);
      return true;
    } catch {
      return false;
    }
  };

  return searchBarProps;
};

/** Generate the value or default to an empty string in the case of an error. */
const generateValueOrDefault = (
  generator: InstructionValueGenerator,
  values: InstructionValues
) => {
  try {
    return PgProgramInteraction.generateValue(generator, values);
  } catch (e: any) {
    console.log("Failed to generate:", e.message);
    return "";
  }
};

export default InstructionInput;
