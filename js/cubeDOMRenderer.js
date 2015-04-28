var CubeDOMRenderer = function CubeDOMRenderer(opts) {

    CubeRenderer.apply(this, arguments);

    var cubeDOMRenderer = this;

    var __defaultOptions = {
        container: null,
        transitionTransforms: true,
        xAngle: 0,
        yAngle: 0,
        listenForKeyEvents: true,
        cellConfig: {
            rotate: false,
            size: 50, // size of our cells in pixels
        },
    };

    var __parentDefaultOptions = this.getDefaultOptions();
    var _parentOptionKeys = Object.keys(__parentDefaultOptions);
    for (var i = 0, numOpts = _parentOptionKeys.length; i < numOpts; i++) {
        __defaultOptions[_parentOptionKeys[i]] = __parentDefaultOptions[_parentOptionKeys[i]];
    }

    var _opts = opts || {};
    var _options = {};
    var _optionKeys = Object.keys(__defaultOptions);
    for (var i = 0, numOpts = _optionKeys.length; i < numOpts; i++) {
        _options[_optionKeys[i]] = (_optionKeys[i] in _opts) ?
            _opts[_optionKeys[i]] :
            __defaultOptions[_optionKeys[i]];
    }

    var _animationStartTime = (new Date()).getTime();
    var _renderStartTime = _animationStartTime;
    var _lastRendererTime = _animationStartTime;
    var __animationFrameRef = 0;
    var __getRenderFrameCb = function() { console.log('default __getRenderFrameCb()'); };

    var __renderStep = function __renderStep() {
        _renderStartTime = (new Date()).getTime();
        var renderFrame = __getRenderFrameCb(_renderStartTime - _animationStartTime);
        cubeDOMRenderer.render(renderFrame);
        _lastRendererTime = _renderStartTime;
        __animationFrameRef = requestAnimationFrame(__renderStep);
    };

    var _cellRenderers = [];

    var __drawnOptions = {};
    var __dirtyOptions = {};
    var __dirtyViewAngle = false;
    var __dirtyDimensions = false;

    var _html = document.createElement('div');


    /**
     * KEYBOARD EVENTS
     */

    var KEY_LISTEN_RATE = 10;   // in milliseconds

    var __keyDirectionMap = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
    };

    var __keydowned = function __keydowned(e) {
        var direction = __keyDirectionMap[e.keyCode];
        if (direction)
        {
            /**
             * If the keyCode pressed has a binding for a direction in the map
             * above, disable CSS transitions so that they don't interfere
             * during our rapid changes to the cube's transform property.
             */
            cubeDOMRenderer.transitionTransforms = false;
            cubeDOMRenderer.nudge(direction);  // actually rotate the cube
        }
    };

    var __keyupped = function __keyupped(e) {
        if (__keyDirectionMap[e.keyCode])
        {   // if we are done rotating the cube...
            cubeDOMRenderer.transitionTransforms = true;    // ... restore the transitions
        }
    };


    /**
     * DOM HELPERS
     */

    function __newElementCanReplace(newEl, currEl) {
        return newEl instanceof HTMLElement;
    }

    function __shouldDestroyExistingEl(newEl) {
        return (newEl === null) || (typeof newEl === 'undefined');
    }

    function __buildHTML() {
        _html.id = 'cube';
        _html.innerHTML = '';
        for (var i = 0; i < cubeDOMRenderer.numCells; i++)
        {
            var cell = cubeDOMRenderer.cells[i];
            var cellRenderer = new CellDOMRenderer(cell, _options.cellConfig);
            _cellRenderers.push(cellRenderer);
            _html.appendChild(cellRenderer.html);
        }
    }

    function __hasDirtyCells() {
        return true;
        for (var i = 0; i < cubeDOMRenderer.numCells; i++)
        {
            if (_cellRenderers[i].dirty)
            {
                return true;
            }
        }
        return false;
    }

    function __hasDirtyOptions() {
        var dirtyKeys = Object.keys(__dirtyOptions);
        for (var i = 0, numKeys = dirtyKeys.length; i < numKeys; i++)
        {
            if (__dirtyOptions[dirtyKeys[i]])
            {
                return true;
            }
        }
        return false;
    }

    function __calculateDirtyOptions() {
        for (var i = 0, numKeys = _optionKeys.length; i < numKeys; i++)
        {
            var key = _optionKeys[i];
            __dirtyOptions[key] = !sloppyOptionsAreEqual(_options[key], __drawnOptions[key]);
        }
        __dirtyViewAngle = (__dirtyOptions['xAngle'] || __dirtyOptions['yAngle']);
        __dirtyDimensions = (__dirtyOptions['size'] || __dirtyOptions['cellConfig']);
    }

    function __updateDrawnOptions() {
        for (var i = 0, numKeys = _optionKeys.length; i < numKeys; i++)
        {
            var key = _optionKeys[i];
            __dirtyOptions[key] = _options[key];
        }
        __dirtyViewAngle = false;
        __dirtyDimensions = false;
    }

    function __updateDOM() {
        if (__dirtyDimensions)
        {
            _html.style.height = cubeDOMRenderer.outerDimensions + 'px';
            _html.style.width = cubeDOMRenderer.outerDimensions + 'px';
            _html.style.transformStyle = 'preserve-3d';
            _html.style.transformOrigin = (
                (cubeDOMRenderer.outerDimensions / 2) + 'px ' +
                (cubeDOMRenderer.outerDimensions / 2) + 'px ' +
                ((cubeDOMRenderer.outerDimensions / 2) * -1) + 'px'
            );
        }
        if (__dirtyViewAngle)
        {
            _html.style.transform = (
                'rotateX(' + _options['xAngle'] + 'deg) ' +
                'rotateY(' + _options['yAngle'] + 'deg)'
            );
        }
    }

    function __updateCellsDOM() {
        var mouseListeningCells = cubeDOMRenderer.cube.controller ?
            cubeDOMRenderer.cube.controller.mouseListeningCells :
            [];

        for (var i = 0; i < cubeDOMRenderer.numCells; i++)
        {
            var cellRenderer = _cellRenderers[i];
            var cell = cellRenderer.cell;

            var newCellRendererOptions = {
                interactive: mouseListeningCells.indexOf(cell.coordAsString) !== -1,
            };

            if (__dirtyViewAngle && _options['cellConfig']['rotate'])
            {
                newCellRendererOptions['rotation'] = [-1 * _options['xAngle'], -1 * _options['yAngle'], 0];
            }

            applyOptions.call(cellRenderer, newCellRendererOptions);
            cellRenderer.render();
        }
    }

    Object.defineProperty(this, 'startRenderLoop', {
        writable: false,
        value: function(getRenderFrame) {
            if (typeof getRenderFrame !== 'function')
            {
                console.error('Invalid render callback for startRenderLoop: ' +
                    'must be a function', getRenderFrame);
                throw 'Invalid getRenderFrame';
            }
            cubeDOMRenderer.resetAnimationTimes();
            __getRenderFrameCb = getRenderFrame;
            __animationFrameRef = requestAnimationFrame(__renderStep);
        },
    });

    Object.defineProperty(this, 'stopRenderLoop', {
        writable: false,
        value: function() {
            cancelAnimationFrame(__animationFrameRef);
            cubeDOMRenderer.resetAnimationTimes();
        },
    });

    Object.defineProperty(this, 'animationStartTime', {
        get: function() { return _animationStartTime; },
    });

    Object.defineProperty(this, 'lastRenderedTime', {
        get: function() { return _lastRenderedTime; },
    });

    Object.defineProperty(this, 'renderStartTime', {
        get: function() { return _renderStartTime; },
    });

    Object.defineProperty(this, 'resetAnimationTimes', {
        writable: false,
        value: function() {
            _lastRenderedTime = _renderStartTime = _animationStartTime = (new Date()).getTime();
        },
    });

    Object.defineProperty(this, 'updateDOM', {
        value: function updateDOM() {
            __calculateDirtyOptions();
            if (__hasDirtyOptions())
            {
                __updateDOM();
                __updateDrawnOptions();
            }
            if (__hasDirtyCells())
            {
                __updateCellsDOM();
            }
        },
    });

    Object.defineProperty(this, 'faceCubeViewingAngles', {
        writable: false,
        value: {   // face: [cube.xAngle, cube.yAngle]
            top: [-60, 30],
            front: [-30, 30],
            left: [-30, 60],
            back: [-20, -155],
            right: [-30, -60],
            bottom: [60, 30],
        },
    });

    Object.defineProperty(this, 'html', {
        get: function() { return _html; },
    });

    Object.defineProperty(this, 'cellRenderers', {
        get: function() { return _cellRenderers; },
    });

    Object.defineProperty(this, 'container', {
        get: function() { return _options['container']; },
        set: function(newEl) {
            if (__newElementCanReplace(newEl, _options['container']))
            {
                _options['container'] = newEl;
                _options['container'].appendChild(_html);
            } else if (__shouldDestroyExistingEl(newEl))
            {
                if (_options['container']) {
                    _options['container'].removeChild(_html);
                }
                _options['container'] = null;
            } else if (!(newEl instanceof HTMLElement))
            {
                console.error('Invalid container: must be instance of HTMLElement');
                throw 'Invalid container';
            }
        },
    });

    Object.defineProperty(this, 'outerDimensions', {
        get: function() { return this.cube.size * _options.cellConfig.size; },
    });

    Object.defineProperty(this, 'xAngle', {
        get: function() { return _options['xAngle']; },
        set: function(newAngle) {
            var parsedAngle = parseFloat(newAngle);
            if (!isNaN(parsedAngle))
            {
                _options['xAngle'] = parsedAngle;
            }
        },
    });

    Object.defineProperty(this, 'yAngle', {
        get: function() { return _options['yAngle']; },
        set: function(newAngle) {
            var parsedAngle = parseFloat(newAngle);
            if (!isNaN(parsedAngle))
            {
                _options['yAngle'] = parsedAngle;
            }
        },
    });

    Object.defineProperty(this, 'transitionTransforms', {
        /**
         * Animate transforms on the cube (does not apply to cells, whose property
         * is set separately).
         */
        get: function() { return _transitionTransforms; },
        set: function(shouldTransition) {
            _transitionTransforms = shouldTransition;

            var TRANSITION_DURATION = '300ms';
            var TRANSITION_EASING = 'ease-in-out';

            if (shouldTransition)
            {
                _html.style.transitionProperty = 'transform';
                _html.style.transitionDuration = TRANSITION_DURATION;
                _html.style.transitionTimingFunction = TRANSITION_EASING;
            } else
            {
                _html.style.transitionProperty = null;
                _html.style.transitionDuration = null;
                _html.style.transitionTimingFunction = null;
            }
        },
    });

    Object.defineProperty(this, 'cellConfig', {
        get: function() { return Object.create(_options.cellConfig); },
        set: function(newConfig) {
            for (var key in newConfig)
            {
                var configProp = 'cell' + key.capitalizeFirstLetter();
                if (this.hasOwnProperty(configProp))
                {
                    this[configProp] = newConfig[key];
                }
            }
        },
    });

    Object.defineProperty(this, 'cellSize', {
        get: function() { return _options.cellConfig.size; },
        set: function(newCellSize) {
            _options.cellConfig.size = newCellSize;
            for (var i = 0; i < this.numCells; i++)
            {
                if (this.cells[i].renderer)
                {
                    applyOptions.call(this.cells[i].renderer, {
                        size: newCellSize,
                    });
                }
            }
        },
    });

    Object.defineProperty(this, 'cellRotate', {
        /**
         * If true, each cell rotates opposite the cube so that it is always facing
         * you. It is computationally expensive and graphically looks a little weird.
         * It is thus not especially useful...
         */
        get: function() { return _options.cellConfig.rotate; },
        set: function(shouldRotate) {
            var prevRotateCells = _options.cellConfig.rotate;
            _options.cellConfig.rotate = shouldRotate;
            if (!_options.cellConfig.rotate && prevRotateCells)
            {
                /**
                 * To improve performance of this.render(), we only iterate over
                 * the cells if we need to rotate them. Thus, if we are not rotating
                 * the cells but were previously, we need to "clear" their rotation
                 * manually because this.render() won't if the property is false.
                 */
                for (var i = 0; i < this.numCells; i++)
                {
                    applyOptions.call(this.cells[i].renderer, {
                        rotation: [0, 0, 0],
                    });
                }
            }
        },
    });

    Object.defineProperty(this, 'listenForKeyEvents', {
        get: function() { return _options.listenForKeyEvents; },
        set: function(shouldListen) {
            document.removeEventListener('keydown', __keydowned);
            document.removeEventListener('keyup', __keyupped);
            _options.listenForKeyEvents = !!shouldListen;
            if (_options.listenForKeyEvents)
            {
                document.addEventListener('keydown', __keydowned);
                document.addEventListener('keyup', __keyupped);
            }
        },
    });

    this.getDefaultOptions = function() {
        return __defaultOptions;
    };

    /**
     * INIT
     */

    function init() {
        __buildHTML();
        applyOptions.call(cubeDOMRenderer, _options);
    }

    this.on('cubeChanged', function(changeData) {
        if (!changeData.prev || !changeData.curr ||
            (changeData.prev.size !== changeData.curr.size))
        {
            __buildHTML();
        }

        cubeDOMRenderer.updateDOM();
    });

    init();

    return this;

};

CubeDOMRenderer.prototype = Object.create(CubeRenderer.prototype);
CubeDOMRenderer.prototype.constructor = CubeDOMRenderer;

CubeDOMRenderer.prototype.render = function(cubeData) {
    if ((this.cube === cubeData) && (this.prevCube !== cubeData))
    {
        return;
    }

    this.prevCube = this.cube;
    this.cube = cubeData;

    for (var i = 0, numCells = cubeData.cells.length; i < numCells; i++)
    {
        this.cellRenderers[i].cell = cubeData.cells[i];
    }

    this.updateDOM();
};

CubeDOMRenderer.prototype.nudge = function(direction, amount) {
    /**
     * Rotate the cube in a direction (left, right, up, down) by an amount
     * (in degrees).
     */

    amount = !isNaN(parseFloat(amount, 10)) ? amount : 1;

    switch (direction) {
        case 'left':
            this.yAngle -= amount;
            break;
        case 'up':
            this.xAngle += amount;
            break;
        case 'right':
            this.yAngle += amount;
            break;
        case 'down':
            this.xAngle -= amount;
            break;
    };

    return this;    // enables multiple calls on cube to be "chained"
};
