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
	borders: true,
	borderChars: fs.readFileSync("border-demo.txt").toString().replace(/\n+$/, "")
});
console.log(str);


function table(values, options){
	options              = options || {};

	let noHeaders        = options.noHeaders;
	let borders          = options.borders;
	let paddingLeft      = options.paddingLeft  || 1;
	let paddingRight     = options.paddingRight || 1;
	let padding          = paddingLeft + paddingRight;
	let width            = options.width;
	
	/** Resolve border characters */
	let borderChars      = "";
	if(borders){
		borderChars = (options.borderChars || `
		  ┏━┳━┳━┓
		  ┃ ┃ ┃ ┃
		  ┡━╇━╇━┩
		  ┌─┬─┬─┐
		  │ │ │ │ 
		  ├─┼─┼─┤
		  └─┴─┴─┘
		`)
			/** Normalise line-endings, just in case... */
			.replace(/\r\n/g, "\n")
			
			/** Strip blank lines and hard-tabs */
			.replace(/^[\x20\t]*\n|\n[\x20\t]*(?=\n|$)/gm, "")
			.replace(/\t+/g, "");
		
		/** Determine the minimum amount of useless whitespace prefixing each line */
		const minIndent = Math.min(...(borderChars.match(/^(\x20*)/gm) || []).map(m => m.length));
		
		/** Strip leading soft-tabs */
		borderChars = borderChars.replace(new RegExp("^ {"+minIndent+"}", "gm"), "");
		
		/** Error-handling: If an author doesn't want any vertical dividers, reinsert blank lines */
		const blank = "\n" + " ".repeat(7) + "\n";
		if(" " !== borderChars[9])  borderChars = borderChars.replace(/\n/, blank);
		if(" " !== borderChars[33]) borderChars = borderChars.substr(0, 31) + blank + borderChars.substr(40);
	}
	
	
	/** Determine the maximum size of each column */
	let maxLengths  = [];
	let numColumns  = 0;
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
	const sizeModifier = width ? (width / minWidth) : 1;
	

	/** Number of extra rows inserted to contain a multi-line value */
	let buffer = 0;
	
	
	/** Flag monitoring whether we're currently within the header row(s) */
	let inHeader = !noHeaders;
	
	
	
	let s = "";
	
	/** Add the top divider */
	if(borders){
		let chars = borderChars.substr(noHeaders ? 24 : 0, 7);
		
		s += chars[0];
		for(let r = 0; r < numColumns; ++r)
			s += chars[r ? (r < numColumns - 1 ? 3 : 5) : 1]
				.repeat(padding + 1 + Math.round(maxLengths[r] * sizeModifier))
				+ chars[r < numColumns - 1 ? 2 : 6];
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
				if(!i) leftBorder = borderChars[inHeader ? 8 : 32];
				
				
				/** Right-edge/last cell */
				if(i >= numColumns - 1)
					rightBorder = borderChars[inHeader ? 14 : 38];
				
				/** Neither */
				else rightBorder = borderChars[inHeader ? 10 : 34];
			}
			
			
			/** Add the cell to the output string */
			s += leftBorder +
				" ".repeat(paddingLeft) +
				text +
				" ".repeat(Math.round(padding + (maxLengths[i] * sizeModifier)) - text.length) +
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
					s += borderChars[16];
					for(let r = 0; r < numColumns; ++r)
						s += borderChars[r ? (r < numColumns - 1 ? 19 : 21) : 17]
							.repeat(padding + 1 + Math.round(maxLengths[r] * sizeModifier))
							+ borderChars[r < numColumns - 1 ? 18 : 22];
					s += "\n";
				}
			}
		}
		
		/** Nah, somewhere in the body */
		else{
			
			/** Decree the rowBuffer count if we're still making up for line-breaks */
			if(buffer) --buffer;
			
			/** Nope, no more breakage. Add a divider? */
			else if(borders && r < rowCount - 1){
				s += borderChars[41];
				for(let r = 0; r < numColumns; ++r)
					s += borderChars[r ? (r < numColumns - 1 ? 44 : 46) : 42]
						.repeat(padding + 1 + Math.round(maxLengths[r] * sizeModifier))
						+ borderChars[r < numColumns - 1 ? 43 : 47];
				s += "\n";
			}
		}
	}
	
	
	/** Add the closing border to the bottom of our table */
	if(borders){
		s += borderChars[49];
		for(let r = 0; r < numColumns; ++r)
			s += borderChars[r ? (r < numColumns - 1 ? 52 : 54) : 50]
				.repeat(padding + 1 + Math.round(maxLengths[r] * sizeModifier))
				+ borderChars[r < numColumns - 1 ? 51 : 55];
	}
	
	return s;
}
