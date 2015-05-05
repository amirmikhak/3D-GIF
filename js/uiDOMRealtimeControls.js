var UIDOMRealtimeControls = function UIDOMRealtimeControls(opts) {

    UIComponent.apply(this, arguments);

    var uiRealtimeControls = this;

    var __fnNop = function() {};

    var __defaultOptions = {
        directions: (new CubeController).directions,
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

    var __guid = 'x' + guid();  // prepend a non-numeric character to ensure class names are valid
    var __jss = new JsStyleSheet(__guid);

    function __getRadioEls() {
        var radioSelector = 'input[type="radio"][name="direction"]';
        var radioElList = uiRealtimeControls.containerEl.querySelectorAll(radioSelector);
        var radioElArray = Array.prototype.slice.apply(radioElList);
        return radioElArray;
    }

    function __containerChangeListener(e) {
        if (uiRealtimeControls.mediator)
        {
            uiRealtimeControls.mediator.emit('componentEvent', {
                type: 'directionSelected',
                data: e.target.value,
                component: uiRealtimeControls,
                callback: uiRealtimeControls.componentEventCb,
            });
        }
    }

    function __bindContainerListeners() {
        this.containerEl.addEventListener('change', __containerChangeListener);
    }

    function __unbindListeners() {
        this.containerEl.removeEventListener('change', __containerChangeListener);
    }

    Object.defineProperty(this, '_destroyer', {
        writable: false,
        value: function() {
            this.html.innerHTML = '';
            __unbindListeners.call(uiRealtimeControls);
        },
    });

    Object.defineProperty(this, 'directions', {
        get: function() { return _options['directions']; },
        set: function(newDirections) {
            if ((newDirections !== null) && !(newDirections instanceof Object))
            {
                console.error('Invalid directions for UIDOMRealtimeControls: ' +
                    'must be an array of direction names.', newDirections);
                throw 'Invalid directions';
            }
            var prevDirections = _options['directions'];
            _options['directions'] = newDirections;
            __updateDOM.call(this);
            this.emit('propertyChanged', {
                property: 'directions',
                oldValue: prevDirections,
                newValue: newDirections,
            });
        },
    });

    Object.defineProperty(this, 'selectedDirection', {
        get: function() {
            var checked = __getRadioEls().filter(function(radioEl) {
                return radioEl.checked;
            });
            return checked[0] ? checked[0].value : null;
        },
        set: function(newDirection) {
            __getRadioEls().forEach(function(input) {
                input.checked = (input.value === newDirection);
            });
        },
    });

    function __buildHTML() {
        if (!this.directions)
        {
            return null;
        }
        var that = this;
        var pickerFrag = document.createDocumentFragment();
        var radioTabsEl = document.createElement('div');
        radioTabsEl.classList.add('radio-tabs');
        this.directions.map(function(directionName) {
            var inputEl = document.createElement('input');
            inputEl.type = 'radio';
            inputEl.name = 'direction';
            inputEl.value = directionName;
            var divEl = document.createElement('div');
            divEl.innerHTML = directionName;
            var labelEl = document.createElement('label');
            labelEl.classList.add('radio-tab')
            labelEl.classList.add('control-button');
            labelEl.appendChild(inputEl);
            labelEl.appendChild(divEl);
            return labelEl;
        }).forEach(function(labelEl) {
            document.appendChild.call(radioTabsEl, labelEl);
        });
        pickerFrag.appendChild(radioTabsEl);
        return pickerFrag;
    }

    function __addStyles() {
        __jss.insertRule('&.realtime-controls', {
            'position': 'absolute',
            'width': '100%',
            'height': '100%',
            'transition': 'opacity 300ms ease-in-out',
        }).insertRule('&.in-front', {
            'z-index': '2',
            'opacity': '1',
        }).insertRule('&.in-back', {
            'z-index': '-1',
            'opacity': '0',
        }).insertRule('.radio-tabs', {
            'letter-spacing': '0.125em',
            'display': 'flex',
            'flex-direction': 'row',
            'justify-content': 'space-between',
            '-webkit-user-select': 'none',
        }).insertRule('.radio-tab', {
            'flex': '1',
            'font-size': '16px',
            'padding': '0',         // override .control-button
            'margin': '0 2px',
        }).insertRule('.radio-tab input', {
            'display': 'none',
        }).insertRule('.radio-tab > div', {
            'padding': '12px 0',    // make up for overridden .control-button
        });
    }

    function __updateDOM() {
        __unbindListeners.call(this);
        this.html = __buildHTML.call(this);
        __bindContainerListeners.call(this);
    }

    // init
    __addStyles();
    this.containerEl.classList.add(__guid);
    this.containerEl.classList.add('realtime-controls');
    applyOptions.call(this, _options);

    return this;

};

UIDOMRealtimeControls.prototype = Object.create(UIComponent.prototype);
UIDOMRealtimeControls.prototype.constructor = UIDOMRealtimeControls;

UIDOMRealtimeControls.prototype.bringToFront = function() {
    this.containerEl.classList.add('in-front');
    this.containerEl.classList.remove('in-back');
};

UIDOMRealtimeControls.prototype.sendToBack = function() {
    this.containerEl.classList.remove('in-front');
    this.containerEl.classList.add('in-back');
};
