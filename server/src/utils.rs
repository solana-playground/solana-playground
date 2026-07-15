use std::ops::{Deref, DerefMut};

use serde::{Deserialize, Serialize};

/// A vector of [`FileEntry`]
#[derive(Debug, Deserialize, Serialize)]
#[serde(transparent)]
pub struct Files(Vec<FileEntry>);

/// (Path, Content)
type FileEntry = (String, String);

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
