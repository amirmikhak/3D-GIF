// !TODO: make uiDOMShapePicker actually work
var UIDOMShapePicker = function UIDOMShapePicker(opts) {

    UIComponent.apply(this, arguments);

    var uiShapePicker = this;

    var __fnNop = function() {};

    var __defaultOptions = {
        shapesGetter: __fnNop,
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

    function __clickListener(e) {
        console.log('click in shapepicker');
        uiShapePicker.componentEventCb({
            type: 'shapeSelected',
            data: e.target.dataset.shape,
        });
    }

    function __bindListeners(el) {
        el.addEventListener('click', __clickListener);
    }

    function __unbindListeners(el) {
        el.removeEventListener('click', __clickListener);
    }

    function __buildHTML(shapes) {
        var pickerEl = document.createElement('div');
        var shapeNames = Object.keys(shapes);
        pickerEl.innerHTML = shapeNames.map(function(shapeName) {
            var shapeRender = new CubeTile(shapes[shapeName]).getPngData();
            return `<div class="swatch" data-shapeName="${shapeName}"
                style="background-image:url('${shapeRender}');
                    background-size:cover;
                    background-position:50% 50%;"></div>`;
        }).join('');
        // !TODO: Fix this. We need this correction look correct.
        var shapePickerHeight = pickerEl.getBoundingClientRect().height - 120;
        pickerEl.style.position = 'absolute';
        pickerEl.style.top = `calc(50% - ${(shapePickerHeight / 2)}px)`;
        pickerEl.style.right = `calc(50% - ${_options['cubeOuterDimensions']}px)`;
        __bindListeners(pickerEl);
        return pickerEl;
    }

    Object.defineProperty(this, '_destroyer', {
        writable: false,
        value: function() {
            this.html.innerHTML = '';
            __unbindListeners(this.html);
        },
    });

    Object.defineProperty(this, 'shapesGetter', {
        get: function() { return _options['shapesGetter']; },
        set: function(newValue) {
            if (typeof newValue !== 'function')
            {
                console.error('Invalid shapesGetter for UIComponent: must be function.', newValue);
                var err = 'Invalid shapesGetter';
                throw err;
            }

            var prevValue = _options['shapesGetter'];
            this.emit('propertyChanged', {
                property: 'shapesGetter',
                newValue: newValue,
                oldValue: prevValue,
            });
            _options['shapesGetter'] = newValue;
        },
    });

    Object.defineProperty(this, 'cubeOuterDimensions', {
        get: function() { return _options['cubeOuterDimensions']; },
        set: function(newOuterDimensions) { return _options['cubeOuterDimensions'] = newOuterDimensions; },
    });

    // if shapes change...
    _options['controllerEventCb'] = function(changeData) {
        this.html = __buildHTML(_options['shapesGetter']());
    };

    // init
    this.html = __buildHTML(_options['shapesGetter']());
    applyOptions.call(this, _options);

    return this;

};

UIDOMShapePicker.prototype = Object.create(UIComponent.prototype);
UIDOMShapePicker.prototype.constructor = UIDOMShapePicker;
