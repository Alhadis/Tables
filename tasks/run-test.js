#!/usr/local/bin/node --es_staging
"use strict";

/** Stupid helper functions to remove before release */
global.puts   = puts;
global.log    = log;

/** Load modules and parse CLI options */
const fs      = require("fs");
const table   = require("../tables.js");
const getopts = require("get-options");
const options = getopts(process.argv.slice(2), {
	"-w, --width":  "[number=\\d+]",
	"-c, --config": "[config]"
}).options;

const width        = +(options.width || process.stdout.columns);
const configFile   = options.config;

/** No config? No service */
if(!configFile){
	console.error("Path to configuration file not found");
	process.exit(1);
}

const borderConfig = fs
	.readFileSync(configFile)
	.toString()
	.replace(/\n+$/, "");


/** Load the input data */
process.stdin.setEncoding("utf8");
process.stdin.on("readable", () => {
	let data = process.stdin.read();
	if(null !== data){
		
		data = data.toString()
			.split(/\n+/g)
			.filter(e => e)
			.map(e => e.replace(/\\n/g, "\n").split(/\t/g));
		
		let str = table(data, {
			width: width,
			paddingLeft: 1,
			paddingRight: 2,
			borders: true,
			keepEmptyBorders: false,
			borderChars: borderConfig.replace(/\n+/g, "").split(""),
			
			beforeCell: (row, column, rowData) => {
				return column % 2
					? "\x1B[48;5;22m" /* Odd:  Green */
					: "\x1B[48;5;4m"  /* Even: Blue  */
			},
			beforeCellInside: (row, column, rowData) => {
				return column % 2
					? "\x1B[38;5;10m"
					: "\x1B[38;5;6m"
			},
			afterCellInside: (row, column, rowData) => {
				return "\x1B[39m";
			},
			afterCell:  (row, column, rowData) => {
				return "\x1B[0m";
			}
		});
		
		console.log(str);
	}
});




/** Print a string with a coloured background */
function puts(s){
	console.log("\x1B[48;5;27m" + s + "\x1B[0m", "\n");
}

/** Less patient way to write to STDERR */
function log(){
	console.warn(...arguments);
}
