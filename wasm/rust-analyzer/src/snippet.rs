use ide::{Snippet, SnippetScope};
use serde::Deserialize;

/// Get snippets from JSON string.
pub fn get_snippets_from_str(snippets: &str) -> Vec<Snippet> {
    serde_json::from_str::<serde_json::Value>(snippets)
        .unwrap()
        .as_object()
        .unwrap()
        .iter()
        .map(|(name, snippet)| {
            (
                name,
                serde_json::from_value::<SnippetDef>(snippet.to_owned()).unwrap(),
            )
        })
        .filter_map(|(name, snippet)| {
            Snippet::new(
                &snippet.prefix,
                &snippet.postfix,
                &snippet.body,
                snippet.description.as_ref().unwrap_or(name),
                &snippet.requires,
                match snippet.scope {
                    SnippetScopeDef::Expr => SnippetScope::Expr,
                    SnippetScopeDef::Type => SnippetScope::Type,
                    SnippetScopeDef::Item => SnippetScope::Item,
                },
            )
        })
        .collect::<Vec<_>>()
}

#[derive(Deserialize, Default)]
#[serde(default)]
struct SnippetDef {
    #[serde(deserialize_with = "single_or_array")]
    prefix: Vec<String>,
    #[serde(deserialize_with = "single_or_array")]
    postfix: Vec<String>,
    description: Option<String>,
    #[serde(deserialize_with = "single_or_array")]
    body: Vec<String>,
    #[serde(deserialize_with = "single_or_array")]
    requires: Vec<String>,
    scope: SnippetScopeDef,
}

#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
enum SnippetScopeDef {
    Expr,
    Item,
    Type,
}

impl Default for SnippetScopeDef {
    fn default() -> Self {
        SnippetScopeDef::Expr
    }
}

fn single_or_array<'de, D>(deserializer: D) -> Result<Vec<String>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    struct SingleOrVec;

    impl<'de> serde::de::Visitor<'de> for SingleOrVec {
        type Value = Vec<String>;

        fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
            formatter.write_str("string or array of strings")
        }

        fn visit_str<E>(self, value: &str) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            Ok(vec![value.to_owned()])
        }

        fn visit_seq<A>(self, seq: A) -> Result<Self::Value, A::Error>
        where
            A: serde::de::SeqAccess<'de>,
        {
            Deserialize::deserialize(serde::de::value::SeqAccessDeserializer::new(seq))
        }
    }

    deserializer.deserialize_any(SingleOrVec)
}
