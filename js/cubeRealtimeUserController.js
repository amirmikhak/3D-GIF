var CubeRealtimeUserController = function CubeRealtimeUserController(opts) {

    CubeController.apply(this, arguments);

    var cubeRealtimeUserController = this;

    var __defaultOptions = {
        animationInterval: 10,
        action: 'slide',
        writeFace: 'front',
        direction: 'back',
        stepSize: 1,
        wrap: false,
        listenForKeys: 'all',
        penColor: 'blue',
    };

    var _options = _.extend({}, __defaultOptions, opts);

    var _mouseListeningCells = [];

    function __updateMouseListeningCells() {
        _mouseListeningCells = [];

        if (!this.cube) {
            return;
        }

        for (var i = 0, numCells = this.cube.cells.length; i < numCells; i++)
        {
            var cell = this.cube.cells[i];

            var shouldBeInteractive = {
                front: (cell.depth === 0),
                left: (cell.column === 0),
                back: (cell.depth === 7),
                right: (cell.column === 7),
                top: (cell.row === 0),
                bottom: (cell.row === 7),
            }[_options['writeFace']];

            if (shouldBeInteractive)
            {
                _mouseListeningCells.push(cell.coordAsString);
            }
        }
    }

    function __listenForKeystrokes() {
        var controller = cubeRealtimeUserController;
        if (!controller.listeningForKeystrokes)
        {
            /**
             * By checking that controller.listeningForKeystrokes is not already set, we
             * prevent double-binding of these listeners to single events.
             */

            controller.listeningForKeystrokes = true;
            document.addEventListener('keydown', controller.validKeyFilterFn);
            document.addEventListener('keydown', controller.actionKeyListenerFn);
            document.addEventListener('keypress', controller.keyListenerFn);
        }
    };

    function __stopListeningForKeystrokes() {
        var controller = cubeRealtimeUserController;
        document.removeEventListener('keydown', controller.validKeyFilterFn);
        document.removeEventListener('keydown', controller.actionKeyListenerFn);
        document.removeEventListener('keypress', controller.keyListenerFn);
        controller.listeningForKeystrokes = false;
    };

    Object.defineProperty(this, 'directions', {
        writable: false,
        value: ['back', 'right', 'down', 'up', 'left', 'forward'],
    });

    Object.defineProperty(this, 'animationCb', {
        /**
         * Read-only property for the correct animation callback to use for the
         * current action and direction.
         */
        get: function() {
            if (_options['action'] === 'slide')
            {
                return {
                    up: function() { this.cube.shiftPlane('X', _options['stepSize'], _options['wrap']); },
                    down: function() { this.cube.shiftPlane('X', -1 * _options['stepSize'], _options['wrap']); },
                    left: function() { this.cube.shiftPlane('Y', _options['stepSize'], _options['wrap']); },
                    right: function() { this.cube.shiftPlane('Y', -1 * _options['stepSize'], _options['wrap']); },
                    forward: function() { this.cube.shiftPlane('Z', _options['stepSize'], _options['wrap']); },
                    back: function() { this.cube.shiftPlane('Z', -1 * _options['stepSize'], _options['wrap']); },
                }[_options['direction']];
            }

            return undefined;   // just being explicit about this
        }
    });

    Object.defineProperty(this, 'validKeyFns', {
        writable: false,
        value: {
            specials: function(e) {
                return (
                    (e.keyCode === 32) ||   // spacebar
                    (e.keyCode === 8) ||    // backspace
                    (e.keyCode === 13) ||   // enter
                    (e.keyCode >= 37 && e.keyCode <= 40)    // arrow keys
                );
            },
            alpha: function(e) {
                return cubeRealtimeUserController.validKeyFns.specials(e) || (e.keyCode >= 65 && e.keyCode <= 90);
            },
            num: function(e) {
                return (
                    cubeRealtimeUserController.validKeyFns.specials(e) ||
                    (e.keyCode >= 48 && e.keyCode <= 57) || // top row
                    (e.keyCode >= 96 && e.keyCode <= 105)   // num pad
                );
            },
            symbols: function(e) {
                return (
                    cubeRealtimeUserController.validKeyFns.specials(e) ||
                    (e.keyCode >= 106 && e.keyCode <= 111) ||  // math operators
                    (e.keyCode >= 186 && e.keyCode <= 222) ||  // punctuation
                    (e.shiftKey && e.keyCode >= 48 && e.keyCode <= 57)    // "uppercase" numbers
                );
            },
            alphanum: function(e) {
                return cubeRealtimeUserController.validKeyFns.alpha(e) || cubeRealtimeUserController.validKeyFns.num(e);
            },
            all: function(e) {
                return cubeRealtimeUserController.validKeyFns.alphanum(e) || cubeRealtimeUserController.validKeyFns.symbols(e);
            },
            none: function(e) {
                return false;
            },
        },
    });

    Object.defineProperty(this, 'validListenForKeys', {
        get: function() { return Object.keys(cubeRealtimeUserController.validKeyFns); },
    });

    Object.defineProperty(this, 'validKeyFilterFn', {
        writable: false,
        value: function validKeyFilterFn(e) {
            /**
             * Call the validator for the current set of desired keys, passing in the
             * current event for evaluation. If the key is valid, allow the event to
             * proceed, otherwise don't let other listeners see it.
             */

            if (cubeRealtimeUserController.validKeyFns[cubeRealtimeUserController.listenForKeys](e))
            {
                return true;
            }

            e.preventDefault();
            e.stopPropagation();
            return false;
        },
    });

    Object.defineProperty(this, 'actionKeyListenerFn', {
        writable: false,
        value: function actionKeyListenerFn(e) {
            var controller = cubeRealtimeUserController;
            var cube = controller.cube;

            /**
             * Capture key events that are supposed to trigger an action on the cube.
             * In the event that an action is typed, we don't want to let the event
             * propagate up to this.keyListenerFn(). If it were to, the letters
             * pressed to trigger actions would appear on the cube. For example,
             * CTRL+B would both change the cube's animation direction and show a 'b'
             * on the front face.
             */

            var keyDirectionMap = {
                37: 'left',
                38: 'up',
                39: 'right',
                40: 'down',
                70: 'front',   // "Front:  CTRL+F"
                66: 'back',    // "Back:   CTRL+B"
                85: 'up',      // "Up:     CTRL+U"
                68: 'down',    // "Down:   CTRL+D"
                82: 'right',   // "Right:  CTRL+R"
                76: 'left',    // "Left:   CTRL+L"
            };

            function keyIsDirectionalAction() {
                return Object.keys(keyDirectionMap).indexOf(e.keyCode.toString()) !== -1;
            }

            if (e.keyCode === 13)  // enter
            {
                controller.togglePlaying();
            } else if (e.ctrlKey && (e.keyCode === 8)) // backspace
            {
                controller.stop();
                cube.clear();   // clear whole cube
            } else if (e.ctrlKey && (e.keyCode === 189))    // ctrl+minus
            {   // prev step
                controller.step(-1);
            } else if (e.ctrlKey && (e.keyCode === 187))    // ctrl+equals
            {   // next step
                controller.step();
            } else if (e.ctrlKey && keyIsDirectionalAction(e))
            {
                var newDirection = keyDirectionMap[e.keyCode];
                if (e.altKey)
                {
                    if (newDirection === 'up')
                    {
                        newDirection = 'back';
                    } else if (newDirection === 'down')
                    {
                        newDirection = 'forward';
                    }
                }
                controller.direction = newDirection;
            } else if (e.ctrlKey && e.keyCode >= 48 && e.keyCode <= 57) // ctrl + num row
            {
                var shapeIndex = parseInt(String.fromCharCode(e.keyCode), 10) - 1;
                var shapeNames = Object.keys(CubeAssets.activeShapeSetShapes);
                var numShapes = shapeNames.length;
                if ((shapeIndex >= 0) && (shapeIndex < numShapes))
                {
                    var shapeTile = CubeAssets.getShapeRender(shapeNames[shapeIndex]);
                    window.requestAnimationFrame(function() {
                        cube.writeSlice(shapeTile, controller.writeFace);
                    });
                }
            } else
            {
                return;
            }

            // fall through to this if any of the above "ifs" are true
            e.preventDefault();
            e.stopPropagation();
        },
    });

    Object.defineProperty(this, 'keyListenerFn', {
        writable: false,
        value: function keyListenerFn(e) {
            /**
             * Called for each keypress that is allowed to pass through the
             * validation function.
             */
            var controller = cubeRealtimeUserController;

            var char = String.fromCharCode(e.which);
            var colorRgb = controller.cube.colors[controller.penColor];
            var charTile = CubeAssets.getCharacterRender(char, colorRgb);
            window.requestAnimationFrame(function() {
                controller.cube.writeSlice(charTile, controller.writeFace);
            });
        },
    });

    Object.defineProperty(this, 'mouseListeningCells', {
        get: function() { return _mouseListeningCells; },
    });

    Object.defineProperty(this, 'writeFace', {
        get: function() { return _options['writeFace']; },
        set: function(newWriteFace) {
            _options['writeFace'] = newWriteFace;
            __updateMouseListeningCells();
            if (this.cube)
            {
                this.cube.render();
            }
        },
    });

    Object.defineProperty(this, 'penColor', {
        get: function() { return _options['penColor']; },
        set: function(newPenColor) {
            if (cube.colorNames.indexOf(newPenColor) === -1)
            {
                console.error('Invalid pen color for cubeRealtimeUserController', newPenColor);
                throw 'Invalid pen color';
            }

            var prevPenColor = _options['penColor'];
            _options['penColor'] = newPenColor;

            this.emit('propertyChanged', {
                setting: 'penColor',
                newValue: _options['penColor'],
                oldValue: prevPenColor,
            });
        },
    });

    Object.defineProperty(this, 'penColorRgb', {
        get: function() { return this.cube.colors[_options['penColor']]; },
    });

    Object.defineProperty(this, 'animationInterval', {
        get: function() { return _options['animationInterval']; },
        set: function(newAnimationInterval) {
            var parsedValue = parseInt(newAnimationInterval, 10);
            if (isNaN(parsedValue) || (parsedValue < 0))
            {
                console.error('Invalid animationInterval for cubeRealtimeUserController', newAnimationInterval);
                throw 'Invalid animation interval';
            }

            var prevAnimationInterval = _options['animationInterval'];
            _options['animationInterval'] = parsedValue;

            this.emit('propertyChanged', {
                setting: 'animationInterval',
                newValue: _options['animationInterval'],
                oldValue: prevAnimationInterval,
            });
        },
    });

    Object.defineProperty(this, 'action', {
        get: function() { return _options['action']; },
        set: function(newAction) {
            if (newAction !== 'slide')
            {
                console.error('Invalid action for cubeRealtimeUserController', newAction);
                throw 'Invalid action';
            }

            var prevAction = _options['action'];
            _options['action'] = newAction;

            this.emit('propertyChanged', {
                setting: 'action',
                newValue: _options['action'],
                oldValue: prevAction,
            });
        },
    });

    Object.defineProperty(this, 'direction', {
        get: function() { return _options['direction']; },
        set: function(newDirection) {
            if (this.directions.indexOf(newDirection) === -1)
            {
                console.error('Invalid direction for cubeRealtimeUserController', newDirection);
                throw 'Invalid direction';
            }

            var prevDirection = _options['direction'];
            _options['direction'] = newDirection;

            this.emit('propertyChanged', {
                setting: 'direction',
                newValue: _options['direction'],
                oldValue: prevDirection,
            });
        },
    });

    Object.defineProperty(this, 'stepSize', {
        get: function() { return _options['stepSize']; },
        set: function(newStepSize) {
            var parsedValue = parseInt(newStepSize, 10);
            if (isNaN(parsedValue) || (parsedValue < 0))
            {
                console.error('Invalid step size for cubeRealtimeUserController', newStepSize);
                throw 'Invalid step size';
            }

            var prevStepSize = _options['stepSize'];
            _options['stepSize'] = newStepSize;

            this.emit('propertyChanged', {
                setting: 'stepSize',
                newValue: _options['stepSize'],
                oldValue: prevStepSize,
            });
        },
    });

    Object.defineProperty(this, 'wrap', {
        get: function() { return _options['wrap']; },
        set: function(newWrap) {
            var prevWrap = _options['wrap'];
            _options['wrap'] = !!newWrap;

            this.emit('propertyChanged', {
                setting: 'wrapys',
                newValue: _options['wrap'],
                oldValue: prevWrap,
            });
        },
    });

    Object.defineProperty(this, 'listenForKeys', {
        get: function() { return _options['listenForKeys'] },
        set: function(newListenForKeys) {
            if (this.validListenForKeys.indexOf(newListenForKeys) === -1)
            {
                console.error('Invalid listenForKeys. ' +
                    'Valid options: ' + this.validListenForKeys.join(', '));
                throw 'Invalid listenForKeys';
            }

            var prevListenForKeys = _options['listenForKeys'];
            _options['listenForKeys'] = newListenForKeys;
            __listenForKeystrokes();

            this.emit('propertyChanged', {
                setting: 'listenForKeys',
                newValue: _options['listenForKeys'],
                oldValue: prevListenForKeys,
            });
        },
    });

    applyOptions.call(this, _options);

    return this;

};

CubeRealtimeUserController.prototype = Object.create(CubeController.prototype);
CubeRealtimeUserController.prototype.constructor = CubeRealtimeUserController;

CubeRealtimeUserController.prototype.getUpdate = function() {
    var timeSinceLastRender = (new Date()).getTime() - this.lastRenderedTime;
    if (timeSinceLastRender >= this.animationInterval)
    {
        this.step();
        this.markRenderTime();
    }
};

CubeRealtimeUserController.prototype.step = function(numSteps) {
    /**
     * Performs a single step of the current animation. If the number of steps
     * is negative, we take the number of steps in the "opposite" direction for
     * the current animation settings.
     */

    var DEFAULT_NUM_STEPS = 1;
    _numSteps = typeof numSteps !== 'undefined' ?
        (parseInt(numSteps, 10) || DEFAULT_NUM_STEPS) :
        DEFAULT_NUM_STEPS;

    if (_numSteps < 0)
    {   // step "backward"
        var startDirection = this.direction;
        var oppositeDirection = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left',
            'forward': 'back',
            'back': 'forward',
        }[startDirection];  // get the opposite direction

        this.direction = oppositeDirection; // apply the opposite direction for our next steps

        this.step(Math.abs(_numSteps));  // call this very function, but with a positive number of steps

        this.direction = startDirection;    // re-apply the old direction

        return;
    }

    for (var i = 0; i < _numSteps; i++)
    {
        this.animationCb();
    }

    return this;
};
