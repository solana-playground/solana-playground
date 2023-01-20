// Project structure:
// ./playnet -> Starting point. Lifecycle starts when a Playnet instance gets created.
// ./runtime -> Where all internal logic for Playnet runtime lives.
// ./rpc     -> Methods for clients to interact with the Playnet.

mod playnet;
mod rpc;
mod runtime;
mod serde;
mod types;
mod utils;

#[cfg(test)]
pub mod test_programs;
