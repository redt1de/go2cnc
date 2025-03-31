#!/bin/bash


IFS=',' read -ra NAMES <<< "$1"

for name in "${NAMES[@]}"; do
    for pth in $(grep -rw "package ${name}" *|cut -d: -f1); do
        echo "${pth}:"
        echo '```'
        cat "${pth}"
        echo '```'
        echo -e "\n\n"
    done
    
done


