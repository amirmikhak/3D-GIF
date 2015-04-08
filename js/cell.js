var Cell = function(opts) {
    var cell = this; // 'this' can point to many, different things, so we grab an easy reference to the object
    // You can read more about 'this' at:
    // MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
    // at http://www.quirksmode.org/js/this.html
    // and in a more detailed tutorial: http://javascriptissexy.com/understand-javascripts-this-with-clarity-and-master-it/

    var defaultOptions = {
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

            // position the cell
            var xform = [
                ['translateX(', (this.size * this.column), 'px)'].join(''),
                ['translateY(', (this.size * this.row), 'px)'].join(''),
                ['translateZ(', (-1 * this.size * this.depth), 'px)'].join(''),
                ['rotateX(', this.rotation[0], 'deg)'].join(''),
                ['rotateY(', this.rotation[1], 'deg)'].join(''),
                ['rotateZ(', this.rotation[2], 'deg)'].join(''),
            ];

            this.html.style.transform = xform.join(' ');
        }.bind(cell));
    }

    Object.defineProperty(this, 'row', {
        enumerable: true,
        get: function() {
            return _row;
        },
        set: function(newRow) {
            _row = _options.row = newRow;
            render();
        }
    });

    Object.defineProperty(this, 'column', {
        enumerable: true,
        get: function() {
            return _column;
        },
        set: function(newColumn) {
            _column = _options.column = newColumn;
            render();
        }
    });

    Object.defineProperty(this, 'depth', {
        enumerable: true,
        get: function() {
            return _depth;
        },
        set: function(newDepth) {
            _depth = _options.depth = newDepth;
            render();
        }
    });

    Object.defineProperty(this, 'color', {
        enumerable: true,
        get: function() {
            return _color;
        },
        set: function(newColor) {
            // A custom setter which both updates our color attribute and renders that color
            _color = _options.color = newColor;
            render();
        }
    });

    Object.defineProperty(this, 'on', {
        enumerable: true,
        get: function() {
            return _on;
        },
        set: function(turnOn) {
            _on = _options.on = turnOn;
            render();
        }
    });

    Object.defineProperty(this, 'size', {
        enumerable: true,
        get: function() {
            return _size;
        },
        set: function(newSize) {
            _size = _options.size = newSize;
            render();
        }
    });

    function clickHandler(event) {
        cell.on = !cell.on; // Toggle my on status when someone clicks the cell
    };

    Object.defineProperty(this, 'clickable', {
        enumerable: true,
        get: function() {
            return _clickable;
        },
        set: function(newClickable) {
            _options.clickable = newClickable;
            cell.htmlReady.then(function() {
                /**
                 * @amirmikhak
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
            }.bind(this));
        }
    });

    Object.defineProperty(this, 'rotation', {
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
            render();
        }
    });

    Object.defineProperty(this, 'transitionTransforms', {
        enumerable: false,
        get: function() {
            return _transitionTransforms;
        },
        set: function(shouldTransition) {
            _transitionTransforms = _options.transitionTransforms = shouldTransition;
            render();
        }
    });

    this.applyOptions = function(newOpts) {
        if (!(newOpts instanceof Object))
        {
            throw 'TypeError: Cell options must be object';
        }

        Object.keys(newOpts).forEach(function(key) {
            if (this.hasOwnProperty(key))
            {
                this[key] = _options[key] = newOpts[key];
            } else
            {
                console.error('Invalid option for Cell:' + key);
            }
        }.bind(this));
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
    }.bind(this)());

    return this;
};

Cell.prototype.setFromCell = function(otherCell) {
    this.applyOptions({
        color: otherCell.color,
        on: otherCell.on,
    });
};

Cell.prototype.toJSON = function() {
    return _.cloneDeep(_options);
}
