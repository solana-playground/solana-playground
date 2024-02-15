use {
    crate::program::spl_token_2022::extension::{Extension, ExtensionType},
    bytemuck::{Pod, Zeroable},
};

/// Indicates that the tokens from this mint can't be transferred
#[derive(Clone, Copy, Debug, Default, PartialEq, Pod, Zeroable)]
#[repr(transparent)]
pub struct NonTransferable;

impl Extension for NonTransferable {
    const TYPE: ExtensionType = ExtensionType::NonTransferable;
}
