#!/usr/local/bin/node --es_staging
"use strict";


const fs = require("fs");
let data = fs.readFileSync("list.tsv")
	.toString()
	.split(/\n+/g)
	.filter(e => e)
	.map(e => e.replace(/\\n/g, "\n").split(/\t/g));


let str = table(data, {
	width: process.stdout.columns,
	borders: true
});
console.log(str);



function table(values, options){
	options              = options || {};

	let noHeaders        = options.noHeaders;
	let borders          = options.borders;
	let borderHeadStart  = options.borderHeadStart || "┏━┳┓";
	let borderHead       = options.borderHead      || "┃ ┃┃";
	let borderHeadEnd    = options.borderHeadEnd   || "┡━╇┩";
	let borderBodyStart  = options.borderBodyStart || "┌─┬┐"
	let borderBody       = options.borderBody      || "├─┼┤│";
	let borderBodyEnd    = options.borderBodyEnd   || "└─┴┘";
	let paddingLeft      = options.paddingLeft     || 1;
	let paddingRight     = options.paddingRight    || 1;
	let padding          = paddingLeft + paddingRight;
	let width            = options.width;
	
	
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
	const minWidth = maxLengths.reduce((a, b) => a + b + padding + (borders ? 1 : 0));
	
	/** If a desired width was specified, calculate a multiplier */
	const sizeModifier   = width ? (width / minWidth) : 1;
	

	/** Number of extra rows inserted to contain a multi-line value */
	let buffer = 0;
	
	
	/** Flag monitoring whether we're currently within the header row(s) */
	let inHeader = !noHeaders;
	
	
	
	let s = "";
	
	/** Add the top divider */
	if(borders){
		let chars = noHeaders ? "┌─┬┐" : "┏━┳┓";
		s += chars[0];
		for(let r = 0; r < numColumns; ++r)
			s += chars[1].repeat((padding + maxLengths[r]) * sizeModifier) + (r < numColumns - 1 ? chars[2] : chars[3]);
		s += "\n";
	}
	
	
	/** Start spitting out rows */
	for(let r = 0, rowCount = values.length; r < rowCount; ++r){
		let row = values[r];
		
		for(let i = 0; i < numColumns; ++i){
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
					for(let l = 0; l < diff; ++l)
						newRows.push(Array(numColumns));
					
					/** Inject them between the rest of our rows */
					values.splice.apply(values, [r + injectOffset + buffer, 0, ...newRows]);
					rowCount = values.length;
					buffer   = numLines;
				}
				
				
				/** Inject each split line into the extra/empty rows below */
				for(let L = 0; L < numLines; ++L)
					values[r + L + 1][i] = lines[L];
			}
			
			let leftBorder  = "";
			let rightBorder = "";
			
			/** We're displaying borders */
			if(borders){
				
				/** Left-edge/first cell */
				if(!i) leftBorder = inHeader ? "┃" : "│";
				
				
				/** Right-edge/last cell */
				if(i >= numColumns)
					rightBorder = inHeader ? "┃" : "│";
				
				/** Neither */
				else rightBorder = inHeader ? "┃" : "│";
			}
			
			
			/** Add the cell to the output string */
			s += leftBorder +
				" ".repeat(paddingLeft) +
				text +
				" ".repeat(((paddingRight + maxLengths[i]) * sizeModifier) - text.length) +
				rightBorder;
		}
		
		s += "\n";
		
		/** Are/were we printing the header rows? */
		if(inHeader){
			
			/** End-of-header? */
			if(!buffer){
				inHeader = false;
				
				/** Add a divider */
				if(borders){
					s += "┡";
					for(let r = 0; r < numColumns; ++r)
						s += "━".repeat((padding + maxLengths[r]) * sizeModifier) + (r < numColumns - 1 ? "╇" : "┩\n");
				}
			}
		}
		
		
		/** Decree the rowBuffer count */
		buffer && --buffer;
	}
	
	
	/** Add the closing border to the bottom of our table */
	if(borders){
		s += "└";
		for(let r = 0; r < numColumns; ++r)
			s += "─".repeat((padding + maxLengths[r]) * sizeModifier) + (r < numColumns - 1 ? "┴" : "┘");
	}
	
	return s;
}
