var Cell = function Cell(opts) {

    var cell = this; // 'this' can point to many, different things, so we grab an easy reference to the object
    var _cube = cube;

    var defaultOptions = {
        cube: null,
        row: null,
        column: null,
        depth: null,
        color: [0, 0, 255],    // We'll store colors internally as an RGB array
        on: false,
        renderer: new CellRenderer(),
        autoRender: true,
    };

    var _options = _.extend({}, defaultOptions, opts);

    function __invalidColor(colorArr) {
        return (
            !(colorArr instanceof Array) ||
            (colorArr.length !== 3) ||
            colorArr.some(function(val) { return (val < 0) || (val > 255); })
        );
    }

    Object.defineProperty(this, 'cube', {
        get: function() { return _options['cube']; },
        set: function(newCube) { return _options['cube'] = newCube; }
    });

    Object.defineProperty(this, 'row', {
        get: function() { return _options['row']; },
        set: function(newRow) {
            _options['row'] = newRow;
            if (_options['autoRender'])
            {
                this.render();
            }
            return _options['row'];
        }
    });

    Object.defineProperty(this, 'column', {
        get: function() { return _options['column']; },
        set: function(newColumn) {
            _options['column'] = newColumn;
            if (_options['autoRender'])
            {
                this.render();
            }
            return _options['column'];
        }
    });

    Object.defineProperty(this, 'depth', {
        get: function() { return _options['depth']; },
        set: function(newDepth) {
            _options['depth'] = newDepth;
            if (_options['autoRender'])
            {
                this.render();
            }
            return _options['depth'];
        }
    });

    Object.defineProperty(this, 'on', {
        get: function() { return _options['on']; },
        set: function(turnOn) {
            _options['on'] = !!turnOn;
            if (_options['autoRender'])
            {
                this.render();
            }
            return _options['on'];
        }
    });

    Object.defineProperty(this, 'color', {
        get: function() { return _options['color']; },
        set: function(newColor) {
            if (__invalidColor(newColor)) {
                console.error('Invalid color for Cell: ' + newColor);
                throw 'Invalid color for Cell';
            }
            _options['color'] = newColor;
            if (_options['autoRender'])
            {
                this.render();
            }
            return _options['color'].slice();
        }
    });

    Object.defineProperty(this, 'renderer', {
        get: function() { return _options['renderer']; },
        set: function(newRenderer) {
            if (!newRenderer || !newRenderer.can('render'))
            {
                console.error('Invalid renderer: must implement render()');
                throw 'Invalid renderer for Cell';
            }

            return _options['renderer'] = newRenderer;
        },
    });

    Object.defineProperty(this, 'autoRender', {
        get: function() { return _options['autoRender']; },
        set: function(shouldAutoRender) { return _options['autoRender'] = !!shouldAutoRender; }
    });

    Object.defineProperty(this, 'options', {
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

    this.applyOptions(_options);

    return this;
};

Cell.prototype.applyOptions = function(newOpts) {
    /**
     * We may be setting many opts and don't want to rerender for each
     * change, so we temporarily disable auto-rendering, manually render,
     * and re-enable for other non-applyOptions() calls.
     */
    this.autoRender = false;
    applyOptions.call(this, newOpts);

    this.render();          // manually render all changes
    this.autoRender = true;    // re-enable auto-rendering

    return this;
};

Cell.prototype.render = function() {
    if (this.renderer)
    {
        return this.renderer.render();
    }
};

Cell.prototype.toJSON = function() {
    return this.options;
};

Cell.prototype.setFromCell = function(otherCell) {
    /**
     * Copy visual properties from another cell into self.
     */
    return this.applyOptions({
        color: otherCell.color,
        on: otherCell.on,
    });
};
