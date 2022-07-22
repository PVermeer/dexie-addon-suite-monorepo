#!/bin/bash
set -e

# Set arguments
arguments=("branch")
hasNoValue=false

for ARGUMENT in "$@"; do
    KEY=$(echo $ARGUMENT | cut -f1 -d=)
    VALUE=$(echo ${ARGUMENT#*=})

    case "$KEY" in
    branch) branch=${VALUE} ;;
    *) ;;
    esac

    for i in ${!arguments[@]}; do
        if [ "${arguments[$i]}" == "$KEY" ]; then
            unset arguments[$i]
            if [ ! "$VALUE" ]; then
                echo "ERROR: No value for $KEY provided"
                hasNoValue=true
            fi
            break
        fi
    done
done

# -- Missing arguments check
missingArguments=false
for i in "${arguments[@]}"; do
    echo "ERROR: Missing argument: $i"
    missingArguments=true
done

if [ "$missingArguments" == "true" ] || [ "$hasNoValue" == "true" ]; then
    exit 1
fi

# -- Add release channel if not on master branch
if [ "$branch" != "master" ]; then

    lerna publish from-package --dist-tag=$branch --no-verify-access --yes

else

    lerna publish from-package --no-verify-access --yes

fi
