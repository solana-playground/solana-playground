/* eslint-disable no-template-curly-in-string */
import {
  Completion,
  snippetCompletion as snip,
} from "@codemirror/autocomplete";

const snippets: Completion[] = [
  // Use statements
  snip("use anchor_lang::prelude::*;${}", {
    label: "use anchor prelude(uap)",
    type: "namespace",
  }),
  // Macros
  snip('declare_id!("11111111111111111111111111111111");', {
    label: "declare id(di)",
    type: "function",
  }),
  snip("require!(${condition}, ${CustomError});", {
    label: "require(rq)",
    type: "function",
  }),
  // Procedural macros
  snip("#[derive(${Trait})]", {
    label: "derive(drv)",
    type: "function",
  }),
  snip("#[derive(AnchorSerialize, AnchorDeserialize)]${}", {
    label: "serialize deserialize(sd)",
    type: "function",
  }),
  snip("#[account(mut)]${}", {
    label: "mut attribute(mat)",
    type: "function",
  }),
  snip("#[account(mut)]\npub ${new_account}: Account<'info, ${NewAccount}>,", {
    label: "mut account(mac)",
    type: "function",
  }),
  snip("#[account(init, payer = signer, space = ${})]", {
    label: "init attribute(iat)",
    type: "function",
  }),
  snip(
    "#[account(init, payer = signer, space = ${})]\npub ${new_account}: Account<'info, ${NewAccount}>,",
    {
      label: "init account(iac)",
      type: "function",
    }
  ),
  // Creators
  snip(
    "pub fn ${name}(ctx: Context<${MyContext}>) -> Result<()> {\n\tOk(())\n}",
    {
      label: "create fn(cf)",
      info: "Create an anchor function",
      type: "function",
    }
  ),
  snip(
    "#[program]\nmod ${my_program} {\n\tuse super::*;\n\tpub fn ${init}(ctx: Context<${MyContext}>) -> Result<()> {\n\t\tOk(())\n\t}\n}",
    {
      label: "create program(cp)",
      type: "interface",
    }
  ),
  snip(
    "#[derive(Accounts)]\npub struct ${MyContext}<'info> {\n\t#[account(${mut})]\n\tpub ${my_account}: Account<'info, ${MyAccount}>,\n}",
    {
      label: "create context(cc)",
      type: "class",
    }
  ),
  snip(
    "#[account]\n#[derive(Default)]\npub struct ${MyAccount} {\n\t${field}: ${u64},\n}",
    {
      label: "create account(ca)",
      type: "class",
    }
  ),
  snip("struct ${MyStruct} {\n\t\n}", {
    label: "create struct(cs)",
    type: "class",
  }),
  snip("enum ${MyEnum} {\n\t\n}", {
    label: "create enum(ce)",
    type: "class",
  }),
  snip("pub struct ${MyStruct} {\n\t\n}", {
    label: "create pub struct(cps)",
    type: "class",
  }),
  snip("pub enum ${MyEnum} {\n\t\n}", {
    label: "create pub enum(cpe)",
    type: "class",
  }),
  // Errors
  snip(
    '#[error_code]\npub enum ${MyError} {\n\t#[msg("${Custom Error Message}")]\n\t${CustomErrorName},\n}',
    {
      label: "create custom error(cce)",
      type: "enum",
    }
  ),
  snip('#[msg("${Custom Error Message}")]\n${CustomErrorName},', {
    label: "custom error field(cef)",
    type: "enum",
  }),
  // Properties
  snip("pub system_program: Program<'info, System>,${}", {
    label: "system program(sp)",
    type: "property",
  }),
  snip("pub token_program: Program<'info, Token>,${}", {
    label: "token program(tp)",
    type: "property",
  }),
  snip("pub rent: Sysvar<'info, Rent>,${}", {
    label: "rent sysvar(sysr)",
    type: "property",
  }),
  snip("pub clock: Sysvar<'info, Clock>,${}", {
    label: "clock sysvar(sysc)",
    type: "property",
  }),
  snip("#[account(mut)]\npub signer: Signer<'info>,${}", {
    label: "signer (sig)",
    type: "property",
  }),
];

export default snippets;
