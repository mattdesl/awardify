var getPalette = require('./get-palette');
var getPixels = require('get-pixels');

module.exports = function(path, callback, count) {
	count = typeof count === 'number' ? count : 5;

	getPixels(path, function(err, pixels) {
		if (err){
			callback(err);
			return;
		}
		var shape = pixels.shape;
		var width = shape[1],
			height = shape[0],
			numComponents = shape[2];
		if (numComponents !== 4) 
			callback('not RGBA: ',path);
		else {

			var uint = new Uint8Array(pixels.data.length);
			for (var i=0; i<uint.length; i++)
				uint[i] = pixels.data[i];

			var pal = getPalette(uint, width, count);
			callback(null, pal);
		}
	});
};