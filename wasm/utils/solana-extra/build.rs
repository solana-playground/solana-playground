extern crate rustc_version;
use rustc_version::{version_meta, Channel};

fn main() {
    // Copied and adapted from
    // https://github.com/Kimundi/rustc-version-rs/blob/1d692a965f4e48a8cb72e82cda953107c0d22f47/README.md#example
    // Licensed under Apache-2.0 + MIT
    match version_meta().unwrap().channel {
        Channel::Nightly | Channel::Dev => {
            println!("cargo:rustc-cfg=NIGHTLY");
        }
        _ => {}
    }
}
