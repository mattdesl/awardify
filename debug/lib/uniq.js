module.exports = function(array) {
    return array.filter(function(elem, pos, self) {
        return self.indexOf(elem) == pos;
    });
}
