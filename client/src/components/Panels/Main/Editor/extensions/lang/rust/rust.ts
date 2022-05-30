import {
  continuedIndent,
  indentNodeProp,
  foldNodeProp,
  foldInside,
  LRLanguage,
  LanguageSupport,
} from "@codemirror/language";
import { styleTags, tags as t } from "@codemirror/highlight";
import { completeFromList, ifNotIn } from "@codemirror/autocomplete";

import { parser } from "./parser";
import snippets from "./snippets";

const rustLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        IfExpression: continuedIndent({ except: /^\s*({|else\b)/ }),
        "String BlockComment": () => null,
        // NEW: Fix indentation after #[]
        AttributeItem: (cx) => cx.continue(),
        "Statement MatchArm": continuedIndent(),
      }),
      foldNodeProp.add((type) => {
        if (/(Block|edTokens|List)$/.test(type.name)) return foldInside;
        if (type.name === "BlockComment")
          return (tree) => ({ from: tree.from + 2, to: tree.to - 2 });
        return undefined;
      }),
      styleTags({
        "const macro_rules struct union enum type fn impl trait let static":
          t.definitionKeyword,
        "mod use crate": t.moduleKeyword,
        "pub unsafe async mut extern default move": t.modifier,
        "for if else loop while match continue break return await":
          t.controlKeyword,
        "as in ref": t.operatorKeyword,
        "where _ crate super dyn": t.keyword,
        self: t.self,
        String: t.string,
        Char: t.character, // NEW:
        RawString: t.special(t.string),
        Boolean: t.bool,
        Identifier: t.variableName,
        "CallExpression/Identifier": t.function(t.variableName),
        BoundIdentifier: t.definition(t.variableName),
        // NEW: Specifically target function names for styling
        "FunctionItem/BoundIdentifier": t.function(
          t.definition(t.variableName)
        ),
        LoopLabel: t.labelName,
        FieldIdentifier: t.propertyName,
        "CallExpression/FieldExpression/FieldIdentifier": t.function(
          t.propertyName
        ),
        Lifetime: t.special(t.variableName),
        ScopeIdentifier: t.namespace,
        TypeIdentifier: t.typeName,
        "MacroInvocation/Identifier MacroInvocation/ScopedIdentifier/Identifier":
          t.macroName,
        "MacroInvocation/TypeIdentifier MacroInvocation/ScopedIdentifier/TypeIdentifier":
          t.macroName,
        '"!"': t.macroName,
        UpdateOp: t.updateOperator,
        LineComment: t.lineComment,
        BlockComment: t.blockComment,
        Integer: t.integer,
        Float: t.float,
        ArithOp: t.arithmeticOperator,
        LogicOp: t.logicOperator,
        BitOp: t.bitwiseOperator,
        CompareOp: t.compareOperator,
        "=": t.definitionOperator,
        ".. ... => ->": t.punctuation,
        "( )": t.paren,
        "[ ]": t.squareBracket,
        "{ }": t.brace,
        ". DerefOp": t.derefOperator, // UPDATED: "." -> ". DerefOp"
        "&": t.operator,
        ", ; ::": t.separator,
        // NEW: #[] macro
        "Attribute/...": t.meta,
      }),
    ],
  }),
  languageData: {
    commentTokens: { line: "//", block: { open: "/*", close: "*/" } },
    indentOnInput: /^\s*(?:\{|\})$/,
  },
});

/// Rust language support
export const rust = () => {
  return new LanguageSupport(
    rustLanguage,
    rustLanguage.data.of({
      autocomplete: ifNotIn(
        ["LineComment", "BlockComment", "String", "Char"],
        completeFromList(snippets)
      ),
    })
  );
};
