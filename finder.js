var http = require("http");
var iconv = require('iconv').Iconv;
var loader = require("./loader.js");

var eucToUtf = new iconv("euc-kr","UTF-8//TRANSLIT//IGNORE");

exports.find = find;

function getArticle(date, componetId, page, callback){
	http.get("http://news.naver.com/main/mainNews.nhn?componentId=" 
			 + componetId + "&date=" + date + "%2000:00:00&page=" 
			 + page, function (res){
		var data = new Buffer(0); 

		res.on('data', function(chuck){
			data = Buffer.concat([data, chuck]);
		}).on("end", function(err){
			if(err) {
				callback(err);
				return;
			}
			onData(data);
		}).on("close", function(err){
			callback(err || new Error("socket close unexpected!"));
		});     
	}).on("error", function(err){
		console.error("article list error!");
		callback(err);
	});

	function onData(chuck){
		try {
			chuck = eucToUtf.convert(chuck);
			callback(null, JSON.parse(chuck));
		} catch(e) {
			console.error("JSON parse Error at " + date + " : " + componetId + " : " + page);
			console.error("\t" + chuck.toString("utf8").substr(0, 100));
			callback(e);
		}
	}
}

function findAllArticle(dateStr, partId) {
	var size = 10;
	var offset = 1;

	onloop();

	function onloop(){
		var err_flag = false;
		var count = 0;
		for(var i = 0; i < size; i++){
			getArticle(dateStr, partId, offset + i, function(e, data){
				count++;
				if(e) {
					err_flag = true;
				} else {
					ondata(data);
				}	
				if(count >= size){
					if(!err_flag){
						onloop();
					}
				}		
			});
		}
		offset += size;
	}
	function ondata(data){
		handleData(data.itemList, partId);
	}
}
function find(startDate, endDate, partId){
	var current = startDate;
	var startCount = 0;
	var endCount = 0;

	while(current.getTime() < endDate.getTime()){
		var dateStr = "" + current.getFullYear() + "-";
		dateStr += (current.getMonth()+1 < 10? "0" : "") + (current.getMonth()+1) + "-";
		dateStr += (current.getDate() < 10 ? "0" : "") + current.getDate();
		findAllArticle(dateStr, partId);
		current = increaseDay(current);
	}

	function increaseDay(date){
		return new Date(date.getTime() + 60 * 60* 24 * 1000);
	}
}
function handleData(data, partId){
	for(var i = 0; i < data.length; i++){
		loader.load({
			partId : data[i].componentId,
			articleId : data[i].articleId,
			url : data[i].linkUrl,
			title : data[i].title,
			officeName : data[i].officeName,
			registeredDate : data[i].registeredDate,
			updateDate : data[i].updateDate,
			articleDate : data[i].articleDate
		});
	}
}
