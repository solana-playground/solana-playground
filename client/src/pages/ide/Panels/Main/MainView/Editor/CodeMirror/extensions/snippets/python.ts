/* eslint-disable no-template-curly-in-string */
import {
  Completion,
  snippetCompletion as snip,
} from "@codemirror/autocomplete";

/** Python language snippets */
export const PYTHON_SNIPPETS: Completion[] = [];

/** Seahorse specific snippets */
export const SEAHORSE_SNIPPETS: Completion[] = [
  snip("from seahorse.prelude import *", {
    label: "import seahorse prelude(isp)",
    type: "namespace",
    info: "Import Seahorse Prelude",
  }),
  snip("declare_id('${1}')${2}", {
    label: "declare id(di)",
    type: "function",
    info: "Declare program id",
  }),
  snip("print('${1:message}')", {
    label: "print(msg)",
    type: "function",
    info: "Log program message",
  }),
  snip("assert ${1:condition}, '${2:error message}'", {
    label: "assert(asrt)",
    type: "function",
    info: "Assert a statement, throw error with the specified message if assertion fails",
  }),
  // Creators
  snip(
    "@instruction\ndef ${1:instruction_name}(${2:signer}: Signer):\n\t${3}",
    {
      label: "create instruction(cin)",
      type: "function",
      info: "Create Seahorse instruction",
    }
  ),
  snip("class ${1:AccountName}(Account):\n\t${2:property}: ${3:type}", {
    label: "create account(cac)",
    type: "class",
    info: "Create program account",
  }),
  snip(
    "class ${1:EventName}(Event):\n\t${2:property}: ${3:type}\n\n\tdef __init__(self, ${2:property}: ${3:type}):\n\t\tself.${2:property} = ${2:property}\n\t\t${4}",
    {
      label: "create event(cev)",
      type: "class",
      info: "Create program event",
    }
  ),
];
