var UIDOMColorPicker = function UIDOMColorPicker(opts) {

    UIComponent.apply(this, arguments);

    var uiColorPicker = this;

    var __defaultOptions = {
        cubeOuterDimensions: 0,
        colors: (new Cube).colors,
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
        var swatch = getClosest(e.target, '.swatch');
        if (!swatch || e.target.nodeName === 'INPUT')
        {
            return; // clicked in white space between cells
        }
        if (uiColorPicker.mediator)
        {
            uiColorPicker.mediator.emit('componentEvent', {
                type: 'colorSelected',
                data: e.target.dataset.color,
                component: uiColorPicker,
                callback: uiColorPicker.componentEventCb,
            });
        }
    }

    function __bindContainerListeners() {
        this.containerEl.addEventListener('click', __containerClickListener);
    }

    function __unbindListeners() {
        this.containerEl.removeEventListener('click', __containerClickListener);
    }

    Object.defineProperty(this, '_destroyer', {
        writable: false,
        value: function() {
            this.html.innerHTML = '';
            __unbindListeners.call(this);
        },
    });

    Object.defineProperty(this, 'colors', {
        get: function() { return _options['colors']; },
        set: function(newColors) {
            if (!newColors || !(newColors instanceof Object))
            {
                console.error('Invalid colors for UIDOMColorPicker: ' +
                    'must be object mapping color names, each to an array of its RGB values.', newColors);
                throw 'Invalid colors';
            }
            var prevColors = _options['colors'];
            _options['colors'] = newColors;
            __updateDOM.call(this);
            this.emit('propertyChanged', {
                property: 'colors',
                oldValue: prevColors,
                newValue: newColors,
            });
        },
    });

    Object.defineProperty(this, 'selectedColor', {
        get: function() {
            var radioSelector = 'input[type="radio"][name="color"]';
            var radioElList = this.containerEl.querySelectorAll(radioSelector);
            var radioElArray = Array.prototype.slice.apply(radioElList);
            var checked = radioElArray.filter(function(radioEl) {
                return radioEl.checked;
            });
            return checked[0] ? checked[0].value : null;
        },
        set: function(newColor) {
            var radioSelector = 'input[type="radio"][name="color"]';
            var radioElList = this.containerEl.querySelectorAll(radioSelector);
            var radioElArray = Array.prototype.slice.apply(radioElList);
            radioElArray.forEach(function(input) {
                input.checked = (input.value === newColor);
            });
        },
    })

    Object.defineProperty(this, 'cubeOuterDimensions', {
        get: function() { return _options['cubeOuterDimensions']; },
        set: function(newCubeOuterDimensions) {
            var parsed = parseInt(newCubeOuterDimensions, 10);
            if (isNaN(parsed) || (parsed < 0))
            {
                console.error('Invalid cubeOuterDimensions for UIDOMColorPicker: ' +
                    'must be positive integer or zero.', newCubeOuterDimensions);
                throw 'Invalid cubeOuterDimensions';
            }
            var prevCubeOuterDimensions = _options['cubeOuterDimensions'];
            _options['cubeOuterDimensions'] = newCubeOuterDimensions;
            __updateContainerElDOM.call(this);
            this.emit('propertyChanged', {
                property: 'cubeOuterDimensions',
                oldValue: prevCubeOuterDimensions,
                newValue: newCubeOuterDimensions,
            });
        },
    });

    this.getDefaultOptions = function() {
        return __defaultOptions;
    };

    function __buildHTML() {
        var that = this;
        var pickerFrag = document.createDocumentFragment();
        Object.keys(this.colors).map(function(colorName) {
            var radioEl = document.createElement('input');
            radioEl.type = 'radio';
            radioEl.name = 'color';
            radioEl.value = colorName;
            var divEl = document.createElement('div');  // to show which is selected
            var swatchEl = document.createElement('label');
            swatchEl.classList.add('swatch');
            swatchEl.style.backgroundColor = `rgb(${that.colors[colorName].join(',')})`;
            swatchEl.dataset.color = colorName;
            radioEl.style.pointerEvents = divEl.style.pointerEvents = 'none';  // we get double events if we don't disable pointer events on stacked elements
            swatchEl.appendChild(radioEl);
            swatchEl.appendChild(divEl);    // must come after radio for CSS to work
            return swatchEl;
        }).forEach(function(swatchEl) {
            document.appendChild.call(pickerFrag, swatchEl);
        });
        return pickerFrag;
    }

    function __updateDOM() {
        __unbindListeners.call(this);
        this.html = __buildHTML.call(this);
        __updateContainerElDOM.call(this);
        __bindContainerListeners.call(this);
    }

    function __updateContainerElDOM() {
        this.containerEl.classList.add('color-list');
        this.containerEl.style.position = 'absolute';
        this.containerEl.style.top = `calc(50% - ${(this.containerEl.getBoundingClientRect().height - 120) / 2}px)`;
        this.containerEl.style.left = `calc(50% - ${_options['cubeOuterDimensions']}px)`;
    }

    // init
    applyOptions.call(this, _options);

    return this;

};

UIDOMColorPicker.prototype = Object.create(UIComponent.prototype);
UIDOMColorPicker.prototype.constructor = UIDOMColorPicker;
