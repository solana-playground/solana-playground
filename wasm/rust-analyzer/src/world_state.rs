use std::{collections::BTreeMap, fmt::Display, sync::Arc};

use base_db::{CrateDisplayName, CrateOrigin, FileLoader};
use cargo_toml::Manifest;
use cfg::CfgOptions;
use ide::{
    Analysis, AnalysisHost, Change, CompletionConfig, CrateGraph, CrateId, DiagnosticsConfig,
    Edition, FileId, FilePosition, HoverConfig, HoverDocFormat, Indel, InlayHintsConfig, InlayKind,
    LineIndex, SourceRoot, TextSize,
};
use ide_db::{
    base_db::{CrateName, Dependency, Env, FileSet, VfsPath},
    helpers::{
        insert_use::{ImportGranularity, InsertUseConfig, PrefixKind},
        SnippetCap,
    },
    search::SearchScope,
};
use wasm_bindgen::prelude::*;

use crate::{
    return_types, to_proto,
    utils::{create_source_root, get_crate_id, get_file_id, get_file_position},
};

#[wasm_bindgen]
pub struct WorldState {
    /// Current state of the world
    host: AnalysisHost,
    /// Current crate graph
    crate_graph: CrateGraph,
    /// All source roots
    source_roots: Vec<SourceRoot>,
    /// Mapping of crate names to their needed dependencies. Keeping track of the dependencies is
    /// is necessary for lazy loading crates.
    needed_deps: BTreeMap<String, Vec<String>>,
    /// Current file id
    file_id: FileId,
}

#[wasm_bindgen]
impl WorldState {
    /// Create a default world state.
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            host: AnalysisHost::default(),
            crate_graph: CrateGraph::default(),
            source_roots: vec![],
            needed_deps: BTreeMap::new(),
            file_id: Self::default_file_id(),
        }
    }

    /// Load `std`, `core` and `alloc` libraries and initialize a default local crate.
    #[wasm_bindgen(js_name = loadDefaultCrates)]
    pub fn load_default_crates(&mut self, std_lib: String, core_lib: String, alloc_lib: String) {
        const DEFAULT_NAME: &str = "solpg";
        const STD_NAME: &str = "std";
        const CORE_NAME: &str = "core";
        const ALLOC_NAME: &str = "alloc";

        let mut change = Change::new();

        // Create file ids
        let file_id = Self::default_file_id();
        let std_id = FileId(1);
        let core_id = FileId(2);
        let alloc_id = FileId(3);

        // Add source roots
        let local_source_root = {
            let mut file_set = FileSet::default();
            file_set.insert(
                file_id,
                VfsPath::new_virtual_path(format!("/{DEFAULT_NAME}/src/lib.rs")),
            );
            SourceRoot::new_local(file_set)
        };
        self.source_roots = vec![
            local_source_root,
            create_source_root(STD_NAME, std_id),
            create_source_root(CORE_NAME, core_id),
            create_source_root(ALLOC_NAME, alloc_id),
        ];
        change.set_roots(self.source_roots.clone());

        // Add crate roots to the crate graph
        let my_crate = self.add_crate_from_name(file_id, DEFAULT_NAME);
        let std_crate = self.add_crate_from_name(std_id, STD_NAME);
        let core_crate = self.add_crate_from_name(core_id, CORE_NAME);
        let alloc_crate = self.add_crate_from_name(alloc_id, ALLOC_NAME);

        // Add dependencies
        let core_dep = Dependency::new(CrateName::new(CORE_NAME).unwrap(), core_crate);
        let alloc_dep = Dependency::new(CrateName::new(ALLOC_NAME).unwrap(), alloc_crate);
        let std_dep = Dependency::new(CrateName::new(STD_NAME).unwrap(), std_crate);

        self.crate_graph
            .add_dep(std_crate, core_dep.clone())
            .unwrap();
        self.crate_graph
            .add_dep(std_crate, alloc_dep.clone())
            .unwrap();
        self.crate_graph
            .add_dep(alloc_crate, core_dep.clone())
            .unwrap();

        self.crate_graph.add_dep(my_crate, core_dep).unwrap();
        self.crate_graph.add_dep(my_crate, alloc_dep).unwrap();
        self.crate_graph.add_dep(my_crate, std_dep).unwrap();
        change.set_crate_graph(self.crate_graph.clone());

        // Set file contents
        change.change_file(file_id, Some(Arc::new("".into())));
        change.change_file(std_id, Some(Arc::new(std_lib)));
        change.change_file(core_id, Some(Arc::new(core_lib)));
        change.change_file(alloc_id, Some(Arc::new(alloc_lib)));

        self.host.apply_change(change);
    }

    /// Set the current local crate's display name.
    #[wasm_bindgen(js_name = setLocalCrateName)]
    pub fn set_local_crate_name(&mut self, name: String) {
        // SAFETY: Undefined Behavior.
        //
        // From https://doc.rust-lang.org/nomicon/transmutes.html
        // Transmuting an `&` to `&mut` is Undefined Behavior. While certain usages may appear
        // safe, note that the Rust optimizer is free to assume that a shared reference won't
        // change through its lifetime and thus such transmutation will run afoul of those
        // assumptions. So:
        // - Transmuting an `&` to `&mut` is *always* Undefined Behavior.
        // - No you can't do it.
        // - No you're not special.
        //
        // Problem is that there is no way to update a crate's display name from `CrateGraph` since
        // it's only possible to get reference to the underlying `CrateData`.
        //
        // Playground currently allows one local crate at a time, and all local crates have the same
        // settings/dependencies. Instead of adding a new local crate for each workspace change,
        // and thus creating a new crate graph each time, we change the display name of the current
        // crate. This has been tested to work without any noticable problems and since nothing
        // else depends on this code, this is going to be the solution until if/when we decide to
        // support multiple local crates(workspace) in playground.
        unsafe {
            let mut_ptr = self.crate_graph[Self::default_crate_id()]
                .display_name
                .as_ref()
                .unwrap() as *const CrateDisplayName
                as *mut CrateDisplayName;
            *mut_ptr = CrateDisplayName::from_canonical_name(name)
        }

        let mut change = Change::new();
        change.set_crate_graph(self.crate_graph.clone());
        self.host.apply_change(change);
    }

    /// Load the given files to the local crate.
    ///
    /// File format is `Vec<[path, content]>`.
    #[wasm_bindgen(js_name = loadLocalFiles)]
    pub fn load_local_files(&mut self, files: JsValue) {
        let files = serde_wasm_bindgen::from_value::<Vec<[String; 2]>>(files).unwrap();
        let mut change = Change::new();
        let mut file_set = FileSet::default();

        for [path, content] in files {
            let path = VfsPath::new_virtual_path(path);
            let file_id = match path.name_and_extension() {
                Some((name, _)) if name == "lib" => Self::default_file_id(),
                _ => self.file_id_from_path(&path).unwrap_or(self.next_file_id()),
            };
            file_set.insert(file_id, path);
            change.change_file(file_id, Some(Arc::new(content)));
        }

        self.source_roots[0] = SourceRoot::new_local(file_set);
        change.set_roots(self.source_roots.clone());
        self.host.apply_change(change);
    }

    /// Load the given dependency and its transitive dependencies.
    ///
    /// Returns an array of needed dependencies if a crate doesn't exist in state.
    #[wasm_bindgen(js_name = loadDependency)]
    pub fn load_dependency(
        &mut self,
        name: String,
        code: Option<String>,
        manifest: Option<String>,
    ) -> JsValue {
        let mut change = Change::new();
        let manifest = Manifest::from_str(
            &manifest.unwrap_or(
                r#"
[package]
name = "empty"
version = "0.0.0""#
                    .to_owned(),
            ),
        )
        .unwrap();

        let (file_id, crate_id) = match get_file_id(&name, &self.source_roots) {
            Some(file_id) => (
                *file_id,
                get_crate_id(&name, &self.source_roots, &self.crate_graph).unwrap(),
            ),
            None => {
                let file_id = self.next_file_id();

                // Add source root
                self.source_roots.push(create_source_root(&name, file_id));
                change.set_roots(self.source_roots.clone());

                // Add crate root
                let crate_id = self.add_crate(file_id, &manifest);
                self.crate_graph
                    .add_dep(
                        Self::default_crate_id(),
                        Dependency::new(CrateName::new(&name).unwrap(), crate_id),
                    )
                    .unwrap();

                (file_id, crate_id)
            }
        };

        // Change file
        change.change_file(file_id, Some(Arc::new(code.unwrap_or_default())));

        // Handle transitive dependencies
        let mut needed_deps = vec![];
        for (dep_name, _) in manifest.dependencies {
            let dep_name = dep_name.replace('-', "_");
            // Get whether the dependency already exists
            match get_file_id(&dep_name, &self.source_roots) {
                Some(file_id) if !self.host.raw_database().file_text(*file_id).is_empty() => {
                    self.crate_graph
                        .add_dep(
                            crate_id,
                            Dependency::new(
                                CrateName::new(&dep_name).unwrap(),
                                get_crate_id(&dep_name, &self.source_roots, &self.crate_graph)
                                    .unwrap(),
                            ),
                        )
                        .unwrap();
                }
                _ => needed_deps.push(dep_name),
            }
        }
        let return_needed_deps = serde_wasm_bindgen::to_value(&needed_deps).unwrap();

        // Check whether the current dependency needs to be added to a previous dependency
        for (dep_name, deps) in &mut self.needed_deps {
            if let Some(index) = deps.iter().position(|dep_name| dep_name == &name) {
                self.crate_graph
                    .add_dep(
                        get_crate_id(dep_name, &self.source_roots, &self.crate_graph).unwrap(),
                        Dependency::new(CrateName::new(&name).unwrap(), crate_id),
                    )
                    .unwrap();

                deps.remove(index);
            }
        }

        // Store the needed deps to add dependency the next time this method is called
        self.needed_deps.insert(name, needed_deps);

        change.set_crate_graph(self.crate_graph.clone());
        self.host.apply_change(change);

        return_needed_deps
    }

    /// Update the current file.
    pub fn update(&mut self, path: String, content: String) -> JsValue {
        let file_id = match self.file_id_from_path(&VfsPath::new_virtual_path(path)) {
            Some(file_id) => file_id,
            None => {
                return serde_wasm_bindgen::to_value(&return_types::UpdateResult::default())
                    .unwrap()
            }
        };

        // Set the current file id
        self.file_id = file_id;

        let mut change = Change::new();
        change.change_file(file_id, Some(Arc::new(content)));
        self.host.apply_change(change);

        let line_index = self.analysis().file_line_index(file_id).unwrap();
        let highlights = self
            .analysis()
            .highlight(file_id)
            .unwrap()
            .into_iter()
            .map(|hl| return_types::Highlight {
                tag: Some(hl.highlight.tag.to_string()),
                range: to_proto::text_range(hl.range, &line_index),
            })
            .collect();

        let diagnostics = self
            .analysis()
            .diagnostics(
                &DiagnosticsConfig::default(),
                ide::AssistResolveStrategy::All,
                file_id,
            )
            .unwrap()
            .into_iter()
            .map(|d| {
                let return_types::Range {
                    start_line_number,
                    start_column,
                    end_line_number,
                    end_column,
                } = to_proto::text_range(d.range, &line_index);
                return_types::Diagnostic {
                    message: d.message,
                    severity: to_proto::severity(d.severity),
                    start_line_number,
                    start_column,
                    end_line_number,
                    end_column,
                }
            })
            .collect();

        serde_wasm_bindgen::to_value(&return_types::UpdateResult {
            diagnostics,
            highlights,
        })
        .unwrap()
    }

    /// Get inlay hints.
    #[wasm_bindgen(js_name = inlayHints)]
    pub fn inlay_hints(&self) -> JsValue {
        let line_index = self.line_index();
        let results = self
            .analysis()
            .inlay_hints(
                &InlayHintsConfig {
                    type_hints: true,
                    parameter_hints: true,
                    chaining_hints: true,
                    hide_named_constructor_hints: true,
                    max_length: Some(25),
                },
                self.file_id,
            )
            .unwrap()
            .into_iter()
            .map(|ih| return_types::InlayHint {
                label: Some(ih.label.to_string()),
                hint_type: match ih.kind {
                    InlayKind::TypeHint | InlayKind::ChainingHint => {
                        return_types::InlayHintType::Type
                    }
                    InlayKind::ParameterHint => return_types::InlayHintType::Parameter,
                },
                range: to_proto::text_range(ih.range, &line_index),
            })
            .collect::<Vec<_>>();

        serde_wasm_bindgen::to_value(&results).unwrap()
    }

    /// Get completions.
    pub fn completions(&self, line_number: u32, column: u32) -> JsValue {
        const COMPLETION_CONFIG: CompletionConfig = CompletionConfig {
            enable_postfix_completions: true,
            enable_imports_on_the_fly: true,
            enable_self_on_the_fly: true,
            snippet_cap: SnippetCap::new(true),
            insert_use: InsertUseConfig {
                granularity: ImportGranularity::Module,
                enforce_granularity: false,
                prefix_kind: PrefixKind::Plain,
                group: true,
                skip_glob_imports: false,
            },
            snippets: Vec::new(),
            add_call_argument_snippets: true,
            add_call_parenthesis: true,
        };

        let line_index = self.line_index();

        let pos = get_file_position(line_number, column, &line_index, self.file_id);
        let res = match self
            .analysis()
            .completions(&COMPLETION_CONFIG, pos)
            .unwrap()
        {
            Some(items) => items,
            None => return JsValue::NULL,
        };

        let items = res
            .into_iter()
            .map(|item| to_proto::completion_item(item, &line_index))
            .collect::<Vec<_>>();
        serde_wasm_bindgen::to_value(&items).unwrap()
    }

    /// Get hover info.
    pub fn hover(&self, line_number: u32, column: u32) -> JsValue {
        let line_index = self.line_index();

        let hover_result = match self
            .analysis()
            .hover(
                &HoverConfig {
                    links_in_hover: true,
                    documentation: Some(HoverDocFormat::Markdown),
                },
                ide::FileRange {
                    file_id: self.file_id,
                    range: ide::TextRange::new(
                        line_index.offset(ide::LineCol {
                            line: line_number - 1,
                            col: column - 1,
                        }),
                        line_index.offset(ide::LineCol {
                            line: line_number - 1,
                            col: column - 1,
                        }),
                    ),
                },
            )
            .unwrap()
        {
            Some(hover_result) => hover_result,
            _ => return JsValue::NULL,
        };

        let hover = return_types::Hover {
            contents: vec![return_types::MarkdownString {
                value: hover_result.info.markup.to_string(),
            }],
            range: to_proto::text_range(hover_result.range, &line_index),
        };

        serde_wasm_bindgen::to_value(&hover).unwrap()
    }

    /// Get code lenses.
    #[wasm_bindgen(js_name = codeLenses)]
    pub fn code_lenses(&self) -> JsValue {
        let line_index = self.line_index();

        let results = self
            .analysis()
            .file_structure(self.file_id)
            .unwrap()
            .into_iter()
            .filter(|it| match it.kind {
                ide::StructureNodeKind::SymbolKind(kind) => matches!(
                    kind,
                    ide_db::SymbolKind::Trait
                        | ide_db::SymbolKind::Struct
                        | ide_db::SymbolKind::Enum
                ),
                ide::StructureNodeKind::Region => true,
            })
            .filter_map(|it| {
                let position = FilePosition {
                    file_id: self.file_id,
                    offset: it.node_range.start(),
                };
                let nav_info = self.analysis().goto_implementation(position).unwrap()?;

                let title = if nav_info.info.len() == 1 {
                    "1 implementation".into()
                } else {
                    format!("{} implementations", nav_info.info.len())
                };

                let positions = nav_info
                    .info
                    .iter()
                    .map(|target| target.focus_range.unwrap_or(target.full_range))
                    .map(|range| to_proto::text_range(range, &line_index))
                    .collect();

                Some(return_types::CodeLensSymbol {
                    range: to_proto::text_range(it.node_range, &line_index),
                    command: Some(return_types::Command {
                        id: "editor.action.showReferences".into(),
                        title,
                        positions,
                    }),
                })
            })
            .collect::<Vec<_>>();

        serde_wasm_bindgen::to_value(&results).unwrap()
    }

    /// Get references.
    pub fn references(&self, line_number: u32, column: u32, include_declaration: bool) -> JsValue {
        let line_index = self.line_index();

        let pos = get_file_position(line_number, column, &line_index, self.file_id);
        let search_scope = Some(SearchScope::single_file(self.file_id));
        let ref_results = match self.analysis().find_all_refs(pos, search_scope) {
            Ok(Some(info)) => info,
            _ => return JsValue::NULL,
        };

        let mut res = vec![];
        for ref_result in ref_results {
            if include_declaration {
                if let Some(r) = ref_result.declaration {
                    let r = r.nav.focus_range.unwrap_or(r.nav.full_range);
                    res.push(return_types::Highlight {
                        tag: None,
                        range: to_proto::text_range(r, &line_index),
                    });
                }
            }
            ref_result.references.iter().for_each(|(_id, ranges)| {
                for (r, _) in ranges {
                    res.push(return_types::Highlight {
                        tag: None,
                        range: to_proto::text_range(*r, &line_index),
                    });
                }
            });
        }

        serde_wasm_bindgen::to_value(&res).unwrap()
    }

    /// Get prepare rename info.
    #[wasm_bindgen(js_name = prepareRename)]
    pub fn prepare_rename(&self, line_number: u32, column: u32) -> JsValue {
        let line_index = self.line_index();

        let pos = get_file_position(line_number, column, &line_index, self.file_id);
        let range_info = match self.analysis().prepare_rename(pos).unwrap() {
            Ok(refs) => refs,
            _ => return JsValue::NULL,
        };

        let range = to_proto::text_range(range_info.range, &line_index);
        let file_text = self.analysis().file_text(self.file_id).unwrap();
        let text = file_text[range_info.range].to_owned();

        serde_wasm_bindgen::to_value(&return_types::RenameLocation { range, text }).unwrap()
    }

    /// Get rename info.
    pub fn rename(&self, line_number: u32, column: u32, new_name: &str) -> JsValue {
        let line_index = self.line_index();

        let pos = get_file_position(line_number, column, &line_index, self.file_id);
        let change = match self.analysis().rename(pos, new_name).unwrap() {
            Ok(change) => change,
            Err(_) => return JsValue::NULL,
        };

        let result = change
            .source_file_edits
            .iter()
            .flat_map(|(_, edit)| edit.iter())
            .map(|atom: &Indel| to_proto::text_edit(atom, &line_index))
            .collect::<Vec<_>>();

        serde_wasm_bindgen::to_value(&result).unwrap()
    }

    /// Get signature help.
    #[wasm_bindgen(js_name = signatureHelp)]
    pub fn signature_help(&self, line_number: u32, column: u32) -> JsValue {
        let line_index = self.line_index();

        let pos = get_file_position(line_number, column, &line_index, self.file_id);
        let call_info = match self.analysis().call_info(pos) {
            Ok(Some(call_info)) => call_info,
            _ => return JsValue::NULL,
        };

        let active_parameter = call_info.active_parameter;
        let sig_info = to_proto::signature_information(call_info);

        let result = return_types::SignatureHelp {
            signatures: [sig_info],
            active_signature: 0,
            active_parameter,
        };
        serde_wasm_bindgen::to_value(&result).unwrap()
    }

    /// Get definition.
    pub fn definition(&self, line_number: u32, column: u32) -> JsValue {
        let line_index = self.line_index();

        let pos = get_file_position(line_number, column, &line_index, self.file_id);
        let nav_info = match self.analysis().goto_definition(pos) {
            Ok(Some(nav_info)) => nav_info,
            _ => return JsValue::NULL,
        };

        let res = to_proto::location_links(nav_info, &line_index);
        serde_wasm_bindgen::to_value(&res).unwrap()
    }

    /// Get type definition.
    #[wasm_bindgen(js_name = typeDefinition)]
    pub fn type_definition(&self, line_number: u32, column: u32) -> JsValue {
        let line_index = self.line_index();

        let pos = get_file_position(line_number, column, &line_index, self.file_id);
        let nav_info = match self.analysis().goto_type_definition(pos) {
            Ok(Some(nav_info)) => nav_info,
            _ => return JsValue::NULL,
        };

        let res = to_proto::location_links(nav_info, &line_index);
        serde_wasm_bindgen::to_value(&res).unwrap()
    }

    /// Get document symbols.
    #[wasm_bindgen(js_name = documentSymbols)]
    pub fn document_symbols(&self) -> JsValue {
        let line_index = self.line_index();

        let struct_nodes = match self.analysis().file_structure(self.file_id) {
            Ok(struct_nodes) => struct_nodes,
            _ => return JsValue::NULL,
        };

        let mut parents = Vec::new();
        for symbol in struct_nodes {
            let doc_symbol = return_types::DocumentSymbol {
                name: symbol.label.clone(),
                detail: symbol.detail.unwrap_or(symbol.label),
                kind: to_proto::symbol_kind(symbol.kind),
                range: to_proto::text_range(symbol.node_range, &line_index),
                children: None,
                tags: [if symbol.deprecated {
                    return_types::SymbolTag::Deprecated
                } else {
                    return_types::SymbolTag::None
                }],
                container_name: None,
                selection_range: to_proto::text_range(symbol.navigation_range, &line_index),
            };
            parents.push((doc_symbol, symbol.parent));
        }

        let mut res = Vec::new();
        while let Some((node, parent)) = parents.pop() {
            match parent {
                None => res.push(node),
                Some(i) => {
                    let children = &mut parents[i].0.children;
                    if children.is_none() {
                        *children = Some(Vec::new());
                    }
                    children.as_mut().unwrap().push(node);
                }
            }
        }

        serde_wasm_bindgen::to_value(&res).unwrap()
    }

    /// Get type formatting.
    #[wasm_bindgen(js_name = typeFormatting)]
    pub fn type_formatting(&self, line_number: u32, column: u32, ch: char) -> JsValue {
        let line_index = self.line_index();

        let mut pos = get_file_position(line_number, column, &line_index, self.file_id);
        pos.offset -= TextSize::of('.');

        let edit = self.analysis().on_char_typed(pos, ch);

        let (_file, edit) = match edit {
            Ok(Some(it)) => it.source_file_edits.into_iter().next().unwrap(),
            _ => return JsValue::NULL,
        };

        let change = to_proto::text_edits(edit, &line_index);
        serde_wasm_bindgen::to_value(&change).unwrap()
    }

    /// Get folding ranges.
    #[wasm_bindgen(js_name = foldingRanges)]
    pub fn folding_ranges(&self) -> JsValue {
        let line_index = self.line_index();

        if let Ok(folds) = self.analysis().folding_ranges(self.file_id) {
            let res = folds
                .into_iter()
                .map(|fold| to_proto::folding_range(fold, &line_index))
                .collect::<Vec<_>>();
            serde_wasm_bindgen::to_value(&res).unwrap()
        } else {
            JsValue::NULL
        }
    }

    /// Get go to implementation info.
    #[wasm_bindgen(js_name = goToImplementation)]
    pub fn go_to_implementation(&self, line_number: u32, column: u32) -> JsValue {
        let line_index = self.line_index();

        let pos = get_file_position(line_number, column, &line_index, self.file_id);
        let nav_info = match self.analysis().goto_implementation(pos) {
            Ok(Some(it)) => it,
            _ => return JsValue::NULL,
        };
        let res = to_proto::location_links(nav_info, &line_index);
        serde_wasm_bindgen::to_value(&res).unwrap()
    }
}

impl WorldState {
    /// Default local file id.
    fn default_file_id() -> FileId {
        FileId(0)
    }

    /// Default local crate id.
    fn default_crate_id() -> CrateId {
        CrateId(0)
    }

    /// Get the current analysis.
    fn analysis(&self) -> Analysis {
        self.host.analysis()
    }

    /// Get the current line index.
    fn line_index(&self) -> Arc<LineIndex> {
        self.analysis().file_line_index(self.file_id).unwrap()
    }

    /// Get the last file id.
    fn last_file_id(&self) -> FileId {
        FileId(
            self.source_roots
                .iter()
                .flat_map(|root| root.iter().map(|file_id| file_id.0))
                .max()
                .unwrap_or_default(),
        )
    }

    /// Get the next file id.
    fn next_file_id(&self) -> FileId {
        FileId(self.last_file_id().0 + 1)
    }

    /// Get the file id from the given path.
    fn file_id_from_path(&self, path: &VfsPath) -> Option<FileId> {
        if self.source_roots.len() == 0 {
            return Some(Self::default_file_id());
        }

        self.source_roots
            .iter()
            .filter_map(|root| root.file_for_path(path))
            .next()
            .map(|file_id| *file_id)
    }

    /// Add crate root based on the manifest file.
    fn add_crate(&mut self, file_id: FileId, manifest: &Manifest) -> CrateId {
        self.crate_graph.add_crate_root(
            file_id,
            match manifest.package().edition.get() {
                Ok(edition) => match edition {
                    cargo_toml::Edition::E2015 => Edition::Edition2015,
                    cargo_toml::Edition::E2018 => Edition::Edition2021,
                    cargo_toml::Edition::E2021 => Edition::Edition2021,
                },
                Err(_) => Edition::Edition2021,
            },
            Some(CrateDisplayName::from_canonical_name(
                manifest.package().name.to_owned(),
            )),
            manifest
                .package()
                .version
                .get()
                .map(|version| version.to_owned())
                .ok(),
            {
                let mut cfg = CfgOptions::default();
                cfg.insert_atom("unix".into());
                cfg.insert_key_value("target_arch".into(), "x86_64".into());
                cfg.insert_key_value("target_pointer_width".into(), "64".into());
                cfg
            },
            Default::default(),
            Env::default(),
            vec![],
            CrateOrigin::default(),
        )
    }

    /// Add crate root from its name.
    fn add_crate_from_name<D: Display>(&mut self, file_id: FileId, name: D) -> CrateId {
        self.add_crate(
            file_id,
            Manifest::from_str(&format!(
                r#"
[package]
name = "{name}"
version = "0.0.0"
"#
            ))
            .as_ref()
            .unwrap(),
        )
    }
}
