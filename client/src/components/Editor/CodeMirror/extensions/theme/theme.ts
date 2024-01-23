import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

import type { Highlight } from "../../../../../utils/pg";

export const getThemeExtension = (h: Highlight) => {
  return syntaxHighlighting(
    HighlightStyle.define([
      {
        tag: t.typeName,
        ...h.typeName,
      },
      {
        tag: t.variableName,
        ...h.variableName,
      },
      {
        tag: t.namespace,
        ...h.namespace,
      },
      {
        tag: t.macroName,
        ...h.macroName,
      },
      {
        tag: t.function(t.variableName),
        ...h.functionCall,
      },
      {
        tag: t.function(t.propertyName),
        ...h.functionDef,
      },
      {
        tag: t.definitionKeyword,
        ...h.definitionKeyword,
      },
      {
        tag: t.moduleKeyword,
        ...h.moduleKeyword,
      },
      {
        tag: t.modifier,
        ...h.modifier,
      },
      {
        tag: t.controlKeyword,
        ...h.controlKeyword,
      },
      {
        tag: t.operatorKeyword,
        ...h.operatorKeyword,
      },
      {
        tag: t.keyword,
        ...h.keyword,
      },
      {
        tag: t.self,
        ...h.self,
      },
      {
        tag: t.bool,
        ...h.bool,
      },
      {
        tag: t.integer,
        ...h.integer,
      },
      {
        tag: t.literal,
        ...h.literal,
      },
      {
        tag: t.string,
        ...h.string,
      },
      {
        tag: t.character,
        ...h.character,
      },
      {
        tag: t.operator,
        ...h.operator,
      },
      {
        tag: t.derefOperator,
        ...h.derefOperator,
      },
      {
        tag: t.special(t.variableName),
        ...h.specialVariable,
      },
      {
        tag: t.lineComment,
        ...h.lineComment,
      },
      {
        tag: t.blockComment,
        ...h.blockComment,
      },
      {
        tag: t.meta,
        ...h.meta,
      },
      {
        tag: t.invalid,
        ...h.invalid,
      },
      {
        tag: t.constant(t.variableName),
        ...h.typeName,
      },
      {
        tag: t.regexp,
        ...h.regexp,
      },
      { tag: t.tagName, ...h.tagName },
      { tag: t.attributeName, ...h.attributeName },
      { tag: t.attributeValue, ...h.attributeValue },
      {
        tag: t.annotation,
        ...h.annotion,
      },
    ])
  );
};
