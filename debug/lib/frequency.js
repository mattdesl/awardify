module.exports = function (data) {
    var dict = {};

    //determine freq
    data.forEach(function(d) {
        if (d in dict)
            dict[d]++;
        else 
            dict[d] = 1;
    });

    //make array
    var sorted = [];
    for (var k in dict) {
        sorted.push({ value: k, frequency: dict[k] });
    }

    //sort & return
    return sorted.sort(function(a, b) {
        return b.frequency - a.frequency;
    });
}