{

    var defaultCellOptions = {
        size: 50, // size of our cells in pixels
    };

    var _cellOptions = _.extend({}, defaultCellOptions, cellOpts || {});


    var _xAngle = 0;
    var _yAngle = 0;
    var _transitionTransforms = true;
    var _rotateCells = false;

    var _html = document.createElement('div');

    /**
     * We use this "Promise" and expose these callbacks to ensure that functions
     * that expect the cube's DOM to be present and built don't run until this
     * is actually the case.
     *
     * To learn more about Promises in Javascript, see these links:
     * https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Promise.jsm/Promise
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
     */
    var __htmlReadySuccessFn;
    var __htmlReadyFailureFn;
    var _htmlReady = new Promise(function(resolve, reject) {
        __htmlReadySuccessFn = resolve;
        __htmlReadyFailureFn = reject;
    });

    Object.defineProperty(this, 'html', {
        enumerable: false,
        set: NOOP,
        get: function() { return _html; },
    });

    Object.defineProperty(this, 'htmlReady', {
        enumerable: false,
        set: NOOP,
        get: function() { return _htmlReady; },
    });

    Object.defineProperty(this, 'outerDimensions', {
        enumerable: false,
        set: NOOP,
        get: function() { return this.size * _cellOptions.size; }
    });

    function applyCameraAngle() {
        /**
         * Helper function for xAngle and yAngle properties that helps ensure
         * that the visible angle of the cube is in sync with the internal state.
         */
        _htmlReady.then(function() {
            _html.style.transform = (
                'rotateX(' + _xAngle + 'deg) ' +
                'rotateY(' + _yAngle + 'deg)'
            );

            if (_rotateCells)
            {
                /**
                 * Only apply rotations if we need to because iterating over the cells
                 * is very expensive and reduces performance significantly. See the
                 * rotateCells property on "this" for more information.
                 */
                _cells.forEach(function(cell) {
                    cell.applyOptions({
                        rotation: [-1 * _xAngle, -1 * _yAngle, 0],
                    });
                });
            }
        });
    }

    Object.defineProperty(this, 'xAngle', {
        enumerable: true,
        get: function() {
            return _xAngle;
        },
        set: function(newAngle) {
            var parsedAngle = parseFloat(newAngle);
            if (!isNaN(parsedAngle))
            {
                _xAngle = parsedAngle;
                applyCameraAngle();
            }
        }
    });

    Object.defineProperty(this, 'yAngle', {
        enumerable: true,
        get: function() {
            return _yAngle;
        },
        set: function(newAngle) {
            var parsedAngle = parseFloat(newAngle);
            if (!isNaN(parsedAngle))
            {
                _yAngle = parsedAngle;
                applyCameraAngle();
            }
        }
    });

    Object.defineProperty(this, 'transitionTransforms', {
        /**
         * Animate transforms on the cube (does not apply to cells, whose property
         * is set separately).
         */
        enumerable: false,
        get: function() {
            return _transitionTransforms;
        },
        set: function(shouldTransition) {
            _transitionTransforms = shouldTransition;

            var TRANSITION_DURATION = '300ms';
            var TRANSITION_EASING = 'ease-in-out';

            _htmlReady.then(function() {
                if (shouldTransition)
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
            });
        }
    });

    Object.defineProperty(this, 'rotateCells', {
        /**
         * If true, each cell rotates opposite the cube so that it is always facing
         * you. It is computationally expensive and graphically looks a little weird.
         * It is thus not especially useful, yet I leave it here for posterity.
         */
        enumerable: true,
        get: function() {
            return _rotateCells;
        },
        set: function(shouldRotate) {
            var prevRotateCells = _rotateCells;
            _rotateCells = shouldRotate;
            if (!_rotateCells && prevRotateCells)
            {
                /**
                 * To improve performance of applyCameraAngle(), we only iterate over
                 * the cells if we need to rotate them. Thus, if we are not rotating
                 * the cells but were previously, we need to "clear" their rotation
                 * manually because applyCameraAngle() won't if the property is false.
                 */
                _cells.forEach(function(cell) {
                    cell.applyOptions({
                        rotation: [0, 0, 0],
                    });
                });
            }

            applyCameraAngle();
        }
    });

    /**
     * Faces-related properties
     */

    Object.defineProperty(this, 'faceCubeViewingAngles', {
        enumerable: true,
        writable: false,
        value: {   // face: [cube.xAngle, cube.yAngle]
            top: [-60, 30],
            front: [-30, 30],
            left: [-30, 60],
            back: [-20, -155],
            right: [-30, -60],
            bottom: [60, 30],
        }
    });

    this.transitionTransforms = _transitionTransforms;

    (function buildHTML() {
        // The HTML display of the cube istelf
        _html.id = 'cube';

        _html.style.height = this.outerDimensions + 'px';
        _html.style.width = this.outerDimensions + 'px';
        _html.style.transformStyle = 'preserve-3d';
        _html.style.transformOrigin = (
            'calc(' + this.outerDimensions + 'px/2) ' +
            'calc(' + this.outerDimensions + 'px/2) ' +
            'calc(-1 * ' + this.outerDimensions + 'px/2)'
        );

        var _cells = _cube.cells;
        for (var i = 0, numCells = _cells.length; i < numCells; i++)
        {
            _html.appendChild(_cells[i].html); // Actually render the cell
        }

        __htmlReadySuccessFn();
    }.bind(this)());  // Use our "outside" this inside of buildHTML

}

Cube.prototype.nudge = function(direction, amount) {
    /**
     * Rotate the cube in a direction (left, right, up, down) by an amount
     * (in degrees).
     */

    amount = !isNaN(parseFloat(amount, 10)) ? amount : 1;

    switch (direction) {
        case 'left':
            this.yAngle -= amount;
            break;
        case 'up':
            this.xAngle += amount;
            break;
        case 'right':
            this.yAngle += amount;
            break;
        case 'down':
            this.xAngle -= amount;
            break;
    };

    return this;    // enables multiple calls on cube to be "chained"
};

