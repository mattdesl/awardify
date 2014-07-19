module.exports = function(batch, packer, width, height, downscale) {
	var textures = packer.textures;

	downscale = typeof downscale === 'number' ? downscale : 1;

	var imageWidth = textures[0].width*downscale,
		imageHeight = textures[0].height*downscale;

	var numX = Math.ceil(width / (packer.width*downscale)),
		numY = Math.ceil(height / (packer.height*downscale));

	for (var i=0; i<textures.length; i++) {
		var tile = textures[i];
		var x = Math.floor((i % numX) * packer.width * downscale),
		    y = Math.floor(~~( i / numX ) * packer.height * downscale);

		batch.draw(tile, x, y, imageWidth, imageHeight);
	}
};