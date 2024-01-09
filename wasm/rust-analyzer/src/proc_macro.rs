use cargo_toml::Manifest;
use ide_db::base_db::ProcMacro;

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
/// For example, without manual expansion of `#[account]` macro of the `anchor-lang` crate, there
/// are no completion hints for the accounts e.g. `ctx.accounts.<NAME>.<FIELD>`.
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

    use manual_expansions::*;
    match_proc_macros!(
        "#[account]" => Account,
        "#[program]" => Program,

        "#[derive(BorshSerialize)]" => BorshSerialize,
        "#[derive(BorshDeserialize)]" => BorshDeserialize,
        "#[derive(Accounts)]" => Accounts,
        "#[derive(InitSpace)]" => InitSpace,

        "declare_id!" => DeclareId,
        "program_declare_id!" => ProgramDeclareId
    )
}

/// Manual proc macro expansions for completion hints.
mod manual_expansions {
    use std::sync::Arc;

    use ide_db::base_db::{
        Env, ProcMacro, ProcMacroExpander, ProcMacroExpansionError, ProcMacroKind,
    };
    use tt::{Delimiter, DelimiterKind, Ident, Leaf, Punct, Spacing, Subtree, TokenId, TokenTree};

    /// Implement dummy `ProcMacroExpander` for types.
    #[macro_export]
    macro_rules! expand {
    // Derive
    ($struct_name:ident) => {
        #[derive(Debug)]
        pub(super) struct $struct_name;

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
        pub(super) struct $struct_name;

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
        pub(super) struct $struct_name;

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
        pub(super) struct $struct_name;

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
                #[allow(unused_variables)]
                let name = get_name_from_subtree(subtree);
                #[allow(unused_mut)]
                let mut traits: Vec<String> = vec![];

                $(
                    let expansion = format!("impl {} for {} {{ }}", $trait, name);
                    traits.push(expansion);
                )*

                let mut subtree = subtree.clone();
                subtree
                    .token_trees
                    .extend(create_subtree(traits.join(" ")).token_trees);

                Ok(subtree)
            }
        }
    };
}

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
    expand!(Program, "program", []);

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
    pub(super) trait ToProcMacro: ProcMacroExpander {
        /// Create a proc macro.
        fn to_proc_macro() -> ProcMacro;
    }

    /// Create a subtree from the given string.
    ///
    /// NOTE: This doesn't represent full parsing of a subtree.
    fn create_subtree<S: AsRef<str>>(s: S) -> Subtree {
        let s = s.as_ref().trim();
        let (tokens, delimiter) = s
            .chars()
            .next()
            .and_then(|char| get_matching_close_char(char).map(|close_char| (char, close_char)))
            .map(|(open_char, close_char)| {
                let tokens = s.trim_start_matches(open_char).trim_end_matches(close_char);
                let delimiter = Delimiter {
                    id: TokenId::unspecified(),
                    kind: match open_char {
                        '{' => DelimiterKind::Brace,
                        '(' => DelimiterKind::Parenthesis,
                        '[' => DelimiterKind::Bracket,
                        _ => unreachable!(),
                    },
                };

                (tokens, Some(delimiter))
            })
            .unwrap_or((s, None));

        let mut remaining_tokens = tokens.to_owned();
        let mut matching_count = 0usize;

        Subtree {
            delimiter,
            token_trees: tokens
                .split_whitespace()
                .filter_map(|token| {
                    let char = match token.chars().next() {
                        Some(c) => c,
                        _ => return None,
                    };

                    if ['}', ')', ']'].contains(&char) {
                        matching_count -= 1;
                        return None;
                    }

                    if matching_count != 0 {
                        None
                    } else if ['{', '(', '['].contains(&char) {
                        matching_count += 1;
                        let (inside, remaining) =
                            get_wrapping_subtree(&remaining_tokens, char).unwrap_or_default();
                        let subtree = create_subtree(inside);
                        remaining_tokens = remaining.to_owned();
                        Some(TokenTree::Subtree(subtree))
                    } else if [':', ';', ','].contains(&char) {
                        Some(TokenTree::Leaf(Leaf::Punct(Punct {
                            char,
                            id: TokenId::unspecified(),
                            spacing: Spacing::Alone,
                        })))
                    } else {
                        Some(TokenTree::Leaf(Leaf::Ident(Ident {
                            text: token.into(),
                            id: TokenId::unspecified(),
                        })))
                    }
                })
                .collect(),
        }
    }

    /// Get inside of the subtree.
    ///
    /// # Example
    ///
    /// ```ignore
    /// get_wrapping_subtree("pub struct MyAccount { field : u64 }", '{'); // Some(("{ field : u64 }", ""))
    /// ```
    ///
    /// Returns a tuple of (inside, remaining).
    fn get_wrapping_subtree(content: &str, open_char: char) -> Option<(&str, &str)> {
        let open_indices = content
            .match_indices(open_char)
            .map(|(i, _)| i)
            .enumerate()
            .collect::<Vec<(usize, usize)>>();

        let close_char = match get_matching_close_char(open_char) {
            Some(c) => c,
            None => return None,
        };
        let close_indices = content
            .match_indices(close_char)
            .map(|(i, _)| i)
            .collect::<Vec<usize>>();

        for (i, open_index) in &open_indices {
            let close_index = close_indices[*i];
            let is_ok = open_indices
                .iter()
                .any(|(_, open_index)| *open_index < close_index);
            if is_ok {
                let inside = content.get(*open_index..close_index + 1).unwrap();
                let remaining = content.get(close_index + 1..).unwrap();
                return Some((inside, remaining));
            }
        }

        None
    }

    /// Get the matching closing char.
    const fn get_matching_close_char(open_char: char) -> Option<char> {
        const INVALID: char = '_';
        let close_char = match open_char {
            '(' => ')',
            '{' => '}',
            '[' => ']',
            _ => INVALID,
        };

        match close_char {
            INVALID => None,
            _ => Some(close_char),
        }
    }

    /// Get item name from the given subtree.
    fn get_name_from_subtree(subtree: &Subtree) -> String {
        subtree
            .token_trees
            .iter()
            .enumerate()
            .find_map(|(i, tree)| {
                if ["struct", "enum", "mod"].contains(&tree.to_string().as_str()) {
                    subtree
                        .token_trees
                        .get(i + 1)
                        .map(|token| token.to_string())
                } else {
                    None
                }
            })
            .unwrap_or_default()
    }
}
