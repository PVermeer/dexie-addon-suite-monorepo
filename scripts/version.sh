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

    lerna version --preid=$branch --conventional-commits --conventional-prerelease --no-private --yes

else

    lerna version --conventional-commits --conventional-graduate --create-release github --no-private --yes

fi
