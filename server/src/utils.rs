use std::{
    ops::{Deref, DerefMut},
    path::PathBuf,
};

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};

/// A vector of [`FileEntry`]
#[derive(Debug, Default, Deserialize, Serialize)]
#[serde(transparent)]
pub struct Files(Vec<FileEntry>);

/// (Path, Content)
type FileEntry = (String, String);

impl TryFrom<Vec<(PathBuf, String)>> for Files {
    type Error = anyhow::Error;
    fn try_from(value: Vec<(PathBuf, String)>) -> Result<Self, Self::Error> {
        value
            .into_iter()
            .map(|(path, content)| {
                let path = path
                    .to_str()
                    .ok_or_else(|| anyhow!("Invalid path: {path:?}"))?
                    .to_owned();
                Ok((path, content))
            })
            .collect()
    }
}

impl Deref for Files {
    type Target = Vec<FileEntry>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for Files {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

impl IntoIterator for Files {
    type Item = FileEntry;
    type IntoIter = std::vec::IntoIter<FileEntry>;

    fn into_iter(self) -> Self::IntoIter {
        self.0.into_iter()
    }
}

impl<'a> IntoIterator for &'a Files {
    type Item = &'a FileEntry;
    type IntoIter = std::slice::Iter<'a, FileEntry>;

    fn into_iter(self) -> Self::IntoIter {
        self.0.iter()
    }
}

impl FromIterator<FileEntry> for Files {
    fn from_iter<T: IntoIterator<Item = FileEntry>>(iter: T) -> Self {
        let mut files = Files(vec![]);
        for file in iter {
            files.push(file);
        }
        files
    }
}

impl Extend<FileEntry> for Files {
    fn extend<T: IntoIterator<Item = FileEntry>>(&mut self, iter: T) {
        self.0.extend(iter);
    }
}

/// Remove space-based indentations.
pub fn dedent<S: AsRef<str>>(input: S) -> String {
    let lines = input.as_ref().lines().collect::<Vec<_>>();
    let common_indent = lines
        .iter()
        .filter(|line| !line.trim().is_empty())
        .map(|line| line.len() - line.trim_start_matches(' ').len())
        .min()
        .unwrap_or_default();

    lines.iter().fold(String::new(), |mut acc, line| {
        if !line.trim().is_empty() {
            acc.push_str(&line[common_indent..]);
        }

        acc.push('\n');
        acc
    })
}
