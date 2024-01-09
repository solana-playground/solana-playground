/* eslint-disable no-template-curly-in-string */
import {
  Completion,
  snippetCompletion as snip,
} from "@codemirror/autocomplete";

/** Rust language snippets */
export const RUST_SNIPPETS: Completion[] = [
  snip("struct ${1:MyStruct} {\n\t${2}\n}", {
    label: "create struct(cst)",
    type: "class",
    info: "Create struct",
  }),
  snip("pub struct ${1:MyStruct} {\n\t${2}\n}", {
    label: "create pub struct(cpst)",
    type: "class",
    info: "Create pub struct",
  }),
  snip("enum ${1:MyEnum} {\n\t${2}\n}", {
    label: "create enum(cen)",
    type: "class",
    info: "Create enum",
  }),
  snip("pub enum ${1:MyEnum} {\n\t${2}\n}", {
    label: "create pub enum(cpen)",
    type: "class",
    info: "Create pub enum",
  }),
];

/** Common snippets for Native and Anchor */
export const COMMON_SNIPPETS: Completion[] = [
  snip('declare_id!("${1}");${2}', {
    label: "declare id(di)",
    type: "function",
    info: "Declare program id",
  }),
  snip("#[derive(${Trait})]", {
    label: "derive(drv)",
    type: "function",
    info: "Derive a trait",
  }),
  snip('msg!("${message}");', {
    label: "message(msg)",
    type: "function",
    info: "Log program message",
  }),
];

/** Native specific snippets */
export const NATIVE_SNIPPETS: Completion[] = [
  snip("#[derive(BorshSerialize, BorshDeserialize)]", {
    label: "serialize deserialize(sd)",
    type: "function",
    info: "Derive Borsh de-serialize",
  }),
];

/** Anchor specific snippets */
export const ANCHOR_SNIPPETS: Completion[] = [
  // Use statements
  snip("use anchor_lang::prelude::*;", {
    label: "use anchor prelude(uap)",
    type: "namespace",
    info: "Use anchor prelude",
  }),
  // Macros
  snip("require!(${condition}, ${CustomError});", {
    label: "require(rq)",
    type: "function",
    info: "Require macro",
  }),
  // Procedural macros
  snip("#[derive(AnchorSerialize, AnchorDeserialize)]", {
    label: "serialize deserialize(sd)",
    type: "function",
    info: "Derive Anchor de-serialize",
  }),
  snip("#[account(mut)]", {
    label: "mut attribute(mat)",
    type: "function",
    info: "Mut attribute",
  }),
  snip("#[account(mut)]\npub ${mut_account}: Account<'info, ${MutAccount}>,", {
    label: "mut account(mac)",
    type: "function",
    info: "Mut account",
  }),
  snip("#[account(init, payer = signer, space = ${space})]", {
    label: "init attribute(iat)",
    type: "function",
    info: "Init attribute",
  }),
  snip(
    "#[account(\n\tinit,\n\tpayer = signer,\n\tspace = ${space},\n\tseeds = [${2}],\n\tbump\n)]",
    {
      label: "init attribute with seeds(iats)",
      type: "function",
      info: "Init attribute with seeds",
    }
  ),
  snip(
    "#[account(init, payer = signer, space = ${space})]\npub ${new_account}: Account<'info, ${NewAccount}>,",
    {
      label: "init account(iac)",
      type: "function",
      info: "Init account",
    }
  ),
  snip(
    "#[account(\n\tinit,\n\tpayer = signer,\n\tspace = ${1:space},\n\tseeds = [${2}],\n\tbump\n)]\npub ${new_account}: Account<'info, ${NewAccount}>,",
    {
      label: "init account with seeds(iacs)",
      type: "function",
      info: "Init account with seeds",
    }
  ),
  // Creators
  snip(
    "#[program]\nmod ${my_program} {\n\tuse super::*;\n\tpub fn ${init}(ctx: Context<${MyContext}>) -> Result<()> {\n\t\tOk(())\n\t}\n}",
    {
      label: "create program(cpr)",
      type: "interface",
      info: "Create program",
    }
  ),
  snip(
    "pub fn ${name}(ctx: Context<${MyContext}>) -> Result<()> {\n\tOk(())\n}",
    {
      label: "create instruction(cin)",
      type: "function",
      info: "Create Anchor instruction",
    }
  ),
  snip(
    "#[derive(Accounts)]\npub struct ${MyContext}<'info> {\n\t#[account(mut)]\n\tpub ${signer}: Signer<'info>,\n}",
    {
      label: "create context(cctx)",
      type: "class",
      info: "Create context",
    }
  ),
  snip(
    "#[account]\n#[derive(Default)]\npub struct ${MyAccount} {\n\tpub ${field}: ${u64},\n}",
    {
      label: "create account(cac)",
      type: "class",
      info: "Create account",
    }
  ),
  snip("#[event]\npub struct ${1:EventName} {\n\t${2}\n}", {
    label: "create event(cev)",
    type: "class",
    info: "Create event",
  }),
  snip("#[constant]\npub const ${CONSTANT}: ${type} = ${value};", {
    label: "create constant(ccnst)",
    type: "function",
    info: "Create constant",
  }),
  // Errors
  snip(
    '#[error_code]\npub enum ${MyError} {\n\t#[msg("${Custom Error Message}")]\n\t${CustomErrorName},\n}',
    {
      label: "create custom error(cce)",
      type: "enum",
      info: "Create custom error",
    }
  ),
  snip('#[msg("${Custom error message}")]\n${CustomErrorName},', {
    label: "custom error field(cef)",
    type: "enum",
    info: "Define custom error variant",
  }),
  // Properties
  snip("pub system_program: Program<'info, System>,", {
    label: "system program(sp)",
    type: "property",
    info: "Add system program account",
  }),
  snip("pub token_program: Program<'info, Token>,", {
    label: "token program(tp)",
    type: "property",
    info: "Add token program account",
  }),
  snip("pub rent: Sysvar<'info, Rent>,", {
    label: "rent sysvar(sysr)",
    type: "property",
    info: "Add rent sysvar account",
  }),
  snip("pub clock: Sysvar<'info, Clock>,", {
    label: "clock sysvar(sysc)",
    type: "property",
    info: "Add clock sysvar account",
  }),
  snip("#[account(mut)]\npub signer: Signer<'info>,", {
    label: "signer(sig)",
    type: "property",
    info: "Add signer account",
  }),
];
