#!/usr/bin/env bash

# updates a single wasm package, by building it and updating the code in pkgs/

if [ $# -eq 0 ]; then
  echo "Usage: update.sh [package] [update-vscode]"
  exit 1
fi

PACKAGE=$1
VSCODE=$2

# get script directory (which is wasm/), and root directory (which is one level higher)
# this allows the script to be run from any directory
WASM_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
ROOT_DIR="$(dirname "$WASM_DIR")"

PACKAGE_DIR="$WASM_DIR/$PACKAGE"

# check package dir exists
if ! test -d "$PACKAGE_DIR"; then
  echo "Error: no package $PACKAGE found in wasm/"
  echo "Valid packages:"
  ls "$WASM_DIR/pkgs"
  exit 1
fi

pushd $PACKAGE_DIR
wasm-pack build

# copy all built files except .gitignore into wasm/pkgs/$PACKAGE
find ./pkg -type f -not -name '.gitignore' -exec cp {} ../pkgs/$PACKAGE \;

# update the client's local dependency of this package
(cd $ROOT_DIR/client && yarn upgrade file:../wasm/pkgs/$PACKAGE)

# update the vscode extension's local dependency of this package if specified
if [ -n "$VSCODE" ]; then
  (cd $ROOT_DIR/vscode && yarn upgrade file:../wasm/pkgs/$PACKAGE)
fi

# return to original working directory
popd
