#!/bin/bash

nme=${1}




j="src/views/${nme}.jsx"
echo "${j}:"
echo '```'
cat ${j}
echo '```'
echo -e "\n\n"

c="src/views/css/${nme}.module.css"
echo "${c}:"
echo '```'
cat ${c}
echo '```'
echo -e "\n\n"