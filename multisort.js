#!/usr/local/bin/node --es_staging
"use strict";


const fs = require("fs");
let data = fs.readFileSync("list.tsv")
	.toString()
	.split(/\n+/g)
	.filter(e => e)
	.map(e => e.split(/\t/g));


let str = table(data, {
	width: process.stdout.columns
});
console.log(str);



function table(values, options){
	options           = options || {};
	
	let headers       = options.headers;
	let headerDivider = options.headerDivider || " ";
	let paddingLeft   = options.paddingLeft   || 1;
	let paddingRight  = options.paddingRight  || 1;
	let padding       = paddingLeft + paddingRight;
	let width         = options.width;
	
	
	/** Determine the maximum size of each column */
	let maxLengths = [];
	for(let row of values){
		
		for(let i = 0, l = row.length; i < l; ++i){
			let cell = row[i];
			maxLengths[i] = Math.max(cell.length, maxLengths[i] || 0);
		}
	}
	
	/** Ascertain the minimum width required to fit the whole table */
	let minWidth = maxLengths.reduce((a, b) => a + b + padding);
	
	/** If a desired width was specified, calculate a multiplier */
	let sizeModifier = width ? (width / minWidth) : 1;
	
	
	/** Start spitting out rows */
	let s = "";
	for(let row of values){
		
		for(let i = 0, l = row.length; i < l; ++i){
			let cell = row[i];
			s += " ".repeat(paddingLeft) + cell + " ".repeat(((paddingRight + maxLengths[i]) * sizeModifier) - cell.length);
		}
		s += "\n";
	}
	
	return s;
}
