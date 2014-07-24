var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var path = require('path');
var URL = require('url');
var chalk = require('chalk');

var sotd = require('./debug/data/sotd/data.json');

var CACHE_PATH = './.scrape-cache.json';
var cache = getCache();

var parseCSSFonts = require('./scrape-stylesheet.js');

function getCache() {
    if (process.argv[2] === '--clean')
        return {};
    if (fs.existsSync(CACHE_PATH)) {
        return JSON.parse( fs.readFileSync(CACHE_PATH, 'utf8') ); 
    }
    return {};
}

function putCache() {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}


function scrapeStyleSheet(url, done) {
    done();
}

function findFonts(css) {

}

var count = 0;

function scrape(url, done) {
    if (count % 50 === 0)
        putCache();
    count++;


    var error;
    if (typeof url !== 'string' || !url) 
        error = 'url is not a string';
    //ehhh... problematic ones
    else if (url === 'http://squaredeye.com'
            || url === 'http://ogreen.special-t.com/') {
        error = 'could not connect';
    }

    if (error) {
        if (url in cache) {
            cache[url].error = error;
        } else {
            cache[url] = {
                url: url,
                styleSheets: [],
                error: error,
                fontStyles: [],
                fontFamilies: []
            }
        }
            
        return done();
    }


    if (url in cache) {
        // var styles = cache[url];
        //async.eachSeries(styles, scrapeStyleSheet, done);
        return done();
    }

    console.log("Requesting", url);
    
    request({ url: url, maxRedirects: 3, timeout: 5000 }, function(err, resp, body) {
        if (err) {
            console.error(chalk.red("Error with page"), url, err.message);
            cache[url] = {
                url: url,
                styleSheets: [],
                fontStyles: [],
                error: err.message
            };
            done();
            return;
        }

        var $ = cheerio.load(body);
        var head = $('head');
            
        var item = {
            url: url,
            styleSheets: [],
            fontStyles: []
        };

        $('link').each(function(el) {
            var styleHref = $(this).attr('href');
            var type = $(this).attr('rel');

            var expectStyle = type === 'stylesheet';

            if (expectStyle || path.extname(styleHref) === '.css') {
                var resolved = URL.resolve(String(url), String(styleHref))
                item.styleSheets.push(resolved);
                console.log("Found style sheet", resolved)
            }
        });

        $('style').each(function(el) {
            var txt = $(this).html();
            console.log("Scraping inline <style> for", url);
            parseCSSFonts(item, txt);
        });

        if (url in cache) {
            console.log("URL ALREADY IN CACHE!", url);
            // cache[url].sheets = item;
        } else {
            cache[url] = item;
        }

        // async.eachSeries(item, scrapeStyleSheet, done);
        if (done)
            done();
        // console.log(head);
    });
}


var urls = sotd.map(function(s) {
    return s.url;
});
// scrape('http://interactions.webflow.com')

async.eachLimit(urls, 10, scrape, function() {
    console.log("DONE SCRAPING",count);
    putCache();
});