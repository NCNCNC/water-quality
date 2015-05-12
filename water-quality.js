var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var fs = require('fs');

var currentYear = 2010;
var startingYear = 2009;
var apiUrl = 'http://www.gzepb.gov.cn:81/was5/web/WaterQuality/MonthlyData.jsp';

var dataSet = {
	updateDate: new Date(),
	result: {}
};

async.waterfall([
	function(callback) {
		for (var i = startingYear; i < currentYear + 1; i++) {
			for (var j = 1; j < 11; j++) {
				(function(year, pgNum) {
					tempSet = [];
					dataSet.result[year.toString()] = [];
					request.post({
						url: apiUrl,
						form: {
							sw: year,
							pg: pgNum
						}
					}, function(err, res, body) {
						if (!err && res.statusCode == 200) {
							callback(null,body, year, year == currentYear && pgNum == 10);
						}
					});
				})(i, j);
			}
		}
	},
	function(body, year, done, callback) {
		var $ = cheerio.load(body);
		var tempSet = [];
		$('.report1_3').each(function(index, elem) {
			tempSet[index] = $(this).text();
		});
		for (var k = 0; k < tempSet.length; k += 8) {
			item = {
				'日期': tempSet[k],
				'城市': tempSet[k + 1],
				'水源地名称': tempSet[k + 2],
				'本月取水量': tempSet[k + 3],
				'水质类别': tempSet[k + 4],
				'水质指数': tempSet[k + 5],
				'水质状况': tempSet[k + 6],
				'主要污染项目': tempSet[k + 7]
			};
			dataSet.result[year.toString()].push(item);
		}
		if (done) {
			callback();
		}
	}, function(callback) {
		fs.writeFile('data.json', JSON.stringify(dataSet), function(err) {
			if (err) {
				console.error(err);
			}
		});
		callback();
	}], function(err) {
	if (err) {
		console.error(err);
	}
});
