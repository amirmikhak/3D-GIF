var CubeController = function CubeController(opts) {

    Emitter(this);

    var controller = this;

    var __defaultOptions = {
        cube: null,
        playing: false,
        penColor: 'blue',
    };

    var _opts = opts || {};
    var _options = {};
    var optionKeys = Object.keys(__defaultOptions);
    for (var i = 0, numOpts = optionKeys.length; i < numOpts; i++) {
        _options[optionKeys[i]] = _opts.hasOwnProperty(optionKeys[i]) ?
            _opts[optionKeys[i]] :
            __defaultOptions[optionKeys[i]];
    }

    var _animationStartTime = (new Date()).getTime();
    var _renderStartTime = _animationStartTime;
    var _lastAnimFrameTime = _animationStartTime;
    var _lastRenderedTime = _animationStartTime;

    var __animationFrameRef = 0;
    var __step = function __step() {
        _renderStartTime = (new Date()).getTime();
        controller.getUpdate();
        _lastAnimFrameTime = _renderStartTime;
        __animationFrameRef = requestAnimationFrame(__step);
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

    Object.defineProperty(this, 'cube', {
        get: function() { return _options['cube']; },
        set: function(newCube) {
            if (!(newCube instanceof Cube) && (newCube !== null))
            {
                console.error('Invalid newCube for CubeController', newCube);
                throw 'Invalid cube';
            }

            return _options['cube'] = newCube;
        },
    });

    Object.defineProperty(this, 'playing', {
        get: function() { return _options['playing']; },
        set: function(newPlaying) {
            var prevPlaying = _options['playing'];
            _options['playing'] = !!newPlaying;

            if (_options['playing'] && !prevPlaying)
            {
                cancelAnimationFrame(__animationFrameRef);
                __animationFrameRef = requestAnimationFrame(__step);
            } else if (!_options['playing'] && prevPlaying)
            {
                cancelAnimationFrame(__animationFrameRef);
            }
        },
    });

    Object.defineProperty(this, 'animationStartTime', {
        get: function() { return _animationStartTime; },
    });

    Object.defineProperty(this, 'lastAnimationFrameTime', {
        get: function() { return _lastAnimFrameTime; },
    });

    Object.defineProperty(this, 'renderStartTime', {
        get: function() { return _renderStartTime; },
    });

    Object.defineProperty(this, 'lastRenderedTime', {
        get: function() { return _lastRenderedTime; },
    });

    Object.defineProperty(this, 'markRenderTime', {
        writable: false,
        value: function() {
            _lastRenderedTime = (new Date()).getTime();
        },
    });

    Object.defineProperty(this, 'resetAnimationTimes', {
        writable: false,
        value: function() {
            _lastRenderedTime = _renderStartTime = _lastAnimFrameTime = _animationStartTime = (new Date()).getTime();
        },
    });

    Object.defineProperty(this, 'penColor', {
        get: function() { return _options['penColor']; },
        set: function(newPenColor) {
            if (!_options['cube'])
            {
                console.log('No cube defined for CubeController when setting color', newPenColor);
                return null;
            } else if (_options['cube'].colorNames.indexOf(newPenColor) === -1)
            {
                console.error('Invalid pen color for CubeController', newPenColor);
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
        get: function() { return _options['cube'].colors[_options['penColor']]; },
    });

    applyOptions.call(this, _options);

    return this;

};


CubeController.prototype.step = function() {};
CubeController.prototype.getUpdate = function() {};

CubeController.prototype.togglePlaying = function() {
    this.playing = !this.playing;
};

CubeController.prototype.stop = function() {
    this.playing = false;
    this.resetAnimationTimes();
};

CubeController.prototype.pause = function() {
    this.playing = false;
};

CubeController.prototype.play = function(resetTimers) {
    this.stop();
    this.playing = true;
};
