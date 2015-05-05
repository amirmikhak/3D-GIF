var UIDOMPlaylistControls = function UIDOMPlaylistControls(opts) {

    UIComponent.apply(this, arguments);

    var uiPlaylistControls = this;

    var __fnNop = function() {};

    var __defaultOptions = {
        wrapDirections: (new CubePlaylistController).wrapDirections,
        modes: (new CubePlaylistController).modes,
        tiles: [],
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

    function __fakeChangeEvent(inputEl) {
        // yoinked from http://darktalker.com/2010/manually-trigger-dom-event/
        evt = document.createEvent('HTMLEvents');
        evt.initEvent('change', true, true); // event type,bubbling,cancelable
        inputEl.dispatchEvent(evt);
    }

    function __getRadioEls(key) {
        var radioSelector = 'input[type="radio"][name="' + key + '"]';
        var radioElList = uiPlaylistControls.containerEl.querySelectorAll(radioSelector);
        var radioElArray = Array.prototype.slice.apply(radioElList);
        return radioElArray;
    }

    function __setLoopingCheckboxChecked(newChecked) {
        var inputEl = uiPlaylistControls.containerEl ?
            uiPlaylistControls.containerEl.querySelector('.looping-cb input') :
            null;
        if (inputEl)
        {
            var prevChecked = inputEl.checked;
            inputEl.checked = newChecked;
            if (prevChecked !== newChecked)
            {
                __fakeChangeEvent(inputEl);
            }
        }
    }

    function __containerChangeListener(e) {
        if (uiPlaylistControls.containerEl && (e.target.name === 'modes'))
        {
            uiPlaylistControls.containerEl.classList.toggle('show-direction-selector', e.target.value !== 'through');
        }
        if (uiPlaylistControls.mediator)
        {
            var selectableProps = ['modes', 'wrapDirections'];
            var propIsSelectable = selectableProps.indexOf(e.target.name) !== -1;
            var eventType = propIsSelectable ?
                (e.target.name.slice(0, -1) + 'Selected') :
                e.target.name + 'Changed';
            console.log('eventtype', eventType);
            uiPlaylistControls.mediator.emit('componentEvent', {
                type: eventType,
                data: propIsSelectable ? e.target.value : e.target.checked, // !TODO: yuck...
                component: uiPlaylistControls,
                callback: uiPlaylistControls.componentEventCb,
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
            this.containerEl.innerHTML = '';
            __unbindListeners.call(this);
        },
    });

    Object.defineProperty(this, 'tiles', {
        // !TODO: actually implement tiles getter/setter
        get: function() { return _options['tiles']; },
        set: function(newTiles) {
            if ((newTiles !== null) && !(newTiles instanceof Array))
            {
                console.error('Invalid tiles for UIDOMPlaylistControls: ' +
                    'must be an array of CubeTiles.', newTiles);
                throw 'Invalid tiles';
            }
            var prevModes = _options['tiles'];
            _options['tiles'] = newTiles;
            __updateDOM.call(this);
            this.emit('propertyChanged', {
                property: 'tiles',
                oldValue: prevModes,
                newValue: newTiles,
            });
        },
    });

    ['mode', 'wrapDirection'].forEach(function(prop) {
        var pluralProp = prop + 's';
        var selPropName = 'selected' + prop.capitalizeFirstLetter();

        Object.defineProperty(uiPlaylistControls, pluralProp, {
            get: function() { return _options[pluralProp]; },
            set: function(newValues) {
                if ((newValues !== null) && !(newValues instanceof Array))
                {
                    console.error('Invalid ' + prop + ' for UIDOMPlaylistControls: ' +
                        'must be an array of ' + prop + ' names.', newValues);
                    throw 'Invalid ' + prop;
                }
                var prevValues = _options[pluralProp];
                _options[pluralProp] = newValues;
                __updateDOM.call(uiPlaylistControls);
                uiPlaylistControls.emit('propertyChanged', {
                    property: pluralProp,
                    oldValue: prevValues,
                    newValue: newValues,
                });
            },
        });

        Object.defineProperty(uiPlaylistControls, selPropName, {
            get: function() {
                var checked = __getRadioEls(pluralProp).filter(function(radioEl) {
                    return radioEl.checked;
                });
                return checked[0] ? checked[0].value : null;
            },
            set: function(newValue) {
                if (_options[pluralProp].indexOf(newValue) === -1)
                {
                    console.error('Invalid ' + selPropName + ' for UIDOMPlaylistControls: ' +
                        'must be one of the following: ' + _options[pluralProp].toString());
                    throw 'Invalid ' + prop;
                }
                __getRadioEls(pluralProp).forEach(function(input) {
                    var prevValue = input.checked;
                    input.checked = (input.value === newValue);
                    if (prevValue !== input.checked)
                    {
                        __fakeChangeEvent(input);
                    }
                });
            },
        });
    });

    Object.defineProperty(this, 'selectedLooping', {
        get: function() { return _options['looping']; },
        set: function(newSelectedLooping) {
            var prevSelectedLooping = _options['looping'];
            _options['looping'] = !!newSelectedLooping;
            __setLoopingCheckboxChecked(_options['looping']);
            this.emit('propertyChanged', {
                property: 'selectedLooping',
                oldValue: prevSelectedLooping,
                newValue: newSelectedLooping,
            });
        },
    });

    function __radioTabForItem(fieldName, item) {
        var inputEl = document.createElement('input');
        inputEl.type = 'radio';
        inputEl.name = fieldName;
        inputEl.value = item;
        var divEl = document.createElement('div');
        var spanEl = document.createElement('span');
        spanEl.innerHTML = item;
        var labelEl = document.createElement('label');
        labelEl.className = 'radio-tab control-button';
        labelEl.appendChild(inputEl);
        labelEl.appendChild(divEl);
        labelEl.appendChild(spanEl);
        return labelEl;
    }

    function __appendChild(parent, child) {
        parent.appendChild(child);
        return parent;
    }

    var __builders = {
        modeSelectorHTML: function() {
            var modeSelectorEl = document.createElement('div');
            modeSelectorEl.className = 'mode-selector radio-tabs vertical mini';
            this.modes
                .map(function(m) { return __radioTabForItem('modes', m); })
                .forEach(function(c) { __appendChild(modeSelectorEl, c); });
            return modeSelectorEl;
        },
        wrapDirectionSelectorHTML: function() {
            var wrapDirectionSelectorEl = document.createElement('div');
            wrapDirectionSelectorEl.className = 'wrap-direction-selector radio-tabs vertical mini';
            this.wrapDirections
                .map(function(m) { return __radioTabForItem('wrapDirections', m); })
                .forEach(function(c) { __appendChild(wrapDirectionSelectorEl, c); });
            return wrapDirectionSelectorEl;
        },
        tileTrayHTML: function() {
            // !TODO: implement __buildTileTrayHTML()
            return document.createDocumentFragment();
        },
        loopCheckboxHTML: function() {
            var inputEl = document.createElement('input');
            inputEl.type = 'checkbox';
            inputEl.name = 'looping';
            var iconEl = document.createElement('i');
            iconEl.className = 'fa fa-refresh';
            var spanEl = document.createElement('span');
            spanEl.appendChild(iconEl);
            var loopingCheckboxEl = document.createElement('label');
            loopingCheckboxEl.className = 'looping-cb';
            loopingCheckboxEl.appendChild(inputEl);
            loopingCheckboxEl.appendChild(spanEl);
            return loopingCheckboxEl;
        },
        spacingIndicatorHTML: function() {
            // !TODO: implement __buildSpacingIndicatorHTML()
            return document.createDocumentFragment();
        },
        animationIntervalIndicatorHTML: function() {
            // !TODO: implement __buildAnimationIntervalIndicatorHTML()
            return document.createDocumentFragment();
        },
    };

    function __buildHTML() {
        var that = this;
        var controlsFrag = document.createDocumentFragment();
        Object.keys(__builders).forEach(function(builderName) {
            controlsFrag.appendChild(__builders[builderName].call(that));
        });
        return controlsFrag;
    }

    function __addStyles() {
        __jss.insertRule('&.playlist-controls', {
            'box-sizing': 'border-box',
            'position': 'absolute',
            'top': '0',
            'width': '100%',
            'height': '100%',
            'border': '1px solid #ccc',
            'padding': '0 2px',
            '-webkit-user-select': 'none',
            'transition': 'opacity 300ms ease-in-out',
        }).insertRule('&.in-front', {
            'z-index': '2',
            'opacity': '1',
        }).insertRule('&.in-back', {
            'z-index': '-1',
            'opacity': '0',
        }).insertRule('.radio-tabs.vertical.mini', {
            'display': 'flex',
            'flex-direction': 'column',
            'justify-content': 'center',
            '-webkit-user-select': 'none',
            'letter-spacing': '0.125em',
        }).insertRule('.radio-tab', {
            'display': 'flex',
            'flex': '1',
            'flex-direction': 'column',
            'justify-content': 'center',
            'margin': '0',
            'padding': '0',
            'font-size': '13px',
            'line-height': '1em',
            'position': 'relative',
        }).insertRule('.radio-tab:hover', {
            'border-color': '#aaa',
        }).insertRule('.radio-tab input', {
            'display': 'none',
        }).insertRule('.radio-tab span', {
            'z-index': '1',
        }).insertRule('.radio-tab div:active', {
            'border-color': '#999',
        }).insertRule('.radio-tab input:checked + div', {
            'background-color': '#999',
        }).insertRule('.radio-tab div', {
            'position': 'absolute',
            'top': '-1px',
            'left': '-1px',
            'width': 'calc(100% + 2px)',
            'height': 'calc(100% + 2px)',
            'box-sizing': 'border-box',
            'border': 'none',
            'z-index': '0',
        }).insertRule('.radio-tab:not(:last-of-type)', {
            'border-bottom': '1px solid #999',
        }).insertRule('.mode-selector', {
            'box-sizing': 'border-box',
            'position': 'absolute',
            'top': 'calc(50% - 37.5px)',
            'left': 'calc(-1 * 120 * 1.1px)',
            'width': '120px',
            'height': '75px',
            'font-size': '36px',
            'line-height': '48px',
            'text-align': 'center',
            'transition': 'left 300ms ease-in-out',
        }).insertRule('.wrap-direction-selector', {
            'box-sizing': 'border-box',
            'position': 'absolute',
            'top': 'calc(50% - 37.5px)',
            'right': 'calc(100% + 12px)',
            'width': '0',
            'height': '75px',
            'font-size': '36px',
            'line-height': '48px',
            'text-align': 'center',
            'overflow': 'hidden',
            'transition': 'width 300ms ease-in-out',
        }).insertRule('&.show-direction-selector .mode-selector', {
            'left': '-182px',
        }).insertRule('&.show-direction-selector .wrap-direction-selector', {
            'width': '50px',
        }).insertRule('.looping-cb', {
            'box-sizing': 'border-box',
            'position': 'absolute',
            'top': 'calc(50% - 25px)',
            'right': 'calc(-1 * 50 * 1.25px)',
            'border': '1px solid #ccc',
            'width': '50px',
            'height': '50px',
            'font-size': '36px',
            'line-height': '48px',
            'text-align': 'center',
        }).insertRule('.looping-cb span', {
            'display': 'block',
            'position': 'absolute',
            'top': '0',
            'bottom': '0',
            'left': '0',
            'right': '0',
            'background': '#fff',
            'color': '#ccc',
        }).insertRule('.looping-cb:hover span', {
            'background': '#fff',
            'color': '#9f9',
        }).insertRule('.looping-cb:active span', {
            'background': '#ccc',
            'color': '#555',
        }).insertRule('.looping-cb input', {
            'z-index': '-1',
            'opacity': '0.1',
        }).insertRule('.looping-cb input:checked + span', {
            'background': '#21C721',
            'color': '#fff',
        }).insertRule('.looping-cb:hover input:checked + span', {
            'color': '#9f9',
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
    this.containerEl.classList.add('playlist-controls');
    applyOptions.call(this, _options);

    return this;

};

UIDOMPlaylistControls.prototype = Object.create(UIComponent.prototype);
UIDOMPlaylistControls.prototype.constructor = UIDOMPlaylistControls;

UIDOMPlaylistControls.prototype.bringToFront = function() {
    this.containerEl.classList.add('in-front');
    this.containerEl.classList.remove('in-back');
};

UIDOMPlaylistControls.prototype.sendToBack = function() {
    this.containerEl.classList.remove('in-front');
    this.containerEl.classList.add('in-back');
};
