var Cell = function(opts) {
    var cell = this; // 'this' can point to many, different things, so we grab an easy reference to the object
    // You can read more about 'this' at:
    // MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
    // at http://www.quirksmode.org/js/this.html
    // and in a more detailed tutorial: http://javascriptissexy.com/understand-javascripts-this-with-clarity-and-master-it/

    var NOOP = function() {};   // does nothing, but useful to pass as argument to things expecting functions

    var defaultOptions = {
        cube: null,
        row: null,
        column: null,
        depth: null,
        color: [0, 0, 255],    // We'll store colors internally as an RGB array
        on: false,
        size: 50,
        interactive: false,
        interactMode: 'drag',
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

    /**
     * We use this "Promise" and expose these callbacks to ensure that functions
     * that expect the cube's DOM to be present and built don't run until this
     * is actually the case.
     *
     * To learn more about Promises in Javascript, see these links:
     * https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Promise.jsm/Promise
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
     */
    var htmlReadySuccessFn;
    var htmlReadyFailureFn;
    this.htmlReady = new Promise(function(resolve, reject) {
        htmlReadySuccessFn = resolve;
        htmlReadyFailureFn = reject;
    });

    var _htmlReady = false;
    var __autoRender = true;

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

    function calculateDirtyOptions() {
        for (var key in _options)
        {
            _dirtyOptions[key] = !__sloppyOptionsAreEqual(_options[key], _drawnOptions[key]);
        }
    }

    function updateDOM() {
        var _size = _options['size'];   // performance
        var _on = _options['on'];   // performance

        if (_dirtyOptions['transitionTransforms'])
        {
            if (_options['transitionTransforms'])
            {
                cell.html.style.transitionProperty = 'transform';
                cell.html.style.transitionDuration = TRANSITION_DURATION;
                cell.html.style.transitionTimingFunction = TRANSITION_EASING;
            } else
            {
                cell.html.style.transitionProperty = null;
                cell.html.style.transitionDuration = null;
                cell.html.style.transitionTimingFunction = null;
            }
        }

        if (_dirtyOptions.on || _dirtyOptions.color)
        {
            // render the LED's on-ness
            cell.led.classList.toggle('on', _on);
            cell.html.style.opacity = _on ? 1 : null;

            // render the LED's color
            cell.led.style.backgroundColor = _on ?
                'rgba(' + _colorRgbString + ',1)' :
                'rgba(0,0,0,1)';
            cell.html.style.backgroundColor = _on ?
                'rgba(' + _colorRgbString + ',0.125)' :
                null;
        }

        // apply cell data attributes
        if (_dirtyOptions.row)
        {
            cell.html.dataset.row = _options['row'];
        }
        if (_dirtyOptions.column)
        {
            cell.html.dataset.column = _options['column'];
        }
        if (_dirtyOptions.depth)
        {
            cell.html.dataset.depth = _options['depth'];
        }

        // set the size of the cell
        if (_dirtyOptions.size)
        {
            cell.html.style.width = _size + 'px';
            cell.html.style.height = _size + 'px';
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
                'translateX(' + (_size * _options['column']) + 'px) ' +
                'translateY(' + (_size * _options['row']) + 'px) ' +
                'translateZ(' + (-1 * _size * _options['depth']) + 'px) '
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

            // assign the built string to the element
            cell.html.style.transform = xformPieces;
         }

    }

    function render() {
        /**
         * Idempotent* render function to ensure that the state of the model and
         * DOM are not out of sync.
         *
         * * Can be called as many times as you like and nothing bad or unexpected
         *   will happen. Technical definition: http://en.wikipedia.org/wiki/Idempotence#Computer_science_meaning
         */

        calculateDirtyOptions();
        if (_htmlReady)
        {
            updateDOM();
        } else
        {
            cell.htmlReady.then(updateDOM);
        }
    }

    Object.defineProperty(this, 'cube', {
        enumerable: true,
        get: function() {
            return _options['cube'];
        },
        set: function(newCube) {
            _options['cube'] = newCube;
        }
    });

    Object.defineProperty(this, 'row', {
        enumerable: true,
        get: function() {
            return _options['row'];
        },
        set: function(newRow) {
            _options['row'] = newRow;
            if (__autoRender)
            {
                render();   // call to ensure that the DOM is sync with model
            }
        }
    });

    Object.defineProperty(this, 'column', {
        enumerable: true,
        get: function() {
            return _options['column'];
        },
        set: function(newColumn) {
            _options['column'] = newColumn;
            if (__autoRender)
            {
                render();   // call to ensure that the DOM is sync with model
            }
        }
    });

    Object.defineProperty(this, 'depth', {
        enumerable: true,
        get: function() {
            return _options['depth'];
        },
        set: function(newDepth) {
            _options['depth'] = newDepth;
            if (__autoRender)
            {
                render();   // call to ensure that the DOM is sync with model
            }
        }
    });

    Object.defineProperty(this, 'color', {
        enumerable: true,
        get: function() {
            return _options['color'];
        },
        set: function(newColor) {
            _options['color'] = newColor;
            _colorRgbString = _options['color'].join(',')
            if (__autoRender)
            {
                render();   // call to ensure that the DOM is sync with model
            }
        }
    });

    Object.defineProperty(this, 'on', {
        enumerable: true,
        get: function() {
            return _options['on'];
        },
        set: function(turnOn) {
            _options['on'] = turnOn;
            if (__autoRender)
            {
                render();   // call to ensure that the DOM is sync with model
            }
        }
    });

    Object.defineProperty(this, 'size', {
        enumerable: true,
        get: function() {
            return _options['size'];
        },
        set: function(newSize) {
            _options['size'] = newSize;
            if (__autoRender)
            {
                render();   // call to ensure that the DOM is sync with model
            }
        }
    });

    function mouseClickHandler(e) {
        e.preventDefault();

        cell.applyOptions({
            on: !_options['on'], // Toggle my on status when someone clicks the cell
            /**
             * IF we have a connection to the cube and it has an opinion about
             * what color we should be, let's honor it.
             */
            color: _options['on'] && _options['cube'] ? cell.cube.penColorRgb : _options['color'],
        });
    }

    function mouseDownHandler(e) {
        e.preventDefault();

        // if start on an on cell the same color as we, clear next ones,
        // otherwise continue to draw in cube's penColor
        var newDragSetOn = !_options['on'] || (_options['cube'] ?
            !__colorsAreEqual(_options['cube'].penColorRgb, _options['color']) :
            false);

        var newDragSetColor = _options['cube'] ?
            _options['cube'].penColorRgb :
            _options['color'];

        CellDraggingDelegate.get().applyOptions({
            isDragging: true,
            dragSetOn: newDragSetOn,
            dragSetColor: newDragSetColor,
        });
    }

    function mouseUpHandler(e) {
        e.preventDefault();

        CellDraggingDelegate.get().applyOptions({
            isDragging: false,
        });
    }

    function mouseMoveHandler(e) {
        e.preventDefault();

        var dragDelegate = CellDraggingDelegate.get();
        if (dragDelegate.isDragging)
        {
            cell.applyOptions({
                on: dragDelegate.dragSetOn,
                color: dragDelegate.dragSetOn ? dragDelegate.dragSetColor : _options['color'],
            });
        }
    }

    Object.defineProperty(this, 'interactive', {
        /**
         * Whether we listen for click events. The click event handler simply toggles
         * whether the cell is on.
         */
        enumerable: true,
        get: function() {
            return _options['interactive'];
        },
        set: function(newInteractive) {
            _options['interactive'] = newInteractive;
            cell.htmlReady.then(function() {
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
                        cell.html.removeEventListener('click', mouseClickHandler);
                        cell.html.removeEventListener('mousedown', mouseDownHandler);
                        cell.html.removeEventListener('mouseup', mouseUpHandler);
                        cell.html.removeEventListener('mousemove', mouseMoveHandler);

                        cell.html.addEventListener('click', mouseClickHandler);

                        if (_options['interactMode'] === 'drag')
                        {
                            cell.html.addEventListener('mousedown', mouseDownHandler);
                            cell.html.addEventListener('mouseup', mouseUpHandler);
                            cell.html.addEventListener('mousemove', mouseMoveHandler);
                        }
                    }
                    _options['interactive'] = newInteractive;
                } else
                {
                    cell.html.removeEventListener('click', mouseClickHandler);
                    cell.html.removeEventListener('mousedown', mouseDownHandler);
                    cell.html.removeEventListener('mouseup', mouseUpHandler);
                    cell.html.removeEventListener('mousemove', mouseMoveHandler);
                }
            }.bind(this));  // Use our "outside" this inside of the promise callback
        }
    });

    Object.defineProperty(this, 'interactMode', {
        get: function() {
            return _options['interactMode'];
        },
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
        }
    });

    Object.defineProperty(this, 'rotation', {
        /**
         * Each cell can be rotated. This property was added for the cube.rotateCells
         * property, which is disabled by default. See comment in that property for
         * details.
         */
        enumerable: true,
        get: function() {
            return _options['rotation'];
        },
        set: function(newRotation) {
            var invalidValueChecker = function(axisValue) {
                return isNaN(parseFloat(axisValue));
            };
            if (!(newRotation instanceof Array) ||
                (newRotation.length !== 3) ||
                newRotation.some(invalidValueChecker))
            {
                throw 'Bad value for cell.rotation: ' + newRotation;
            }

            _options['rotation'] = newRotation;

            // cache whether we have a rotation for performance
            _hasRotation = newRotation.reduce(function(prev, curr) {
                return prev + curr;
            });
            render();   // call to ensure that the DOM is sync with model
        }
    });

    Object.defineProperty(this, 'transitionTransforms', {
        /**
         * Apply CSS transitions on the cell's transform style.
         */
        enumerable: false,
        get: function() {
            return _options['transitionTransforms'];
        },
        set: function(shouldTransition) {
            _options['transitionTransforms'] = shouldTransition;
            render();   // call to ensure that the DOM is sync with model
        }
    });

    Object.defineProperty(this, 'options', {
        /**
         * If anyone wants to know our options, we don't have to give them a pointer
         * to our private _options. Instead, we give them a new object with values
         * that are the same as in our object. That way, someone from outside the
         * cell can't inadvertantly make changes to our internal model.
         */
        enumerable: false,
        configurable: false,
        set: NOOP,
        get: function() {
            return {
                // do not include cube because we could get a circular reference
                row: _options['row'],
                column: _options['column'],
                depth: _options['depth'],
                color: _options['color'],
                on: _options['on'],
                size: _options['size'],
                interactive: _options['interactive'],
                rotation: _options['rotation'],
            };
        }
    });

    this.applyOptions = function(newOpts) {
        /**
         * Assign a collection of options passed in as a single object for the
         * cell.
         */
        if (!(newOpts instanceof Object))
        {
            throw 'TypeError: Cell options must be object';
        }

        /**
         * We may be setting many opts and don't want to rerender for each
         * change, so we temporarily disable auto-rendering, manually render,
         * and re-enable for other non-applyOptions() calls.
         */
        __autoRender = false;
        var opts = Object.keys(newOpts);
        for (var i = 0, numOpts = opts.length; i < numOpts; i++)
        {
            var key = opts[i];
            /**
             * For each option passed in from the caller, check that we have a
             * property by that name. If so, assign the value from newOpts to
             * it, which will trigger the custom setter, which will ensure that
             * the DOM is in sync.
             */
            if (this.hasOwnProperty(key))
            {
                this[key] = newOpts[key];
            } else
            {
                console.error('Invalid option for Cell:' + key);
            }
        }
        render();   // manually render all changes
        __autoRender = true;    // re-enable auto-rendering
    };

    (function buildHTML() {
        this.applyOptions(_options);

        // Let's make the HTML that'll display me
        this.html = document.createElement('div');
        this.html.classList.add('cell');

        this.led = document.createElement('div');
        this.led.classList.add('led');

        this.html.appendChild(this.led);

        htmlReadySuccessFn();
        _htmlReady = true;
    }.bind(this)());  // Use our "outside" this inside of buildHTML

    return this;
};

Cell.prototype.setFromCell = function(otherCell) {
    /**
     * Copy visual properties from another cell into self.
     */
    this.applyOptions({
        color: otherCell.color,
        on: otherCell.on,
    });
};

Cell.prototype.toJSON = function() {
    /**
     * Custom serialization function. See comment for Cube.toJSON in cube.js
     * for thorough explanation.
     */
    return this.options;
};
