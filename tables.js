"use strict";


function table(values, options){
	options              = options || {};

	let noHeaders        = options.noHeaders;
	let borders          = options.borders;
	let width            = options.width;
	let paddingLeft      = undefined == options.paddingLeft  ? 1 : options.paddingLeft;
	let paddingRight     = undefined == options.paddingRight ? 1 : options.paddingRight;
	
	/** Allow both padding options to be set with "options.padding" */
	if(undefined != options.padding){
		paddingLeft  =
		paddingRight = +options.padding;
	}
	
	/** Store the total horizontal padding for convenience's sake */
	let padding = paddingLeft + paddingRight;
	
	
	/** Formatting */
	const beforeRow            = options.beforeRow;
	const beforeCell           = options.beforeCell;
	const beforeCellInside     = options.beforeCellInside;
	const afterCellInside      = options.afterCellInside;
	const afterCell            = options.afterCell;
	const afterRow             = options.afterRow;
	const func                 = "function";
	const beforeRowIsFn        = func === typeof beforeRow;
	const beforeCellIsFn       = func === typeof beforeCell;
	const beforeCellInsideIsFn = func === typeof beforeCellInside;
	const afterCellInsideIsFn  = func === typeof afterCellInside;
	const afterCellIsFn        = func === typeof afterCell;
	const afterRowIsFn         = func === typeof afterRow;
	
	
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
			const cell = row[i];
			const lineLengths = cell.split(/\n+/g).map(l => l.length);
			maxLengths[i] = Math.max(...lineLengths, maxLengths[i] || 0);
		}
	}
	
	
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
	
	
	/** Ascertain the minimum width required to fit the whole table */
	const skipBorders = [];
	const minWidth = maxLengths.reduce((total, value, index) => {
		const borderGroup  = index === lastColumn ? 3 : index === secondLast ? 2 : +!!index;
		skipBorders[index] = 3 === borderGroup ? skip[15] : 2 === borderGroup ? skip[13] : borderGroup ? skip[11] : skip[9];
		return total + value + padding + (skipBorders[index] ? 0 : 1);
	});
	
	
	/** If a desired width was specified, calculate a multiplier */
	const sizeModifier = width ? (width / minWidth) : 1;
	
	/** Calculate the absolute width of each column, padding/borders included */
	let actualWidth = 0;
	const columnWidths = maxLengths.map((size, index) => {
		let width = Math.round(size * sizeModifier) + padding + (skipBorders[index] ? 0 : 1);
		actualWidth += width;
		return width;
	});
	
	
	/** We were given a target width, and round-off weirdness made us miss it. Fix that shit */
	if(width && actualWidth != width){
		const overflow = actualWidth - width;
		const sorted   = columnWidths.map((width, index) => [width, index]).sort((a, b) => {
			if(a[0] < b[0]) return 1;
			if(a[0] > b[0]) return -1;
			return 0;
		});
		
		console.info("Correcting width: " + overflow);
		for(let i = 0, l = Math.abs(overflow); i < l; ++i)
			columnWidths[sorted[i % sorted.length][1]] += overflow > 0 ? -1 : 1;
	}
	
	
	/** Number of extra rows inserted to contain a multi-line value */
	let buffer = 0;
	
	
	/** Actual row of data being printed - excludes "extra rows" inserted for multiline values */
	let realRow = 0;
	
	
	/** Flag monitoring whether we're currently within the header row(s) */
	let inHeader = !noHeaders;
	
	
	

	/** Output */
	let s = "";
	
	/** Add the top divider */
	if(borders && !skip[0]){
		
		/** Row: Before */
		if(beforeRow)
			s += beforeRowIsFn
				? beforeRow.call(null, 0, 0)
				: beforeRow;
		
		/** Cell: Before */
		if(beforeCell)
			s += beforeCellIsFn
				? beforeCell.call(null, 0, 0)
				: beforeCell;
		
		
		/** Add leftmost border unless there's nothing there */
		if(!skip[7]) s += topBorder[0];
		
		
		/** Loop through each column */
		for(let r = 0; r < numColumns; ++r){
			const columnIndex = r === lastColumn ? 3 : r === secondLast ? 2 : +!!r
			
			/** Cell: Before */
			if(r && beforeCell)
				s += beforeCellIsFn
					? beforeCell.call(null, 0, r)
					: beforeCell;
			
			s +=
				(beforeCellInside ? beforeCellInsideIsFn ? beforeCellInside.call(null, 0, r) : beforeCellInside : "")
				+ topBorder[
					3 === columnIndex
						? 7
						: 2 === columnIndex
							? 5
							: columnIndex
								? 3
								: 1
				].repeat(columnWidths[r])
				
				+ (afterCellInside ? afterCellInsideIsFn ? afterCellInside.call(null, 0, r) : afterCellInside : "")
				+ (topBorder[
					3 === columnIndex
						? (skip[15] ? -1 : 8)
						: 2 === columnIndex
							? (skip[13] ? -1 : 6)
							: columnIndex
								? (skip[11] ? -1 : 4)
								: (skip[9]  ? -1 : 2)
				] || "")
				+ (afterCell ? afterCellIsFn ? afterCell.call(null, 0, r) : afterCell : "");
		}
		
		/** Add extra trailing characters? */
		if(afterRow)
			s += afterRowIsFn
				? afterRow.call(null, 0, numColumns)
				: afterRow;
		s += "\n";
	}
	
	
	/** Start spitting out rows */
	for(let r = 0, rowCount = values.length; r < rowCount; ++r){
		let row = values[r];
		
		/** Print extra leading characters? */
		if(beforeRow)
			s += beforeRowIsFn
				? beforeRow.call(null, realRow, 0, row)
				: beforeRow;
		
		
		/** Loop through each of the row's cells */
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
			s +=
				(beforeCell ? beforeCellIsFn ? beforeCell.call(null, realRow, i, row, text) : beforeCell : "")
				+ leftBorder
				+ (beforeCellInside ? beforeCellInsideIsFn ? beforeCellInside.call(null, realRow, i, row, text) : beforeCellInside : "")
				+ " ".repeat(paddingLeft)
				+ text
				+ " ".repeat(Math.max(0, columnWidths[i] - text.length - paddingLeft))
				+ (afterCellInside ? afterCellInsideIsFn ? afterCellInside.call(null, realRow, i, row, text) : afterCellInside : "")
				+ rightBorder
				+ (afterCell ? afterCellIsFn ? afterCell.call(null, realRow, i, row, text) : afterCell : "");
		}
		
		
		/** Add extra trailing characters? */
		if(afterRow)
			s += afterRowIsFn
				? afterRow.call(null, realRow, numColumns, row)
				: afterRow;
		s += "\n";
		
		
		
		/** Are/were we printing the header rows? */
		if(inHeader){
			
			/** End-of-header? */
			if(!buffer){
				inHeader = false;
				
				/** Add a divider */
				if(!skip[2] && borders){
					
					/** Row: Before */
					if(beforeRow)
						s += beforeRowIsFn
							? beforeRow.call(null, realRow, 0)
							: beforeRow;
					
					/** Cell: Before */
					if(beforeCell)
						s += beforeCellIsFn
							? beforeCell.call(null, realRow, 0, row)
							: beforeCell;
					
					
					/** Add the leftmost border character */
					if(!skip[7]) s += borderChars[20];
					
					/** Loop through each column */
					for(let r = 0; r < numColumns; ++r){
						const columnIndex = r === lastColumn ? 3 : r === secondLast ? 2 : +!!r;
						
						/** Cell: Before */
						if(r && beforeCell)
							s += beforeCellIsFn
								? beforeCell.call(null, realRow, r, row)
								: beforeCell;
						
						s +=
							(beforeCellInside ? beforeCellInsideIsFn ? beforeCellInside.call(null, realRow, r, row) : beforeCellInside : "")
							+ borderChars[
								3 === columnIndex
									? 27
									: 2 === columnIndex
										? 25
										: columnIndex
											? 23
											: 21
							].repeat(columnWidths[r])
							+ (afterCellInside ? afterCellInsideIsFn ? afterCellInside.call(null, realRow, r, row) : afterCellInside : "")
							+ (borderChars[
								3 === columnIndex
									? (skip[15] ? -1 : 28)
									: 2 === columnIndex
										? (skip[13] ? -1 : 26)
										: columnIndex
											? (skip[11] ? -1 : 24)
											: (skip[9]  ? -1 : 22)
							] || "")
							+ (afterCell ? afterCellIsFn ? afterCell.call(null, realRow, r, row) : afterCell : "");
					}
					
					
					/** Row: After */
					if(afterRow)
						s += afterRowIsFn
							? afterRow.call(null, realRow, numColumns)
							: afterRow;
					
					s += "\n";
				}
			
				++realRow;
			}
		}
		
		
		/** Nah, somewhere in the body */
		else{
			
			/** Decree the rowBuffer count if we're still making up for line-breaks */
			if(buffer) --buffer;
			
			/** Nope, no more breakage */
			else{
				
				/** Add a divider? */
				if(borders && !skip[5] && r < rowCount - 1){
					
					/** Row: Before */
					if(beforeRow)
						s += beforeRowIsFn
							? beforeRow.call(null, realRow, 0)
							: beforeRow;
					
					/** Cell: Before */
					if(beforeCell)
						s += beforeCellIsFn
							? beforeCell.call(null, realRow, 0, row)
							: beforeCell;
					
					
					/** Add the leftmost border character */
					if(!skip[7]) s += borderChars[50];
					
					/** Loop through each column */
					for(let r = 0; r < numColumns; ++r){
						const columnIndex = r === lastColumn ? 3 : r === secondLast ? 2 : +!!r;
						
						/** Cell: Before */
						if(r && beforeCell)
							s += beforeCellIsFn
								? beforeCell.call(null, realRow, r, row)
								: beforeCell;
						
						s +=
							(beforeCellInside ? beforeCellInsideIsFn ? beforeCellInside.call(null, realRow, r, row) : beforeCellInside : "")
							+ borderChars[
								3 === columnIndex
									? 57
									: 2 === columnIndex
										? 55
										: columnIndex
											? 53
											: 51
							].repeat(columnWidths[r])
							+ (afterCellInside ? afterCellInsideIsFn ? afterCellInside.call(null, realRow, r, row) : afterCellInside : "")
							+ (borderChars[
								3 === columnIndex
									? (skip[15] ? -1 : 58)
									: 2 === columnIndex
										? (skip[13] ? -1 : 56)
										: columnIndex
											? (skip[11] ? -1 : 54)
											: (skip[9]  ? -1 : 52)
							] || "")
							+ (afterCell ? afterCellIsFn ? afterCell.call(null, realRow, r, row) : afterCell : "");
					}
					
					
					/** Row: After */
					if(afterRow)
						s += afterRowIsFn
							? afterRow.call(null, realRow, numColumns)
							: afterRow;
					s += "\n";
				}
			
				++realRow;
			}
		}
	}
	
	
	/** Add the closing border to the bottom of our table (assuming there's one to display) */
	if(borders && !skip[6]){

		/** Row: Before */
		if(beforeRow)
			s += beforeRowIsFn
				? beforeRow.call(null, realRow, 0)
				: beforeRow;
		
		/** Cell: Before */
		if(beforeCell)
			s += beforeCellIsFn
				? beforeCell.call(null, realRow, 0)
				: beforeCell;
		
		
		/** Add leftmost border character */
		if(!skip[7]) s += borderChars[60];
		
		/** Loop through each column */
		for(let r = 0; r < numColumns; ++r){
			const columnIndex = r === lastColumn ? 3 : r === secondLast ? 2 : +!!r;
			
			/** Cell: Before */
			if(r && beforeCell)
				s += beforeCellIsFn
					? beforeCell.call(null, realRow, r)
					: beforeCell;
			
			s +=
				(beforeCellInside ? beforeCellInsideIsFn ? beforeCellInside.call(null, realRow, r) : beforeCellInside : "")
				+ borderChars[
					3 === columnIndex
						? 67
						: 2 === columnIndex
							? 65
							: columnIndex
								? 63
								: 61
				].repeat(columnWidths[r])
				+ (afterCellInside ? afterCellInsideIsFn ? afterCellInside.call(null, realRow, r) : afterCellInside : "")
				+ (borderChars[
					3 === columnIndex
						? (skip[15] ? -1 : 68)
						: 2 === columnIndex
							? (skip[13] ? -1 : 66)
							: columnIndex
								? (skip[11] ? -1 : 64)
								: (skip[9]  ? -1 : 62)
				] || "")
				+ (afterCell ? afterCellIsFn ? afterCell.call(null, realRow, r) : afterCell : "");
		}
		
		
		/** Row: After */
		if(afterRow)
			s += afterRowIsFn
				? afterRow.call(null, realRow, numColumns)
				: afterRow;
	}
	
	/** Oops. Guess we didn't need that superfluous newline, then */
	else s = s.replace(/\n$/, "");
	
	return s;
}



/** Node.js */
if("object" === typeof module && module.exports)
	module.exports = table;
