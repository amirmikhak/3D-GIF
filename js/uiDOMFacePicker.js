var UIDOMFacePicker = function UIDOMFacePicker(opts) {

    UIComponent.apply(this, arguments);

    var uiFacePicker = this;

    var __defaultOptions = {
        cubeOuterDimensions: 0,
        faces: (new Cube).faceNames,
        enabledFaces: null,
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

    function __getRadioEls() {
        var radioSelector = 'input[type="radio"][name="face"]';
        var radioElList = uiFacePicker.containerEl.querySelectorAll(radioSelector);
        var radioElArray = Array.prototype.slice.apply(radioElList);
        return radioElArray;
    }

    function __containerChangeListener(e) {
        if (uiFacePicker.mediator)
        {
            uiFacePicker.mediator.emit('componentEvent', {
                type: 'faceSelected',
                data: e.target.value,
                component: uiFacePicker,
                callback: uiFacePicker.componentEventCb,
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
            __unbindListeners.call(this);
        },
    });

    Object.defineProperty(this, 'faces', {
        get: function() { return _options['faces']; },
        set: function(newFaces) {
            if (!newFaces || !(newFaces instanceof Array))
            {
                console.error('Invalid faces for UIDOMFacePicker: must be array of face names.', newFaces);
                throw 'Invalid faces';
            }
            var prevFaces = _options['faces'];
            _options['faces'] = newFaces;
            __updateDOM.call(this);
            this.emit('propertyChanged', {
                property: 'faces',
                oldValue: prevFaces,
                newValue: newFaces,
            });
        },
    });

    Object.defineProperty(this, 'selectedFace', {
        get: function() {
            var checked = __getRadioEls().filter(function(radioEl) {
                return radioEl.checked;
            });
            return checked[0] ? checked[0].value : null;
        },
        set: function(newFace) {
            __getRadioEls().forEach(function(input) {
                input.checked = (input.value === newFace);
            });
        },
    });

    Object.defineProperty(this, 'enabledFaces', {
        get: function() { return _options['enabledFaces']; },
        set: function(newEnabledFaces) {
            if ((newEnabledFaces !== null) && !(newEnabledFaces instanceof Array))
            {
                console.error('Invalid enabledFaces: must be null or an array of face names', newEnabledFaces);
                throw 'Invalid supported faces';
            }

            var prevEnabledFaces = _options['enabledFaces'];
            _options['enabledFaces'] = newEnabledFaces;
            __getRadioEls().forEach(function(radioEl) {
                radioEl.disabled = (_options['enabledFaces'] !== null) ?
                    (newEnabledFaces.indexOf(radioEl.value) === -1) :
                    false;
            });
            this.emit('propertyChanged', {
                property: 'enabledFaces',
                oldValue: prevEnabledFaces,
                newValue: newEnabledFaces,
            });
        },
    });

    Object.defineProperty(this, 'cubeOuterDimensions', {
        get: function() { return _options['cubeOuterDimensions']; },
        set: function(newCubeOuterDimensions) {
            var parsed = parseInt(newCubeOuterDimensions, 10);
            if (isNaN(parsed) || (parsed < 0))
            {
                console.error('Invalid cubeOuterDimensions for UIDOMFacePicker: ' +
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
        this.faces.map(function(faceName) {
            var radioEl = document.createElement('input');
            radioEl.type = 'radio';
            radioEl.name = 'face';
            radioEl.value = faceName;
            var divEl = document.createElement('div');  // to show which is selected
            divEl.innerHTML = faceName;
            var swatchEl = document.createElement('label');
            swatchEl.classList.add('swatch');
            swatchEl.style.backgroundFace = '#fff';
            swatchEl.dataset.face = faceName;
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
        this.containerEl.classList.add('face-list');
        this.containerEl.style.position = 'absolute';
        this.containerEl.style.top = `calc(50% - ${(this.containerEl.getBoundingClientRect().height - 120) / 2}px)`;
        this.containerEl.style.left = `calc(50% - ${_options['cubeOuterDimensions'] + 75}px)`;
    }

    // init
    applyOptions.call(this, _options);

    return this;

};

UIDOMFacePicker.prototype = Object.create(UIComponent.prototype);
UIDOMFacePicker.prototype.constructor = UIDOMFacePicker;
