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
		console.error("error : cannot get list! at " + date + " : " + componetId + " : " + page);
		callback(err);
	});

	function onData(chuck){
		try {
			chuck = eucToUtf.convert(chuck);
			callback(null, JSON.parse(chuck));
		} catch(e) {
			console.error("error : cannot parse list at " + date + " : " + componetId + " : " + page);
			callback(e);
		}
	}
}
function findAllArticle(dateStr, partId){
	var count = 1;
	loop();

	function loop(){
		var retry = 1;
		getArticle(dateStr, partId, count, onArticle);

		function onArticle(e, data){
			if(e) {
				if(retry++ < 3){
					getArticle(dateStr, partId, count, onArticle);
					return;
				}
			} else {
				try {
					if(isExistBefore(data.itemList[0].url)) return;
				} catch(e){}

				handleData(data.itemList, partId);
			}
			count++;
			loop();	
		}
	}


	var before = [];
	function isExistBefore(id){
		for(var i = 0; i < before.length; i++){
			if(before[i] == id)
				return true;
		}
		before.push(id);
		return false;
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
		return new Date(date.getTime() + 60 * 60 * 24 * 1000);
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
