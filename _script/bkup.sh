#!/bin/bash
comment="$(echo ${1}|sed 's/ /_/g')"
store="./_bak"
if [ ! -d $store ]; then
    mkdir $store
fi
ts="$(date +"%m.%d.%y_%H%M")"
npart="$ts"
if [ ! -z "${comment}" ]; then
    npart="${ts}${comment}"
fi

zip -r "${store}/grbltest.$npart.zip" "./" -x "_bak"


