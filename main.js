var finder = require("./finder.js");
var config  = require("./config.json");

var startDate = config.start ? new Date(config.start.year, config.start.month - 1, config.start.day) : new Date();
var endDate = config.end ? new Date(config.end.year, config.end.month -1, config.end.day) : new Date();

for(var partname in config.partList){
	var partid = config.partList[partname];
	finder.find(startDate, endDate, partid);
}

