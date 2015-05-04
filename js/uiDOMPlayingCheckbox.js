var UIDOMPlayingCheckbox = function UIDOMPlayingCheckbox(opts) {

    UIComponent.apply(this, arguments);

    var uiPlayingCheckbox = this;

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

    var _checked;
    var __guid = 'x' + guid();  // prepend a non-numeric character to ensure class names are valid
    var __jss = new JsStyleSheet(__guid);

    function __changeListener(e) {
        _checked = e.target.checked;
        if (uiPlayingCheckbox.mediator)
        {
            uiPlayingCheckbox.mediator.emit('componentEvent', {
                type: 'changed',
                data: null,
                component: uiPlayingCheckbox,
                callback: uiPlayingCheckbox.componentEventCb,
            });
        }
    }

    function __bindListeners(el) {
        el.addEventListener('change', __changeListener);
    }

    function __unbindListeners(el) {
        el.removeEventListener('change', __changeListener);
    }

    Object.defineProperty(this, '_destroyer', {
        writable: false,
        value: function() {
            __unbindListeners(this.html);
            __jss.destroy();
        },
    });

    Object.defineProperty(this, 'checked', {
        get: function() { return _checked; },
    });

    this.getDefaultOptions = function() {
        return __defaultOptions;
    };

    function __addStyles() {
        __jss.insertRule('input', {
            'position': 'absolute',
            'opacity': '0',
            'z-index': '-1',
            'top': '0',
            'left': '0',
        });
    }

    function __buildHTML() {
        var wrapperLabel = document.createElement('label');
        var inputEl = document.createElement('input');
        inputEl.name = 'playing';
        inputEl.type = 'checkbox';
        inputEl.checked = false;
        var textSpan = document.createElement('span');
        textSpan.innerHTML = 'Play';
        wrapperLabel.appendChild(textSpan);
        wrapperLabel.appendChild(inputEl);
        return wrapperLabel;
    }

    // init
    __addStyles();
    this.containerEl.classList.add(__guid);
    this.containerEl.appendChild(__buildHTML());
    applyOptions.call(this, _options);
    this.html = this.containerEl;
    __bindListeners(this.html);

    return this;

};

UIDOMPlayingCheckbox.prototype = Object.create(UIComponent.prototype);
UIDOMPlayingCheckbox.prototype.constructor = UIDOMPlayingCheckbox;
