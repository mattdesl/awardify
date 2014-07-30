var slug = require('slug')
var fs = require('fs');
var request = require('request');
var async = require('async');
var path = require('path');
var urlJoin = require('url-join');

var base = 'http://www.awwwards.com/'

var folders = ['sotd', 'sotm', 'winners'];

var PRETTY_PRINT = true;
var IGNORE_EXISTING = true;

var download = function(folder, info, callback){
	var uri = info.url;
	var filename = path.join('debug', 'data', folder, 'images', info.filename);

	request.head(uri, function(err, res, body){
		// console.log('content-type:', res.headers['content-type']);
		// console.log('content-length:', res.headers['content-length']);

		console.log("Image type", res.headers['content-type'])
		request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
	});
};

var uniques = {};



function scrapeFolder(name, done) {
	var folder = path.join('debug', 'data', name);
	var input = JSON.parse( fs.readFileSync(path.join(folder, 'data.json'), 'utf8') );

	var imgFiles = fs.readdirSync(path.join(folder, 'images'));
	
	
	var images = input.map(function(item) {
		var ext = path.extname( item.thumbnail );

		var file;
		if (item.company)
			file = slug(item.title + '-' + item.company.name + '-' + item.date.replace(',',''));
		else 
			file = slug(item.name);

		if (file in uniques) {
			file += '-'+(uniques[file]);
			uniques[file]++;
			console.warn("Fixing unique...", file);
		} else {
			uniques[file] = 0;
		}

		file += ext;

		var url = urlJoin(base, item.thumbnail);

		item.image = file;

		return {
			url: url,
			filename: file
		}
	});

	if (IGNORE_EXISTING) {
		images = images.filter(function(i) {
			return imgFiles.indexOf( i.filename ) === -1;
		});
		console.log("Remaining: ", images.length);
	}
	

	var jsonOut = JSON.stringify( input, undefined, PRETTY_PRINT ? 2 : undefined );
    fs.writeFileSync( path.join(folder, 'data.json'), jsonOut);

	async.eachLimit( images, 20, download.bind(this, name), done );
}

async.eachSeries(folders, scrapeFolder, function(err) {
	if (err)
		console.error(err);
	console.log("Finished scraping images.");
})