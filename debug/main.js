var async = require('async');
var urlJoin = require('url-join');

var testbed = require('canvas-testbed');
var xtend = require('xtend');

var test = require('canvas-testbed');

var colorUtils = require('./lib/palette-utils');
var quantize = require('quantize');
var color = require('./lib/color-style');
var weightedPalette = require('./lib/get-palette');

// var data = require('./data/sotd/data.json');

test(render, setup, {
	once: true
});

// var img = new Image();
// img.onload = function() {
// 	test(render, setup, {

// 	})
// }
// img.src = 'data/sotd/images/' + data[Math.floor(Math.random()*data.length)].image;

var palette;

var sharedCanvas, 
	sharedContext;
function getImagePixels(image, context) {
	context = context || sharedContext;

	if (!context) {
		sharedCanvas = document.createElement("canvas");
		sharedContext = sharedCanvas.getContext("2d");
		context = sharedContext;
	}

	var cnv = context.canvas;
	cnv.width = image.width;
	cnv.height = image.height;

	context.clearRect(0,0,cnv.width,cnv.height);
	context.drawImage(image,0,0);
	var data = context.getImageData(0,0,cnv.width,cnv.height);
	return data.data;
}

function setup(context, width, height) {
	// var pixels = getImagePixels(img)
	// palette = weightedPalette(pixels, img.width, 6);
}

function render(context, width, height) {
	context.clearRect(0, 0, width, height);

	// context.drawImage(img, 0, 0);


	context.save();
	context.translate(30, 30);
	

	colorUtils.draw(context, width, height);
	
	// var total = img.width*img.height;

	// var x = 0;
	// for (var i=0; i<palette.length; i++) {
	// 	var p = palette[i];
	// 	context.fillStyle = color(p.color);
	// 	var w = 10;
	// 	var hPerc = p.amount;
	// 	context.fillRect(x, 0, w, 50 * hPerc); 
	// 	x += w;
	// }

	context.restore();
}

