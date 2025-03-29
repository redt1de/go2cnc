#!/bin/bash

pth=${1}


echo "Directory Structure:"
echo '```'
tree -I '*.sum|*.mod|*.sh|*.md|_*' ${pth}

echo '```'

for file in $(find . -type f|grep -vE '.sum|.mod|.sh|.md|/_' ); do
    echo -e "\n\n"
    echo "File: ${file}"
    echo '```'
    cat ${file}
    echo '```'
    echo -e "\n\n"
done