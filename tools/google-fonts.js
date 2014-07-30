var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var path = require('path');
var URL = require('url');
var chalk = require('chalk');
var querystring = require('querystring');

var parseCSS = require('css').parse;
var frequency = require('../debug/lib/frequency')
var uniq = require('../debug/lib/uniq')

var CACHE_PATH = './.scrape-cache.json';
var cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
var mime = require('mime');

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

function getTrimmedNames(s) {
    var families = [];

    var dat = querystring.parse( URL.parse(s).query );
    if (dat.family) {
        families = dat.family.split('|').map(function(f) {
            if (f.indexOf('family')===0)
                return f.substring('family'.length+1);

            return f;
        }).filter(function(f) {
            return !(f===''||f.charAt(0)==='.')
        });
    }
    return families.map(function (f) {
        return f.replace(/(:.*$)/g, '');
    })
}

var googleFontSheets = allSheets.filter(function(s) {
    return s.indexOf('http://fonts.googleapis.com/') === 0;
});

console.log("Total Sheets", allSheets.length);
console.log("Total Google Font Style Sheets", googleFontSheets.length)

var googleFonts = googleFontSheets
        .map(getTrimmedNames)
        .reduce(function(a, b) {
            return a.concat(b)
        })

var googleFontNames = frequency( googleFonts );
var uniqueFonts = uniq( googleFonts );



// seems like a lot?
var ascii = [];
for (var i=33; i<=126; i++)
    ascii.push(String.fromCharCode(i));
ascii = ascii.join('')

// var textChars = ascii;
var textChars = 'Abc'
var cssURL = 'http://fonts.googleapis.com/css?family=' + uniqueFonts.join('|') + '&text=' + textChars;

// console.log(uniqueFonts.length)


function saveFont(font, callback) {
    var folder = 'sotd';
    var filename = path.join('debug', 'data', folder, 'fonts');
    
    request.head(font.url, function(err, res, body){
        if (err)
            throw err
        var ext = res.headers['content-type'].split('/')[1]
        filename = path.join(filename, font.name+'.'+ext);

        request(font.url).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
}

function from(fonts, name) {
    return fonts.filter(function(f) {
        return f.name === name;
    })[0]
}

//find associated sites using that fony family 

function freq(name) {
    var r =  googleFontNames.filter(function(g) {
        return g.value === name
    })
    return r[0].frequency
}

function addDetails(font) {

    var sites = items
        .filter(function(i) {
            return i.styleSheets.length > 0
        })
        .map(function(i) {
            var families = i.styleSheets
                    .filter(function(s) {
                        return googleFontSheets.indexOf(s) !== -1
                    })
                    .map(getTrimmedNames)
            if (families.length>0) {
                families = families.reduce(function(a,b) {
                    return a.concat(b)
                })
            }

            return { 
                url: i.url, 
                families: families
                    
            }
        }).filter(function(n) {
            return n.families.indexOf(font.name) !== -1;
        });

    font.sites = sites;
    font.frequency = freq(font.name)
}

request(cssURL, function(err, resp, body) {
    var result = parseCSS(body);
    var fonts = [];

    result.stylesheet.rules.forEach(function(r) {
        if (r.type !== 'font-face')
            return;

        var fontName = '';
        var ttfURL = '';
        
        r.declarations.forEach(function(d) {
            if (d.type === 'declaration') {
                if (d.property ==='font-family') 
                    fontName = d.value.replace(/(^')|('$)/g, '').trim();    
                else if (d.property === 'src') {
                    ttfURL =  /url\((.*?)\)/ig.exec(d.value)[1] 
                }
            } 
        });
        if (!fontName || !ttfURL)
            console.warn("Skipping", r);
        else
            fonts.push({ url: ttfURL, name: fontName });
    });

    fonts.forEach(addDetails);    

    fs.writeFileSync('./.font-cache.json', JSON.stringify(fonts, null, 2))

    if (process.argv[2] === '--save') {
        async.eachSeries(fonts, saveFont, function(err) {
            console.log("DONE")
        })   
    }
});

// googleFontNames.forEach(function(f) {
//     console.log(f.frequency+': '+f.value);
// })
