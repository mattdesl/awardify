var async = require('async');
var urlJoin = require('url-join');

var testbed = require('canvas-testbed');
var data = require('./data/sotd/data.json');
var baseImagePath = 'data/sotd/images/';
var xtend = require('xtend');

var App = require('./lib/draw');
	
console.log("Total", data.length);
data = data.slice(0, 50);



function addImage(app, item, done) {
	var img = new Image();
	img.src = urlJoin( baseImagePath, item.image );
	img.onload = function() {
		var result = xtend({}, item);
		app.addItem(result, img);
		done();
	};
	img.onerror = function() {
		done('could not find image');
	};
}

require('domready')(function() {
	var targetWidth = 64;

	var app = App();
	app.start();

	document.body.style.margin = '0';
	document.body.style.overflow = 'hidden';
	document.body.appendChild(app.canvas);

	async.eachLimit( data, 20, addImage.bind(this, app), function(err) {
		if (err)
			console.error(err);
		console.log("All images added", app.data.length);
	});


	window.addEventListener('keydown', function(ev) {
		var code = ev.which || ev.keyCode;
		if (code === 32) {
			app.stop();
			console.log("Total count", app.data.length);
			saveImage(app.canvas);
		}
	})
});



function saveImage(canvas) {
	var dataURL = canvas.toDataURL("image/png");

	var displayWidth = canvas.width,
		displayHeight = canvas.height;
	var imageWindow = window.open("", "fractalLineImage",
                          "left=0,top=0,width="+800+",height="+500+",toolbar=0,resizable=0");
	imageWindow.document.write("<title>Export Image</title>")
	imageWindow.document.write("<img id='exportImage'"
	                             + " alt=''"
	                             + " height='" + displayHeight + "'"
	                             + " width='"  + displayWidth  + "'"
	                             + " style='position:absolute;left:0;top:0'/>");
	imageWindow.document.close();
	var exportImage = imageWindow.document.getElementById("exportImage");
	exportImage.src = dataURL;
}