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
	borderChars: borderChars.replace(/\n+/g, "").split(""),
	
	_beforeCell: (row, column, rowData) => {
		return column % 2
			? "\x1B[48;5;22m" /* Odd:  Green */
			: "\x1B[48;5;4m"  /* Even: Blue  */
	},
	beforeCell: (row, column, rowData) => {
		return column % 2
			? "\x1B[38;5;10m"
			: "\x1B[38;5;6m"
	},
	afterCell: (row, column, rowData) => {
		return "\x1B[39m";
	},
	_afterCell:  (row, column, rowData) => {
		return "\x1B[0m";
	}
});

console.log(str);


/** Print a string with a coloured background */
function puts(s){
	console.log("\x1B[48;5;27m" + s + "\x1B[0m", "\n");
}
