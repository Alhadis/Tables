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
		
		/** We were supplied an array */
		if(Array.isArray(borderChars = options.borderChars)){
			borderChars = borderChars
				.map(c => "number" === typeof c ? String.fromCodePoint(c) : (c ? c[0] : " "))
				.join("")
				.replace(/(.{9})/g, "$1\n");
			
			/** Pad the result with whitespace in case the author omitted some trailing lines */
			if(borderChars.length < 69)
				borderChars += " ".repeat(69 - borderChars.length);
		}
		
		
		/** Nope, it's a string (we'll assume) */
		else{
			borderChars = (borderChars || `
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
				
				/** Strip hard-tabs, as well as blank lines before and after the characters */
				.replace(/^(?:[\x20\t]*\n)*|(?:\n[\x20\t]*)*$/g, "")
				.replace(/\t+/g, "");
			
			
			/** Determine the minimum amount of useless whitespace prefixing each line */
			const minIndent = Math.min(...(borderChars.match(/^(\x20*)/gm) || []).map(m => m.length));
			
			/* Clean up and optimise the input **/
			borderChars = borderChars
			
				/** Strip leading soft-tabs */
				.replace(new RegExp("^ {"+minIndent+"}", "gm"), "")
			
				/** Ensure each line is exactly nine characters long */
				.replace(/$/gm, " ".repeat(9))
				.replace(/^(.{9}).*$/gm, "$1");
			
			
			/** Error-handling: If an author didn't want any vertical dividers for the header, reinsert blank lines */
			if(" " === borderChars[1] || undefined === borderChars[41]){
				const blank = " ".repeat(9) + "\n";
				
				/** Only the top line's missing */
				if(" " === borderChars[1])
					borderChars = blank + borderChars;
				
				else borderChars = blank + blank + borderChars;
			}
			
			/** One final check to ensure there's enough space */
			const expectedMinLength = 69;
			if(borderChars.length < expectedMinLength)
				borderChars += " ".repeat(expectedMinLength - borderChars.length);
		}
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
	const topBorder  = borderChars.substr(noHeaders ? 30 : 0, 9);
	const skip       = (!borders || options.keepEmptyBorders) ? [] : [
		
		/**===== ROWS ========================================================
		/*  0: ┏━┳━┳━┳━┓   */   0 === topBorder.trim().length,
		/*  1: ┃ ┃ ┃ ┃ ┃   */   0 === borderChars.substr(10, 9).trim().length,
		/*  2: ┡━╇━╇━╇━┩   */   0 === borderChars.substr(20, 9).trim().length,
		/*  3: ┌─┬─┬─┬─┐   */   , // See 0
		/*  4: │ │ │ │ │   */   0 === borderChars.substr(40, 9).trim().length,
		/*  5: ├─┼─┼─┼─┤   */   0 === borderChars.substr(50, 9).trim().length,
		/*  6: └─┴─┴─┴─┘   */   0 === borderChars.substr(60, 9).trim().length,
		
		/**==== COLUMNS ======================================================
		/*  7   8   9   10   11   12   13   14   15
		/*  ┢━━━┷━━━╈━━━━┷━━━━╈━━━━┷━━━━╈━━━━┷━━━━┪
		/*  ┃   A   ┃    B    ┃    C    ┃    D    ┃
		/*  ┗━━━━━━━┻━━━━━━━━━┻━━━━━━━━━┻━━━━━━━━━┛
		*/ ...(s => {
			const columns = ["", "", "", "", "", "", "", "", "", ""];
			for(let i = 0; i < s.length; ++i)
				columns[i % 10] += s[i];
			return columns.map(s => 0 === s.trim().length);
		})(borderChars)
	];
	
	
	let s = "";
	
	/** Add the top divider */
	if(borders && !skip[0]){
		
		if(!skip[7])
			s += topBorder[0];
		
		for(let r = 0; r < numColumns; ++r){
			const columnIndex = r === lastColumn ? 3 : r === secondLast ? 2 : +!!r
			
			s += topBorder[
				3 === columnIndex
					? 7
					: 2 === columnIndex
						? 5
						: columnIndex
							? 3
							: 1
			].repeat(padding + 1 + Math.round(maxLengths[r] * sizeModifier))
			
			+ (topBorder[
				3 === columnIndex
					? (skip[15] ? -1 : 8)
					: 2 === columnIndex
						? (skip[13] ? -1 : 6)
						: columnIndex
							? (skip[11] ? -1 : 4)
							: (skip[9]  ? -1 : 2)
			] || "");
		}
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
			
			/** Ascertain which border-column we're effectively in */
			const columnIndex = i === lastColumn ? 3 : i === secondLast ? 2 : +!!i;
			
			
			let leftBorder  = "";
			let rightBorder = "";
			
			/** We're displaying borders */
			if(borders){
				
				/** First column */
				if(!columnIndex){
					if(!skip[7]) leftBorder  = borderChars[inHeader ? 10 : 40];
					if(!skip[9]) rightBorder = borderChars[inHeader ? 12 : 42];
				}
								
				/** Last column */
				else if(3 === columnIndex){
					if(!skip[15])
						rightBorder = borderChars[inHeader ? 18 : 48];
				}
				
				/** Second last */
				else if(2 === columnIndex){
					if(!skip[13])
						rightBorder = borderChars[inHeader ? 16 : 46];
				}
				
				/** Centre */
				else if(!skip[11])
					rightBorder = borderChars[inHeader ? 14 : 44];
			}
			
			
			/** Add the cell to the output string */
			s += leftBorder
				+ " ".repeat(paddingLeft)
				+ text
				+ " ".repeat(Math.round(padding + (maxLengths[i] * sizeModifier)) - text.length)
				+ rightBorder;
		}
		
		
		s += "\n";
		
		/** Are/were we printing the header rows? */
		if(inHeader){
			
			/** End-of-header? */
			if(!buffer){
				inHeader = false;
				
				/** Add a divider */
				if(!skip[2] && borders){
					if(!skip[7])
						s += borderChars[20];
					
					for(let r = 0; r < numColumns; ++r){
						const columnIndex = r === lastColumn ? 3 : r === secondLast ? 2 : +!!r;
						
						s += borderChars[
							3 === columnIndex
								? 27
								: 2 === columnIndex
									? 25
									: columnIndex
										? 23
										: 21
						].repeat(padding + 1 + Math.round(maxLengths[r] * sizeModifier))
						
						+ (borderChars[
							3 === columnIndex
								? (skip[15] ? -1 : 28)
								: 2 === columnIndex
									? (skip[13] ? -1 : 26)
									: columnIndex
										? (skip[11] ? -1 : 24)
										: (skip[9]  ? -1 : 22)
						] || "");
					}
					s += "\n";
				}
			}
		}
		
		
		/** Nah, somewhere in the body */
		else{
			
			/** Decree the rowBuffer count if we're still making up for line-breaks */
			if(buffer) --buffer;
			
			/** Nope, no more breakage. Add a divider? */
			else if(!skip[5] && r < rowCount - 1){
				
				if(!skip[7])
					s += borderChars[50];
				
				for(let r = 0; r < numColumns; ++r){
					const columnIndex = r === lastColumn ? 3 : r === secondLast ? 2 : +!!r;
					
					s += borderChars[
						3 === columnIndex
							? 57
							: 2 === columnIndex
								? 55
								: columnIndex
									? 53
									: 51
					].repeat(padding + 1 + Math.round(maxLengths[r] * sizeModifier))
					+ (borderChars[
						3 === columnIndex
							? (skip[15] ? -1 : 58)
							: 2 === columnIndex
								? (skip[13] ? -1 : 56)
								: columnIndex
									? (skip[11] ? -1 : 54)
									: (skip[9]  ? -1 : 52)
					] || "");
				}
				s += "\n";
			}
		}
	}
	
	
	/** Add the closing border to the bottom of our table (assuming there's one to display) */
	if(borders && !skip[6]){
		if(!skip[7]) s += borderChars[60];
		
		for(let r = 0; r < numColumns; ++r){
			const columnIndex = r === lastColumn ? 3 : r === secondLast ? 2 : +!!r;
			s += borderChars[
				3 === columnIndex
					? 67
					: 2 === columnIndex
						? 65
						: columnIndex
							? 63
							: 61
			].repeat(padding + 1 + Math.round(maxLengths[r] * sizeModifier))
			+ (borderChars[
				3 === columnIndex
					? (skip[15] ? -1 : 68)
					: 2 === columnIndex
						? (skip[13] ? -1 : 66)
						: columnIndex
							? (skip[11] ? -1 : 64)
							: (skip[9]  ? -1 : 62)
			] || "");
		}
	}
	
	/** Oops. Guess we didn't need that superfluous newline, then */
	else s = s.replace(/\n$/, "");
	
	return s;
}



/** Node.js */
if("object" === typeof module && module.exports)
	module.exports = table;
