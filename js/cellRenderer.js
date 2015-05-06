var CellRenderer = function CellRenderer(cell, opts) {

    CubeEventEmitter(this);

    var __defaultOptions = {
        cell: cell,
        dirty: true,
    };

    var _opts = opts || {};
    var _options = {};
    var _optionKeys = Object.keys(__defaultOptions);
    for (var i = 0, numOpts = _optionKeys.length; i < numOpts; i++) {
        _options[_optionKeys[i]] = (_optionKeys[i] in _opts) ?
            _opts[_optionKeys[i]] :
            __defaultOptions[_optionKeys[i]];
    }

    Object.defineProperty(this, 'cell', {
        get: function() { return _options['cell']; },
        set: function(newCell) {
            if (newCell === null)
            {
                console.error('Invalid cell for CellRenderer: cannot be null', newCell);
                throw 'Invalid cell';
            }

            if (newCell instanceof Cell)
            {
                return _options['cell'] = newCell;
            }

            return _options['cell'] = applyOptions.call(new Cell(), newCell);
        }
    });

    Object.defineProperty(this, 'dirty', {
        configurable: true,
        get: function() { return _options['dirty']; },
        set: function(newDirty) { return _options['dirty'] = !!newDirty; }
    });

    this.getDefaultOptions = function() {
        return __defaultOptions;
    };

    applyOptions.call(this, _options);

    return this;

};

CellRenderer.prototype.render = function() {};
