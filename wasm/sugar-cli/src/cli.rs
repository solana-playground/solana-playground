use clap::{Parser, Subcommand};

#[derive(Parser)]
#[clap(version, about)]
pub struct Cli {
    #[clap(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand)]
pub enum Commands {
    /// Interact with the bundlr network
    Bundlr {
        /// RPC Url
        #[clap(short, long)]
        rpc_url: Option<String>,

        #[clap(subcommand)]
        action: BundlrAction,
    },

    /// Manage the collection on the candy machine
    Collection {
        #[clap(subcommand)]
        command: CollectionSubcommands,
    },

    /// Interactive process to create the config file
    CreateConfig {
        /// RPC Url
        #[clap(short, long)]
        rpc_url: Option<String>,
    },

    /// Deploy cache items into candy machine config on-chain
    Deploy {
        /// RPC Url
        #[clap(short, long)]
        rpc_url: Option<String>,
    },

    /// Manage guards on the candy machine
    Guard {
        #[clap(subcommand)]
        command: GuardCommand,
    },

    /// Generate hash of cache file for hidden settings.
    Hash {
        /// Compare a provided hash with a cache file to check integrity.
        #[clap(long)]
        compare: Option<String>,
    },

    /// Create a candy machine deployment from assets
    Launch {
        /// RPC Url
        #[clap(short, long)]
        rpc_url: Option<String>,

        /// Strict mode: validate against JSON metadata standard exactly
        #[clap(long)]
        strict: bool,

        /// Skip collection validate prompt
        #[clap(long)]
        skip_collection_prompt: bool,
    },

    /// Mint one NFT from candy machine
    Mint {
        /// RPC Url
        #[clap(short, long)]
        rpc_url: Option<String>,

        /// Amount of NFTs to be minted in bulk
        #[clap(short, long)]
        number: Option<u64>,

        /// Public key of the receiver of the minted NFT, defaults to keypair
        #[clap(long)]
        receiver: Option<String>,

        /// Address of candy machine to mint from.
        #[clap(long)]
        candy_machine: Option<String>,
    },

    /// Reveal the NFTs from a hidden settings candy machine
    Reveal {
        /// RPC Url
        #[clap(short, long)]
        rpc_url: Option<String>,
    },

    /// Show the on-chain config of an existing candy machine
    Show {
        /// RPC Url
        #[clap(short, long)]
        rpc_url: Option<String>,

        /// Address of candy machine
        candy_machine: Option<String>,

        /// Display a list of unminted indices
        #[clap(long)]
        unminted: bool,
    },

    /// Sign one or all NFTs from candy machine
    Sign {
        /// RPC Url
        #[clap(short, long)]
        rpc_url: Option<String>,

        /// Mint id for single NFT to be signed
        #[clap(short, long)]
        mint: Option<String>,

        /// Candy machine id.
        #[clap(long)]
        candy_machine_id: Option<String>,
    },

    /// Update the candy machine config on-chain
    Update {
        /// RPC Url
        #[clap(short, long)]
        rpc_url: Option<String>,

        /// Pubkey for the new authority
        #[clap(short, long)]
        new_authority: Option<String>,

        /// Address of candy machine to update.
        #[clap(long)]
        candy_machine: Option<String>,
    },

    /// Upload assets to storage and creates the cache config
    Upload {
        /// RPC Url
        #[clap(short, long)]
        rpc_url: Option<String>,
    },

    /// Validate JSON metadata files
    Validate {
        /// Strict mode: validate against JSON metadata standard exactly
        #[clap(long)]
        strict: bool,

        /// Skip collection prompt
        #[clap(long)]
        skip_collection_prompt: bool,
    },

    /// Verify uploaded data
    Verify {
        /// RPC Url
        #[clap(short, long)]
        rpc_url: Option<String>,
    },

    /// Withdraw funds from candy machine account by closing it
    Withdraw {
        /// Address of candy machine to withdraw funds from.
        #[clap(long)]
        candy_machine: Option<String>,

        /// RPC Url
        #[clap(short, long)]
        rpc_url: Option<String>,

        /// List available candy machines, no withdraw performed
        #[clap(long)]
        list: bool,
    },
}

#[derive(Subcommand)]
pub enum BundlrAction {
    /// Retrieve the balance on bundlr
    Balance,
    /// Withdraw funds from bundlr
    Withdraw,
}

#[derive(Subcommand)]
pub enum CollectionSubcommands {
    /// Set the collection mint on the candy machine
    Set {
        /// RPC Url
        #[clap(short, long)]
        rpc_url: Option<String>,

        /// Address of candy machine to update.
        #[clap(long)]
        candy_machine: Option<String>,

        /// Address of collection mint to set the candy machine to.
        collection_mint: String,
    },
}

#[derive(Subcommand)]
pub enum GuardCommand {
    /// Add a candy guard on a candy machine
    Add {
        /// RPC Url
        #[clap(short, long)]
        rpc_url: Option<String>,

        /// Address of the candy machine.
        #[clap(long)]
        candy_machine: Option<String>,

        /// Address of the candy guard.
        #[clap(long)]
        candy_guard: Option<String>,
    },
    /// Remove a candy guard from a candy machine
    Remove {
        /// RPC Url
        #[clap(short, long)]
        rpc_url: Option<String>,

        /// Address of the candy machine.
        #[clap(long)]
        candy_machine: Option<String>,

        /// Address of the candy guard.
        #[clap(long)]
        candy_guard: Option<String>,
    },
    /// Show the on-chain config of an existing candy guard
    Show {
        /// RPC Url
        #[clap(short, long)]
        rpc_url: Option<String>,

        /// Address of the candy guard.
        #[clap(long)]
        candy_guard: Option<String>,
    },
    /// Update the configuration of a candy guard
    Update {
        /// RPC Url
        #[clap(short, long)]
        rpc_url: Option<String>,

        /// Address of the candy guard.
        #[clap(long)]
        candy_guard: Option<String>,
    },
    /// Withdraw funds from a candy guard account closing it
    Withdraw {
        /// RPC Url
        #[clap(short, long)]
        rpc_url: Option<String>,

        /// Address of the candy guard.
        #[clap(long)]
        candy_guard: Option<String>,
    },
}
