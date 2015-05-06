var CellDOMRenderer = function CellDOMRenderer(cell, opts) {

    CellRenderer.apply(this, arguments);

    var cellDOMRenderer = this;

    var __defaultOptions = {
        cell: cell,
        size: 50,
        interactive: true,
        interactMode: 'drag',
        rotate: false,
        rotation: [0, 0, 0],
        transitionTransforms: false,
        mediator: null,
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

    var __rotationAsString = '0,0,0';

    var _drawnOptions = {};
    var _dirtyOptions = {
        coord: false,
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

    function __bindClickHandler() {
        _html.addEventListener('click', __mouseClickHandler);
    }

    function __bindDragHandlers() {
        _html.addEventListener('mousedown', __mouseDownHandler);
        _html.addEventListener('mouseup', __mouseUpHandler);
        _html.addEventListener('mousemove', __mouseMoveHandler);
    }

    function __unbindClickHandler() {
        _html.removeEventListener('click', __mouseClickHandler);
    }

    function __unbindDragHandlers() {
        _html.removeEventListener('mousedown', __mouseDownHandler);
        _html.removeEventListener('mouseup', __mouseUpHandler);
        _html.removeEventListener('mousemove', __mouseMoveHandler);
    }

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

    function __hasDirtyOptions() {
        var dirtyKeys = Object.keys(_dirtyOptions);
        for (var i = 0, numKeys = dirtyKeys.length; i < numKeys; i++)
        {
            if (_dirtyOptions[dirtyKeys[i]])
            {
                return true;
            }
        }
        return false;
    }

    function __calculateDirtyOptions() {
        var _cellSimpleOptionsKeys = Object.keys(cellDOMRenderer.cell.simpleOptions);
        for (var i = 0, numKeys = _optionKeys.length; i < numKeys; i++)
        {
            _dirtyOptions[_optionKeys[i]] = _options[_optionKeys[i]] !== _drawnOptions[_optionKeys[i]];
        }
        for (var i = 0, numKeys = _cellSimpleOptionsKeys.length; i < numKeys; i++)
        {
            _dirtyOptions[_cellSimpleOptionsKeys[i]] = cellDOMRenderer.cell.simpleOptions[_cellSimpleOptionsKeys[i]] !== _drawnOptions[_cellSimpleOptionsKeys[i]];
        }
    }

    function __updateDrawnOptions() {
        var _cellSimpleOptionsKeys = Object.keys(cellDOMRenderer.cell.simpleOptions);
        for (var i = 0, numKeys = _optionKeys.length; i < numKeys; i++)
        {
            _drawnOptions[_optionKeys[i]] = _options[_optionKeys[i]];
        }
        for (var i = 0, numKeys = _cellSimpleOptionsKeys.length; i < numKeys; i++)
        {
            _drawnOptions[_cellSimpleOptionsKeys[i]] = cellDOMRenderer.cell.simpleOptions[_cellSimpleOptionsKeys[i]];
        }
    }

    function __updateDOM(html, led, hasRotation, cell, domSpecificOptions, dirtyOptions) {
        var TRANSITION_DURATION = '300ms';
        var TRANSITION_EASING = 'ease-in-out';

        var _size = domSpecificOptions['size'];
        var _on = cell['on'];
        var _colorRgbString = cell['colorAsString'];

        if (dirtyOptions['transitionTransforms'])
        {
            if (domSpecificOptions['transitionTransforms'])
            {
                html.style.transitionProperty = 'transform';
                html.style.transitionDuration = TRANSITION_DURATION;
                html.style.transitionTimingFunction = TRANSITION_EASING;
            } else
            {
                html.style.transitionProperty = null;
                html.style.transitionDuration = null;
                html.style.transitionTimingFunction = null;
            }
        }

        if (dirtyOptions['on'] || dirtyOptions['color'])
        {
            // render the LED's on-ness
            led.classList.toggle('on', _on);
            html.style.opacity = _on ? 1 : null;

            // render the LED's color
            led.style.backgroundColor = _on ?
                'rgba(' + _colorRgbString + ',1)' :
                'rgba(0,0,0,1)';
            html.style.backgroundColor = _on ?
                'rgba(' + _colorRgbString + ',0.125)' :
                null;
        }

        // apply cell data attributes
        if (dirtyOptions['coord'])
        {
            if (html.dataset.row !== cell['row'])
            {
                html.dataset.row = cell['row'];
            }
            if (html.dataset.column !== cell['column'])
            {
                html.dataset.column = cell['column'];
            }
            if (html.dataset.depth !== cell['depth'])
            {
                html.dataset.depth = cell['depth'];
            }
        }

        // set the size of the cell
        if (dirtyOptions['size'])
        {
            html.style.width = _size + 'px';
            html.style.height = _size + 'px';
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
        if (dirtyOptions['size'] || dirtyOptions['coord'] || dirtyOptions['rotation'])
        {
           var xformPieces = (
               'translateX(' + (_size * cell['column']) + 'px) ' +
               'translateY(' + (_size * cell['row']) + 'px) ' +
               'translateZ(' + (-1 * _size * cell['depth']) + 'px) '
           );
           if (hasRotation)
           {   // if we need to rotate the cell...
               // ... add the rotation transform rules to the array
               var rot = domSpecificOptions['rotation'];
               xformPieces += (
                   'rotateX(' + rot[0] + 'deg) ' +
                   'rotateY(' + rot[1] + 'deg) ' +
                   'rotateZ(' + rot[2] + 'deg) '
               );
           }

           html.style.transform = xformPieces;
        }
    }

    function __cellIsListening(cell, listeningCells) {
        return listeningCells && (listeningCells.indexOf(cell.coordAsString) !== -1);
    }

    function __mouseClickHandler(e) {
        e.preventDefault();
        if (cellDOMRenderer.mediator)
        {
            cellDOMRenderer.mediator.emit('rendererEvent', {
                type: 'mouseClick',
                data: e,
                renderer: cellDOMRenderer,
                callback: __mouseClickCtrlCb,
            });
        }
    }

    function __mouseDownHandler(e) {
        e.preventDefault();
        if (cellDOMRenderer.mediator)
        {
            cellDOMRenderer.mediator.emit('rendererEvent', {
                type: 'mouseDown',
                data: e,
                renderer: cellDOMRenderer,
                callback: __mouseDownCtrlCb,
            });
        }
    }

    function __mouseUpHandler(e) {
        e.preventDefault();
        applyOptions.call(CellDraggingDelegate.get(), {
            isDragging: false,
        });
    }

    function __mouseMoveHandler(e) {
        e.preventDefault();
        if (cellDOMRenderer.mediator)
        {
            cellDOMRenderer.mediator.emit('rendererEvent', {
                type: 'mouseMove',
                data: e,
                renderer: cellDOMRenderer,
                callback: __mouseMoveCtrlCb,
            });
        }
    }

    function __mouseClickCtrlCb(event) {
        if (__cellIsListening(_options['cell'], event.ctrl.mouseListeningCells))
        {
            var _on = _options['cell']['on'];
            applyOptions.call(_options['cell'], {
                on: !_on, // Toggle my on status when someone clicks the cell
                // IF we have a connection to the cube and it has an opinion about
                // what color we should be, let's honor it.
                color: _on && event.ctrl ?
                    event.ctrl.penColorRgb :
                    _options['cell']['color'],
            });
            event.ctrl.cube.applyCell(_options['cell']);
        }
    }

    function __mouseDownCtrlCb(event) {
        console.log('__mouseDownCtrlCb', __cellIsListening(_options['cell'], event.ctrl.mouseListeningCells));
        if (__cellIsListening(_options['cell'], event.ctrl.mouseListeningCells))
        {
            /**
             * If start on an on cell the same color as we, clear next ones,
             * otherwise continue to draw in cube's penColor
             */
            var newDragSetOn = !(_options['cell']['on'] &&
                __colorsAreEqual(_options['cell']['color'], event.ctrl.penColorRgb));
            var newDragSetColor = event.ctrl.penColorRgb;
            applyOptions.call(CellDraggingDelegate.get(), {
                isDragging: true,
                dragSetOn: newDragSetOn,
                dragSetColor: newDragSetColor,
            });
        }
    }

    function __mouseMoveCtrlCb(event) {
        /**
         * "this" is cellDOMRenderer
         * event.ctrl === activeController
         * event.type === type from "original" event (from component)
         * event.data === data from "original" event (from component)
         */
        if (__cellIsListening(_options['cell'], event.ctrl.mouseListeningCells))
        {
            var dragDelegate = CellDraggingDelegate.get();
            if (dragDelegate.isDragging)
            {
                var newCellOpts = {
                    on: dragDelegate.dragSetOn,
                };
                if (newCellOpts.on)
                {
                    newCellOpts.color = dragDelegate.dragSetColor;
                }
                applyOptions.call(_options['cell'], newCellOpts);
                event.ctrl.cube.applyCell(_options['cell']);
            }
        }
    }

    Object.defineProperty(this, 'updateDOM', {
        writable: false,
        value: function updateDOM() {
            __calculateDirtyOptions();
            if (__hasDirtyOptions())
            {
                __updateDOM(_html, _led, _hasRotation, cellDOMRenderer.cell, _options, _dirtyOptions);
                __updateDrawnOptions();
            }
        },
    });

    Object.defineProperty(this, 'dirty', {
        get: function() {
            __calculateDirtyOptions();
            return __hasDirtyOptions();
        },
        set: function(newDirty) {
            var newDirtyBool = !!newDirty;
            for (var i = 0, numKeys = _optionKeys.length; i < numKeys; i++)
            {
                _dirtyOptions[_optionKeys[i]] = newDirtyBool;
            }
            return newDirtyBool;
        },
    });

    Object.defineProperty(this, 'html', {
        get: function() { return _html; },
    });

    Object.defineProperty(this, 'size', {
        get: function() { return _options['size']; },
        set: function(newSize) {
            _options['size'] = newSize;
        },
    });

    Object.defineProperty(this, 'rotate', {
        get: function() { return _options['rotate']; },
        set: function(newShouldRotate) {
            _options['rotate'] = !!newShouldRotate;
            _hasRotation = false;
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
            __rotationAsString = (newRotation[0] + ',' + newRotation[1] + ',' + newRotation[2]);

            // cache whether we have a rotation for performance
            _hasRotation = _options['rotate'] && (
                newRotation.reduce(function(prev, curr) { return prev + curr; }));
        },
    });

    Object.defineProperty(this, 'transitionTransforms', {
        /**
         * Apply CSS transitions on the cell's transform style.
         */
        get: function() { return _options['transitionTransforms']; },
        set: function(shouldTransition) {
            _options['transitionTransforms'] = shouldTransition;
        },
    });

    Object.defineProperty(this, 'interactive', {
        /**
         * Whether we listen for click events. The click event handler simply toggles
         * whether the cell is on.
         */
        get: function() { return _options['interactive']; },
        set: function(newInteractive) {
            var prevInteractive = _options['interactive'];
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
                    __bindClickHandler();
                    if (_options['interactMode'] === 'drag')
                    {
                        __bindDragHandlers();
                    }
                }
            } else
            {
                __unbindClickHandler();
                if (_options['interactMode'] === 'drag')
                {
                    __unbindDragHandlers();
                }
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

            var prevInteractMode = _options['interactMode'];
            _options['interactMode'] = newInteractMode;

            if (!_options['interactive'])
            {
                return;
            }

            if ((prevInteractMode === 'drag') && (newInteractMode === 'click'))
            {
                __unbindDragHandlers();
            } else if ((prevInteractMode === 'click') && newInteractMode === 'drag')
            {
                __bindDragHandlers();
            }
        },
    });

    Object.defineProperty(this, 'mediator', {
        get: function() { return _options['mediator']; },
        set: function(newMediator) {
            if (!(newMediator instanceof UIMediator) && (newMediator !== null))
            {
                console.error('Invalid mediator: must be a UIMediator.', newMediator);
                throw 'Invalid mediator';
            }
            var prevMediator = _options['mediator'];
            _options['mediator'] = newMediator;
            cellDOMRenderer.emit('propertyChanged', {
                property: 'mediator',
                newValue: newMediator,
                oldValue: prevMediator,
            });
        }
    });

    this.getDefaultOptions = function() {
        return __defaultOptions;
    };

    (function buildHTML() {
        _led.classList.add('led');
        _html.classList.add('cell');
        _html.appendChild(_led);
    }());

    applyOptions.call(this, _options);

    return this;

};

CellDOMRenderer.prototype = Object.create(CellRenderer.prototype);
CellDOMRenderer.prototype.constructor = CellDOMRenderer;

CellDOMRenderer.prototype.render = function render() {
    this.updateDOM();
};
