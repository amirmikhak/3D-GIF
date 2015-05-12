var Cube = function Cube(size, opts) {
    this._size = size || 0;
    this._cells = [];

    for (var x = 0; x < this._size; x++) {
        for (var y = 0; y < this._size; y++) {
            for (var z = 0; z < this._size; z++) {
                this._cells.push(new Cell({
                    x: x,
                    y: y,
                    z: z,
                }));
            }
        }
    }

    return this;
};

Object.defineProperty(Cube.prototype, '__offCell', {
    writable: false,
    value: new Cell({
        on: false,
        color: [0, 0, 0],
    }),
});

Object.defineProperty(Cube.prototype, 'size', {
    get: function() { return this._size; },
});

Object.defineProperty(Cube.prototype, 'cells', {
    get: function() { return this._cells; },
});

Object.defineProperty(Cube.prototype, 'faceNames', {
    writable: false,
    value: ['top', 'front', 'left', 'back', 'right', 'bottom'],
});

Object.defineProperty(Cube.prototype, 'colors', {
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

Object.defineProperty(Cube.prototype, 'colorNames', {
    get: function() { return Object.keys(this.colors); },
});

Object.defineProperty(Cube.prototype, 'shiftedCoordsFns', {
    writable: false,
    value: {
        X: function(cell, cubeSize, wrap, stepSize) { return [Cube.prototype.getNewValueForShift(cell['x'], cubeSize, wrap, stepSize), cell['y'], cell['z']]; },
        Y: function(cell, cubeSize, wrap, stepSize) { return [cell['x'], Cube.prototype.getNewValueForShift(cell['y'], cubeSize, wrap, stepSize), cell['z']]; },
        Z: function(cell, cubeSize, wrap, stepSize) { return [cell['x'], cell['y'], Cube.prototype.getNewValueForShift(cell['z'], cubeSize, wrap, stepSize)]; },
    }
});

Cube.prototype.toJSON = function() {
    return {
        size: this._size,
        cells: this._cells,
    };
};

Cube.prototype.sliceValidator = function(dataToValidate) {
    return dataToValidate && (dataToValidate.length === Math.pow(this._size, 2));
};

Cube.prototype.getForNetworkSubmission = function() {
    var retCells = [];
    for (var i = 0, numCells = this._cells.length; i < numCells; i++)
    {
        retCells.push(this._cells[i].getForNetworkSubmission());
    }
    return {
        s: this._size,
        c: retCells,
    };
};

Cube.prototype.serializeForCompare = function() {
    var cellSimpleInfos = [];
    for (var i = 0, numCells = this._cells.length; i < numCells; i++)
    {
        cellSimpleInfos.push(this._cells[i].simpleOptions);
    }
    return JSON.stringify({
        size: this._size,
        cells: cellSimpleInfos,
    });
};

Cube.prototype.getCellOnStates = function() {
    return this._cells.map(function(cell) { return cell.on ? 1 : 0 }).toString();
};

Cube.prototype.getForAnimationFrame = function() {
    var retCube = new Cube(this._size);
    var retCells = retCube.cells;
    for (var i = 0, numCells = this._cells.length; i < numCells; i++)
    {
        retCells[i].setFromCell(this._cells[i]);
    }
    return retCube;
};

Cube.prototype.getNewValueForShift = function(cellPos, cubeSize, wrap, stepSize) {
    var cellPlusSize = cellPos + stepSize;
    if ((cellPlusSize >= 0) && (cellPlusSize < cubeSize))
    {   // your new coord originated from inside of bounds
        return (cellPlusSize) % cubeSize;
    } else if (wrap)    // your new coord originated from outside of bounds
    {   // reach around the other side
        return (cubeSize + cellPlusSize) % cubeSize;
    }
    return -1;  // screw it, your new value is nothing
};

Cube.prototype.shiftPlane = function(axis, stepSize, wrap) {
    /**
     * Apply the state of any given cell to its n'th-away neighbor (stepSize)
     * along a given plane (axis: X, Y, Z). Wrap defines whether cells "fall
     * off" or wrap to the opposite face when shifting out of bounds.
     */

    var _stepSize = typeof stepSize !== 'undefined' ? stepSize : -1;
    var _wrap = typeof wrap !== 'undefined' ? !!wrap : true;

    var nextState = [];
    for (var i = 0, numCells = this._cells.length; i < numCells; i++)
    {
        // We want to calculate the coordinates of the 'previous' cell along various directions
        var shiftedCoords = this.shiftedCoordsFns[axis].apply(this, [this._cells[i], this._size, _wrap, _stepSize]);
        var sourceCell = this.getCellAt(shiftedCoords[0], shiftedCoords[1], shiftedCoords[2]);

        // Once we have it, grab its on status and color and return it
        nextState.push({
            on: sourceCell.on,
            color: sourceCell.color,
        });
    }

    // Iterate over all the cells and change their on status and color to their 'previous' neighbor's
    for (var i = 0, numCells = this._cells.length; i < numCells; i++)
    {
        applyOptions.call(this._cells[i], {
            on: nextState[i].on,
            color: nextState[i].on ? nextState[i].color : this._cells[i].color,
        });
    }

    return this;
};

Cube.prototype.dimensionOutOfBounds = function(dimValue) {
    return (dimValue < 0) || (dimValue >= this._size);
}

Cube.prototype.invalidCoord = function(x, y, z) {
    return (
        this.dimensionOutOfBounds(x) ||
        this.dimensionOutOfBounds(y) ||
        this.dimensionOutOfBounds(z)
    );
};

Cube.prototype.getCellAt = function(x, y, z) {
    /**
     * Returns the cell for a given coordinate. If the coordinate is invalid,
     * return a Cell that is off and has no color. Note that this Cell does not
     * need to have a link to the cube or any other attributes set on it
     * because it represents an invalid point and is only used to set the state
     * of existing, valid cells. See cell.setFromCell() for the list of
     * properties that are copied between cells.
     */

    if (this.invalidCoord(x, y, z))
    {
        return this.__offCell;
    }

    var cellIndex = (x * this._size * this._size) + (y * this._size) + z;
    return this._cells[cellIndex];
};

Cube.prototype.setCellAt = function(x, y, z, newCell) {
    /**
     * Apply newCell's state to a cell at a given coordinate.
     *
     * Thys "Invalid coordinate" if the coordinate is impossible.
     */

    if (this.invalidCoord(x, y, z))
    {
        console.error('Invalid Coord', x, y, z, newCell);
        throw 'Invalid coordinate';
    }

    return this.getCellAt(x, y, z).setFromCell(newCell);
};

Cube.prototype.applyCell = function(newCell) {
    /**
     * Convenience function for cube.setCellAt(). Expects a cell whose y,
     * x, and z are all set. This may be useful for programatically
     * created Cell objects.
     */

    return this.setCellAt(newCell.x, newCell.y, newCell.z, newCell);
};

Cube.prototype.clear = function() {
    /**
     * Clear the contents of the cube.
     */

    for (var i = 0, numCells = this._cells.length; i < numCells; i++)
    {
        this._cells[i].on = false;
    }

    return this;
};


/**
 * SLICE MANIPULATION FUNCTIONS
 */

Cube.prototype.affectXSlice = function(x, fn) {
    /**
     * Call a function on each cell within a given X slice starting from the left
     */

    for (var z = this._size - 1; z >= 0; z--)
    {
        for (var y = 0; y < this._size; y++)
        {
            fn.apply(this, [x, y, z]);
        }
    }

    return this;
};

Cube.prototype.affectYSlice = function(y, fn) {
    /**
     * Call a function on each cell within a given Y slice starting from the top
     */

    for (var x = 0; x < this._size; x++)
    {
        for (var z = this._size - 1; z >= 0; z--)
        {
            fn.apply(this, [x, y, z]);
        }
    }

    return this;
};

Cube.prototype.affectZSlice = function(z, fn) {
    /**
     * Call a function on each cell within a given Z slice starting from the front
     */

    for (var x = 0; x < this._size; x++)
    {
        for (var y = 0; y < this._size; y++)
        {
            fn.apply(this, [x, y, z]);
        }
    }

    return this;
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
     */
    offset = (typeof offset !== 'undefined') ?
        Math.max(0, Math.min(parseInt(offset, 10), this._size - 1)) :
        0;
    face = (typeof face !== 'undefined') && (Cube.prototype.faceNames.indexOf(face) !== -1) ?
        face :
        this.writeFace;
    output = (typeof output !== 'undefined') && (validOutputs.indexOf(output) !== -1) ?
        output :
        'json';

    var cellsRead = [];

    function captureCell(x, y, z) {
        /**
         * Callback, called for each cell, for getting the cell data in the
         * correct format and gathering them into a single data structure.
         */
        var cell = (output === 'object-deep') ?
            _.cloneDeep(this.getCellAt(x, y, z)) :
            this.getCellAt(x, y, z);
        cellsRead.push(cell);
    }

    /**
     * Use the correct affectFooSlice function for the axis
     */
    if ((face === 'front') || (face === 'back'))
    {
        var z = (face === 'back') ? (this._size - 1) - offset : offset;
        this.affectZSlice(z, captureCell);
    } else if ((face === 'top') || (face === 'bottom'))
    {
        var y = (face === 'bottom') ? (this._size - 1) - offset : offset;
        this.affectYSlice(y, captureCell);
    } else if ((face === 'left') || (face === 'right'))
    {
        var x = (face === 'right') ? (this._size - 1) - offset : offset;
        this.affectXSlice(x, captureCell);
    }

    if (output === 'json')
    {
        return JSON.stringify(cellsRead);
    }

    return cellsRead;
};

Cube.prototype.writeSlice = function(data, face, offset) {
    /**
     * Write a saved slice (recorded in the formats output by cube.readSlice) to
     * "offset" slices in from "face".
     */

    offset = (typeof offset !== 'undefined') ?
        Math.max(0, Math.min(parseInt(offset, 10), this._size - 1)) :
        0;
    face = (typeof face !== 'undefined') && (this.faceNames.indexOf(face) !== -1) ?
        face :
        'front';

    var dataTile = (data instanceof CubeTile) ?
        new CubeTile(data.cells, {}, false) :
        new CubeTile(tryJSON(data, this.sliceValidator.bind(this)));

    var facesToReflectX = ['back', 'right'];
    var facesToReflectY = ['top'];

    if (facesToReflectX.indexOf(face) !== -1)
    {
        dataTile.reflectX();
    }

    if (facesToReflectY.indexOf(face) !== -1)
    {
        dataTile.reflectY();
    }

    var cellsToWrite = dataTile.cells;

    function writeCellFromData(x, y, z) {
        var cell = cellsToWrite.shift();
        this.setCellAt(x, y, z, cell);
    };

    if ((face === 'front') || (face === 'back'))
    {
        var z = (face === 'back') ? (this._size - 1) - offset : offset;
        this.affectZSlice(z, writeCellFromData);
    } else if ((face === 'top') || (face === 'bottom'))
    {
        var y = (face === 'top') ? (this._size - 1) - offset : offset;
        this.affectYSlice(y, writeCellFromData);
    } else if ((face === 'left') || (face === 'right'))
    {
        var x = (face === 'right') ? (this._size - 1) - offset : offset;
        this.affectXSlice(x, writeCellFromData);
    }

    return this;
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
        for (idx = 0; idx < this._size; idx++)
        {
            cb.apply(this, [dim1, idx, dim2, idx]);
        }
    } else if (dims === 'xy')
    {   // not tested
        for (idx = 0; idx < this._size; idx++)
        {
            cb.apply(this, [dim2, dim1, idx, idx]);
        }
    } else if (dims === 'yz')
    {   // not tested
        for (idx = 0; idx < this._size; idx++)
        {
            cb.apply(this, [idx, dim1, dim2, idx]);
        }
    } else
    {
        console.error('Callback not called due to no "dims" match.', dims);
    }
};

Cube.prototype.writeXZCol = function(x, z, cells) {
    var cube = this;
    this.affectCol('xz', x, z, function(x, y, z, idx) {
        this.setCellAt(x, y, z, cells[idx]);
    });
    return this;
};

Cube.prototype.readXZCol = function(x, z) {
    var cube = this;
    var strip = [];
    this.affectCol('xz', x, z, function(x, y, z, idx) {
        strip.push(cube.getCellAt(x, y, z));
    });
    return strip;
};

Cube.prototype.writeXYCol = function(x, y, cells) {
    // NOT TESTED
    var cube = this;
    this.affectCol('xy', x, y, function(x, y, z, idx) {
        this.setCellAt(x, y, z, cells[idx]);
    });
    return this;
};

Cube.prototype.readXYCol = function(x, y) {
    // NOT TESTED
    var cube = this;
    var strip = [];
    this.affectCol('xy', x, y, function(x, y, z, idx) {
        strip.push(cube.getCellAt(x, y, z));
    });
    return strip;
};

Cube.prototype.writeYZCol = function(y, z, cells) {
    // NOT TESTED
    var cube = this;
    this.affectCol('yz', y, z, function(x, y, z, idx) {
        this.setCellAt(x, y, z, cells[idx]);
    });
    return this;
};

Cube.prototype.readYZCol = function(y, z) {
    // NOT TESTED
    var cube = this;
    var strip = [];
    this.affectCol('yz', y, z, function(x, y, z, idx) {
        strip.push(cube.getCellAt(x, y, z));
    });
    return strip;
};
