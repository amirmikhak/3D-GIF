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

    function __containerClickListener(e) {
        // yoinked from http://darktalker.com/2010/manually-trigger-dom-event/
        evt = document.createEvent('HTMLEvents');
        evt.initEvent('click', false, true); // event type,bubbling,cancelable
        uiButton.html.dispatchEvent(evt);
    }

    function __ownClickListener(e) {
        e.stopPropagation();
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

    function __bindOwnListeners() {
        this.html.addEventListener('click', __ownClickListener);
    }

    function __bindContainerListeners() {
        this.containerEl.addEventListener('click', __containerClickListener);
    }

    function __unbindListeners() {
        this.html.removeEventListener('click', __ownClickListener);
        this.containerEl.removeEventListener('click', __containerClickListener);
    }

    Object.defineProperty(this, '_destroyer', {
        writable: false,
        value: function() {
            this.html.innerHTML = '';
            __unbindListeners.call(this);
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
    applyOptions.call(this, _options);

    __bindOwnListeners.call(this);
    __bindContainerListeners.call(this);

    return this;

};

UIDOMLabelledButton.prototype = Object.create(UIComponent.prototype);
UIDOMLabelledButton.prototype.constructor = UIDOMLabelledButton;
