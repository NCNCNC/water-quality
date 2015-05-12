var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var fs = require('fs');

var startingYear = process.argv[2] ? process.argv[2] : 2009;
var currentYear = process.argv[3] ? process.argv[3] : 2015;
console.log(startingYear);

var apiUrl = 'http://www.gzepb.gov.cn:81/was5/web/WaterQuality/MonthlyData.jsp';

var dataSet = {
	updateDate: new Date(),
};

var queryTime = [];
for (var i = startingYear; i <= currentYear; i++) {
	for (var j = 1; j <= 12; j++) {
		queryTime.push(i + ',' + j);
	}
}

async.map(queryTime, function(time, callback) {
	request.post({
		url: apiUrl,
		form: {
			sw: time
		}
	}, function(err, res, body) {
		if (!err && res.statusCode == 200) {
			var $ = cheerio.load(body);
			var tempSet = [];
			var monthlyData = [];
			$('.report1_3').each(function(index, elem) {
				tempSet[index] = $(this).text();
			});
			for (var k = 0; k < tempSet.length; k += 8) {
				var  item = {
					'日期': tempSet[k],
					'城市': tempSet[k + 1],
					'水源地名称': tempSet[k + 2],
					'本月取水量': tempSet[k + 3],
					'水质类别': tempSet[k + 4],
					'水质指数': tempSet[k + 5],
					'水质状况': tempSet[k + 6],
					'主要污染项目': tempSet[k + 7]
				};
				monthlyData.push(item);
			}
			callback(null, monthlyData);
		}
	});
}, function(err, result) {
	if (err) { console.error(err); }
	dataSet.result = result;
	fs.writeFile('data.json', JSON.stringify(dataSet), function(err) {
		if (err) { console.error(err); }
	});
});