var CubeRealtimeUserController = function CubeRealtimeUserController(opts) {

    CubeController.apply(this, arguments);

    var cubeRealtimeUserController = this;

    var __defaultOptions = {
        delay: 100,
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

    Object.defineProperty(this, 'mouseListeningCells', {
        get: function() { return _mouseListeningCells; }
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
        }
    });

    Object.defineProperty(this, 'penColor', {
        get: function() { return _options['penColor']; },
        set: function(newPenColor) { _options['penColor'] = newPenColor; }
    });
    Object.defineProperty(this, 'penColorRgb', {
        get: function() { return this.cube.colors[_options['penColor']]; },
    });

    // !TODO: fill in the real properties for the options
    Object.defineProperty(this, 'delay', {
        get: function() { return _options['delay']; },
        set: function(newDelay) { _options['delay'] = newDelay; }
    });
    Object.defineProperty(this, 'action', {
        get: function() { return _options['action']; },
        set: function(newAction) { _options['action'] = newAction; }
    });
    Object.defineProperty(this, 'direction', {
        get: function() { return _options['direction']; },
        set: function(newDirection) { _options['direction'] = newDirection; }
    });
    Object.defineProperty(this, 'stepSize', {
        get: function() { return _options['stepSize']; },
        set: function(newStepSize) { _options['stepSize'] = newStepSize; }
    });
    Object.defineProperty(this, 'wrap', {
        get: function() { return _options['wrap']; },
        set: function(newWrap) { _options['wrap'] = newWrap; }
    });
    Object.defineProperty(this, 'listenForKeys', {
        get: function() { return _options['listenForKeys']; },
        set: function(newListenForKeys) { _options['listenForKeys'] = newListenForKeys; }
    });

    applyOptions.call(this, _options);

    return this;

};

CubeRealtimeUserController.prototype = Object.create(CubeController.prototype);
CubeRealtimeUserController.prototype.constructor = CubeRealtimeUserController;

CubeRealtimeUserController.prototype.getUpdate = function() {
    console.log('"Real" getUpdate()');
};

