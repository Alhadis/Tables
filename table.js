"use strict";


class Table{
	
	constructor(options = {}){
		this.data        = [];
		
		this.body        = options.body;
		this.rowTemplate = options.rowTemplate;
	}
	
	
	queryVars(){
		
	}
	
	
	load(){
		let req = new XMLHttpRequest();
		req.open("GET", "endpoint.php");
		req.addEventListener("readystatechange", e => {
			
			if(4 === req.readyState){
				this.data = JSON.parse(req.responseText).data;
				this.refresh();
			}
		});
		req.send();
	}
	
	
	addRow(data){
		let result = this.rowTemplate.cloneNode(true);
		let c = result.children;
		c[0].textContent = data.ID;
		c[1].textContent = data.name;
		c[2].textContent = data.email;
		c[3].textContent = data.phone;
		c[4].textContent = data.dob;
		c[5].textContent = data.postcode;
		c[6].textContent = data.answer;
		return result;
	}
	
	
	refresh(){
		let row;
		while(row = this.body.firstChild)
			this.body.removeChild(row);
		
		for(let i = 0, l = this.data.length; i < l; ++i){
			row = this.addRow(this.data[i]);
			this.body.appendChild(row);
		}
	}
}
