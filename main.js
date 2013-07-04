var finder = require("./finder.js");
var partlist = require("./partList.json");

var startDate = new Date(2013, 6, 2);

for(var partname in partlist){
	var partid = partlist[partname];
	finder.find(startDate, new Date(), partid);
}

