var path = require('path');
var fs = require('fs');
var async = require('async');
var getImagePalette = require('./debug/lib/get-image-palette');

var list = [
	{ name: 'sotd', data: require('./debug/data/sotd/data.json') },
	// { name: 'sotm', data: require('./debug/data/sotm/data.json') }
];

var PRETTY_PRINT = true;



function parseColor(name, output, element, next) {
	var img = path.join('debug', 'data', name, 'images', element.image);
	
	console.log(element.title);
	getImagePalette(img, function(item, err, palette) {
		if (err) {
			console.error("Bad image path", path, err);
			palette = [];
		} 

		//don't need size info..
		palette.forEach(function(p) {
			delete p.size;
		});

		output.push({ image: item.image, palette: palette });
		next(err);
	}.bind(this, element))
}

function writePalette(palettes, name) {
	var f = path.join('debug', 'data', name, 'palettes.json');
	console.log("PAL", palettes.length)
	fs.writeFile(f, JSON.stringify(palettes, undefined, PRETTY_PRINT ? 2 : undefined));
}

list.forEach(function(d) {
	var name = d.name;
	var data = d.data;

	var paletteOutput = [];
	console.log("Getting palettes..")
	async.eachLimit(data, 20, parseColor.bind(this, name, paletteOutput), function(err) {
		console.log("Done parsing images.");
		writePalette(paletteOutput, name);
	})

})