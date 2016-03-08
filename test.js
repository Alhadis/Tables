#!/usr/local/bin/node --es_staging
"use strict";

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
	borderChars: borderChars
});

console.log(str);
