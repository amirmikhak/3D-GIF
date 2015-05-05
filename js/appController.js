var AppController = function AppController(opts) {

    var appCtrl = this;

    Emitter(this);

    var __defaultOptions = {
        renderer: null,
        mediator: null,
    };

    var _opts = opts || {};
    var _options = {};
    var _optionKeys = Object.keys(__defaultOptions);
    for (var i = 0, numOpts = _optionKeys.length; i < numOpts; i++) {
        _options[_optionKeys[i]] = (_optionKeys[i] in _opts) ?
            _opts[_optionKeys[i]] :
            __defaultOptions[_optionKeys[i]];
    }

    var _activeControllerKey = null;
    var _activeController = null;
    var _loadedControllerKeys = [];
    var _loadedControllers = [];

    function __handleMediatedEvent(event) {
        if ((event.origin === 'component') || (event.origin === 'renderer'))
        {
            if (event.origin === 'renderer')
            {
                if (event.type === 'rendererPropertyChanged')
                {
                    appCtrl.mediator.emit('controllerEvent', {
                        type: event.type,
                        data: event.data,
                        ctrl: _activeController,
                    });
                }
            }
            if (typeof event.callback === 'function')
            {
                event.callback.call(event[event.origin], {
                    appCtrl: appCtrl,
                    ctrl: appCtrl.activeController,
                    type: event.type,
                    data: event.data,
                });
            }
        } else if ((event.origin === 'controller') || (event.origin === 'appController'))
        {
            appCtrl.mediator.emit('controllerEvent', {
                type: event.type,
                data: event.data,
                ctrl: _activeController,
            });
        }
    }

    function __handleOwnPropertyChanged(changeData) {
        appCtrl.mediator.emit('mediatedEvent', {
            origin: 'appController',
            type: 'propertyChanged',
            data: changeData,
        });
    }

    function __handleActiveControllerPropertyChanged(changeData) {
        // !TODO: fix unnecessary indirection of events/callers
        appCtrl.mediator.emit('mediatedEvent', {
            origin: 'controller',
            type: 'propertyChanged',
            data: changeData,
        });
    }

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
            var prevRenderer = _options['renderer'];
            if (prevRenderer !== newRenderer)
            {
                if (prevRenderer && prevRenderer.hasOwnProperty('mediator'))
                {
                    prevRenderer.mediator = null;
                }
            }
            if (newRenderer && newRenderer.hasOwnProperty('mediator'))
            {
                newRenderer.mediator = _options['mediator'];
            }
            var prevPlaying = this.playing;
            __detachRendererFromController();
            _options['renderer'] = newRenderer;
            __attachRendererToController(prevPlaying);
            if (_options['mediator'])
            {
                _options['mediator'].triggerControllerInit(this);
            }
        },
    });

    Object.defineProperty(this, 'mediator', {
        get: function() { return _options['mediator']; },
        set: function(newMediator) {
            if ((newMediator !== null) && !(newMediator instanceof UIMediator))
            {
                console.error('Invalid mediator for AppController: must be a UIMediator', newMediator);
                throw 'Invalid mediator';
            }
            var prevMediator = _options['mediator'];
            _options['mediator'] = newMediator;
            if (_options['mediator'])
            {
                _options['mediator'].on('mediatedEvent', __handleMediatedEvent);
                _options['mediator'].triggerControllerInit(this);
            }
            if (prevMediator && (prevMediator !== _options['mediator']))
            {
                prevMediator.off('mediatedEvent', __handleMediatedEvent);
            }
        },
    });

    Object.defineProperty(this, 'activeController', {
        get: function() { return _activeController; },
        set: function(newActiveControllerKey) {
            var prevActiveControllerKey = _activeControllerKey;
            if (newActiveControllerKey === null)
            {
                __detachRendererFromController();
                if (_activeController)
                {
                    _activeController.off('propertyChanged', __handleActiveControllerPropertyChanged);
                }
                this.emit('propertyChanged', {
                    property: 'activeController',
                    newValue: _activeControllerKey,
                    oldValue: prevActiveControllerKey
                });
                return _activeControllerKey = _activeController = null;
            }
            var ctrlIndex = _loadedControllerKeys.indexOf(newActiveControllerKey);
            if (ctrlIndex === -1)
            {
                console.error(`Could not load controller: ${newActiveControllerKey}`, _loadedControllerKeys);
                throw 'Controller not loaded';
            }
            var prevPlaying = this.playing;
            __detachRendererFromController();
            if (_activeController)
            {
                _activeController.off('propertyChanged', __handleActiveControllerPropertyChanged);
            }
            _activeControllerKey = newActiveControllerKey;
            _activeController = _loadedControllers[ctrlIndex];
            _activeController.on('propertyChanged', __handleActiveControllerPropertyChanged);
            __attachRendererToController(prevPlaying);
            this.emit('propertyChanged', {
                property: 'activeController',
                newValue: _activeControllerKey,
                oldValue: prevActiveControllerKey
            });
        },
    });

    Object.defineProperty(this, 'activeControllerKey', {
        get: function() { return _activeControllerKey; },
    });

    Object.defineProperty(this, 'nextControllerKey', {
        get: function() {
            return (!_loadedControllers.length) ? null :
                (_loadedControllerKeys[(_activeControllerKey === null) ? 0 :
                    (_loadedControllerKeys.indexOf(_activeControllerKey) + 1) % _loadedControllerKeys.length]);
        }
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

    this.on('propertyChanged', __handleOwnPropertyChanged);

    applyOptions.call(this, _options);

    return this;

};

AppController.prototype.useNextController = function() {
    this.activeController = this.nextControllerKey;
    return this;
};

AppController.prototype.useController = function(controllerKey) {
    this.activeController = controllerKey;
    return this;
};

AppController.prototype.stop = function() {
    this.playing = false;
    return this;
};

AppController.prototype.play = function() {
    this.playing = true;
    return this;
};
