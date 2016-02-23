"use strict";


/**
 * Parse a value into a query string.
 *
 * If given an object, its properties are broken up into "&key=value" pairs,
 * with any arrays expanded into "&key[0]=value&key[1]=value" sequences. Any
 * other value types are coerced into their stringified forms.
 *
 * The result is prepended with a question mark, unless empty.
 *
 * @param {Object|} input
 * @return {String}
 */
function parseQuery(input){
	
	/** Sanity check */
	if(!input) return "";
	
	const encode   = encodeURIComponent;
	const toString = ({}).toString;
	
	/** Input is an object of some description */
	if("[object Object]" === toString.call(input)){
		let result = "";
		
		for(let i in input){
			
			/** This property is assigned an array: expand it */
			if("[object Array]" === toString.call(input[i]))
				result += "&" + input[i].map((item, index) => {
					return encode(i) + "["+index+"]=" + encode(item);
				}).filter(e => undefined !== e).join("&");
			
			/** Just add another "&name=value" pair */
			else result += "&"+encode(i)+"="+encode(input[i]);
		}
		input = result;
	}
	
	/** Return the stringified result, adding a "?" if needed */
	return (input + "").replace(/^[?&]*(?=.)/, "?");
}
