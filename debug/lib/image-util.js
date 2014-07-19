var canvas = document.createElement("canvas");
var context = canvas.getContext("2d");
var ColorThief = require('color-thief');

var thief = new ColorThief();

module.exports.resize = function(image, newWidth, newHeight) {
	canvas.width = newWidth;
	canvas.height = newHeight;

	context.clearRect(0, 0, newWidth, newHeight);
	context.drawImage(image, 0, 0, newWidth, newHeight);
	return canvas;
};

module.exports.getContext = function() {
	return context;
}

module.exports.getPalette = function(colorCount, quality) {
	var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
	return thief.getPaletteFromArray(imgData.data, canvas.width, canvas.height, colorCount, quality);
};

module.exports.getPaletteColor = function() {
	return module.exports.getPalette(5)[0];
};