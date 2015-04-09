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
        clickable: false,
        rotation: [0, 0, 0],
        transitionTransforms: false,
    };

    var _cube;

    var _row;
    var _column;
    var _depth;
    var _color;
    var _on;
    var _size;
    var _clickable;
    var _rotation;
    var _transitionTransforms;

    var TRANSITION_DURATION = '300ms';
    var TRANSITION_EASING = 'ease-in-out';

    var _options = _.extend({}, defaultOptions, opts);

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

    function getRbgaFromColorWithOpacity(color, opacity) {
        return 'rgba(' + color.join(',') + ',' + opacity + ')';
    }

    function render() {
        /**
         * Idempotent* render function to ensure that the state of the model and
         * DOM are not out of sync.
         *
         * * Can be called as many times as you like and nothing bad or unexpected
         *   will happen. Technical definition: http://en.wikipedia.org/wiki/Idempotence#Computer_science_meaning
         */
        cell.htmlReady.then(function() {
            if (_transitionTransforms)
            {
                this.html.style.transitionProperty = 'transform';
                this.html.style.transitionDuration = TRANSITION_DURATION;
                this.html.style.transitionTimingFunction = TRANSITION_EASING;
            } else
            {
                this.html.style.transitionProperty = null;
                this.html.style.transitionDuration = null;
                this.html.style.transitionTimingFunction = null;
            }

            // render the LED's on-ness
            this.led.classList.toggle('on', _on);
            this.html.style.opacity = _on ? 1 : null;

            // render the LED's color
            this.led.style.backgroundColor = getRbgaFromColorWithOpacity(_on ? _color : [0, 0, 0], 1);
            this.html.style.backgroundColor = _on ?
                getRbgaFromColorWithOpacity(_color, 0.125) :
                null;

            // apply cell data attributes
            this.html.setAttribute('data-row', _row);
            this.html.setAttribute('data-column', _column);
            this.html.setAttribute('data-depth', _depth);

            // set the size of the cell
            this.html.style.width = _size + 'px';
            this.html.style.height = _size + 'px';

            /**
             * Build the string to position the cell / optionally change its face
             *
             * NOTE: 3d transforms are not commutitive meaning that the order
             *  of the transforms matters. Browsers apply transforms in reverse
             *  order of their appearance in the CSS. That is in the case of
             *  "transform: A B C;" browsers will first perform transform C,
             *  then B, then A.
             */
            var xform = [
                ['translateX(', (this.size * this.column), 'px)'].join(''),
                ['translateY(', (this.size * this.row), 'px)'].join(''),
                ['translateZ(', (-1 * this.size * this.depth), 'px)'].join(''),
                ['rotateX(', this.rotation[0], 'deg)'].join(''),
                ['rotateY(', this.rotation[1], 'deg)'].join(''),
                ['rotateZ(', this.rotation[2], 'deg)'].join(''),
            ].join(' ');

            // assign the built string to the element
            this.html.style.transform = xform;
        }.bind(cell));
    }

    Object.defineProperty(this, 'cube', {
        enumerable: true,
        get: function() {
            return _cube;
        },
        set: function(newCube) {
            // assign newCube value to both _cube and _options.cube
            _cube = _options.cube = newCube;
        }
    });

    Object.defineProperty(this, 'row', {
        enumerable: true,
        get: function() {
            return _row;
        },
        set: function(newRow) {
            // assign newRow value to both _row and _options.row
            _row = _options.row = newRow;
            render();   // call to ensure that the DOM is sync with model
        }
    });

    Object.defineProperty(this, 'column', {
        enumerable: true,
        get: function() {
            return _column;
        },
        set: function(newColumn) {
            // assign newColumn value to both _column and _options.column
            _column = _options.column = newColumn;
            render();   // call to ensure that the DOM is sync with model
        }
    });

    Object.defineProperty(this, 'depth', {
        enumerable: true,
        get: function() {
            return _depth;
        },
        set: function(newDepth) {
            // assign newDept value to both _depth and _options.depth
            _depth = _options.depth = newDepth;
            render();   // call to ensure that the DOM is sync with model
        }
    });

    Object.defineProperty(this, 'color', {
        enumerable: true,
        get: function() {
            return _color;
        },
        set: function(newColor) {
            // assign newColor value to both _color and _options.color
            _color = _options.color = newColor;
            render();   // call to ensure that the DOM is sync with model
        }
    });

    Object.defineProperty(this, 'on', {
        enumerable: true,
        get: function() {
            return _on;
        },
        set: function(turnOn) {
            // assign turnOn value to both _on and _options.on
            _on = _options.on = turnOn;
            render();   // call to ensure that the DOM is sync with model
        }
    });

    Object.defineProperty(this, 'size', {
        enumerable: true,
        get: function() {
            return _size;
        },
        set: function(newSize) {
            // assign newSize value to both _size and _options.size
            _size = _options.size = newSize;
            render();   // call to ensure that the DOM is sync with model
        }
    });

    function clickHandler(event) {
        cell.on = !cell.on; // Toggle my on status when someone clicks the cell
        if (cell.cube && cell.on)
        {
            /**
             * IF we have a connection to the cube and it has an opinion about
             * what color we should be, let's honor it.
             */
            cell.color = cube.penColorRgb;
        }
    };

    Object.defineProperty(this, 'clickable', {
        /**
         * Whether we listen for click events. The click event handler simply toggles
         * whether the cell is on.
         */
        enumerable: true,
        get: function() {
            return _clickable;
        },
        set: function(newClickable) {
            _options.clickable = newClickable;
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
                if (newClickable && !_clickable)
                {
                    cell.html.addEventListener('click', clickHandler);
                    _clickable = newClickable;
                } else
                {
                    cell.html.removeEventListener('click', clickHandler);
                }
            }.bind(this));  // Use our "outside" this inside of the promise callback
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
            return _rotation;
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

            _rotation = _options.rotation = newRotation;
            render();   // call to ensure that the DOM is sync with model
        }
    });

    Object.defineProperty(this, 'transitionTransforms', {
        /**
         * Apply CSS transitions on the cell's transform style.
         */
        enumerable: false,
        get: function() {
            return _transitionTransforms;
        },
        set: function(shouldTransition) {
            _transitionTransforms = _options.transitionTransforms = shouldTransition;
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
                row: this.row,
                column: this.column,
                depth: this.depth,
                color:this.color,
                on: this.on,
                size: this.size,
                clickable:this.clickable,
                rotation:this.rotation,
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

        Object.keys(newOpts).forEach(function(key) {
            /**
             * For each option passed in from the caller, check that we have a
             * property by that name. If so, assign the value from newOpts to
             * it, which will trigger the custom setter, which will ensure that
             * the DOM is in sync.
             */
            if (this.hasOwnProperty(key))
            {
                this[key] = _options[key] = newOpts[key];
            } else
            {
                console.error('Invalid option for Cell:' + key);
            }
        }.bind(this));  // Use our "outside" this inside of the foreach
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
