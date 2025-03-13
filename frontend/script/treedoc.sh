#!/bin/bash

pth=${1}


echo "Directory Structure:"
echo '```'
tree ${pth}

echo '```'

for file in $(find ${pth} -type f); do
    echo -e "\n\n"
    echo "File: ${file}"
    echo '```'
    cat ${file}
    echo '```'
    echo -e "\n\n"
done