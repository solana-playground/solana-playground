use clap::{Arg, ArgGroup, Command};

pub trait ConfigSubCommands {
    fn config_subcommands(self) -> Self;
}

impl ConfigSubCommands for Command<'_> {
    fn config_subcommands(self) -> Self {
        self.subcommand(
            Command::new("config")
                .about("Solana command-line tool configuration settings")
                .aliases(&["get", "set"])
                .subcommand_required(true)
                .arg_required_else_help(true)
                .subcommand(
                    Command::new("get")
                        .about("Get current config settings")
                        .arg(
                            Arg::new("specific_setting")
                                .index(1)
                                .value_name("CONFIG_FIELD")
                                .takes_value(true)
                                .possible_values([
                                    "json_rpc_url",
                                    "websocket_url",
                                    // "keypair",
                                    "commitment",
                                ])
                                .help("Return a specific config setting"),
                        ),
                )
                .subcommand(
                    Command::new("set").about("Set a config setting").group(
                        ArgGroup::new("config_settings")
                            .args(&[
                                "json_rpc_url",
                                "websocket_url",
                                // "keypair",
                                "commitment",
                            ])
                            .multiple(true), // NOTE: .required is panicking clap when there is no argument
                                             // .required(true),
                    ),
                ), // .subcommand(
                   //     Command::new("import-address-labels")
                   //         .about("Import a list of address labels")
                   //         .arg(
                   //             Arg::new("filename")
                   //                 .index(1)
                   //                 .value_name("FILENAME")
                   //                 .takes_value(true)
                   //                 .help("YAML file of address labels"),
                   //         ),
                   // )
                   // .subcommand(
                   //     Command::new("export-address-labels")
                   //         .about("Export the current address labels")
                   //         .arg(
                   //             Arg::new("filename")
                   //                 .index(1)
                   //                 .value_name("FILENAME")
                   //                 .takes_value(true)
                   //                 .help("YAML file to receive the current address labels"),
                   //         ),
                   // ),
        )
    }
}
