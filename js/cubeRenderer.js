var CubeRenderer = function CubeRenderer(opts) {

    Emitter(this);

    var __defaultOptions = {
        cube: null,
    };

    var _opts = opts || {};
    var _options = {};
    var _optionKeys = Object.keys(__defaultOptions);
    for (var i = 0, numOpts = _optionKeys.length; i < numOpts; i++) {
        _options[_optionKeys[i]] = (_optionKeys[i] in _opts) ?
            _opts[_optionKeys[i]] :
            __defaultOptions[_optionKeys[i]];
    }

    var _cells = [];
    var _numCells = 0;

    Object.defineProperty(this, 'cube', {
        get: function() { return _options['cube']; },
        set: function(newCube) {
            var prevCube = _options['cube'];
            if (newCube === null)
            {
                _options['cube'] = null;
                _cells = [];
                _numCells = 0;
                if (prevCube !== newCube)
                {
                    this.emit('cubeChanged');
                }
                return;
            }

            if (!(newCube instanceof Cube))
            {
                console.error('Invalid Cube for CubeRenderer: must be Cube', newCube);
                throw 'Invalid Cube for CubeRenderer';
            }

            _options['cube'] = newCube;
            _cells = _options['cube'].cells;
            _numCells = _options['cube'].cells.length;
            if (prevCube !== newCube)
            {
                this.emit('cubeChanged');
            }
        },
    });

    Object.defineProperty(this, 'cells', {
        get: function() { return _cells; },
    });

    Object.defineProperty(this, 'numCells', {
        get: function() { return _numCells; },
    });

    this.getDefaultOptions = function() {
        return __defaultOptions;
    };

    applyOptions.call(this, _options);

    return this;

};

CubeRenderer.prototype.render = function() { console.log('cubeRenderer.render()'); };
