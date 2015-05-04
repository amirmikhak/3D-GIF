var UIComponent = function UIComponent(opts) {

    var uiComponent = this;

    Emitter(this);

    var __fnTrueCb = function() { return true; };
    var __fnNop = function() {};

    var __defaultOptions = {
        mediator: null,
        containerEl: null,
        visibleCondition: __fnTrueCb,
        enabledCondition: __fnTrueCb,
        componentEventCb: __fnNop,
        controllerEventCb: __fnNop,
    };

    var _opts = opts || {};
    var _options = {};
    var _optionKeys = Object.keys(__defaultOptions);
    for (var i = 0, numOpts = _optionKeys.length; i < numOpts; i++) {
        _options[_optionKeys[i]] = (_optionKeys[i] in _opts) ?
            _opts[_optionKeys[i]] :
            __defaultOptions[_optionKeys[i]];
    }

    var _html = document.createElement('div');

    Object.defineProperty(this, 'html', {
        get: function() { return _html; },
        set: function(newHTML) {
            if (!(newHTML instanceof HTMLElement))
            {
                throw 'Invalid htmlEl';
            }
            if (newHTML === _html)
            {
                return;
            }
            _options['containerEl'].removeChild(_html);
            _html = newHTML;
            if (_html === _options['containerEl'])
            {
                return;
            }
            _options['containerEl'].appendChild(_html);
        },
    });

    Object.defineProperty(this, '_destroyer', {
        configurable: true,
        writable: false,
        value: __fnNop,
    });

    Object.defineProperty(this, 'mediator', {
        get: function() { return _options['mediator']; },
        set: function(newMediator) {
            if (!(newMediator instanceof UIMediator) && (newMediator !== null))
            {
                console.error('Invalid mediator: must be a UIMediator.', newMediator);
                throw 'Invalid mediator';
            }
            var prevMediator = _options['mediator'];
            if (prevMediator !== newMediator)
            {
                uiComponent.emit('propertyChanged', {
                    property: 'mediator',
                    newValue: newMediator,
                    oldValue: prevMediator,
                });
                _options['mediator'] = newMediator;
            }
        }
    });

    Object.defineProperty(this, 'containerEl', {
        get: function() { return _options['containerEl']; },
        set: function(newContainerEl) {
            if (!(newContainerEl instanceof HTMLElement) && (newContainerEl !== null))
            {
                console.error('Invalid containerEl for UIComponent: must be HTMLElement.', newContainerEl);
                throw 'Invalid containerEl';
            }

            var prevContainerEl = _options['containerEl'];
            uiComponent.emit('propertyChanged', {
                property: 'containerEl',
                newValue: newContainerEl,
                oldValue: prevContainerEl,
            });
            _options['containerEl'] = newContainerEl;
            _options['containerEl'].appendChild(_html);
        },
    });

    var __fnProps = [
        'visibleCondition',
        'enabledCondition',
        'componentEventCb',
        'controllerEventCb',
    ];

    // !TODO: controllerEventCb: incomplete, untested

    __fnProps.forEach(function(prop) {
        Object.defineProperty(uiComponent, prop, {
            get: function() { return _options[prop]; },
            set: function(newValue) {
                if (typeof newValue !== 'function')
                {
                    console.error('Invalid ' + prop + ' for UIComponent: must be function.', newValue);
                    var err = 'Invalid ' + prop;
                    throw err;
                }

                var prevValue = _options[prop];
                uiComponent.emit('propertyChanged', {
                    property: prop,
                    newValue: newValue,
                    oldValue: prevValue,
                });
                _options[prop] = newValue;
            },
        });

    });

    this.getDefaultOptions = function() {
        return __defaultOptions;
    };

    applyOptions.call(this, _options);

    return this;
};

UIComponent.prototype.destroy = function() { this._destroyer(); };
