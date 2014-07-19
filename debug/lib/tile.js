module.exports = function(batch, packer, width, height, downscale, texOverride, colorOverride, alpha) {
	var regions = packer.regions;

	downscale = typeof downscale === 'number' ? downscale : 1;

	var imageWidth = packer.imageWidth*downscale,
		imageHeight = packer.imageHeight*downscale;

	var numX = Math.ceil(width / imageWidth),
		numY = Math.ceil(height / imageHeight);

	for (var i=0; i<regions.length; i++) {
		var tile = regions[i];
		var x = Math.floor((i % numX) * imageWidth),
		    y = Math.floor(~~( i / numX ) * imageHeight);


	    if (texOverride && colorOverride) {
	    	var color = colorOverride[i][0];
	    	batch.setColor(color[0]/255, color[1]/255, color[2]/255, alpha);
	    	batch.draw(texOverride, x, y, imageWidth, imageHeight);	
	    } else {
	    	batch.setColor(1);
			batch.drawRegion(tile, x, y, imageWidth, imageHeight);
	    }
	}
};