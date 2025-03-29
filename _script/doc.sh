#!/bin/bash

# Usage: ./split_names.sh "RunView,FileBrowser,OtherComponent"

IFS=',' read -ra NAMES <<< "$1"

for name in "${NAMES[@]}"; do
    for pth in $(find . -type f -name "*$name*"); do
    short=$(echo "${pth}" | sed 's/\.\/frontend\/src\///g')
        echo "${short}:"
        echo '```'
        cat "${pth}"
        echo '```'
        echo -e "\n\n"
    done
    
done


