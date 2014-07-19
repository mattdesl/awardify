var winners = require('./data/winners/data.json');
var colors = require('./lib/colors');
var path = require('path');
var fs = require('fs');
var async = require('async');

var list = [
	{ name: 'sotd', data: require('./data/sotd/data.json') },
	// { name: 'sotm', data: require('./data/sotm/data.json') }
];



function sortBy(entry, a, b) {
	return b[entry] - a[entry];
}

function print(item) {
	console.log(item.title+' - by '+item.company.name);
}

function removeDuplicates(list) {
	return list.filter(function(elem, pos, self) {
	    return self.indexOf(elem) == pos;
	})
}

function getAgencies(agencyList) {
	//edge cases
	if (agencyList === 'MoreSleep'
		|| agencyList === 'Zero Zero Project')
		return agencyList;
	if (agencyList === 'Tool of North America')
		return 'Tool of NA';

	var compare = agencyList.toLowerCase();

	//if the whole word matches exactly one agency, return that...

	var ret = [];

	var matches = winners.filter(function(w) {
		return w.name.toLowerCase() === compare;
	});

	if (matches.length>0) {
		return [ matches[0].name ];
	}

	winners.forEach(function(w) {
		var name = w.name.toLowerCase();
		var regex = new RegExp('(^|\\s|,)'+name+'(\\s|$|,)');
		if (name && regex.test(compare)) {
			ret.push(w.name);
		}
	});

	ret = removeDuplicates(ret);

	if (ret.length === 0)
		return agencyList;

	return ret;
}

function frequencies(data) {
	var dict = {};

	//determine freq
	data.forEach(function(d) {
		if (d in dict)
			dict[d]++;
		else 
			dict[d] = 1;
	});

	//make array
	var sorted = [];
	for (var k in dict) {
		sorted.push({ value: k, frequency: dict[k] });
	}

	//sort & return
	return sorted.sort(function(a, b) {
		return b.frequency - a.frequency;
	});
};

function parseColor(name, output, element, next) {
	var img = path.join('data', name, 'images', element.image);
	
	colors(img, function(item, err, palette) {
		if (err) {
			console.error("Bad image path", path, err);
			palette = [];
		} 

		output.push({ image: item.image, palette: palette });
		next(err);
	}.bind(this, element))
}

function writePalette(palettes, name) {
	var f = path.join('data', name, 'palettes.json');

	fs.writeFile(f, JSON.stringify(palettes, undefined, 2));
}

list.forEach(function(d) {
	var name = d.name;
	var data = d.data;
	console.log("--- "+name);
	console.log("--- "+data.length + ' items');

	var sortedData = d.data.slice(0);
	sortedData.sort(sortBy.bind(this, 'score'));
	sortedData.slice(0, 5).forEach(print);
	console.log();

	// var paletteOutput = [];
	// console.log("Getting palettes..")
	// async.eachLimit(data, 20, parseColor.bind(this, name, paletteOutput), function(err) {
	// 	console.log("Done parsing images.");
	// 	writePalette(paletteOutput, name);
	// })

	console.log();

	//some items have multiple agencies in one, so we need to reduce those..
	var agencyList = [];
	data.forEach(function(e) {
		agencyList = agencyList.concat( getAgencies(e.company.name) );
	});

	var freq = frequencies(agencyList);
	console.log("Best agencies:")
	console.log(freq.slice(0, 10))
})