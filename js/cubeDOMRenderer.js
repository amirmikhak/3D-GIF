var CubeDOMRenderer = function CubeDOMRenderer(opts) {

    CubeRenderer.apply(this, arguments);

    var cubeDOMRenderer = this;

    var __defaultOptions = {
        cube: null,
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

    var _options = _.extend({}, __defaultOptions, opts || {});

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

    var __keydowned = _.throttle(function __keydowned(e) {
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
    }, KEY_LISTEN_RATE, false);

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
        _html.style.height = cubeDOMRenderer.outerDimensions + 'px';
        _html.style.width = cubeDOMRenderer.outerDimensions + 'px';
        _html.style.transformStyle = 'preserve-3d';
        _html.style.transformOrigin = (
            'calc(' + cubeDOMRenderer.outerDimensions + 'px/2) ' +
            'calc(' + cubeDOMRenderer.outerDimensions + 'px/2) ' +
            'calc(-1 * ' + cubeDOMRenderer.outerDimensions + 'px/2)'
        );

        _html.innerHTML = '';
        for (var i = 0; i < cubeDOMRenderer.numCells; i++)
        {
            cubeDOMRenderer.cells[i].renderer = new CellDOMRenderer(cubeDOMRenderer.cells[i], _options.cellConfig);
            _html.appendChild(cubeDOMRenderer.cells[i].render());
        }
    }

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

    Object.defineProperty(this, 'faceNames', {
        get: function() { return Object.keys(this.faceCubeViewingAngles); },
    });

    Object.defineProperty(this, 'html', {
        get: function() { return _html; },
    });

    Object.defineProperty(this, 'container', {
        get: function() { return _options['container']; },
        set: function(newEl) {
            if (__newElementCanReplace(newEl, _options['container']))
            {
                _options['container'] = newEl;
                _options['container'].appendChild(_html);
                this.render();
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
                this.render();
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
                this.render();
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

            this.render();
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


    /**
     * INIT
     */

    function init() {
        __buildHTML();
        applyOptions.call(cubeDOMRenderer, _options);
    }

    this.on('cubeChanged', init);

    init();

    return this;

};

CubeDOMRenderer.prototype = Object.create(CubeRenderer.prototype);
CubeDOMRenderer.prototype.constructor = CubeDOMRenderer;

CubeDOMRenderer.prototype.render = function() {
    this.html.style.transform = (
        'rotateX(' + this.xAngle + 'deg) ' +
        'rotateY(' + this.yAngle + 'deg)'
    );

    var mouseListeningCells = this.cube.controller ?
        this.cube.controller.mouseListeningCells :
        [];

    for (var i = 0; i < this.numCells; i++)
    {
        var wasAutoRendering = this.cells[i].autoRender;
        this.cells[i].autoRender = false;

        if (this.cellRotate)
        {
            /**
             * Only apply rotations if we need to because iterating over the cells
             * is very expensive and reduces performance significantly. See the
             * rotateCells property on "this" for more information.
             */
            applyOptions.call(this.cells[i].renderer, {
                rotation: [-1 * this.xAngle, -1 * this.yAngle, 0],
            });
        }

        applyOptions.call(this.cells[i].renderer, {
            interactive: mouseListeningCells.indexOf(this.cells[i].coordAsString) !== -1,
        });

        this.cells[i].autoRender = wasAutoRendering;
    }
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
