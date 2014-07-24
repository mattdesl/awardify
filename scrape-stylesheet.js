var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var path = require('path');
var URL = require('url');
var chalk = require('chalk');
var querystring = require('querystring');

var parseCSS = require('css').parse;
var frequency = require('./debug/lib/frequency')
var uniq = require('./debug/lib/uniq')

var CACHE_PATH = './.scrape-cache.json';
var cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
var CLEAN = process.argv[2] === '--clean';

function parseCSSFonts(item, cssText) {
    var sheet;
    var dblQuote = /(^['"])|(['"]$)/g

    try {
        sheet = parseCSS(cssText).stylesheet;
    } catch(e) {
        console.log("Error with style sheet", item.url, e.message);
        return;
    }
    var fntFaces = sheet.rules.filter(function(r) {
        return r.type === 'font-face';
    });

    if (!item.fontFamilies || CLEAN)
        item.fontFamilies = [];

    if (fntFaces.length > 0) {
        console.log("Got some font-faces");
        fntFaces.forEach(function(f) {
            f.declarations.forEach(function(dec) {
                if (dec.type === 'declaration' && dec.property === 'font-family') {
                    var val = dec.value.replace(dblQuote, '')
                    if ( CLEAN || item.fontFamilies.indexOf( val ) === -1) {
                        item.fontFamilies.push(val);
                    }
                }
            })
        });
    }

    var imports = sheet.rules.filter(function(r) {
        return r.type === 'import'
    })
    if (imports.length > 0) {
        console.warn(chalk.yellow("Skipping imports for", item.url));
    }

    sheet.rules.forEach(function(r) {
        if (r.type !== "rule")
            return;

        r.declarations.forEach(function(prop) {
            // if (prop === 'font') {
            //     // item.fontStyles.push(prop.value)
            // } else 
            if (prop === 'font-family') {
                item.fontFamilies.push(prop.value.replace(dblQuote, ''));
            }
        })
    });


    item.fontFamilies = uniq(item.fontFamilies);
    item.fontStyles = uniq(item.fontStyles);

    console.log(item.url, item.fontFamilies, item.fontStyles)
}

module.exports = parseCSSFonts;


function scrapeStyleSheet(item, url, done) {
    if (item.checked && !CLEAN) {
        done();
        return;
    }

    if (item.error) {
        item.checked = true
        console.warn(chalk.yellow("Skipping " +item.url));
        done();
        return;
    }

    request({ url: url, maxRedirects: 1 }, function(err, resp, body) {
        if (err) {
            item.error = err.message
            item.checked = true
            console.error(chalk.red("Error with stylesheet: " +url, err.message));
            done();
            return;
        }

        parseCSSFonts(item, body);
        item.checked = true
        cache[item.url] = item;//update cache

        done();
    });
}

if (require.main === module) {
    var items = [];
    for (var i in cache) {
        var item = cache[i];
        items.push(item);
    }

    

    // async.eachSeries(items, function(item, done) {
    //     async.eachLimit(item.styleSheets, 5, scrapeStyleSheet.bind(this, item), done);
    // }, function() {
    //     console.log("FINISHED ALL");
    //     putCache();
    // });

    function putCache() {
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
    }
}