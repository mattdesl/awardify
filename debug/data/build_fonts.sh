#!/bin/bash

#build all TTF files using 64pt and CommonJS output
mkdir -p sotd/fonts/out

SAVEIFS=$IFS
#why is bash so bloody cryptic
IFS=$(echo -en "\n\b")

for i in `find sotd/fonts -type f | egrep '\.(ttf|otf|woff)$'`; 
do
	s=$i;
	s=${s##*/};
	echo -n "$s: "; 
	# s=${s%.*};
	# you may want to change the font size here!
	fontpath "$i" -o "sotd/fonts/out/$s.json" -s 200; 
done

IFS=$SAVEIFS