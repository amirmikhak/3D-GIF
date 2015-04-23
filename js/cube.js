var Cube = function Cube(size) {
    var cube = this;

    // DEFINE SOME PROPERTIES
    var _size = size;
    var _cells = [];
    var _renderer = null;
    var _controller = null;

    this.sliceValidator = function(dataToValidate) {
        /**
         * Verify that a "slice" object is is valid (enough)
         */
        return (dataToValidate instanceof Array) && (dataToValidate.length === Math.pow(this.size, 2));
    };

    Object.defineProperty(this, 'size', {
        get: function() { return _size; },
    });

    Object.defineProperty(this, 'cells', {
        get: function() { return _cells.slice(); },
    });

    Object.defineProperty(this, 'colors', {
        writable: false,
        value: {
            indigo: [75, 0, 130],
            blue: [0, 0, 255],
            cyan: [0, 255, 255],
            yellow: [255, 255, 0],
            green: [0, 255, 0],
            magenta: [255, 0, 255],
            orange: [255, 127, 0],
            red: [255, 0, 0],
            // white: [255, 255, 255],
            // gray: [125, 125, 125],
            // black: [0, 0, 0],
        }
    });

    Object.defineProperty(this, 'colorNames', {
        get: function() { return Object.keys(this.colors); },
    });

    Object.defineProperty(this, 'controller', {
        get: function() { return _controller; },
        set: function(newController) {
            if (!newController.can('getUpdate'))
            {
                console.error('Invalid controller: must implement getUpdate()');
                throw 'Invalid controller for Cube';
            }

            _controller = newController;
            _controller.cube = this;
        },
    });

    Object.defineProperty(this, 'renderer', {
        get: function() { return _renderer; },
        set: function(newRenderer) {
            if (!newRenderer.can('render'))
            {
                console.error('Invalid renderer: must implement render()');
                throw 'Invalid renderer for Cube';
            }

            _renderer = newRenderer;
            _renderer.cube = this;
        },
    });


    /**
     * INIT CODE
     */

    (function __buildCells() {
        for (var depth = 0; depth < _size; depth++) {
            // Iterate over each Z-plane
            for (var row = 0; row < _size; row++) {
                // Iterate over each row
                for (var column = 0; column < _size; column++) {
                    // Iterate over each column
                    _cells.push(new Cell({
                        cube: cube,
                        column: column,
                        row: row,
                        depth: depth,
                        autoRender: false,
                    }));
                }
            }
        }
    }());

    return this;
};

Cube.prototype.update = function() {
    if (this.controller)
    {
        this.controller.getUpdate();
    }
};

Cube.prototype.render = function() {
    if (this.renderer)
    {
        this.renderer.render();
    }
};

Cube.prototype.toJSON = function() {
    /**
     * Overrides the default (inherited) Object.toJSON() function to for custom
     * serialization. This is necessary because of the cube.html property,
     * which contains what are called "circular references," which prevent the
     * serializer from completing. To prevent this, we expose only the relevant
     * and serializable properties of the object.
     *
     * Example of a circular reference:
     *     var y = {
     *         property1: 'one',
     *         property2: 'two',
     *     };
     *     var x = {
     *         property1: 'aye',
     *         property2: 'bee',
     *         property3: y,
     *     };
     *     y.property3 = x;
     *
     * If you run the above code in the Chrome developer's console, you'll find
     * that both x and y are valid objects and that each points to the other.
     * You can verify this by expanding the properties of each (to see them,
     * just type each's variable name in the console and hit enter) and seeing
     * that the nesting of the objects never stops. This presents a problem for
     * the .toJSON() method because it's doing a similar traversal when
     * generating a string representation of each object.
     */

    return {
        size: this.size,
        cells: this.cells,
    };
};

Cube.prototype.shiftPlane = function(axis, stepSize, wrap) {
    /**
     * Apply the state of any given cell to its n'th-away neighbor (stepSize)
     * along a given plane (axis: X, Y, Z). Wrap defines whether cells "fall
     * off" or wrap to the opposite face when shifting out of bounds.
     */

    stepSize = typeof stepSize !== 'undefined' ? stepSize : -1;
    wrap = typeof wrap !== 'undefined' ? !!wrap : true;

    var cube = this;

    function getNewValueForShift(cell, axis) {
        var cubeSize = cube['size'];
        var cellPlusSize = cell[axis] + stepSize;

        if ((cellPlusSize >= 0) && (cellPlusSize < cubeSize))
        {   // your new coord originated from inside of bounds
            return (cellPlusSize) % cubeSize;
        } else if (wrap)    // your new coord originated from outside of bounds
        {   // reach around the other side
            return (cubeSize + cellPlusSize) % cubeSize;
        }

        // screw it, your new value is nothing
        return -1;
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
    for (var i = 0, numCells = cube.cells.length; i < numCells; i++)
    {
        cube.cells[i].applyOptions({
            on: nextState[i].on,
            color: nextState[i].on ? nextState[i].color : cube.cells[i].color,
        });
    }

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.dimensionOutOfBounds = function(dimValue) {
    return (dimValue < 0) || (dimValue >= this.size);
}

Cube.prototype.invalidCoord = function(r, c, d) {
    return (
        this.dimensionOutOfBounds(r) ||
        this.dimensionOutOfBounds(c) ||
        this.dimensionOutOfBounds(d)
    );
};

Cube.prototype.getCellAt = function(row, column, depth) {
    /**
     * Returns the cell for a given coordinate. If the coordinate is invalid,
     * return a Cell that is off and has no color. Note that this Cell does not
     * need to have a link to the cube or any other attributes set on it
     * because it represents an invalid point and is only used to set the state
     * of existing, valid cells. See cell.setFromCell() for the list of
     * properties that are copied between cells.
     */

    if (this.invalidCoord(row, column, depth))
    {
        return new Cell({
            on: false,
            color: [0, 0, 0],
        });
    }

    var cellIndex = (depth * this.size * this.size) + (row * this.size) + column;
    return this.cells[cellIndex];
};

Cube.prototype.setCellAt = function(row, column, depth, newCell) {
    /**
     * Apply newCell's state to a cell at a given coordinate.
     *
     * Throws "Invalid coordinate" if the coordinate is impossible.
     */

    if (this.invalidCoord(row, column, depth))
    {
        console.error('Invalid Coord', row, column, depth, newCell);
        throw 'Invalid coordinate';
    }

    return this.getCellAt(row, column, depth).setFromCell(newCell);
};

Cube.prototype.applyCell = function(newCell) {
    /**
     * Convenience function for cube.setCellAt(). Expects a cell whose row,
     * column, and depth are all set. This may be useful for programatically
     * created Cell objects.
     */

    return this.setCellAt(newCell.row, newCell.column, newCell.depth, newCell);
};

Cube.prototype.clear = function() {
    /**
     * Clear the contents of the cube.
     */

    this.cells.forEach(function(cell) {
        cell.on = false;
    });

    return this;    // enables multiple calls on cube to be "chained"
};


/**
 * SLICE MANIPULATION FUNCTIONS
 */

Cube.prototype.affectXSlice = function(column, fn) {
    /**
     * Call a function on each cell within a given X slice starting from the left
     */

    for (var depth = cube.size - 1; depth >= 0; depth--)
    {
        for (var row = 0; row < cube.size; row++)
        {
            fn.apply(this, [row, column, depth]);
        }
    }

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.affectYSlice = function(row, fn) {
    /**
     * Call a function on each cell within a given Y slice starting from the top
     */

    for (var column = 0; column < this.size; column++)
    {
        for (var depth = this.size - 1; depth >= 0; depth--)
        {
            fn.apply(this, [row, column, depth]);
        }
    }

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.affectZSlice = function(depth, fn) {
    /**
     * Call a function on each cell within a given Z slice starting from the front
     */

    for (var column = 0; column < cube.size; column++)
    {
        for (var row = 0; row < cube.size; row++)
        {
            fn.apply(this, [row, column, depth]);
        }
    }

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.readSlice = function(face, offset, output) {
    /**
     * Read a slice "offset" slices in from "face", and return in format: "output"
     *
     * Note: readSlice('left') returns the same thing as readSlice('right', 7);
     *  they are _NOT_ reflections of each other. Both are captured as if looking
     *  from the left with the origin in the upper left. The same applies for top
     *  and bottom and for front and back. The intuitive faces are FRONT, TOP, and
     *  LEFT.
     */

    var validOutputs = ['object', 'object-deep', 'json'];

    /**
     * Use reasonable default values if the caller didn't give you any or gave
     * values that are out of bounds or otherwise invalid.
     *
     * !TODO: log an error the console?
     */
    offset = (typeof offset !== 'undefined') ?
        Math.max(0, Math.min(parseInt(offset, 10), this.size - 1)) :
        0;
    face = (typeof face !== 'undefined') && (this.faceNames.indexOf(face) !== -1) ?
        face :
        this.writeFace;
    output = (typeof output !== 'undefined') && (validOutputs.indexOf(output) !== -1) ?
        output :
        'json';

    var cells = [];

    function captureCell(r, c, d) {
        /**
         * Callback, called for each cell, for getting the cell data in the
         * correct format and gathering them into a single data structure.
         */
        var cell = (output === 'object-deep') ?
            _.cloneDeep(this.getCellAt(r, c, d)) :
            this.getCellAt(r, c, d);
        cells.push(cell);
    }

    /**
     * Use the correct affectFooSlice function for the axis
     */
    if ((face === 'front') || (face === 'back'))
    {
        var depth = (face === 'back') ? (this.size - 1) - offset : offset;
        this.affectZSlice(depth, captureCell);
    } else if ((face === 'top') || (face === 'bottom'))
    {
        var row = (face === 'bottom') ? (this.size - 1) - offset : offset;
        this.affectYSlice(row, captureCell);
    } else if ((face === 'left') || (face === 'right'))
    {
        var column = (face === 'right') ? (this.size - 1) - offset : offset;
        this.affectXSlice(column, captureCell);
    }

    if (output === 'json')
    {
        return JSON.stringify(cells);
    }

    return cells;
};

Cube.prototype.writeSlice = function(data, face, offset) {
    /**
     * Write a saved slice (recorded in the formats output by cube.readSlice) to
     * "offset" slices in from "face".
     *
     * Note: Refer to note in cube.readSlice() on left/right, front/back, etc. origins.
     */

    offset = (typeof offset !== 'undefined') ?
        Math.max(0, Math.min(parseInt(offset, 10), this.size - 1)) :
        0;
    face = (typeof face !== 'undefined') && (this.faceNames.indexOf(face) !== -1) ?
        face :
        'front';

    var dataToUse = tryJSON(data, this.sliceValidator.bind(this));

    var dataTile = new Tile(dataToUse);

    var facesToReflectX = ['back', 'right'];
    var facesToReflectY = ['bottom'];

    if (facesToReflectX.indexOf(face) !== -1)
    {
        dataTile.reflectX();
    }

    if (facesToReflectY.indexOf(face) !== -1)
    {
        dataTile.reflectY();
    }

    var cells = dataTile.getCells();

    function writeCellFromData(r, c, d) {
        var cell = cells.shift();
        this.setCellAt(r, c, d, cell);
    };

    if ((face === 'front') || (face === 'back'))
    {
        var depth = (face === 'back') ? (this.size - 1) - offset : offset;
        this.affectZSlice(depth, writeCellFromData);
    } else if ((face === 'top') || (face === 'bottom'))
    {
        var row = (face === 'bottom') ? (this.size - 1) - offset : offset;
        this.affectYSlice(row, writeCellFromData);
    } else if ((face === 'left') || (face === 'right'))
    {
        var column = (face === 'right') ? (this.size - 1) - offset : offset;
        this.affectXSlice(column, writeCellFromData);
    }

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.affectCol = function(dims, dim1, dim2, cb) {
    var validDims = ['xz', 'xy', 'yz'];
    if ((typeof dims !== 'string') || (dims.length !== 2))
    {
        console.error('affectCol(): Bad dimensions. Valid dimensions: ' + validDims.join(', '), dims);
        return;
    } else if (this.dimensionOutOfBounds(dim1))
    {
        var dimName = dims.charAt(0).toUpperCase();
        console.error('affectCol(): Bad ' + dimName, dim1);
        return;
    } else if (this.dimensionOutOfBounds(dim2))
    {
        var dimName = dims.charAt(1).toUpperCase();
        console.error('affectCol(): Bad ' + dimName, dim2);
        return;
    }

    if (dims === 'xz')
    {
        for (idx = 0; idx < this.size; idx++)
        {
            cb.apply(this, [idx, dim1, dim2, idx]);
        }
    } else if (dims === 'xy')
    {   // not tested
        for (idx = 0; idx < this.size; idx++)
        {
            cb.apply(this, [dim1, dim2, idx, idx]);
        }
    } else if (dims === 'yz')
    {   // not tested
        for (idx = 0; idx < this.size; idx++)
        {
            cb.apply(this, [dim1, idx, dim2, idx]);
        }
    } else
    {
        console.error('Callback not called due to no "dims" match.', dims);
    }
};

Cube.prototype.writeXZCol = function(x, z, cells) {
    var cube = this;
    this.affectCol('xz', x, z, function(r, c, d, idx) {
        this.setCellAt(r, c, d, cells[idx]);
    });
    return this;
};

Cube.prototype.readXZCol = function(x, z) {
    var cube = this;
    var strip = [];
    this.affectCol('xz', x, z, function(r, c, d, idx) {
        strip.push(cube.getCellAt(r, c, d));
    });
    return strip;
};

Cube.prototype.writeXYCol = function(x, y, cells) {
    // NOT TESTED
    var cube = this;
    this.affectCol('xy', x, y, function(r, c, d, idx) {
        this.setCellAt(r, c, d, cells[idx]);
    });
    return this;
};

Cube.prototype.readXYCol = function(x, y) {
    // NOT TESTED
    var cube = this;
    var strip = [];
    this.affectCol('xy', x, y, function(r, c, d, idx) {
        strip.push(cube.getCellAt(r, c, d));
    });
    return strip;
};

Cube.prototype.writeYZCol = function(y, z, cells) {
    // NOT TESTED
    var cube = this;
    this.affectCol('yz', y, z, function(r, c, d, idx) {
        this.setCellAt(r, c, d, cells[idx]);
    });
    return this;
};

Cube.prototype.readYZCol = function(y, z) {
    // NOT TESTED
    var cube = this;
    var strip = [];
    this.affectCol('yz', y, z, function(r, c, d, idx) {
        strip.push(cube.getCellAt(r, c, d));
    });
    return strip;
};
