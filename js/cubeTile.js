var CubeTile = function CubeTile(cells, cellOpts) {
    var _cellOpts = cellOpts || {};

    var __sliceValidator = function(dataToValidate) {
        return (dataToValidate instanceof Array) && (dataToValidate.length === 64);
    };

    var __copyCell = function(originalCell, addlCellOpts) {
        var mergedCellOptions = {
            row: originalCell.row,
            column: originalCell.column,
            depth: originalCell.depth,
            on: originalCell.on,
            color: originalCell.color,
        };
        for (var key in mergedCellOptions) {
            mergedCellOptions[key] = addlCellOpts.hasOwnProperty(key) ?
                addlCellOpts[key] :
                mergedCellOptions[key];
        }
        return new Cell(mergedCellOptions);
    };

    var _cells = tryJSON(cells, __sliceValidator);
    for (var i = 0, numCells = cells.length; i < numCells; i++)
    {
        _cells[i] = __copyCell(_cells[i], _cellOpts);
    }

    Object.defineProperty(this, 'cells', {
        get: function() { return _cells.slice(); },
    });

    this.getAsStrips = function() {
        var strips = [[],[],[],[],[],[],[],[]];
        for (var i = 0; i < 8; i++)
        {
            for (var j = 0; j < 8; j++)
            {
                strips[i][j] = _cells[Math.floor(i * 8) + j];
            }
        }
        return strips;
    };

    this.setFromStrips = function(strips) {
        var __stripIsInvalid = function(strip) {
            return !(strip instanceof Array) || (strip.length !== 8);
        };

        if (!(strips instanceof Array) ||
            (strips.length !== 8) ||
            strips.some(__stripIsInvalid))
        {
            console.error('Invalid strips provided. Cannot compose.');
            return;
        }

        for (var i = 0; i < 8; i++)
        {
            for (var j = 0; j < 8; j++)
            {
                _cells[Math.floor(i * 8) + j] = strips[i][j];
            }
        }

        return this;
    };

    this.reflectX = function() {
        return this.setFromStrips(this.getAsStrips().reverse());
    };

    this.reflectY = function() {
        var _reflectedCells = [];

        for (var col = 0; col < 8; col++)
        {
            var reflectedRow = [];
            for (var row = 0; row < 8; row++)
            {
                reflectedRow.unshift(_cells[(col * 8) + row]);
            }

            _reflectedCells = _reflectedCells.concat(reflectedRow);
        }

        _cells = _reflectedCells;
    };

    return this;
};

CubeTile.prototype.getPngData = function() {
    var PNG_OUTPUT_WIDTH = 64;
    var PNG_OUTPUT_HEIGHT = 64;

    var PIXEL_MULTIPLIER_W = Math.floor(PNG_OUTPUT_WIDTH / 8);
    var PIXEL_MULTIPLIER_H = Math.floor(PNG_OUTPUT_HEIGHT / 8);

    var c = document.createElement('canvas');
    c.width = PNG_OUTPUT_WIDTH;
    c.height = PNG_OUTPUT_HEIGHT;

    var ctx = c.getContext('2d');

    var id = ctx.createImageData(1, 1);
    var d = id.data;

    for (var idx = 0, numCells = this.cells.length; idx < numCells; idx++)
    {
        var cell = this.cells[idx];
        cell.row = !isNaN(parseInt(cell.row, 10)) ? cell.row : Math.floor(idx % 8);
        cell.column = !isNaN(parseInt(cell.column, 10)) ? cell.column : Math.floor(idx / 8);

        var pixelOffsetX = cell.row * PIXEL_MULTIPLIER_W;
        var pixelOffsetY = cell.column * PIXEL_MULTIPLIER_H;

        for (var subpixelCol = 0; subpixelCol < PIXEL_MULTIPLIER_W; subpixelCol++)
        {
            for (var subpixelRow = 0; subpixelRow < PIXEL_MULTIPLIER_H; subpixelRow++)
            {
                d[0] = cell.color[0];
                d[1] = cell.color[1];
                d[2] = cell.color[2];
                d[3] = cell.on ? 255 : 0;

                var y = pixelOffsetX + subpixelRow; // the x/y are swapped in the slice serialization
                var x = pixelOffsetY + subpixelCol;

                ctx.putImageData(id, x, y);
            }
        }
    }

    return c.toDataURL();
};
