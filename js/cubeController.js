var CubeController = function CubeController(cube) {

    Emitter(this);

    var controller = this;

    var _cube = cube;
    var _playing = false;
    var _animationStartTime = (new Date()).getTime();
    var _lastAnimFrameTime = _animationStartTime;
    var _lastRenderedTime = _animationStartTime;

    var __animationFrameRef = 0;
    var __step = function __step() {
        controller.getUpdate();
        _lastAnimFrameTime = (new Date()).getTime();
        __animationFrameRef = requestAnimationFrame(__step);
    };

    Object.defineProperty(this, 'cube', {
        get: function() { return _cube; },
        set: function(newCube) {
            if (!(newCube instanceof Cube) && (newCube !== null))
            {
                console.error('Invalid newCube for CubeController', newCube);
                throw 'Invalid cube';
            }

            _cube = newCube;
        },
    });

    Object.defineProperty(this, 'playing', {
        get: function() { return _playing; },
        set: function(newPlaying) {
            var prevPlaying = _playing;
            _playing = !!newPlaying;

            if (_playing && !prevPlaying)
            {
                cancelAnimationFrame(__animationFrameRef);
                __animationFrameRef = requestAnimationFrame(__step);
            } else if (!_playing && prevPlaying)
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
            _lastRenderedTime = _lastAnimFrameTime = _animationStartTime = (new Date()).getTime();
        },
    });

    return this;

};

CubeController.prototype.getUpdate = function() {
};

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

CubeController.prototype.play = function() {
    this.playing = true;
};
