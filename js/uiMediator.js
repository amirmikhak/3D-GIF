var UIMediator = function UIMediator() {

    var mediator = this;

    Emitter(this);

    var _componentKeys = [];
    var _components = [];

    function __handleControllerEvent(event) {
        _components.forEach(function(component) {
            component.controllerEventCb.call(component, {
                type: event.type,
                data: event.data,
                ctrl: event.ctrl,
            });
        });
    }

    function __handleComponentEvent(event) {
        this.emit('mediatedEvent', {
            origin: 'component',
            type: event.type,
            data: event.data,
            component: event.component,
            callback: event.callback,
        });
    }

    function __handleRendererEvent(event) {
        this.emit('mediatedEvent', {
            origin: 'renderer',
            type: event.type,
            data: event.data,
            renderer: event.renderer,
            callback: event.callback,
        });
    }

    this.addComponent = function(key, newComponent) {
        if (_componentKeys.indexOf(key) !== -1)
        {
            console.error('Key already defined', key, _componentKeys);
            throw 'Duplicate key';
        } else if (!(newComponent instanceof UIComponent))
        {
            console.error('Invalid component: must be a UIComponent', newComponent);
            throw 'Invalid UIComponent';
        }

        newComponent.mediator = this;
        _components.push(newComponent);
        _componentKeys.push(key);

        return this;
    };

    this.removeComponent = function(key) {
        // !TODO: verify UIMediator.removeComponent(key) works (untested)
        var keyIndex = _componentKeys.indexOf(key);
        if (keyIndex === -1)
        {
            console.error('No key registered');
        }

        _components[keyIndex].mediator = null;
        _components.splice(keyIndex, 1);
        _componentKeys.splice(keyIndex, 1);

        return this;
    };

    this.getComponent = function(key) {
        var componentIndex = _componentKeys.indexOf(key);
        if (componentIndex === -1)
        {
            return null
        }
        return _components[componentIndex];
    };

    this.triggerControllerInit = function(ctrl) {
        _components.forEach(function(component) {
            component.controllerInitCb.call(component, ctrl);
        });
    };

    this.on('controllerEvent', __handleControllerEvent);
    this.on('componentEvent', __handleComponentEvent);
    this.on('rendererEvent', __handleRendererEvent);

    return this;

};
