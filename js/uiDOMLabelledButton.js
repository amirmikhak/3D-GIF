var UIDOMLabelledButton = function UIDOMLabelledButton(opts) {

    UIComponent.apply(this, arguments);

    var uiButton = this;

    var __defaultOptions = {
        label: '',
    };

    var __parentDefaultOptions = this.getDefaultOptions();
    var _parentOptionKeys = Object.keys(__parentDefaultOptions);
    for (var i = 0, numOpts = _parentOptionKeys.length; i < numOpts; i++) {
        __defaultOptions[_parentOptionKeys[i]] = (_parentOptionKeys[i] in __defaultOptions) ?
            __defaultOptions[_parentOptionKeys[i]] :
            __parentDefaultOptions[_parentOptionKeys[i]];
    }

    var _opts = opts || {};
    var _options = {};
    var _optionKeys = Object.keys(__defaultOptions);
    for (var i = 0, numOpts = _optionKeys.length; i < numOpts; i++) {
        _options[_optionKeys[i]] = (_optionKeys[i] in _opts) ?
            _opts[_optionKeys[i]] :
            __defaultOptions[_optionKeys[i]];
    }

    function __clickListener(e) {
        if (uiButton.mediator)
        {
            uiButton.mediator.emit('componentEvent', {
                type: 'buttonClicked',
                data: null,
                component: uiButton,
                callback: uiButton.componentEventCb,
            });
        }
    }

    function __bindListeners(el) {
        el.addEventListener('click', __clickListener);
    }

    function __unbindListeners(el) {
        el.removeEventListener('click', __clickListener);
    }

    Object.defineProperty(this, '_destroyer', {
        writable: false,
        value: function() {
            this.html.innerHTML = '';
            __unbindListeners(this.html);
        },
    });

    Object.defineProperty(this, 'label', {
        get: function() { return _options['label']; },
        set: function(newLabel) {
            var prevLabel = _options['label'];
            _options['label'] = newLabel.toString();
            this.html.innerHTML = _options['label'];
            this.emit('propertyChanged', {
                property: 'label',
                oldValue: prevLabel,
                newValue: newLabel,
            });
        },
    });

    this.getDefaultOptions = function() {
        return __defaultOptions;
    };

    // init
    __bindListeners(this.html);

    applyOptions.call(this, _options);



    return this;

};

UIDOMLabelledButton.prototype = Object.create(UIComponent.prototype);
UIDOMLabelledButton.prototype.constructor = UIDOMLabelledButton;
