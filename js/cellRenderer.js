var CellRenderer = function CellRenderer(cell, opts) {

    var _cell = cell;

    Object.defineProperty(this, 'cell', {
        get: function() { return _cell; }
    });

    return this;

};

CellRenderer.prototype.render = function() {
    // to be overwritten by "subclasses"
};
