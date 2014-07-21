
var palettes = require('../data/sotd/palettes.json');

var color = require('./color-style');
var rgb2lab = require('color-convert').rgb2lab;
var rgb2hsl = require('color-convert').rgb2hsl;
var rgb2lch = require('color-convert').rgb2lch;
var luminance = require('color-luminance');
var xtend = require('xtend');
// palettes = palettes.slice(0, 2);

var data = require('../data/sotd/data.json');

function getInfo(image) {
	for (var i=0; i<data.length; i++) {
		if (data[i].image === image)
			return data[i];
	}
	return {};
}

function sortByLuminance(a, b) {
	return luminance(b.color[0], b.color[1], b.color[2]) 
				- luminance(a.color[0], a.color[1], a.color[2]);
}

function sortByHue(a, b) {
	return rgb2hsl(b.color)[0] - rgb2hsl(a.color)[0];
}

function sortBySaturation(a, b) {
	return rgb2hsl(b.color)[1] - rgb2hsl(a.color)[1];
}

function sortByAmount(a, b) {
	return b.amount - a.amount;
}

function avgSat(p) {
	var sat = 0;
	for (var i=0; i<p.length; i++) {
		var hsl = rgb2hsl(p[i].color);
		sat += hsl[1];
	}
	return sat / p.length;
}

function avgLum(p) {
	var avg = 0;
	for (var i=0; i<p.length; i++) {
		var c = p[i].color;
		var lum = luminance(c[0], c[1], c[2]);
		avg += lum;
	}
	return (avg / p.length)||0;
}


var NUM_COLORS = 3;

var colorPalettes = palettes.map(function(p) {
	var origPal = p.palette;

	var remainingSum = 0;
	for (var i=NUM_COLORS; i<origPal.length; i++) {
		remainingSum += origPal[i].amount;
	}

	//distribute new percentages
	var pal = origPal.slice(0, NUM_COLORS).map(function(c) {
		return {
			color: c.color,
			amount: c.amount + (remainingSum / NUM_COLORS)
		}
	});

	return xtend({
		palette: pal,
		avgSat: avgSat(pal),
		avgLum: avgLum(pal)
	}, getInfo(p.image));
}).filter(function(p) {
	if (p.palette.length > 0)
		return true;
	console.log("Skipping", p.title);
	return false;
})

colorPalettes.sort(function(a, b) {
	return (b.avgSat - a.avgSat)*1 + (b.avgLum - a.avgLum)*0.1;
});

// colorPalettes.sort(function(a, b) {
// 	return b.score - a.score;
// });




// colorPalettes.sort(function(a, b) {
// 	if (a.length > 0 && b.length > 0) {
// 		var aa = a[0];
// 		var bb = b[0];
// 		if (aa.color.length > 0 && bb.color.length > 0)
// 			return sortBySaturation( aa, bb );
// 	}
// 	return 0;
// });



module.exports.pie = function(context, colors, x, y, r) {
	var start = -Math.PI/2;
	var incr = (Math.PI*2) / (colors.length);

	//make sure that all numbers add up to one...
	var remainder = 0;
	for (var j=0; j<colors.length; j++) {
		remainder += colors[j].amount;
	}
	var delta = 0;
	if (remainder !== 1) 
		delta = remainder < 1 ? (1-remainder) : (-remainder);

	for (var j=0; j<colors.length; j++) {
		var c = colors[j];
		var amt = c.amount + ((j===0) ? delta : 0);
		var incr = (Math.PI*2) * amt;

		// context.strokeStyle
		context.fillStyle = color(c.color);

		context.beginPath();
		context.moveTo(x, y);
		context.arc(x, y, r, start, start+incr, false);
		context.closePath();
		context.fill();
		// context.stroke();
		// r -= 2;
		// r -= r*0.5;
		// r = Math.max(0.5, r);

		start += incr;
	}
}

console.log("total", colorPalettes.length);

module.exports.draw = function(context, width, height) {

	var sz = 14;
	var imageWidth = sz,
		imageHeight = sz;

	var targetWidth = width/2-sz,
		targetHeight = height-sz;
	var numX = Math.floor(targetWidth / imageWidth),
		numY = Math.floor(targetHeight / imageHeight);

	var pad = 1;
	var colors = colorPalettes;

	for (var i=0; i<colors.length; i++) {
		var tile = colors[i];
		var xpos = Math.floor(i%numX),
			ypos = Math.floor(i/numX);

		var r = imageWidth/2;

		var x = (xpos * (imageWidth + pad)),
		    y = (ypos * (imageHeight + pad));
		// x -= r;
		// y -= r;

		// var highlight = /Jam3/i.test(tile.company.name);
		// context.globalAlpha = highlight ? 1.0 : 0.3;
		this.pie(context, tile.palette, x, y, r);
	}
}
