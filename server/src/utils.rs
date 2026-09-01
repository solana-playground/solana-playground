use std::{
    fmt,
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

/// Image name (tag) prefix
const IMAGE_PREFIX: &str = concat!(env!("CARGO_PKG_NAME"), "-sandbox");

/// Get sandboxed image name.
pub fn get_image_name(name: impl fmt::Display) -> String {
    format!("{IMAGE_PREFIX}-{name}")
}
