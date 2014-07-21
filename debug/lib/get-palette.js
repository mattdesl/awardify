var quantize = require('quantize');

module.exports = function(pixels, width, count, quality) {
	count = typeof count === 'number' ? count : 5;
	quality = typeof quality === 'number' ? quality : 10;

    // Store the RGB values in an array format suitable for quantize function
    var pixelArray = [],
    	step = 4*quality;

    for (var i=0, len=pixels.length; i<len; i+=step) {
    	var r = pixels[i + 0],
	        g = pixels[i + 1],
	        b = pixels[i + 2],
	        a = pixels[i + 3];

        // If pixel is mostly opaque and not white
        if (a >= 125) {
            if (!(r > 250 && g > 250 && b > 250)) {
                pixelArray.push([r, g, b]);
            }
        }
    }

    var cmap = quantize(pixelArray, count);

    //get the size of each
    var total = 0;

    palette = cmap.vboxes.map(function(vb) {
	    var size = vb.vbox.count() * vb.vbox.volume();
        total += size;
	    return {
	    	color: vb.color,
	    	size: size,
            amount: 0
	    }
	});

    //normalize the size..  
    palette.forEach(function(p) {
    	p.amount = p.size/total;
    });

    //quantize.js doesn't support < 4
    if (count < palette.length)
    	palette = palette.slice(0, count);
    
    return palette;
}