var Cell = function Cell(opts) {

    var cell = this; // 'this' can point to many, different things, so we grab an easy reference to the object
    var _cube = cube;

    var __defaultOptions = {
        cube: null,
        row: null,
        column: null,
        depth: null,
        color: [0, 0, 255],    // We'll store colors internally as an RGB array
        on: false,
        renderer: null,
    };

    var _opts = opts || {};
    var _options = {};
    var _optionKeys = Object.keys(__defaultOptions);
    for (var i = 0, numOpts = _optionKeys.length; i < numOpts; i++) {
        _options[_optionKeys[i]] = (_optionKeys[i] in _opts) ?
            _opts[_optionKeys[i]] :
            __defaultOptions[_optionKeys[i]];
    }

    var __colorAsString = '0,0,255';
    var __coordAsString = 'null,null,null';

    function __invalidColor(colorArr) {
        return (
            !(colorArr instanceof Array) ||
            (colorArr.length !== 3) ||
            (colorArr[0] < 0) || (colorArr[0] > 255) ||
            (colorArr[1] < 0) || (colorArr[1] > 255) ||
            (colorArr[2] < 0) || (colorArr[2] > 255)
        );
    };

    Object.defineProperty(this, 'cube', {
        get: function() { return _options['cube']; },
        set: function(newCube) { return _options['cube'] = newCube; },
    });

    Object.defineProperty(this, 'row', {
        get: function() { return _options['row']; },
        set: function(newRow) {
            _options['row'] = newRow;
            __coordAsString = _options['column'] + ',' + _options['row'] + ',' + _options['depth'];
            return _options['row'];
        },
    });

    Object.defineProperty(this, 'column', {
        get: function() { return _options['column']; },
        set: function(newColumn) {
            _options['column'] = newColumn;
            __coordAsString = _options['column'] + ',' + _options['row'] + ',' + _options['depth'];
            return _options['column'];
        },
    });

    Object.defineProperty(this, 'depth', {
        get: function() { return _options['depth']; },
        set: function(newDepth) {
            _options['depth'] = newDepth;
            __coordAsString = _options['column'] + ',' + _options['row'] + ',' + _options['depth'];
            return _options['depth'];
        },
    });

    Object.defineProperty(this, 'coordAsString', {
        get: function() { return __coordAsString; },
    });

    Object.defineProperty(this, 'on', {
        get: function() { return _options['on']; },
        set: function(turnOn) {
            _options['on'] = !!turnOn;
            return _options['on'];
        },
    });

    Object.defineProperty(this, 'color', {
        get: function() { return _options['color']; },
        set: function(newColor) {
            if (__invalidColor(newColor)) {
                console.error('Invalid color for Cell: ' + newColor);
                throw 'Invalid color for Cell';
            }
            _options['color'] = newColor;
            __colorAsString = (_options['color'][0] + ',' + _options['color'][1] + ',' + _options['color'][2]);
            return _options['color'];
        },
    });

    Object.defineProperty(this, 'colorAsString', {
        get: function() { return __colorAsString; },
    });

    Object.defineProperty(this, 'renderer', {
        get: function() { return _options['renderer']; },
        set: function(newRenderer) {
            if (newRenderer && !newRenderer.can('render'))
            {
                console.error('Invalid renderer: must implement render()');
                throw 'Invalid renderer for Cell';
            }

            return _options['renderer'] = newRenderer;
        },
    });

    Object.defineProperty(this, 'options', {
        get: function() {
            return {
                'row': _options['row'],
                'column': _options['column'],
                'depth': _options['depth'],
                'on': _options['on'],
                'color': _options['color'],
            };
        },
    });

    Object.defineProperty(this, 'simpleOptions', {
        get: function() {
            return {
                'on': _options['on'] ? 1 : 0,
                'color': __colorAsString,
                'coord': __coordAsString,
            };
        },
    });

    applyOptions.call(this, _options);

    return this;
};

Cell.prototype.toJSON = function() {
    return this.options;
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
