#!/usr/local/bin/node --es_staging
"use strict";

global.puts = puts;
const table = require("./tables.js");
const fs    = require("fs");
let data    = fs.readFileSync("list.tsv")
	.toString()
	.split(/\n+/g)
	.filter(e => e)
	.map(e => e.replace(/\\n/g, "\n").split(/\t/g));



const borderChars = fs
	.readFileSync("border-demo.txt")
	.toString()
	.replace(/\n+$/, "");

let str = table(data, {
	width: process.stdout.columns,
	borders: true,
	keepEmptyBorders: false,
	borderChars: borderChars.replace(/\n+/g, "").split("")
});

console.log(str);


/** Print a string with a coloured background */
function puts(s){
	console.log("\x1B[48;5;27m" + s + "\x1B[0m", "\n");
}