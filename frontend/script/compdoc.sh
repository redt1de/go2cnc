#!/bin/bash

nme=${1}




j="src/components/${nme}.jsx"
echo "${j}:"
echo '```'
cat ${j}
echo '```'
echo -e "\n\n"

c="src/components/css/${nme}.module.css"
echo "${c}:"
echo '```'
cat ${c}
echo '```'
echo -e "\n\n"