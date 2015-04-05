var Cube = function(size, parentElement, playButton, clearButton, cellOpts) {
    // 'this' can point to many, different things, so we grab an easy reference to the object
    // You can read more about 'this' at:
    // MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
    // at http://www.quirksmode.org/js/this.html
    // and in a more detailed tutorial: http://javascriptissexy.com/understand-javascripts-this-with-clarity-and-master-it/
    var cube = this;

    // DEFINE SOME PROPERTIES
    var defaultPlaybackOptions = {
        delay: 100,
        action: 'slide',
        direction: 'back',
        wrap: false,
    };

    var defaultCellOptions = {
        size: 50, // size of our cells in pixels
    };

    var playbackOptions = _.extend({}, defaultPlaybackOptions);
    var cellOptions = _.extend({}, defaultCellOptions);

    Object.defineProperty(this, 'playbackOptions', {
        enumerable: true,
        get: function() {
            return playbackOptions;
        },
        set: function(newOptions) {
            _.extend(playbackOptions, newOptions);
        }
    });

    Object.defineProperty(this, 'cellOptions', {
        enumerable: true,
        get: function() {
            return cellOptions;
        },
        set: function(newOptions) {
            _.extend(cellOptions, newOptions);
        }
    });

    // @amirmikhak
    // Note: there has _got_ to be a "nicer" way to do this. This code feels smelly.
    this.cellOptions = defaultCellOptions;  // copy in the default options
    this.cellOptions = typeof cellOpts !== 'undefined' ? cellOpts : {}; // copy in what the user wanted


    // CONFIGURE FOR ARGUMENTS
    if (!(parentElement instanceof HTMLElement))
    {
        parentElement = document.getElementsByTag('body');
        parentElement = parentElement.length ? parentElement[0] : null;
        if (!parentElement)
        {
            throw 'No parent element for the cube';
        }
    }

    if (playButton instanceof HTMLElement)
    {
        playButton.addEventListener('click', function(event) {
            cube.play();
        });
    }

    if (clearButton instanceof HTMLElement)
    {
        clearButton.addEventListener('click', function(event) {
            cube.clear();
        });
    }

    // SET UP REST OF SELF
    this.size = size; // How many rows and columns do I have?

    var outerDimensions = this.size * this.cellOptions.size;

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
                var cell = new Cell(this.cellOptions.size);
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
                        'X': cube.cellOptions.size * cell.column,
                        'Y': cube.cellOptions.size * cell.row,
                        'Z': -1 * cube.cellOptions.size * cell.depth
                    };
                    return 'translate' + direction + '(' + translation[direction] + 'px' + ')';
                }).join(' ');

                cube.cells.push(cell);
                cube.html.appendChild(cell.html); // Actually render the cell
            }
        }
    }

    parentElement.appendChild(this.html); // Actually render the cube

    return this;
};

Cube.prototype.shiftPlane = function(axis, stepSize, wrap) {
    stepSize = typeof stepSize !== 'undefined' ? stepSize : -1;
    wrap = typeof wrap !== 'undefined' ? !!wrap : true;

    var cube = this;

    function getNewValueForShift(cell, axis) {
        if ((cell[axis] + stepSize) >= 0 && (cell[axis] + stepSize) < cube.size)
        {   // your new coord originated from inside of bounds
            return (cell[axis] + stepSize) % cube.size;
        } else
        {   // your new coord originated from outside of bounds
            if (wrap)
            {   // reach around the other side
                return (cube.size + cell[axis] + stepSize) % cube.size;
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

    var nextState = cube.cells.map(function(cell) {
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
            'on': cube.getCellAt(shiftedCoords[0], shiftedCoords[1], shiftedCoords[2]).on,
            'color': cube.getCellAt(shiftedCoords[0], shiftedCoords[1], shiftedCoords[2]).color
        };
    });

    // Iterate over all the cells and change their on status and color to their 'previous' neighbor's
    cube.cells.forEach(function(cell, index) {
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

    var cellIndex = (depth * this.size * this.size) + (row * this.size) + column;
    return this.cells[cellIndex];
};

Cube.prototype.setCellAt = function(row, column, depth, newCell) {
    if ((row < 0) || (row > this.size - 1) ||
        (column < 0) || (column > this.size - 1) ||
        (depth < 0) ||  (depth > this.size - 1))
    {
        throw 'Invalid coordinate';
    }

    var cellIndex = (depth * this.size * this.size) + (row * this.size) + column;
    var matchedCell = this.cells[cellIndex];

    matchedCell.setFromCell(newCell);

    return matchedCell;
};

Cube.prototype.applyCell = function(newCell) {
    return this.setCellAt(newCell.row, newCell.column, newCell.depth, newCell);
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

Cube.prototype.play = function(opts) {
    var cube = this;

    opts = typeof opts !== 'undefined' ? opts : {};

    this.playbackOptions = opts;

    if (this.playbackOptions.action === 'slide')
    {
        switch(this.playbackOptions.direction)
        {
            case 'up':
                loopOverCubeSize(function() {
                    cube.shiftPlane('X', 1, cube.playbackOptions.wrap);
                });
                break;
            case 'down':
                loopOverCubeSize(function() {
                    cube.shiftPlane('X', -1, cube.playbackOptions.wrap);
                });
                break;
            case 'left':
                loopOverCubeSize(function() {
                    cube.shiftPlane('Y', 1, cube.playbackOptions.wrap);
                });
                break;
            case 'right':
                loopOverCubeSize(function() {
                    cube.shiftPlane('Y', -1, cube.playbackOptions.wrap);
                });
                break;
            case 'forward':
                loopOverCubeSize(function() {
                    cube.shiftPlane('Z', 1, cube.playbackOptions.wrap);
                });
                break;
            case 'back':
            default:
                loopOverCubeSize(function() {
                    cube.shiftPlane('Z', -1, cube.playbackOptions.wrap);
                });
        }
    } else
    {
        console.error('animation action not supported');
    }


    var animateInterval;

    /**
     * @amirmikhak
     * These functions can be "defined" after they are "called" above because of javascript's "hoisting".
     * Learn more: http://code.tutsplus.com/tutorials/javascript-hoisting-explained--net-15092
     */
    function loopOverCubeSize(func) {
        var numOps = 0;
        clearInterval(animateInterval);
        animateInterval = setInterval(function() {
            func.apply(this);
            if (++numOps == cube.size)
            {
                clearInterval(animateInterval);
            }
        }, cube.playbackOptions.delay);
    }
};

Cube.prototype.clear = function() {
    this.cells.forEach(function(cell) {
        cell.on = false;
    });
};

Cube.prototype.buildPlaybackControls = function(parentEl) {
    var cube = this;

    parentEl.innerHTML = (
        '<div>' +
            'Direction: ' +
            '<select>' +
                '<option value="forward">Forward</option>' +
                '<option value="back">Back</option>' +
                '<option value="left">Left</option>' +
                '<option value="right">Right</option>' +
                '<option value="up">Up</option>' +
                '<option value="down">Down</option>' +
            '</select><br>' +
            '<label>Wrap?: <input type="checkbox"></label>' +
        '</div>'
        );

    parentEl.addEventListener('change', function(e) {
        if (e.target.nodeName === 'SELECT')
        {
            cube.playbackOptions = {
                direction: e.target.value,
            };
        } else if (e.target.nodeName === 'INPUT')
        {
            cube.playbackOptions = {
                wrap: e.target.checked,
            };
        }
    });

    function arrize(thing) {
        return Array.prototype.slice.apply(thing);
    }

    arrize(parentEl.querySelectorAll('select option')).forEach(function(el) {
        el.selected = (el.value == cube.playbackOptions.direction);
    });

    arrize(parentEl.querySelectorAll('input')).forEach(function(el) {
        el.checked = cube.playbackOptions.wrap;
    });
};

Cube.prototype.affectXSlice = function(column, fn) {
    for (var depth = cube.size; depth > 0; --depth)
    {
        for (var row = 0; row < cube.size; row++)
        {
            fn.apply(this, [row, column, depth]);
        }
    }
};

Cube.prototype.affectYSlice = function(row, fn) {
    for (var column = 0; row < this.size; row++)
    {
        for (var depth = this.size; depth > 0; --depth)
        {
            fn.apply(this, [row, column, depth]);
        }
    }
};

Cube.prototype.affectZSlice = function(depth, fn) {
    for (var row = 0; row < cube.size; row++)
    {
        for (var column = 0; column < cube.size; column++)
        {
            fn.apply(this, [row, column, depth]);
        }
    }
};

Cube.prototype.readSlice = function(face, offset, output) {
    var cube = this;

    var validFaces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    var validOutputs = ['object', 'object-deep', 'json'];

    offset = (typeof offset !== 'undefined') ?
        Math.max(0, Math.min(parseInt(offset, 10), this.size - 1)) :
        0;
    face = (typeof face !== 'undefined') && (validFaces.indexOf(face) !== -1) ?
        face :
        'front';
    output = (typeof output !== 'undefined') && (validOutputs.indexOf(output) !== -1) ?
        output :
        'object-deep';

    var cells = [];

    function captureCell(r, c, d) {
        var cell = (output === 'object-deep') ?
            _.cloneDeep(this.getCellAt(r, c, d)) :
            this.getCellAt(r, c, d);
        cells.push(cell);
    }

    if ((face === 'front') || (face === 'back'))
    {
        var depth = (face === 'back') ? (cube.size - 1) - offset : offset;
        this.affectZSlice(depth, captureCell);
    } else if ((face === 'top') || (face === 'bottom'))
    {
        var row = (face === 'bottom') ? (this.size - 1) - offset : offset;
        this.affectYSlice(row, captureCell);
    } else if ((face === 'left') || (face === 'right'))
    {
        var column = (face === 'right') ? (cube.size - 1) - offset : offset;
        this.affectXSlice(column, captureCell);
    }

    if (output === 'json')
    {
        return JSON.stringify(cells);
    }

    return cells;
};

Cube.prototype.writeSlice = function(data, face, offset) {
    var cube = this;

    var validFaces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    var validOutputs = ['object', 'json'];

    offset = (typeof offset !== 'undefined') ?
        Math.max(0, Math.min(parseInt(offset, 10), this.size - 1)) :
        0;
    face = (typeof face !== 'undefined') && (validFaces.indexOf(face) !== -1) ?
        face :
        'front';

    try
    {   // handle different types of data input: JSON or raw object
        data = JSON.parse(data);    // throws SyntaxError if not valid JSON string
    } catch (err)
    {   // pass
    }

    if (!(data instanceof Array) || (data.length !== Math.pow(this.size, 2)))
    {
        throw 'Malformed data';
    }

    var cells = data.slice();

    function writeCellFromData(r, c, d) {
        var cell = cells.shift();
        this.setCellAt(r, c, d, cell);
    };

    if ((face === 'front') || (face === 'back'))
    {
        var depth = (face === 'back') ? (cube.size - 1) - offset : offset;
        this.affectZSlice(depth, writeCellFromData);
    } else if ((face === 'top') || (face === 'bottom'))
    {
        var row = (face === 'bottom') ? (this.size - 1) - offset : offset;
        this.affectYSlice(row, writeCellFromData);
    } else if ((face === 'left') || (face === 'right'))
    {
        var column = (face === 'right') ? (cube.size - 1) - offset : offset;
        this.affectXSlice(column, writeCellFromData);
    }
};

Cube.prototype.toJSON = function() {
    return {
        size: this.size,
        cells: this.cells,
        playbackOptions: this.playbackOptions,
        cellOptions: this.cellOptions,
    };
};
