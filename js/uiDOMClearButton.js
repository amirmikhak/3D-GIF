var UIDOMClearButton = function UIDOMClearButton(opts) {

    UIComponent.apply(this, arguments);

    var uiClearButton = this;

    var __defaultOptions = {};

    var __parentDefaultOptions = this.getDefaultOptions();
    var _parentOptionKeys = Object.keys(__parentDefaultOptions);
    for (var i = 0, numOpts = _parentOptionKeys.length; i < numOpts; i++) {
        __defaultOptions[_parentOptionKeys[i]] = __parentDefaultOptions[_parentOptionKeys[i]];
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
        if (uiClearButton.mediator)
        {
            uiClearButton.mediator.emit('componentEvent', {
                type: 'clearClicked',
                data: null,
                component: uiClearButton,
                callback: uiClearButton.componentEventCb,
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
            __unbindListeners(this.html);
        },
    });

    this.getDefaultOptions = function() {
        return __defaultOptions;
    };

    // init
    applyOptions.call(this, _options);
    this.html = this.containerEl;
    __bindListeners(this.html);

    return this;

};

UIDOMClearButton.prototype = Object.create(UIComponent.prototype);
UIDOMClearButton.prototype.constructor = UIDOMClearButton;
