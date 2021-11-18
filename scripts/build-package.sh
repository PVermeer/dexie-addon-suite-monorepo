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

    echo "Building esm witch tsc"
    tsc --build
    echo "Esm is done"

    # Tsc doesn't rewrite import and since outDir is specified with composite referenced project
    # the common package is not build in the correct location for each package. So copy it here
    # to the right location. Every tsconfig of the packages should reference it.
    echo "Copying common package"
    cp -r $packagePath/../common/dist/esm $packagePath/dist
    echo "Copy done"

)
catch || {
    rm -rf $packagePath/dist/*
    echo "Package $package build failed!"
    exit 1
}

echo "Package $package build successful"
exit 0;
