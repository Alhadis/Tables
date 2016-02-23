#!/usr/local/bin/node --es_staging
"use strict";


const fs = require("fs");
let data = fs.readFileSync("list.tsv")
	.toString()
	.split(/\n+/g)
	.filter(e => e)
	.map(e => e.replace(/\\n/g, "\n").split(/\t/g));


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
	let maxLengths    = [];
	let numColumns    = 0;
	for(let row of values){
		
		/** Record the maximum number of columns in case cell-count is inconsistent */
		let l = row.length;
		if(l > numColumns)
			numColumns = l;
		
		for(let i = 0; i < l; ++i){
			let cell = row[i];
			maxLengths[i] = Math.max(cell.length, maxLengths[i] || 0);
		}
	}
	
	/** Ascertain the minimum width required to fit the whole table */
	const minWidth       = maxLengths.reduce((a, b) => a + b + padding);
	
	/** If a desired width was specified, calculate a multiplier */
	const sizeModifier   = width ? (width / minWidth) : 1;
	

	/** Number of extra rows inserted to contain a multi-line value */
	let buffer = 0;
	
	/** Start spitting out rows */
	let s = "";
	for(let r = 0, rowCount = values.length; r < rowCount; ++r){
		let row = values[r];
		
		for(let i = 0, l = row.length; i < l; ++i){
			let text = row[i] || "";
			
			
			/** This cell's content contains line-breaks */
			if(/\n/.test(text)){
				const lines   = text.split(/\n/g);
				let numLines  = lines.length;
				let injectOffset = 1;				
				
				/** Replace the original cell's content with the first line, and remove it from the lines to be inserted */
				text = lines.shift();
				--numLines;
				
				
				/** Do we need more space? */
				if(numLines > buffer){
					const newRows = [];
					const diff    = numLines - buffer;
					
					/** Create new rows of blank cells */
					for(let L = 0; L < diff; ++L)
						newRows.push(Array(numColumns));
					
					/** Inject them between the rest of our rows */
					values.splice.apply(values, [r + injectOffset + buffer, 0, ...newRows]);
					rowCount = values.length;
					buffer   = numLines;
				}
				
				
				/** Inject each split line into the extra/empty rows below */
				for(let L = 0; L < numLines; ++L){
					values[r + L + 1][i] = lines[L];
				}
			}
			
			
			/** Add the cell to the output string */
			s +=
				" ".repeat(paddingLeft) +
				text +
				" ".repeat(((paddingRight + maxLengths[i]) * sizeModifier) - text.length);
		}
		
		s += "\n";
		
		/** Decree the rowBuffer count */
		buffer && --buffer;
	}
	
	return s;
}
