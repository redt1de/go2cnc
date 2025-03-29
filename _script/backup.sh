#!/bin/bash


IFS=',' read -ra NAMES <<< "$1"

for name in "${NAMES[@]}"; do
    for pth in $(find . -type f -name "*$name*"); do
        cp ${pth} _backups/
    done
    
done


