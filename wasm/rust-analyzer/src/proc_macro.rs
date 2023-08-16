use std::sync::Arc;

use cargo_toml::Manifest;
use ide_db::base_db::{Env, ProcMacro, ProcMacroExpander, ProcMacroExpansionError, ProcMacroKind};
use tt::{Ident, Leaf, Punct, Spacing, Subtree, TokenId, TokenTree};

/// Get whether the crate is a proc macro crate from manifest.
pub fn get_is_proc_macro(manifest: &Manifest) -> bool {
    manifest
        .lib
        .as_ref()
        .map(|lib| lib.proc_macro)
        .unwrap_or_default()
}

/// Get proc macros from the given lib.
///
/// Full macro expansion depends on `rustc`, which is not available in browsers. In order to get
/// at least some of the type benefits, we manually expand the most used proc macros.
///
/// For example, without manual expansion of `#[account]` macro from the `anchor-lang` crate, there
/// is no type hint for the accounts in `ctx.accounts.<NAME>.<MISSING_TYPE_HINTS>`.
pub fn get_proc_macros(lib: &str) -> Vec<ProcMacro> {
    /// Get implementations of the proc macros.
    #[macro_export]
    macro_rules! match_proc_macros {
    ($( $macro_name:literal => $struct_name:ident ),+) => {{
        let mut proc_macros = vec![];

        $(
            let search_text = if $macro_name.starts_with("#[derive(") {
                format!(
                    "# [proc_macro_derive ({} ",
                    $macro_name
                        .trim_start_matches("#[derive(")
                        .trim_end_matches(")]")
                )
            } else if $macro_name.starts_with("#[") {
                format!(
                    "# [proc_macro_attribute] pub fn {} ",
                    $macro_name
                        .trim_start_matches("#[")
                        .trim_end_matches("]")
                )
            } else if $macro_name.ends_with('!') {
                format!(
                    "# [proc_macro] pub fn {} ",
                    $macro_name.trim_end_matches('!')
                )
            } else {
                unreachable!()
            };

            if lib.contains(&search_text) {
                proc_macros.push($struct_name::to_proc_macro());
            }
        )+

        proc_macros
    }};
}

    match_proc_macros!(
        "#[account]" => Account,

        "#[derive(BorshSerialize)]" => BorshSerialize,
        "#[derive(BorshDeserialize)]" => BorshDeserialize,
        "#[derive(Accounts)]" => Accounts,
        "#[derive(InitSpace)]" => InitSpace,

        "declare_id!" => DeclareId,
        "program_declare_id!" => ProgramDeclareId
    )
}

/// Implement dummy `ProcMacroExpander` for types.
#[macro_export]
macro_rules! expand {
    // Derive
    ($struct_name:ident) => {
        #[derive(Debug)]
        struct $struct_name;

        impl ToProcMacro for $struct_name {
            fn to_proc_macro() -> ProcMacro {
                ProcMacro {
                    name: stringify!($struct_name).into(),
                    kind: ProcMacroKind::CustomDerive,
                    expander: Arc::new($struct_name),
                }
            }
        }

        impl ProcMacroExpander for $struct_name {
            fn expand(
                &self,
                subtree: &Subtree,
                _: Option<&Subtree>,
                _: &Env,
            ) -> Result<Subtree, ProcMacroExpansionError> {
                let name = get_name_from_subtree(subtree);
                let expansion = format!("impl {} for {} {{ }}", stringify!($struct_name), name);
                Ok(create_subtree(expansion))
            }
        }
    };

    // Derive with different trait names
    ($struct_name:ident, [$( $trait:literal ),+]) => {
        #[derive(Debug)]
        struct $struct_name;

        impl ToProcMacro for $struct_name {
            fn to_proc_macro() -> ProcMacro {
                ProcMacro {
                    name: stringify!($struct_name).into(),
                    kind: ProcMacroKind::CustomDerive,
                    expander: Arc::new($struct_name),
                }
            }
        }

        impl ProcMacroExpander for $struct_name {
            fn expand(
                &self,
                subtree: &Subtree,
                _: Option<&Subtree>,
                _: &Env,
            ) -> Result<Subtree, ProcMacroExpansionError> {
                let name = get_name_from_subtree(subtree);
                let mut traits = vec![];

                $(
                    let expansion = format!("impl {} for {} {{ }}", $trait, name);
                    traits.push(expansion);
                )*

                Ok(create_subtree(traits.join(" ")))
            }
        }
    };

    // Function like(!)
    ($struct_name:ident, $name:literal, $expansion:literal) => {
        #[derive(Debug)]
        struct $struct_name;

        impl ToProcMacro for $struct_name {
            fn to_proc_macro() -> ProcMacro {
                ProcMacro {
                    name: $name.into(),
                    kind: ProcMacroKind::FuncLike,
                    expander: Arc::new($struct_name),
                }
            }
        }

        impl ProcMacroExpander for $struct_name {
            fn expand(
                &self,
                _: &Subtree,
                _: Option<&Subtree>,
                _: &Env,
            ) -> Result<Subtree, ProcMacroExpansionError> {
                Ok(create_subtree($expansion))
            }
        }
    };

    // Attribute
    ($struct_name:ident, $name:literal, [$( $trait:literal ),*]) => {
        #[derive(Debug)]
        struct $struct_name;

        impl ToProcMacro for $struct_name {
            fn to_proc_macro() -> ProcMacro {
                ProcMacro {
                    name: $name.into(),
                    kind: ProcMacroKind::Attr,
                    expander: Arc::new($struct_name),
                }
            }
        }

        impl ProcMacroExpander for $struct_name {
            fn expand(
                &self,
                subtree: &Subtree,
                _: Option<&Subtree>,
                _: &Env,
            ) -> Result<Subtree, ProcMacroExpansionError> {
                let name = get_name_from_subtree(subtree);
                let mut traits = vec![];

                $(
                    let expansion = format!("impl {} for {} {{ }}", $trait, name);
                    traits.push(expansion);
                )*

                Ok(create_subtree(traits.join(" ")))
            }
        }
    };
}

// FIXME: Fix attribute macros not expanding
// Attribute
expand!(
    Account,
    "account",
    [
        "AccountDeserialize",
        "AccountSerialize",
        "AnchorDeserialize",
        "AnchorSerialize",
        "Clone",
        "Discriminator",
        "Owner"
    ]
);

// Derive
expand!(BorshDeserialize);
expand!(BorshSerialize);
expand!(
    Accounts,
    [
        "Accounts",
        "ToAccountInfos",
        "ToAccountMetas",
        "AccountsExit"
    ]
);
expand!(InitSpace, ["Space"]);

// Function like
expand!(DeclareId, "declare_id", "pub static ID : Pubkey ;");
expand!(
    ProgramDeclareId,
    "program_declare_id",
    "pub static ID : Pubkey ;"
);

/// Create a [`ProcMacro`], supertrait of [`ProcMacroExpander`]
trait ToProcMacro: ProcMacroExpander {
    /// Create a proc macro.
    fn to_proc_macro() -> ProcMacro;
}

/// Create a subtree from the given string.
fn create_subtree<S: AsRef<str>>(s: S) -> Subtree {
    Subtree {
        delimiter: None,
        token_trees: s
            .as_ref()
            .split_whitespace()
            .map(|token| {
                let char = token.chars().next().unwrap();
                // TODO: Recursively parse subtrees
                if [':', ';', '{', '}'].contains(&char) {
                    TokenTree::Leaf(Leaf::Punct(Punct {
                        char,
                        id: TokenId::unspecified(),
                        spacing: Spacing::Alone,
                    }))
                } else {
                    TokenTree::Leaf(Leaf::Ident(Ident {
                        text: token.into(),
                        id: TokenId::unspecified(),
                    }))
                }
            })
            .collect(),
    }
}

/// Get name from the given subtree of a `struct` or `enum`.
fn get_name_from_subtree(subtree: &Subtree) -> String {
    subtree
        .token_trees
        .iter()
        .enumerate()
        .find_map(|(i, tree)| {
            if ["struct", "enum"].contains(&tree.to_string().as_str()) {
                Some(subtree.token_trees[i + 1].to_string())
            } else {
                None
            }
        })
        .unwrap()
}
