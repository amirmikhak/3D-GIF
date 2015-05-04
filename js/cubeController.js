var CubeController = function CubeController(opts) {

    Emitter(this);

    var controller = this;

    var __emptyCube = new Cube(8);

    var __defaultOptions = {
        cube: null,
        renderer: null,
        playing: false,
        animationInterval: 1,
        penColor: 'blue',
        frameCacheSize: 0,
    };

    var _opts = opts || {};
    var _options = {};
    var _optionKeys = Object.keys(__defaultOptions);
    for (var i = 0, numOpts = _optionKeys.length; i < numOpts; i++) {
        _options[_optionKeys[i]] = (_optionKeys[i] in _opts) ?
            _opts[_optionKeys[i]] :
            __defaultOptions[_optionKeys[i]];
    }

    var _animationFrames = [];
    var __animationInterval = 0;
    var __frameIndex = 0;
    var __frameValidStart = 0;
    var __frameValidEnd = 0;
    var __animationLoopInterval = 0;

    var __startAnimationLoop = function() {
        __stopAnimationLoop();
        __animationInterval = _options['animationInterval'];
        __frameIndex = 0;
        __frameValidStart = 0;
        __frameValidEnd = 0;
        __animationLoopInterval = setInterval(function animationLoopCb() {
            __frameValidStart = ++__frameIndex * __animationInterval;
            __frameValidEnd = __frameValidStart + __animationInterval;
            controller.update(__frameValidStart, __frameValidEnd);
        }, __animationInterval);
    };

    var __stopAnimationLoop = function() {
        clearInterval(__animationLoopInterval);
    };

    var __handleMediatedComponentEvent = function(event) {
        console.log('__handleMediatedComponentEvent', event, this);
    };

    Object.defineProperty(this, 'directions', {
        configurable: true,
        writable: false,
        value: ['back', 'right', 'down', 'up', 'left', 'forward'],
    });

    Object.defineProperty(this, 'currentSupportedFaces', {
        configurable: true,
        writable: false,
        value: ['front', 'left', 'back', 'right', 'top', 'bottom'],
    });

    Object.defineProperty(this, 'getEmptyCube', {
        writable: false,
        value: function() { return __emptyCube; }
    });

    Object.defineProperty(this, 'cube', {
        get: function() { return _options['cube']; },
        set: function(newCube) {
            if (!(newCube instanceof Cube) && (newCube !== null))
            {
                console.error('Invalid newCube for CubeController', newCube);
                throw 'Invalid cube';
            }

            if (_options['cube'] !== newCube)
            {
                _options['cube'] = newCube;
                if (_options['renderer'])
                {
                    _options['renderer'].cube = _options['cube'];
                }
            }
            return _options['cube'];
        },
    });

    Object.defineProperty(this, 'renderer', {
        get: function() { return _options['renderer']; },
        set: function(newRenderer) {
            if ((newRenderer === null))
            {
                return _options['renderer'] = null;
            }

            if (!newRenderer.can('render'))
            {
                console.error('Invalid renderer: must implement render()');
                throw 'Invalid renderer for CubeController';
            }

            _options['renderer'] = newRenderer;
            if (_options['renderer'].cube !== this.cube)
            {
                _options['renderer'].cube = this.cube;
            }
        },
    });

    Object.defineProperty(this, 'playing', {
        get: function() { return _options['playing']; },
        set: function(newPlaying) {
            var prevPlaying = _options['playing'];
            _options['playing'] = !!newPlaying;

            if (_options['playing'] && !prevPlaying)
            {
                __startAnimationLoop();
                if (_options['renderer'])
                {
                    _options['renderer'].startRenderLoop(this.getRenderFrame);
                }
            } else if (!_options['playing'] && prevPlaying)
            {
                __stopAnimationLoop();
                if (_options['renderer'])
                {
                    _options['renderer'].stopRenderLoop();
                }
            }
            this.emit('propertyChanged', {
                property: 'playing',
                oldValue: prevPlaying,
                newValue: _options['playing'],
            });
        },
    });

    Object.defineProperty(this, 'animationFrames', {
        get: function() { return _animationFrames.slice(); }
    });

    Object.defineProperty(this, 'getRenderFrame', {
        configurable: true,
        value: function(renderTime) { console.log('CubeController.getRenderFrame()'); },
    });

    Object.defineProperty(this, 'penColor', {
        get: function() { return _options['penColor']; },
        set: function(newPenColor) {
            if (!_options['cube'])
            {
                return null;
            } else if (_options['cube'].colorNames.indexOf(newPenColor) === -1)
            {
                console.error('Invalid pen color for CubeController', newPenColor);
                throw 'Invalid pen color';
            }

            var prevPenColor = _options['penColor'];
            _options['penColor'] = newPenColor;

            this.emit('propertyChanged', {
                property: 'penColor',
                newValue: _options['penColor'],
                oldValue: prevPenColor,
            });
        },
    });

    Object.defineProperty(this, 'penColorRgb', {
        get: function() { return _options['cube'].colors[_options['penColor']]; },
    });

    Object.defineProperty(this, 'frameCacheSize', {
        get: function() { return _options['frameCacheSize']; },
        set: function(newFrameCacheSize) {
            var parsedValue = parseInt(newFrameCacheSize, 10);
            if (isNaN(parsedValue) || parsedValue < 0)
            {
                console.error('Invalid frame cache size: must be integer >= 0.', newFrameCacheSize);
                throw 'Invalid frameCacheSize';
            }

            return _options['frameCacheSize'] = parsedValue;
        },
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
                property: 'animationInterval',
                newValue: _options['animationInterval'],
                oldValue: prevAnimationInterval,
            });
        },
    });

    function __validateNewFrameArguments(cubeData, startTime, endTime) {
        if (arguments.length !== 3)
        {
            console.error('Invalid arguments for CubeController.addAnimationFrame()');
            throw 'Invalid arguments';
        } else if (!(cubeData instanceof Cube))
        {
            console.error('Invalid cubeData for CubeController.addAnimationFrame()');
            throw 'Invalid Cube data';
        } else if (isNaN(parseInt(startTime, 10)))
        {
            console.error('Invalid start time for CubeController.addAnimationFrame()');
            throw 'Invalid startTime';
        } else if (isNaN(parseInt(endTime, 10)))
        {
            console.error('Invalid end time for CubeController.addAnimationFrame()');
            throw 'Invalid endTime';
        }
    }

    function __flushCacheIfWillOverflow() {
        if (controller.frameCacheSize &&
            (_animationFrames.length >= (controller.frameCacheSize - 1)))
        {
            _animationFrames = [];
        }
    }

    Object.defineProperty(this, 'unshiftAnimationFrame', {
        writable: false,
        value: function(cubeData, startTime, endTime) {
            __validateNewFrameArguments.apply(this, arguments);
            __flushCacheIfWillOverflow();
            _animationFrames.unshift({
                data: cubeData,
                start: parseInt(startTime, 10),
                end: parseInt(endTime, 10),
            });
        },
    });

    Object.defineProperty(this, 'addAnimationFrame', {
        writable: false,
        value: function(cubeData, startTime, endTime) {
            __validateNewFrameArguments.apply(this, arguments);
            __flushCacheIfWillOverflow();
            _animationFrames.push({
                data: cubeData,
                start: parseInt(startTime, 10),
                end: parseInt(endTime, 10),
            });
        },
    });

    Object.defineProperty(this, 'popCurrentAnimationFrame', {
        writable: false,
        value: function() {
            return _animationFrames.length ? _animationFrames.shift() : null;
        },
    });

    Object.defineProperty(this, 'clearAnimationFrames', {
        writable: false,
        value: function() {
            return _animationFrames.splice(0, _animationFrames.length);
        },
    });

    Object.defineProperty(this, 'currentAnimationFrame', {
        get: function() {
            return _animationFrames.length ? _animationFrames[0] : null;
        },
    });

    this.getDefaultOptions = function() {
        return __defaultOptions;
    };

    this.on('mediatedComponentEvent', __handleMediatedComponentEvent);

    applyOptions.call(this, _options);

    return this;

};

CubeController.prototype.serializeForNetworkSubmission = function() {
    if (!this.cube)
    {
        return null;
    }
    return JSON.stringify(this.cube.getForNetworkSubmission());
};

CubeController.prototype.render = function(cubeData) {
    if (this.renderer && ((cubeData instanceof Cube) || this.cube))
    {
        this.renderer.render((cubeData instanceof Cube) ? cubeData : this.cube);
    }
};

CubeController.prototype.togglePlaying = function() {
    this.playing = !this.playing;
};

CubeController.prototype.stop = function() {
    this.playing = false;
};

CubeController.prototype.play = function(resetTimers) {
    this.stop();
    this.playing = true;
};

CubeController.prototype.clear = function() {};
CubeController.prototype.step = function() {};
CubeController.prototype.update = function(frameValidStart, frameValidEnd) {};
