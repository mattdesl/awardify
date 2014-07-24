var fs = require('fs');
// var request = require('request');
// var cheerio = require('cheerio');
// var async = require('async');
var path = require('path');
var URL = require('url');
var chalk = require('chalk');
var querystring = require('querystring');

var parseCSS = require('css').parse;
var frequency = require('./debug/lib/frequency')
var uniq = require('./debug/lib/uniq')

var CACHE_PATH = './.scrape-cache.json';
var cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));


var items = [];
for (var i in cache) {
    var item = cache[i];
    items.push(item);
}

var allSheets = items.map(function(i) {
    return i.styleSheets
}).reduce(function(a, b) {
    return a.concat(b)
})

var googleFontSheets = allSheets.filter(function(s) {
    return s.indexOf('http://fonts.googleapis.com/') === 0;
});

console.log("Total Sheets", allSheets.length);
console.log("Total Google Font Style Sheets", googleFontSheets.length)

var googleFonts = googleFontSheets.map(function(s) {
    var families = [];

    var dat = querystring.parse( URL.parse(s).query );
    if (dat.family) {
        families = dat.family.split('|').map(function(f) {
            if (f.indexOf('family')===0)
                return f.substring('family'.length);
            return f;
        }).filter(function(f) {
            return !(f===''||f.charAt(0)==='.')
        });
    }
    return families;
}).reduce(function(a, b) {
    return a.concat(b)
}); 

function trimWeight(f) {
    return f//.replace(/(:.*$)/g, '');
}

var googleFontNames = frequency( googleFonts.map(trimWeight) );

var uniqueFonts = uniq( googleFonts.map(trimWeight) );

// console.log(uniqueFonts)
var textChars = 'A';
var cssURL = 'http://fonts.googleapis.com/css?family=' + uniqueFonts.join('|') + '&text=' + textChars;

console.log(cssURL);
// console.log(googleFontNames)
