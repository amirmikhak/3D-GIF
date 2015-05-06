var UIDOMPlaylistControls = function UIDOMPlaylistControls(opts) {

    UIComponent.apply(this, arguments);

    var uiPlaylistControls = this;

    var __defaultOptions = {
        wrapDirections: (new CubePlaylistController).wrapDirections,
        modes: (new CubePlaylistController).modes,
        tiles: [],
        cursorPosition: 0,
        inFocus: false,
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

    function __getCursorEl() {
        return uiPlaylistControls.containerEl ?
            uiPlaylistControls.containerEl.querySelector('.cursor') :
            null;
    }

    function __getTileTrayEl() {
        return uiPlaylistControls.containerEl ?
            uiPlaylistControls.containerEl.querySelector('.tile-tray') :
            null;
    }

    function __renderTileElFromTileData(tile) {
        var imgEl = document.createElement('img');
        imgEl.src = tile.thumb;
        var tileEl = document.createElement('div');
        tileEl.className = 'tile';
        tileEl.dataset.idx = tile.idx,
        tileEl.appendChild(imgEl);
        return tileEl;
    }

    function __rebuildTileTray() {
        var that = this;
        var tileEls = this.tiles.map(__renderTileElFromTileData);
        var cursorEl = __getCursorEl();
        if (cursorEl)
        {
            tileEls.splice(that.cursorPosition, 0, cursorEl);
        }
        var tileTrayEl = __getTileTrayEl();
        tileTrayEl.innerHTML = '';
        tileEls.forEach(function(tileEl) {
            tileTrayEl.appendChild(tileEl);
        });
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

    function __containerClickListener(e) {
        uiPlaylistControls.inFocus = true;
        e.stopImmediatePropagation();
    }

    function __documentClickListener(e) {
        uiPlaylistControls.inFocus = false;
    }

    function __documentKeydownListener(e) {
        var ui = uiPlaylistControls;
        var keyMap = {
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down',
            46: 'delete',
            8: 'backspace',
        };

        if (ui.inFocus)
        {
            /**
             * INSERT SHAPE
             */
            if (e.ctrlKey)
            {
                var charAsNum = parseInt(String.fromCharCode(e.which)) - 1;
                if (!isNaN(charAsNum) && (charAsNum >= 0) && ui.mediator)
                {
                    ui.mediator.emit('componentEvent', {
                        type: 'tileAdded',
                        data: {
                            tileIdx: ui.cursorPosition,
                            tileType: 'shapeIndex',
                            tileData: charAsNum,
                        },
                        component: ui,
                        callback: ui.componentEventCb,
                    });
                }
            }

            /**
             * CURSOR MOVEMENT (AND BACKSPACE/DELETE)
             */
            if (Object.keys(keyMap).indexOf(e.keyCode.toString()) === -1)
            {
                return;
            } else if (keyMap[e.keyCode] === 'up')
            {
                ui.cursorPosition = 0;
            } else if (keyMap[e.keyCode] === 'down')
            {
                ui.cursorPosition = ui.tiles.length;
            } else if (keyMap[e.keyCode] === 'right')
            {
                ui.cursorPosition++;
            } else if (keyMap[e.keyCode] === 'left')
            {
                ui.cursorPosition = Math.max(0, ui.cursorPosition - 1);
            } else if (keyMap[e.keyCode] === 'delete')
            {
                if (ui.mediator)
                {
                    ui.mediator.emit('componentEvent', {
                        type: 'tileDeleted',
                        data: ui.cursorPosition,
                        component: ui,
                        callback: ui.componentEventCb,
                    });
                }
            } else if (keyMap[e.keyCode] === 'backspace')
            {
                if (ui.mediator)
                {
                    ui.mediator.emit('componentEvent', {
                        type: 'tileBackspaced',
                        data: ui.cursorPosition,
                        component: ui,
                        callback: ui.componentEventCb,
                    });
                }
            }
            e.stopImmediatePropagation();
            e.preventDefault();
            return;
        }
    }

    function __documentKeypressListener(e) {
        var ui = uiPlaylistControls;
        if (ui.inFocus && ui.mediator)
        {
            ui.mediator.emit('componentEvent', {
                type: 'tileAdded',
                data: {
                    tileIdx: ui.cursorPosition,
                    tileType: 'character',
                    tileData: String.fromCharCode(e.which),
                },
                component: ui,
                callback: ui.componentEventCb,
            });
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
            uiPlaylistControls.mediator.emit('componentEvent', {
                type: eventType,
                data: propIsSelectable ? e.target.value : e.target.checked, // !TODO: yuck...
                component: uiPlaylistControls,
                callback: uiPlaylistControls.componentEventCb,
            });
        }
    }

    function __bindListeners() {
        this.containerEl.addEventListener('change', __containerChangeListener);
        this.containerEl.addEventListener('click', __containerClickListener);
        document.addEventListener('click', __documentClickListener);
        document.addEventListener('keydown', __documentKeydownListener);
        document.addEventListener('keypress', __documentKeypressListener);
    }

    function __unbindListeners() {
        this.containerEl.removeEventListener('change', __containerChangeListener);
        this.containerEl.removeEventListener('click', __containerClickListener);
        document.removeEventListener('click', __documentClickListener);
        document.removeEventListener('keydown', __documentKeydownListener);
        document.removeEventListener('keypress', __documentKeypressListener);
    }

    Object.defineProperty(this, '_destroyer', {
        writable: false,
        value: function() {
            this.containerEl.innerHTML = '';
            __unbindListeners.call(this);
        },
    });

    Object.defineProperty(this, 'tiles', {
        get: function() { return _options['tiles']; },
        set: function(newTiles) {
            if ((newTiles !== null) && !(newTiles instanceof Array))
            {
                console.error('Invalid tiles for UIDOMPlaylistControls: ' +
                    'must be an array of CubeTiles.', newTiles);
                throw 'Invalid tiles';
            }
            var prevTiles = _options['tiles'];
            _options['tiles'] = newTiles;
            __rebuildTileTray.call(this);
            this.emit('propertyChanged', {
                property: 'tiles',
                oldValue: prevTiles,
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

    Object.defineProperty(this, 'inFocus', {
        get: function() { return _options['inFocus']; },
        set: function(newInFocus) {
            var prevInFocus = _options['inFocus'];
            _options['inFocus'] = !!newInFocus;
            this.containerEl.classList.toggle('focus', _options['inFocus']);
            this.emit('propertyChanged', {
                property: 'inFocus',
                oldValue: prevInFocus,
                newValue: newInFocus,
            });
        },
    });

    Object.defineProperty(this, 'cursorPosition', {
        get: function() { return _options['cursorPosition']; },
        set: function(newCursorPosition) {
            var parsed = parseInt(newCursorPosition, 10);
            if (isNaN(parsed))
            {
                console.error('Invalid cursor position for UIDOMPlaylistControls: must be integer', newCursorPosition);
                throw 'Invalid cursorPosition';
            }
            parsed = (parsed < 0) ?
                Math.max(0, this.tiles.length + parsed) :
                Math.min(this.tiles.length, parsed);
            var prevCursorPosition = _options['cursorPosition'];
            _options['cursorPosition'] = parsed;
            __rebuildTileTray.call(this);
            this.emit('propertyChanged', {
                property: 'cursorPosition',
                oldValue: prevCursorPosition,
                newValue: newCursorPosition,
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
            var cursorEl = document.createElement('div');
            cursorEl.className = 'cursor';
            var tileTrayEl = document.createElement('div');
            tileTrayEl.className = 'tile-tray';
            tileTrayEl.appendChild(cursorEl);
            return tileTrayEl;
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
        }).insertRule('.tile-tray', {
            'position': 'absolute',
            'top': '0',
            'bottom': '0',
            'right': '0',
            'left': '0',
            'text-transform': 'uppercase',
            'overflow-y': 'hidden',
            'overflow-x': 'auto',
            'white-space': 'nowrap',
            'font-size': '0',
            'background': '#fff',
        }).insertRule('.tile', {
            'box-sizing': 'border-box',
            'display': 'inline-block',
            'border': '1px solid #ccc',
            'width': '42px',
            'height': '42px',
            'padding': '0',
            'margin': '4px',
        }).insertRule('.tile img', {
            'width': '100%',
            'height': '100%',
        }).insertRule('.cursor', {
            'position': 'relative',
            'left': '-4px',
            'width': '10px',
            'height': '42px',
            'display': 'none',
        }).insertRule('&.focus', {
            'border-color': '#777',
        }).insertRule('&.focus .cursor', {
            'display': 'inline-block',
            '-webkit-animation': 'blink 700ms infinite linear alternate',
            '-webkit-font-smoothing': 'antialiased',
        }).insertRule(['.cursor:after', '.cursor:before'], {
            'position': 'absolute',
            'top': '5px',
            'left': '3px',
            'right': '0',
            'bottom': '0',
            'font-size': '48px',
            'line-height': '24px',
            'font-weight': '200',
            'content': `']'`,
            'color': '#555',
            'text-align': 'center',
        }).insertRule('.cursor:before', {
            'perspective': '10px',
            'transform-style': 'preserve-3d',
            'transform-origin': '90% 50%',
            'transform': 'rotateY(180deg)',
        });
    }

    function __updateDOM() {
        __unbindListeners.call(this);
        this.html = __buildHTML.call(this);
        __bindListeners.call(this);
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
