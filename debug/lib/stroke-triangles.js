module.exports = function(context, triangles, scale, x, y) {
    for (var i=0; i<triangles.length; i++) {
        var t = triangles[i]
        var p0 = t.getPoint(0)
        var p1 = t.getPoint(1)
        var p2 = t.getPoint(2)

        context.moveTo(p0.x * scale + x, p0.y * -scale + y)
        context.lineTo(p1.x * scale + x, p1.y * -scale + y)
        context.lineTo(p2.x * scale + x, p2.y * -scale + y)
        context.lineTo(p0.x * scale + x, p0.y * -scale + y)
    }
}