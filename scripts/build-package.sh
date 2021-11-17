#!/bin/bash

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
source "$SCRIPT_DIR/try-catch.sh"

export packagePath="${PWD}"
export package="${PWD##*/}"

try
(
    set -e

    echo "Cleaning dist folder"
    rm -rf ../../dist/$package

    echo "Building package: $package"

    echo "Building bundles"
    webpack --config ../../webpack.config.js --env packagePath=$packagePath
    echo "Bundles build"

    echo "Building declaration file"
    dts-bundle-generator --config ../../scripts/dts-bundler.config.js
    echo "Declarations done"

    echo "Building esm witch tsc"
    tsc --build
    echo "Esm is done"

    echo "Package $package build successful"
)
catch || {
    rm -rf ../../dist/$package
    exit 1
}

exit 0;
