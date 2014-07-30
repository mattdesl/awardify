var fs = require('fs');
var path = require('path');
var fontCache = require('../.font-cache.json')
var xtend = require('xtend')

function getInfo(name) {
    return fontCache.filter(function(f) {
        return f.name === name
    })[0]
}

module.exports = function() {
    var input = path.join('debug', 'data', 'sotd', 'fonts', 'out')
    fs.readdir( input, function(err, list) {
        if (err)
            throw err;

        var result = list.filter(function(f) {
            return path.extname(f) === '.json'
        }).map(function(f) {
            var base = path.basename(f, '.ttf.json')
            
            var info = getInfo(base)
            if (!info)
                throw new Error("err with "+base)

            var obj = JSON.parse( fs.readFileSync( path.join(input, f) ) )
            
            obj = xtend(obj, info)
            return obj
        })

        fs.writeFile(path.join('debug', 'fonts', 'google-fonts.json'), JSON.stringify(result))
    })
}

if (require.main === module)
    module.exports();