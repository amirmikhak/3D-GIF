// !TODO: make uiDOMShapePicker actually work
var UIDOMShapePicker = function UIDOMShapePicker(opts) {

    UIComponent.apply(this, arguments);

    var uiShapePicker = this;

    var __fnNop = function() {};

    var __defaultOptions = {
        shapes: null,
        cubeOuterDimensions: 0,
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
        if (uiShapePicker.mediator)
        {
            uiShapePicker.mediator.emit('componentEvent', {
                type: 'shapeSelected',
                data: e.target.dataset.shape,
                component: uiShapePicker,
                callback: uiShapePicker.componentEventCb,
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
            __unbindListeners.call(uiShapePicker);
        },
    });

    Object.defineProperty(this, 'shapes', {
        get: function() { return _options['shapes']; },
        set: function(newShapes) {
            if ((newShapes !== null) && !(newShapes instanceof Object))
            {
                console.error('Invalid shapes for UIDOMShapePicker: ' +
                    'must be object mapping shape names, each to an array of its cell states.', newShapes);
                throw 'Invalid shapes';
            }
            var prevShapes = _options['shapes'];
            _options['shapes'] = newShapes;
            __updateDOM.call(this);
            this.emit('propertyChanged', {
                property: 'shapes',
                oldValue: prevShapes,
                newValue: newShapes,
            });
        },
    });

    Object.defineProperty(this, 'cubeOuterDimensions', {
        get: function() { return _options['cubeOuterDimensions']; },
        set: function(newCubeOuterDimensions) {
            var parsed = parseInt(newCubeOuterDimensions, 10);
            if (isNaN(parsed) || (parsed < 0))
            {
                console.error('Invalid cubeOuterDimensions for UIDOMShapePicker: ' +
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

    function __buildHTML(shapes) {
        if (!this.shapes)
        {
            return null;
        }
        var that = this;
        var pickerFrag = document.createDocumentFragment();
        Object.keys(this.shapes).map(function(shapeName) {
            var shapeRender = new CubeTile(that.shapes[shapeName]).getPngData();
            var swatchEl = document.createElement('div');
            swatchEl.classList.add('swatch');
            swatchEl.dataset.shape = shapeName;
            swatchEl.style.backgroundImage = `url('${shapeRender}')`;
            swatchEl.style.backgroundSize = 'cover';
            swatchEl.style.backgroundPosition = '50% 50%;';
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
        this.containerEl.classList.add('shape-list');
        this.containerEl.style.position = 'absolute';
        this.containerEl.style.top = `calc(50% - ${(this.containerEl.getBoundingClientRect().height - 120) / 2}px)`;
        this.containerEl.style.right = `calc(50% - ${_options['cubeOuterDimensions']}px)`;
    }

    // init
    applyOptions.call(this, _options);

    return this;

};

UIDOMShapePicker.prototype = Object.create(UIComponent.prototype);
UIDOMShapePicker.prototype.constructor = UIDOMShapePicker;
