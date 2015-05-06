var Cell = function Cell(opts) {
    var __defaultOptions = {
        row: null,
        column: null,
        depth: null,
        color: [0, 0, 255],    // We'll store colors internally as an RGB array
        on: false,
        renderer: null,
    };

    this._options = {};
    this.__colorAsString = '0,0,255';
    this.__coordAsString = 'null,null,null';

    var _opts = opts || {};
    var _optionKeys = Object.keys(__defaultOptions);
    for (var i = 0, numOpts = _optionKeys.length; i < numOpts; i++) {
        this._options[_optionKeys[i]] = (_optionKeys[i] in _opts) ?
            _opts[_optionKeys[i]] :
            __defaultOptions[_optionKeys[i]];
    }

    applyOptions.call(this, this._options);

    return this;
};

Object.defineProperty(Cell.prototype, 'row', {
    get: function() { return this._options['row']; },
    set: function(newRow) {
        this._options['row'] = newRow;
        this.__coordAsString = this.column + ',' + this.row + ',' + this.depth;
    },
});

Object.defineProperty(Cell.prototype, 'column', {
    get: function() { return this._options['column']; },
    set: function(newColumn) {
        this._options['column'] = newColumn;
        this.__coordAsString = this.column + ',' + this.row + ',' + this.depth;
    },
});

Object.defineProperty(Cell.prototype, 'depth', {
    get: function() { return this._options['depth']; },
    set: function(newDepth) {
        this._options['depth'] = newDepth;
        this.__coordAsString = this.column + ',' + this.row + ',' + this.depth;
    },
});

Object.defineProperty(Cell.prototype, 'coordAsString', {
    get: function() { return this.__coordAsString; },
});

Object.defineProperty(Cell.prototype, 'on', {
    get: function() { return this._options['on']; },
    set: function(turnOn) { this._options['on'] = !!turnOn; },
});

Object.defineProperty(Cell.prototype, 'color', {
    get: function() { return this._options['color']; },
    set: function(newColor) {
        if (invalidColorArr(newColor)) {
            console.error('Invalid color for Cell: ' + newColor);
            throw 'Invalid color for Cell';
        }
        this._options['color'] = newColor;
        this.__colorAsString = this.color[0] + ',' + this.color[1] + ',' + this.color[2];
    },
});

Object.defineProperty(Cell.prototype, 'colorAsString', {
    get: function() { return this.__colorAsString; },
});

Object.defineProperty(Cell.prototype, 'renderer', {
    get: function() { return this._options['renderer']; },
    set: function(newRenderer) {
        if (newRenderer && !newRenderer.can('render'))
        {
            console.error('Invalid renderer: must implement render()');
            throw 'Invalid renderer for Cell';
        }
        this._options['renderer'] = newRenderer;
    },
});

Object.defineProperty(Cell.prototype, 'options', {
    get: function() {
        return {
            'row': this.row,
            'column': this.column,
            'depth': this.depth,
            'on': this.on,
            'color': this.color,
        };
    },
});

Object.defineProperty(Cell.prototype, 'simpleOptions', {
    get: function() {
        return {
            'on': this.on ? 1 : 0,
            'color': this.__colorAsString,
            'coord': this.__coordAsString,
        };
    },
});


Cell.prototype.toJSON = function() {
    return this.options;
};

Cell.prototype.getForNetworkSubmission = function() {
    return {
        o: this.on ? 1 : 0,
        c: this.colorAsString,
    };
};

Cell.prototype.setFromCell = function(otherCell) {
    /**
     * Copy visual properties from another cell into self.
     */
    return applyOptions.call(this, {
        color: otherCell.color,
        on: otherCell.on,
    });
};
