var http = require("http");
var iconv = require('iconv').Iconv;

var eucToUtf = new iconv("euc-kr","UTF-8//TRANSLIT//IGNORE");

exports.load = function(article){
	if(!article.url){
		article.body = "";
		print(article);
		return;
	}
	http.get("http://news.naver.com" + article.url, function(res){
		var data = new Buffer(0);
		res.on("data", function(chuck){
			data = Buffer.concat([data, chuck]);
		}).on("end", function(err){
			try {
				onData(article, eucToUtf.convert(data));
			} catch(e) {
				console.error("error : connot convert char encoding");
			}
		});;
	}).on("error", function(err){
			console.error("error : cannot get article!");
	});
}
function onData(article, data){
	var body = data.toString("utf8");

	body = body.replace(/[\r\n]/g, " ");
	body = body.match(/id="articleBody">(.+)<!-- 구독버튼 , 미투하기 버튼-->/);
	if(body == null){
		console.error("error : cannot parse article at " + article.url);
		return;
	}
	body = body[1];
	body = body.replace(/<br[^>]*>/g, "");//이딴 tag 없에고
	body = body.replace(/<\/?p[^>]*>/g, "");//문단은 살려두고..
	body = body.replace(/<(\w+)[^>]*>(.*?)<\/\1>/g, "");//태그 내용을 지우기..
	body = body.replace(/&lt[^&]+&gt/g, "");
	body = body.replace(/[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})/g, "");//email
	body = body.replace(/<[^>]+>/g, "");//남은 잔챙이 태그 지우기
	body = decodeHtmlEntity(body);
	body = body.replace(/\s+/g, " ");
	body = body.replace(/^\s+/g, "");
	
	article.body = body;
	article.title = decodeHtmlEntity(article.title);
	print(article);

	function decodeHtmlEntity(str){
		var translate = {"nbsp": " ","amp" : "&","quot": "\"","lt"  : "<","gt"  : ">"};
		return str.replace(/&(nbsp|amp|quot|lt|gt);?/g, function(match, entity){
			return translate[entity];
		});
	}
}
function print(article){
	try {
		process.stdout.write(article.partId + "");
		process.stdout.write("&&");
		process.stdout.write(article.articleId + "");
		process.stdout.write("&&");
		process.stdout.write(article.url + "");
		process.stdout.write("&&");
		process.stdout.write(article.officeName + "");
		process.stdout.write("&&");
		process.stdout.write(article.articleDate + "");
		process.stdout.write("&&");
		process.stdout.write(article.registeredDate + "");
		process.stdout.write("&&");
		process.stdout.write(article.updateDate + "");
		process.stdout.write("&&");
		process.stdout.write(article.title + "");
		process.stdout.write("&&");
		process.stdout.write(article.body + "");
		process.stdout.write("\n");
	} catch (e){
		console.error("error : stdout");
	}
}
