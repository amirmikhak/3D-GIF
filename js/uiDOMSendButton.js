var UIDOMSendButton = function UIDOMSendButton(opts) {

    UIDOMLabelledButton.apply(this, arguments);

    var uiClearButton = this;

    var __defaultOptions = {
        label: 'Send',
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

    this.getDefaultOptions = function() {
        return __defaultOptions;
    };

    // init
    var __guid = 'x' + guid();  // prepend a non-numeric character to ensure class names are valid
    var __jss = new JsStyleSheet(__guid);

    __jss.insertRule('&', {
        'position': 'relative',
    });

    __jss.insertRule('input[type="text"]', {
        'position': 'absolute',
        'top': '100%',
        'left': '0',
        'display': 'none',
        'font-size': '16px',
        'font-family': '"Andale Mono", monospace',
        'width': '140px',
        'height': '32px',
        'border': '1px solid black',
        'padding': '12px',
    });

    __jss.insertRule('&:hover input[type="text"]', {
        'display': 'block',
    });

    var __stopPropagation = function(e) {
        e.stopImmediatePropagation();
        e.stopPropagation();
    };

    var __preventDefault = function(e) {
        e.preventDefault();
    };

    var inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.addEventListener('keydown', __stopPropagation);
    inputEl.addEventListener('keyup', __stopPropagation);
    inputEl.addEventListener('keypress', __stopPropagation);
    inputEl.addEventListener('click', __stopPropagation);
    inputEl.addEventListener('click', __preventDefault);
    this.containerEl.classList.add(__guid);
    this.containerEl.appendChild(inputEl);

    applyOptions.call(this, _options);

    return this;

};

UIDOMSendButton.prototype = Object.create(UIDOMLabelledButton.prototype);
UIDOMSendButton.prototype.constructor = UIDOMSendButton;
