var winners = require('./data/winners/data.json');
var path = require('path');
var fs = require('fs');
var async = require('async');
var frequencies = require('./lib/frequency');

var list = [
	{ name: 'sotd', data: require('./data/sotd/data.json') },
	{ name: 'sotm', data: require('./data/sotm/data.json') }
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




list.forEach(function(d) {
	var name = d.name;
	var data = d.data;
	console.log("--- "+name);
	console.log("--- "+data.length + ' items');

	var sortedData = d.data.slice(0);
	sortedData.sort(sortBy.bind(this, 'score'));
	sortedData.slice(0, 5).forEach(print);
	console.log();

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