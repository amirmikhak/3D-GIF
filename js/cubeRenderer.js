var CubeRenderer = function CubeRenderer(opts) {

    CubeEventEmitter(this);

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

    Object.defineProperty(this, 'startRenderLoop', {
        configurable: true,
        value: function() { console.log('CubeRenderer.startRenderLoop()'); },
    });

    Object.defineProperty(this, 'stopRenderLoop', {
        configurable: true,
        value: function() { console.log('CubeRenderer.stopRenderLoop()'); },
    });

    Object.defineProperty(this, 'cube', {
        get: function() { return _options['cube']; },
        set: function(newCube) {
            if ((newCube !== null) && !(newCube instanceof Cube))
            {
                console.error('Invalid Cube for CubeRenderer: must be Cube', newCube);
                throw 'Invalid Cube for CubeRenderer';
            }

            var prevCube = _options['cube'];
            _options['cube'] = newCube;
            _cells = newCube === null ? [] : _options['cube'].cells;
            _numCells = newCube === null ? 0 : _options['cube'].cells.length;
            if (prevCube !== newCube)
            {
                this.emit('cubeChanged', {
                    prev: prevCube,
                    curr: newCube,
                });
            }
            this.emit('propertyChanged', {
                property: 'cube',
                oldValue: prevCube,
                newValue: newCube,
            });
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

CubeRenderer.prototype.render = function(cubeData) { console.log('cubeRenderer.render()'); };
