#!/usr/bin/env bash

# Build package(s)

# Exit on any failure
set -e

help() {
    echo "Usage: build.sh [OPTIONS] <PACKAGE>

<PACKAGE>: Optional WASM package name. Builds all packages if not specified.

OPTIONS:
    -h, --help: Print help information
    -u, --update: Update client dependency
"

    exit 0
}

if [ "$1" = "--help" ]; then
    help
fi

args=()

while [[ $# -gt 0 ]]; do
    case $1 in
    -u | --update)
        update=true
        shift
        ;;
    -*)
        echo "Unknown option '$1'"
        exit 1
        ;;
    *)
        args+=("$1")
        shift
        ;;
    esac
done

# All package names
all_packages=(
    "anchor-cli"
    "rust-analyzer"
    "seahorse-compile"
    "solana-cli"
    "spl-token-cli"
    "sugar-cli"
)
vscode_packages=(${all_packages[2]})

# Get script directory (which is wasm/), and root directory (which is one level higher).
# This allows the script to be run from any directory.
wasm_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
root_dir=$(dirname "$wasm_dir")

build() {
    local package="$1"
    echo "Building '$package'..."

    package_dir="$wasm_dir/$package"

    # Check whether the package directory exists
    if [ ! -d "$package_dir" ]; then
        echo "Error: no package named '$package' found in wasm/"
        echo "Valid packages: ${packages[@]}"
        exit 1
    fi

    pushd $package_dir

    # Set the toolchain based on the `rust-toolchain.toml` file
    if [ -f "rust-toolchain.toml" ]; then
        echo "Installing rust toolchain"
        toolchain=$(awk '/"[stable|nightly]/{gsub(/"/, ""); print $3 }' rust-toolchain.toml)
        rustup toolchain install $toolchain --component rust-src
    fi

    # Rust Analyzer requires `--target web`
    if [ "$package" = "rust-analyzer" ]; then
        wasm-pack build --target web
    else
         wasm-pack build

        # Handle a WASM bug from `solana_sdk::instruction::SystemInstruction`
        package_name=$(
            awk "/^name/" Cargo.toml |
                cut -d "\"" -f 2 |
                sed "s/-/_/g"
        )

        # Comment out the following line
        line="wasm.__wbg_systeminstruction_free(ptr);"

        if [[ "$(uname)" == "Darwin" ]]; then
            sed -i '' "s/$line/\/\/$line/" "pkg/${package_name}_bg.js"
        else
            sed -i "s/$line/\/\/$line/" "pkg/${package_name}_bg.js"
        fi
    fi

    popd
}

if [ ${#args[@]} -ne 0 ]; then
    packages="${args[@]}"
else
    packages="${all_packages[@]}"
fi

# Build and update client packages
client_package_names=""

for package in $packages; do
    build $package
    client_package_names="${client_package_names}@solana-playground/$package "
done

# Exit early if `--update` is not specified
if [ "$update" != true ]; then
    exit 0
fi

# Update client packages
echo "Updating client packages: $client_package_names"
cd $root_dir/client && yarn install --frozen-lockfile && yarn upgrade $client_package_names

# Update vscode packages
vscode_package_names=""

for package in "${vscode_packages[@]}"; do
    vscode_package_names="${vscode_package_names}@solana-playground/$package "
done

echo "Updating VSCode packages: $vscode_package_names"
cd $root_dir/vscode && yarn install --frozen-lockfile && yarn upgrade $vscode_package_names
