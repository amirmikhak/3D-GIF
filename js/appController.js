var AppController = function AppController(opts) {

    var appCtrl = this;

    Emitter(this);

    var __defaultOptions = {
        renderer: null,
    };

    var _opts = opts || {};
    var _options = {};
    var _optionKeys = Object.keys(__defaultOptions);
    for (var i = 0, numOpts = _optionKeys.length; i < numOpts; i++) {
        _options[_optionKeys[i]] = (_optionKeys[i] in _opts) ?
            _opts[_optionKeys[i]] :
            __defaultOptions[_optionKeys[i]];
    }

    var _activeController = null;
    var _loadedControllerKeys = [];
    var _loadedControllers = [];

    function __attachRendererToController(playAfterAttach) {
        if (_activeController)
        {
            _activeController.renderer = _options['renderer'];
            if (playAfterAttach)
            {
                _activeController.play();
            }
        }
    }

    function __detachRendererFromController() {
        if (_activeController)
        {
            _activeController.stop();
            _activeController.renderer = null;
        }
    }

    Object.defineProperty(this, 'playing', {
        get: function() {
            return _activeController ?
                !!_activeController.playing :
                false;
        },
        set: function(newPlaying) {
            if (!_activeController)
            {
                throw 'Cannot play without activeController';
            }
            _activeController.playing = !!newPlaying;
        }
    });

    Object.defineProperty(this, 'renderer', {
        get: function() { return _options['renderer']; },
        set: function(newRenderer) {
            if ((newRenderer !== null) && !(newRenderer instanceof CubeRenderer))
            {
                throw 'Invalid Renderer';
            }
            var prevPlaying = this.playing;
            __detachRendererFromController();
            _options['renderer'] = newRenderer;
            __attachRendererToController(prevPlaying);
        },
    });

    Object.defineProperty(this, 'activeController', {
        get: function() { return _activeController; },
        set: function(newActiveControllerKey) {
            if (newActiveControllerKey === null)
            {
                __detachRendererFromController();
                return _activeController = null;
            }
            var ctrlKey = _loadedControllerKeys.indexOf(newActiveControllerKey);
            if (ctrlKey === -1)
            {
                throw 'Controller not loaded';
            }
            var prevPlaying = this.playing;
            __detachRendererFromController();
            _activeController = _loadedControllers[ctrlKey];
            __attachRendererToController(prevPlaying);
        },
    });

    Object.defineProperty(this, 'loadedControllers', {
        get: function() { return _loadedControllerKeys.slice(); },
    });

    this.loadController = function(key, cubeCtrl) {
        if (!(cubeCtrl instanceof CubeController))
        {
            throw 'Invalid controller';
        }
        if (_loadedControllers.indexOf(cubeCtrl) !== -1)
        {   // if we have already loaded this controller
            return;
        }
        _loadedControllerKeys.push(key);
        _loadedControllers.push(cubeCtrl);
        return this;
    };

    this.unloadController = function(key) {
        var keyIndex = _loadedControllerKeys.indexOf(key);
        if (keyIndex === -1)
        {
            throw 'Invalid controller key';
        }
        _loadedControllerKeys.splice(keyIndex, 1);
        _loadedControllers.splice(keyIndex, 1);
        if (_loadedControllers.indexOf(_activeController) === -1)
        {
            this.activeController = _loadedControllerKeys.length ?
                _loadedControllerKeys[0] :
                null;
        }
        return this;
    };

    applyOptions.call(this, _options);

    return this;

};

AppController.prototype.stop = function() {
    this.playing = false;
};

AppController.prototype.play = function() {
    this.playing = true;
};
