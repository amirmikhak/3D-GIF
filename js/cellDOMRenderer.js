var CellDOMRenderer = function CellDOMRenderer(cell, opts) {

    CellRenderer.apply(this, arguments);

    var _cell = cell;

    var cellDOMRenderer = this;

    var defaultOptions = {
        size: 50,
        interactive: false,
        interactMode: 'drag',
        rotate: false,
        rotation: [0, 0, 0],
        transitionTransforms: false,
    };

    var TRANSITION_DURATION = '300ms';
    var TRANSITION_EASING = 'ease-in-out';

    var _options = _.extend({}, defaultOptions, opts);
    var _drawnOptions = {};
    var _dirtyOptions = {
        row: false,
        column: false,
        depth: false,
        color: false,
        on: false,
        size: false,
        rotation: false,
        transitionTransforms: false,
    };

    var _colorRgbString = '0,0,0';  // trying to preconcat this for performance reasons
    var _hasRotation = false;   // also here for performance reasons

    var _html = document.createElement('div');
    var _led = document.createElement('div');

    function __colorsAreEqual(c1, c2) {
        if ((c1.length !== 3) || (c2.length !== 3))
        {
            return false;
        }

        for (var i = 0; i < 3; i++)
        {
            if (c1[i] !== c2[i])
            {
                return false;
            }
        }

        return true;
    }

    function __sloppyOptionsAreEqual(a, b) {
        // a function for comparing simple and more complex types such as arrays
        return (
              (a === null || b === null) ||
              (typeof a === 'undefined' || typeof b === 'undefined')
          ) ?
            a === b :
            a.toString() === b.toString();   // crappy but close enough for now
    }

    function __calculateDirtyOptions() {
        for (var key in _options)
        {
            _dirtyOptions[key] = !__sloppyOptionsAreEqual(_options[key], _drawnOptions[key]);
        }
        for (var key in _cell.options)
        {
            _dirtyOptions[key] = !__sloppyOptionsAreEqual(_cell.options[key], _drawnOptions[key]);
        }
    }

    function __updateDrawnOptions() {
        for (var key in _options)
        {
            _drawnOptions[key] = _options[key];
        }
        for (var key in _cell.options)
        {
            _drawnOptions[key] = _cell.options[key];
        }
    }

    function __updateDOM() {
        __calculateDirtyOptions();

        var _size = _options['size'];
        var _on = _cell['on'];
        var _colorRgbString = _cell['colorAsString'];

        if (_dirtyOptions['transitionTransforms'])
        {
            if (_options['transitionTransforms'])
            {
                _html.style.transitionProperty = 'transform';
                _html.style.transitionDuration = TRANSITION_DURATION;
                _html.style.transitionTimingFunction = TRANSITION_EASING;
            } else
            {
                _html.style.transitionProperty = null;
                _html.style.transitionDuration = null;
                _html.style.transitionTimingFunction = null;
            }
        }

        if (_dirtyOptions.on || _dirtyOptions.color)
        {
            // render the LED's on-ness
            _led.classList.toggle('on', _on);
            _html.style.opacity = _on ? 1 : null;

            // render the LED's color
            _led.style.backgroundColor = _on ?
                'rgba(' + _colorRgbString + ',1)' :
                'rgba(0,0,0,1)';
            _html.style.backgroundColor = _on ?
                'rgba(' + _colorRgbString + ',0.125)' :
                null;
        }

        // apply cell data attributes
        if (_dirtyOptions.row)
        {
            _html.dataset.row = _cell['row'];
        }
        if (_dirtyOptions.column)
        {
            _html.dataset.column = _cell['column'];
        }
        if (_dirtyOptions.depth)
        {
            _html.dataset.depth = _cell['depth'];
        }

        // set the size of the cell
        if (_dirtyOptions.size)
        {
            _html.style.width = _size + 'px';
            _html.style.height = _size + 'px';
        }

        /**
         * Build the string to position the cell / optionally change its face
         *
         * NOTE: 3d transforms are not commutitive meaning that the order
         *  of the transforms matters. Browsers apply transforms in reverse
         *  order of their appearance in the CSS. That is in the case of
         *  "transform: A B C;" browsers will first perform transform C,
         *  then B, then A.
         */
        if (_dirtyOptions.size ||
           _dirtyOptions.row ||
           _dirtyOptions.column ||
           _dirtyOptions.depth ||
           _dirtyOptions.rotation)
        {
           var xformPieces = (
               'translateX(' + (_size * _cell['column']) + 'px) ' +
               'translateY(' + (_size * _cell['row']) + 'px) ' +
               'translateZ(' + (-1 * _size * _cell['depth']) + 'px) '
           );
           if (_hasRotation)
           {   // if we need to rotate the cell...
               // ... add the rotation transform rules to the array
               var rot = _options['rotation'];
               xformPieces += (
                   'rotateX(' + rot[0] + 'deg) ' +
                   'rotateY(' + rot[1] + 'deg) ' +
                   'rotateZ(' + rot[2] + 'deg) '
               );
           }

           _html.style.transform = xformPieces;
        }
        __updateDrawnOptions();
    }

    function __mouseClickHandler(e) {
        e.preventDefault();

        applyOptions.call(_cell, {
            on: !_cell['on'], // Toggle my on status when someone clicks the cell
            /**
             * IF we have a connection to the cube and it has an opinion about
             * what color we should be, let's honor it.
             */
            color: _cell['on'] && _cell.cube && _cell.cube.controller ?
                _cell.cube.controller.penColorRgb : _cell['color'],
        });
    }

    function __mouseDownHandler(e) {
        e.preventDefault();

        /**
         * If start on an on cell the same color as we, clear next ones,
         * otherwise continue to draw in cube's penColor
         */
        var newDragSetOn = !_cell['on'] || ((_cell.cube && _cell.cube.controller) ?
            !__colorsAreEqual(_cell.cube.controller.penColorRgb, _cell['color']) :
            false);

        var newDragSetColor = _cell.cube && _cell.cube.controller ?
            _cell.cube.controller.penColorRgb :
            _cell['color'];

        applyOptions.call(CellDraggingDelegate.get(), {
            isDragging: true,
            dragSetOn: newDragSetOn,
            dragSetColor: newDragSetColor,
        });
    }

    function __mouseUpHandler(e) {
        e.preventDefault();

        applyOptions.call(CellDraggingDelegate.get(), {
            isDragging: false,
        });
    }

    function __mouseMoveHandler(e) {
        e.preventDefault();

        var dragDelegate = CellDraggingDelegate.get();
        if (dragDelegate.isDragging)
        {
            _cell.applyOptions({
                on: dragDelegate.dragSetOn,
                color: dragDelegate.dragSetOn ? dragDelegate.dragSetColor : _cell['color'],
            });
        }
    }

    Object.defineProperty(this, 'updateDOM', {
        writable: false,
        value: __updateDOM,
    });

    Object.defineProperty(this, 'html', {
        get: function() { return _html; },
    });

    Object.defineProperty(this, 'size', {
        get: function() { return _options['size']; },
        set: function(newSize) {
            _options['size'] = newSize;
            if (_cell.autoRender)
            {
                this.render();   // call to ensure that the DOM is sync with model
            }
        },
    });

    Object.defineProperty(this, 'rotate', {
        get: function() { return _options['rotate']; },
        set: function(newShouldRotate) {
            _options['rotate'] = !!newShouldRotate;
            _hasRotation = false;
            if (_cell.autoRender)
            {
                this.render();   // call to ensure that the DOM is sync with model
            }
        },
    });

    Object.defineProperty(this, 'rotation', {
        /**
         * Each cell can be rotated. This property was added for the cube.rotateCells
         * property, which is disabled by default. See comment in that property for
         * details.
         */
        get: function() { return _options['rotation']; },
        set: function(newRotation) {
            var invalidValueChecker = function(axisValue) {
                return isNaN(parseFloat(axisValue));
            };
            if (!(newRotation instanceof Array) ||
                (newRotation.length !== 3) ||
                newRotation.some(invalidValueChecker))
            {
                throw 'Bad value for CellDOMRenderer.rotation: ' + newRotation;
            }

            _options['rotation'] = newRotation;

            // cache whether we have a rotation for performance
            _hasRotation = _options['rotate'] && (
                newRotation.reduce(function(prev, curr) { return prev + curr; }));
            if (_cell.autoRender)
            {
                this.render();   // call to ensure that the DOM is sync with model
            }
        },
    });

    Object.defineProperty(this, 'transitionTransforms', {
        /**
         * Apply CSS transitions on the cell's transform style.
         */
        get: function() { return _options['transitionTransforms']; },
        set: function(shouldTransition) {
            _options['transitionTransforms'] = shouldTransition;
            if (_cell.autoRender)
            {
                this.render();   // call to ensure that the DOM is sync with model
            }
        },
    });

    Object.defineProperty(this, 'interactive', {
        /**
         * Whether we listen for click events. The click event handler simply toggles
         * whether the cell is on.
         */
        get: function() { return _options['interactive']; },
        set: function(newInteractive) {
            _options['interactive'] = newInteractive;
            /**
             * The binding of even listeners is not put into the render() function
             * because the render function is meant to be idempotent. That is, one
             * should be able to call it as many time as they like and the state
             * and behavior of the cell should not change. If the event listener
             * code were put into the render function (at least as it is designed
             * now), multiple event listeners would be bound for the same click
             * each time the function were called. That is, if the render function
             * were called 20 times, there would be 20 listeners that will have
             * been added to capture a single click causing 20 callbacks to occur.
             */
            if (newInteractive)
            {
                if (_options['interactMode'] === 'click' ||
                    _options['interactMode'] === 'drag')
                {
                    _html.removeEventListener('click', __mouseClickHandler);
                    _html.removeEventListener('mousedown', __mouseDownHandler);
                    _html.removeEventListener('mouseup', __mouseUpHandler);
                    _html.removeEventListener('mousemove', __mouseMoveHandler);

                    _html.addEventListener('click', __mouseClickHandler);

                    if (_options['interactMode'] === 'drag')
                    {
                        _html.addEventListener('mousedown', __mouseDownHandler);
                        _html.addEventListener('mouseup', __mouseUpHandler);
                        _html.addEventListener('mousemove', __mouseMoveHandler);
                    }
                }
                _options['interactive'] = newInteractive;
            } else
            {
                _html.removeEventListener('click', __mouseClickHandler);
                _html.removeEventListener('mousedown', __mouseDownHandler);
                _html.removeEventListener('mouseup', __mouseUpHandler);
                _html.removeEventListener('mousemove', __mouseMoveHandler);
            }
        },
    });

    Object.defineProperty(this, 'interactMode', {
        get: function() { return _options['interactMode']; },
        set: function(newInteractMode) {
            var validModes = ['click', 'drag'];
            if (validModes.indexOf(newInteractMode) === -1)
            {
                console.error('Invalid interactMode: ' + newInteractMode + '. ' +
                    'Valid modes: ' + validModes.join(', ') + '.');
                return;
            }

            _options['interactMode'] = newInteractMode;
            this.interactive = _options['interactive'];    // call to un/rebind handlers
        },
    });

    (function buildHTML() {
        _led.classList.add('led');
        _html.classList.add('cell');
        _html.appendChild(_led);
    }());

    _cell.autoRender = false;
    applyOptions.call(this, _options);
    this.render();
    _cell.autoRender = true;

    return this;

};

CellDOMRenderer.prototype = Object.create(CellRenderer.prototype);
CellDOMRenderer.prototype.constructor = CellDOMRenderer;

CellDOMRenderer.prototype.render = function render() {
    this.updateDOM();
    return this.html;
};
