#!/bin/bash

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
source "$SCRIPT_DIR/try-catch.sh"

export packagePath="${PWD}"
export package="${PWD##*/}"

try
(
    set -e

    echo "Cleaning dist folder"
    rm -rf $packagePath/dist/*

    echo "Building package: $package"

    echo "Building bundles"
    webpack --config ../../webpack.config.js --env packagePath=$packagePath
    echo "Bundles build"

    echo "Building declaration file"
    dts-bundle-generator --config ../../scripts/dts-bundler.config.js
    echo "Declarations done"

    echo "Building esm"
    node ../../scripts/esbuild
    echo "Esm is done"
)
catch || {
    rm -rf $packagePath/dist/*
    echo "Removed dist files"
    echo "Package $package build failed!"
    exit 1
}

echo "Package $package build successful"
exit 0;
