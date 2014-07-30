var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var path = require('path');

var sections = {
    'awards-of-the-day': {
        folder: 'sotd',
        total: 122
    },
    'awards-of-the-month': {
        folder: 'sotm',
        total: 5
    },
    'winners-list': {
        folder: 'winners',
        total: 61
    }
}

var PRETTY_PRINT = true;

function scrapeAward(data, section, index, next) {
    var base = 'http://www.awwwards.com/'+section+'?page=';

    index = index||0; //page 0 is giving us duplicates.. start with 1 instead
    request(base + index, function(err, resp, body) {
        if (err) {
            console.error("Error with page", index);
            next(err);
            return;
        }

        var $ = cheerio.load(body);
        
        var li = $('ul.grid').children();
        li.each(function(i) {
            var el = $(this);

            var result = {};
            result.title = el.find('h3 > a').text();
            result.hearts = parseInt( el.find('span.total').text(), 10 );

            var rows = el.find('div.row');
            
            var info1 = rows.eq(0).find('strong')
            var href = info1.eq(0).find('a');
            result.company = {
                name: href.text(),
                url: href.attr('href')
            };
            result.location = info1.eq(1).text();
            result.score = parseFloat( info1.eq(2).text() );
            result.date = rows.eq(1).text().trim();

            result.url = el.find('a.bt-url').attr('href');


            //grab image and other details
            var fig = el.find('figure');
            var img = fig.find('img');
            result.thumbnail = img.attr('src');
            result.developerAward = fig.find('div.label.developer').length > 0;

            console.log(result.title);
            data.push(result);
        })

        next();
    });
}

function scrapeWinners(data, section, index, next) {
    var base = 'http://www.awwwards.com/winner-list/?page=';

    index = index||0; //page 0 is giving us duplicates.. start with 1 instead
    request(base + index, function(err, resp, body) {
        if (err) {
            console.error("Error with page", index);
            next(err);
            return;
        }

        var $ = cheerio.load(body);
        
        var li = $('ul.list-table.winners').children();
        li.each(function(i) {
            var el = $(this);

            var result = {};
            
            result.thumbnail = el.find('figure.rollover > a > img').attr('src');
            result.name = el.find('.info > h3.bold > a').text().trim();
            var info = el.find('.col.n-1 > .row');
            result.url = info.eq(0).find('a').attr('href');
            result.location = info.eq(1).text().trim().replace(/\s{2,}/g, ' ');
            result.description = el.find('.col.n-2 > p').text().trim().replace(/\s{2,}/g, ' ');

            var awardList = el.find('.list-number-awards');
            result.awards = {
                sotd: parseInt( awardList.find('.sotd').text(), 10 ),
                developer: parseInt( awardList.find('.developer').text(), 10 ),
                sotm: parseInt( awardList.find('.sotm').text(), 10 ),
                soty: parseInt( awardList.find('.soty').text(), 10 )
            };

            if (!result.name && result.url) {
                var matches = result.url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
                var domain = matches && matches[1];  // domain will be null if no match is found
                result.name = domain||'';
            }

            console.log("Winner: ", result.name);
            data.push(result);
        });
        next();
    });
}

function scrape(data, section, index, next) {
    if (section.indexOf('winners-list')===0) 
        scrapeWinners(data, section, index, next);
    else
        scrapeAward(data, section, index, next);
}


function scrapeSection(sectionName, next) {
    var data = [];

    var pages = [];
    var max = sections[sectionName].total;
    for (var i=0; i<max; i++)
        pages.push(i+1);

    async.eachSeries(pages, scrape.bind(this, data, sectionName), function(err) {
        if (err)
            console.error("Error: ", err);
        else {
            var folderName = sections[sectionName].folder;
            var jsonOut = JSON.stringify( data, undefined, PRETTY_PRINT ? 2 : undefined );
            fs.writeFile( path.join('debug', 'data', folderName, 'data.json'), jsonOut);
        }
        console.log("Finished section "+sectionName+", count:", data.length);
        next(err);
    })
}

async.eachSeries(Object.keys(sections), scrapeSection, function(err) {
    if (err)
        console.error("Scrape error:", err);
    console.log("All scrapes complete.");
})

    