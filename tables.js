#!/usr/local/bin/node --es_staging
"use strict";


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
		  ┏━┳━┳━┳━┓
		  ┃ ┃ ┃ ┃ ┃
		  ┡━╇━╇━╇━┩
		  ┌─┬─┬─┬─┐
		  │ │ │ │ │
		  ├─┼─┼─┼─┤
		  └─┴─┴─┴─┘
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
		const blank = "\n" + " ".repeat(9) + "\n";
		if(" " !== borderChars[11])  borderChars = borderChars.replace(/\n/, blank);
		if(" " !== borderChars[41])  borderChars = borderChars.substr(0, 39) + blank + borderChars.substr(40);
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
	
	
	/** Useful constants to use mid-loop */
	const lastColumn = numColumns - 1;
	const secondLast = numColumns - 2;
	
	
	let s = "";
	
	/** Add the top divider */
	if(borders){
		let chars = borderChars.substr(noHeaders ? 30 : 0, 9);
		
		s += chars[0];
		for(let r = 0; r < numColumns; ++r)
			s += chars[r
					? r < secondLast
						? 3
						: r === secondLast
							? 5
							: 7
					: 1
				].repeat(padding + 1 + Math.round(maxLengths[r] * sizeModifier))
				+ chars[r
					? r < lastColumn
						? r
							? r < secondLast
								? 4
								: 6
							: 6
						: 8
					: 2
				];
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
				
				/** First column */
				if(!i){
					leftBorder = borderChars[inHeader
						? 10
						: 40
					];
					rightBorder = borderChars[inHeader
						? 12
						: 42
					];
				}
				
				
				/** Last column */
				else if(i >= secondLast)
					rightBorder = borderChars[
						i === secondLast
							? inHeader
								? 16
								: 46
							: inHeader
								? 18
								: 48
					];
				
				/** Centre */
				else rightBorder = borderChars[inHeader
						? i
							? 14
							: 12
						: i
							? 44
							: 42
					];
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
					s += borderChars[20];
					for(let r = 0; r < numColumns; ++r)
						s += borderChars[r
								? r < secondLast
									? 23
									: r === secondLast
										? 25
										: 27
								: 21]
							.repeat(padding + 1 + Math.round(maxLengths[r] * sizeModifier))
							+ borderChars[r < lastColumn
								? 22
								: r < secondLast
									? 25
									: 28
							];
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
				s += borderChars[50];
				for(let r = 0; r < numColumns; ++r)
					s += borderChars[r
						? r < secondLast
							? 53
							: r === secondLast
								? 55
								: 57
						: 51
					].repeat(padding + 1 + Math.round(maxLengths[r] * sizeModifier))
					+ borderChars[r < secondLast
						? r
							? 54
							: 52
						: r === secondLast
							? 56
							: 58
					];
				s += "\n";
			}
		}
	}
	
	
	/** Add the closing border to the bottom of our table */
	if(borders){
		s += borderChars[60];
		for(let r = 0; r < numColumns; ++r)
			s += borderChars[r
				? r < secondLast
					? 63
					: r === lastColumn
						? 67
						: 65
				: 61
			].repeat(padding + 1 + Math.round(maxLengths[r] * sizeModifier))
			+ borderChars[r
				? r < secondLast
					? 64
					: r === lastColumn
						? 68
						: 66
				: 62
			];
	}
	
	return s;
}




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
