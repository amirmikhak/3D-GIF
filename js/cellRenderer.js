var CellRenderer = function CellRenderer(cell, opts) {

    var _cell = cell;

    Object.defineProperty(this, 'cell', {
        get: function() { return _cell; }
    });

    this.getDefaultOptions = function() {
        return {};
    };

    return this;

};

CellRenderer.prototype.render = function() {};
