var Cube = function(size, parentElement, playButton, clearButton, cellOptions) {
    var me = this;
    // 'this' can point to many, different things, so we grab an easy reference to the object
    // You can read more about 'this' at:
    // MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
    // at http://www.quirksmode.org/js/this.html
    // and in a more detailed tutorial: http://javascriptissexy.com/understand-javascripts-this-with-clarity-and-master-it/

    // CONFIGURE FOR ARGUMENTS
    if (!(parentElement instanceof HTMLElement))
    {
        parentElement = document.getElementsByTag('body');
        parentElement = parentElement.length ? parentElement[0] : null;
        if (!parentElement)
        {
            throw Error('No parent element for the cube');
        }
    }

    if (playButton instanceof HTMLElement)
    {
        playButton.addEventListener('click', function(event) {
            me.play();
        });
    }

    if (clearButton instanceof HTMLElement)
    {
        clearButton.addEventListener('click', function(event) {
            me.clear();
        });
    }

    var defaultCellOptions = {
        size: 50,
    };

    cellOptions = typeof cellOptions !== 'undefined' ? cellOptions : defaultCellOptions;

    // SET UP REST OF SELF

    this.size = size; // How many rows and columns do I have?

    this.resolution = cellOptions.size ? cellOptions.size : defaultCellOptions.size; // size of our cells in pixels

    var outerDimensions = this.size * this.resolution;

    // The HTML display of the cube istelf
    this.html = document.createElement('div');
    this.html.id = 'cube';

    this.html.style.height = outerDimensions + 'px';
    this.html.style.width = outerDimensions + 'px';
    this.html.style.transformStyle = 'preserve-3d';
    this.html.style.transformOrigin = [
        'calc(' + outerDimensions + 'px/2)',
        'calc(' + outerDimensions + 'px/2)',
        'calc(-1 * ' + outerDimensions + 'px/2)'
    ].join(' ');


    this.cells = [];
    for (var depth = 0; depth < this.size; depth++) {
        // Iterate over each Z-plane
        for (var row = 0; row < this.size; row++) {
            // Iterate over each row
            for (var column = 0; column < this.size; column++) {
                // Iterate over each column

                // Create a cell
                var cell = new Cell(this.resolution);
                cell.depth = depth;
                cell.column = column;
                cell.row = row;

                // Store the cell's coordinates in data attributes
                ['depth', 'column', 'row'].forEach(function(dimension) {
                    var attribute = 'data' + '-' + dimension;
                    cell.html.setAttribute(attribute, cell[dimension]);
                });

                // Manually position the cell in the right location via CSS
                cell.html.style.transform = ['X', 'Y', 'Z'].map(function(direction) {
                    var translation = {
                        'X': me.resolution * cell.column,
                        'Y': me.resolution * cell.row,
                        'Z': -1 * me.resolution * cell.depth
                    };
                    return 'translate' + direction + '(' + translation[direction] + 'px' + ')';
                }).join(' ');

                me.cells.push(cell);
                me.html.appendChild(cell.html); // Actually render the cell
            }
        }
    }

    parentElement.appendChild(this.html); // Actually render the cube

    return this;
};

Cube.prototype.shiftPlane = function(axis, stepSize, wrap) {
    stepSize = typeof stepSize !== 'undefined' ? stepSize : -1;
    wrap = typeof wrap !== 'undefined' ? !!wrap : true;

    var me = this;

    function getNewValueForShift(cell, axis) {
        if ((cell[axis] + stepSize) >= 0 && (cell[axis] + stepSize) < me.size)
        {   // your new coord originated from inside of bounds
            return (cell[axis] + stepSize) % me.size;
        } else
        {   // your new coord originated from outside of bounds
            if (wrap)
            {   // reach around the other side
                return (me.size + cell[axis] + stepSize) % me.size;
            } else
            {   // screw it, your new value is nothing
                return -1;
            }
        }
    };

    function getNewRowForXShift(cell) {
        return getNewValueForShift(cell, 'row');
    }

    function getNewColForYShift(cell) {
        return getNewValueForShift(cell, 'column');
    }

    function getNewDepthForZShift(cell) {
        return getNewValueForShift(cell, 'depth');
    }

    var nextState = me.cells.map(function(cell) {
        // We want to calculate the coordinates of the 'previous' cell along various directions
        var shiftedCoords = {
            'X': [
                getNewRowForXShift(cell),
                cell.column,
                cell.depth,
            ],
            'Y': [
                cell.row,
                getNewColForYShift(cell),
                cell.depth,
            ],
            'Z': [
                cell.row,
                cell.column,
                getNewDepthForZShift(cell),
            ]
        }[axis];

        // Once we have it, grab its on status and color and return it
        return {
            'on': me.getCellAt(shiftedCoords[0], shiftedCoords[1], shiftedCoords[2]).on,
            'color': me.getCellAt(shiftedCoords[0], shiftedCoords[1], shiftedCoords[2]).color
        };
    });

    // Iterate over all the cells and change their on status and color to their 'previous' neighbor's
    me.cells.forEach(function(cell, index) {
        cell.on = false;
        cell.on = nextState[index].on;
        if (cell.on) {
            cell.color = nextState[index].color;
        }
    });
};

Cube.prototype.getCellAt = function(row, column, depth) {
    if ((row < 0) || (row > this.size - 1) ||
        (column < 0) || (column > this.size - 1) ||
        (depth < 0) ||  (depth > this.size - 1))
    {
        /*
         * @amirmikhak
         * if impossible coordinate, return an object that _looks like_ an off cell.
         * this is likely very confusing behavior, but it works for what I need in
         * shiftPlane().
         */
        return {
            on: false,
            color: [0, 0, 0],
        }
    }
    return this.cells[depth * this.size * this.size + row * this.size + column];
};

Cube.prototype.nudge = function(direction, amount) {
    amount = !isNaN(parseFloat(amount, 10)) ? amount : 1;

    this.yAngle = this.yAngle ? this.yAngle : 0;
    this.xAngle = this.xAngle ? this.xAngle : 0;

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

    this.html.style.transform = [
        'rotateX(' + this.xAngle + 'deg' + ')',
        'rotateY(' + this.yAngle + 'deg' + ')'
    ].join(' ');
};

Cube.prototype.play = function(mode, options) {
    var cube = this;

    var defaultOptions = {
        delay: 250,
    };

    mode = typeof mode !== 'undefined' ? mode : 'back';
    options = typeof options !== 'undefined' ? options : defaultOptions;

    switch(mode)
    {
        case 'someYetToBeDefinedOtherMode':
            // placeholder for future playback modes
            break;
        case 'back':
        default:
            doAnimateBack();
    }

    /**
     * @amirmikhak
     * These functions can be "defined" after they are "called" above because of javascript's "hoisting".
     * Learn more: http://code.tutsplus.com/tutorials/javascript-hoisting-explained--net-15092
     */
    function doAnimateBack() {
        var numShifts = 0;
        var animateBack = setInterval(function() {
            cube.shiftPlane('Z');
            numShifts++;
            if (numShifts == (cube.size - 1)) {
                numShifts = 0;
                clearInterval(animateBack);
            }
        }, options.delay ? options.delay : 250);
    };
};

Cube.prototype.clear = function() {
    this.cells.forEach(function(cell) {
        cell.on = false;
    });
};