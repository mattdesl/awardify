var CanvasApp = require('canvas-app');
var getContext = require('webgl-context');

var Batcher = require('kami-batch');
var Texture = require('kami-texture');
var WhiteTexture = require('kami-white-texture');

var imgUtil = require('./image-util');

var SquarePacker = require('./SquarePacker');

var tile = require('./tile');

var ColorThief = require('color-thief');

function Draw() {
	if (!(this instanceof Draw))
		return new Draw();



	CanvasApp.call(this, this.render.bind(this), {
		context: 'webgl',
		contextAttributes: {
			preserveDrawingBuffer: true,
			alpha: false,
		},
	});

	this.whiteTexture = new WhiteTexture(this.context);
	this.colors = [];
	this.packer = null;
	this.data = [];
	//texture pages
	this.pages = [];
	this.batch = new Batcher(this.context);

	this.targetWidth = undefined;
};


Draw.prototype = Object.create(CanvasApp.prototype);

Draw.prototype.addItem = function(item, image) {
	//first run
	if (!this.packer) {
		var targetWidth = typeof this.targetWidth === 'number' ? this.targetWidth : image.width;

		this.imageWidth = Math.ceil(targetWidth);
		this.imageHeight = Math.ceil(targetWidth * 1/(image.width/image.height));

		this.packer = new SquarePacker(this.context, 5, 5);
	}

	image = imgUtil.resize(image, this.imageWidth, this.imageHeight);

	// var color = imgUtil.getPalette();
	// this.colors.push( color );
	
	this.packer.pack(image);

	this.data.push(item);
};



Draw.prototype.render = function(context, width, height) {
	var gl = this.context;
	var batch = this.batch;

	gl.clearColor(1,1,1,1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.viewport(0, 0, width, height);

	var data = this.data;
	if (data.length===0)
		return;

	batch.begin();
	batch.resize(width, height);

	var down = 0.25;
	tile(batch, this.packer, width, height, down);
	// tile(batch, this.packer, width, height, down, this.whiteTexture, this.colors, 0.5);


	// batch.draw(this.packer.textures[0], 0, 0, this.packer.textureWidth/4, this.packer.textureHeight/4);

	batch.end();
};

/* 2d canvas
Draw.prototype.render = function(context, width, height) {
	context.clearRect(0,0,width,height);	

};*/

module.exports = Draw;