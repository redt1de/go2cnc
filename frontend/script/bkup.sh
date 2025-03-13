#!/bin/bash
comment="$(echo ${1}|sed 's/ /_/g')"
store="/home/redt1de/make/pendant-backups"
if [ ! -d $store ]; then
    mkdir $store
fi
ts="$(date +"%m.%d.%y_%H%M")"
npart="$ts"
if [ ! -z "${comment}" ]; then
    npart="${ts}${comment}"
fi

zip -r "${store}/pendant.$npart.zip" "/home/redt1de/make/pendant/"