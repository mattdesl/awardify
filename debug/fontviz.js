var fonts = require('./fonts/google-fonts.json')

var decompose = require('fontpath-shape2d')
var triangulate = require('shape2d-triangulate')
var strokeTris = require('./lib/stroke-triangles')
var getPxScale = require('fontpath-util').getPxScale

var CanvasApp = require('canvas-app')


var d3 = require('d3-browserify')
console.log(fonts.length)


function steinerPoints(glyph, N) {
    var steinerPoints = [];
    N = N||200;
    for (var count=0; count<N; count++) {
        var dat = { 
            x: Math.round(Math.random()*(glyph.width+glyph.hbx)), 
            y: -glyph.hby + Math.round(Math.random()*(glyph.height+glyph.hby)) 
        };
        steinerPoints.push(dat);
    }
    return steinerPoints
}

function tris(font, glyph) {
    var shapes = decompose(glyph).map(function(s) {
        return s.simplify( font.units_per_EM * 0.15, s )
    })
    var p = steinerPoints(glyph, 400);
    return triangulate( shapes, p )
}

var cache = {};
var time = 0
var CHAR = 'A'
fonts.forEach(function(f) {
    putCache(f, CHAR)
})

function putCache(font, chr) {
    var triangles;  
    var glyph = font.glyphs[chr]

    if (!(font.name in cache)) {
        triangles = tris(font, glyph)
        cache[font.name] = triangles
    } else
        triangles = cache[font.name]

    return triangles
}

function renderGlyph(context, tx, ty, font, chr, size) {
    var triangles = putCache(font, chr)
    var glyph = font.glyphs[chr]
    var scale = getPxScale(font, 400 * size)

    var gw = (glyph.width+glyph.hbx*2)*scale,
        gh = glyph.height*scale;
    strokeTris(context, triangles, scale, tx - gw/2, ty + gh/2)
}

// testbed(function(context, width, height) {
//     context.clearRect(0,0,width,height)

//     var font = fonts[ ~~( (time+=0.1) % fonts.length ) ]
//     renderGlyph(context, font, 'A')
    
// }, {
//     // once: true
// });


require('domready')(function() {

    var width = window.innerWidth,
        height = window.innerHeight,
        padding = 1.5, // separation between same-color nodes
        clusterPadding = 2, // separation between different-color nodes
        maxRadius = 152;

    var app = CanvasApp({
        width: width,
        height: height
    })

    var context = app.context

    document.body.appendChild(app.canvas)
    document.body.style.margin = '0'
    document.body.style.overflow = 'hidden'

    var n = fonts.length, // total number of nodes
        m = fonts.length; // number of distinct clusters

    var color = d3.scale.category10()
        .domain(d3.range(m));

    // The largest node for each cluster.
    var clusters = new Array(m);

    var nodes = d3.range(n).map(function(el, index) {
      var i = index;
          // r = Math.sqrt((i + 1) / m * -Math.log(Math.random())) * maxRadius;

      r = maxRadius * fonts[index].frequency 

      var d = { 
        cluster: i, radius: r,
        font: fonts[index], 
        frequency: fonts[index].frequency
      };
      if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
      return d;
    });


    // Use the pack layout to initialize node positions.
    d3.layout.pack()
        .sort(function(a, b) {
            return b.frequency - a.frequency
        })
        .size([width, height])
        .children(function(d) { return d.values; })
        .value(function(d) { return d.radius * d.radius; })
        .nodes({values: d3.nest()
          .key(function(d) { return d.cluster; })
          .entries(nodes)});

    var force = d3.layout.force()
        .nodes(nodes)
        .size([width, height])
        .gravity(.06)
        .charge(10)
        .on("tick", tick)
        .start();

    var svg = d3.select("body")
        .attr("width", width)
        .attr("height", height);

    var node = svg.selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        // .style("fill", function(d) { return color(d.cluster); })
        // .call(force.drag);


    node.transition()
        .duration(750)
        .delay(function(d, i) { return i * 5; })
        .attrTween("r", function(d) {
          var i = d3.interpolate(0, d.radius);
          return function(t) { return d.radius = i(t); };
        });

    function tick(e) {
        node
          .each(cluster(10 * e.alpha * e.alpha))
          .each(collide(0.5))

        context.clearRect(0,0,width,height)

        context.save()
        var s = 0.05
       context.translate(width/2,height/2)
        context.scale(s,s)
        context.beginPath()
        context.lineWidth = 7
        node.each(function(e) {
            renderGlyph(context, e.x, e.y, e.font, CHAR, e.radius / maxRadius)
        })


        context.lineStyle = 'black'
        context.stroke()

        context.beginPath()
        context.lineWidth = 2
        node.each(function(e) {
            context.arc(e.x, e.y, e.radius, Math.PI*2, 0, false)
        })
        context.stroke()
        context.restore()

    }

    // Move d to be adjacent to the cluster node.
    function cluster(alpha) {
      return function(d) {
        var cluster = clusters[d.cluster];
        if (cluster === d) return;
        var x = d.x - cluster.x,
            y = d.y - cluster.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + cluster.radius;
        if (l != r) {
          l = (l - r) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          cluster.x += x;
          cluster.y += y;
        }
      };
    }

    // Resolves collisions between d and all other circles.
    function collide(alpha) {
      var quadtree = d3.geom.quadtree(nodes);
      return function(d) {
        var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
            nx1 = d.x - r,
            nx2 = d.x + r,
            ny1 = d.y - r,
            ny2 = d.y + r;
        quadtree.visit(function(quad, x1, y1, x2, y2) {
          if (quad.point && (quad.point !== d)) {
            var x = d.x - quad.point.x,
                y = d.y - quad.point.y,
                l = Math.sqrt(x * x + y * y),
                r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
            if (l < r) {
              l = (l - r) / l * alpha;
              d.x -= x *= l;
              d.y -= y *= l;
              quad.point.x += x;
              quad.point.y += y;
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
      };
    }
})