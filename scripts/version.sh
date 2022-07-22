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

    echo -e "\n"
    echo "Setting pre-release version for $branch"
    echo -e "\n"

    if lerna version --preid=$branch --conventional-commits --conventional-prerelease --no-private --yes; then
        echo -e "\n"
        echo "Packages release on $branch"
        echo -e "\n"
    else
        echo -e "\n"
        echo "Failed versioning of packages:"
        echo -e "\n"
        cat ./lerna-debug.log
        echo -e "\n"

        exit 1
    fi

else

    echo -e "\n"
    echo "Setting version for production"
    echo -e "\n"
    echo "Graduating packages"
    echo -e "\n"

    if lerna version --conventional-commits --conventional-graduate --create-release github --no-private --yes; then
        echo -e "\n"
        echo "Graduated packages"
        echo -e "\n"
    else
        echo -e "\n"
        echo "Whoops, could not graduate packages let's try a first release of packages"
        echo -e "\n"

        if lerna version --conventional-commits --create-release github --no-private --yes; then
            echo -e "\n"
            echo "Versioned packages as first release"
            echo -e "\n"
        else
            echo -e "\n"
            echo "Failed versioning of packages:"
            echo -e "\n"
            cat ./lerna-debug.log
            echo -e "\n"

            exit 1
        fi
    fi

fi
