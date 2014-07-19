//packs squares into a texture

var Texture = require('kami-texture');
var TextureRegion = require('texture-region');
var nextPowerOfTwo = require('number-util').nextPowerOfTwo;

function SquarePacker(context, cols, rows) {
	this.context = context;
	this.cols = cols;
	this.rows = typeof rows === 'number' ? rows : cols;

	this.textures = [];
	this.regions = [];

	this._nextTexture = null;
	this._nextCount = 0;
}

//Assumes that all images are equal size...
SquarePacker.prototype.pack = function(image) {
	if (!this.imageWidth || !this.imageHeight) {
		this.imageWidth = image.width;
		this.imageHeight = image.height;

		this.width = this.cols * this.imageWidth;
		this.height = this.rows * this.imageHeight;

		this.textureWidth = nextPowerOfTwo(this.width);
		this.textureHeight = nextPowerOfTwo(this.height);

		console.log(this.textureWidth, this.textureHeight)

		var max = this.context.getParameter(this.context.MAX_TEXTURE_SIZE);
		if (this.width > max || this.height > max)
			throw new Error("width or height is over max size:", max);

	} 

	var imageWidth = this.imageWidth;
	var imageHeight = this.imageHeight;


	var width = this.width,
		height = this.height;

	var numX = Math.floor(width / imageWidth),
		numY = Math.floor(height / imageHeight);

	//get ready to start a new texture page...
	if (this._nextCount > (this.rows*this.cols)-1) {
		this._nextCount = 0;
	}

	//first frame, build a new texture
	if (this._nextCount === 0) {
		console.log("Next texture")
		this._nextTexture = new Texture(this.context, {
			width: this.textureWidth,
			height: this.textureHeight
		});
		// this._nextTexture.setFilter(Texture.Filter.LINEAR_MIPMAP_LINEAR, Texture.Filter.LINEAR);

		this.textures.push(this._nextTexture);
	} 

	var i = this._nextCount;
	var x = Math.floor((i % numX) * imageWidth),
	    y = Math.floor(~~( i / numX ) * imageHeight);

    //upload the image data into the texture
	this._nextTexture.uploadSubImage(image, x, y);
	// this._nextTexture.generateMipmap();

	var region = new TextureRegion(this._nextTexture, x, y, imageWidth, imageHeight);
	this.regions.push(region);
		
	this._nextCount++;
	return region;
};

module.exports = SquarePacker;