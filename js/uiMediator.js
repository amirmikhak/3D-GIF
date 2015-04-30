var UIMediator = function UIMediator() {

    var mediator = this;

    Emitter(this);

    var _componentKeys = [];
    var _components = [];

    function __handleControllerEvent(event) {
        // !TODO: __handleControllerEvent incomplete, untested
        console.log('__handleControllerEvent', event);
        _components.forEach(function(component) {
            console.log('emitting to component', component);
            component.emit('mediatedEvent', {
                origin: 'controller',
                type: event.type,
                data: event.data,
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

    this.on('controllerEvent', __handleControllerEvent);
    this.on('componentEvent', __handleComponentEvent);

    return this;

};
