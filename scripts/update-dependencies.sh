#!/bin/bash
set -e

onlyUpdate="false"
if [ "$1" == "only-update" ]; then
    onlyUpdate="true"
fi

echo -e "\n"
echo "Checking dependencies"
echo -e "\n"

if npx npm-check-updates --configFilePath ./scripts --configFileName npm-check-updates-rc.json --dep prod,dev,peer,bundle,optional --deep --errorLevel 2; then
    echo -e "\n"
    echo "No dependency updates found"
    echo -e "\n"

    exit 0
else
    echo -e "\n"
    echo "Depency updates found"
    echo -e "\n"
fi

echo -e "\n"
echo "Updating all dependency versions"
echo -e "\n"

if npx npm-check-updates --configFilePath ./scripts --configFileName npm-check-updates-rc.json --dep prod,dev,peer,bundle,optional --deep -u; then
    echo -e "\n"
    echo "Updated all package.json's"
    echo -e "\n"

    echo -e "\n"
    echo "Updating package-lock.json"
    echo -e "\n"

    npm i --package-lock-only

    echo -e "\n"
    echo "Updated package-lock.json"
    echo -e "\n"
else
    echo -e "\n"
    echo "Failed"
    echo -e "\n"

    exit 1
fi

if [ "$onlyUpdate" == "true" ]; then
    exit 0
fi

echo -e "\n"
echo "Installing all dependencies"
echo -e "\n"

if npm run bootstrap; then
    echo -e "\n"
    echo "Installed new dependencies versions"
    echo -e "\n"
else
    echo -e "\n"
    echo "Failed"
    echo -e "\n"

    exit 1
fi

echo -e "\n"
echo "Running tests"
echo -e "\n"

if npm run test; then
    echo -e "\n"
    echo "All tests successful"
    echo -e "\n"
else
    echo -e "\n"
    echo "Failed"
    echo -e "\n"

    exit 1
fi
