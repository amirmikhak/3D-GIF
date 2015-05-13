var CubeTile = function CubeTile(cells, cellOpts, shallow) {
    var _cellOpts = cellOpts || {};

    var _shallow = !!shallow;

    var __sliceValidator = function(dataToValidate) {
        return (dataToValidate instanceof Array) && (dataToValidate.length === 64);
    };

    var __copyCell = function(originalCell, addlCellOpts, __shallow) {
        var mergedCellOptions = {
            y: originalCell.y,
            x: originalCell.x,
            z: originalCell.z,
            on: originalCell.on,
            color: originalCell.color,
        };
        var optionKeys = Object.keys(mergedCellOptions);
        for (var i = 0, numOpts = optionKeys.length; i < numOpts; i++) {
            if (optionKeys[i] in addlCellOpts)
            {
                mergedCellOptions[optionKeys[i]] = addlCellOpts[optionKeys[i]];
            }
        }
        if (__shallow)
        {
            return applyOptions.call(originalCell, mergedCellOptions);
        }
        return new Cell(mergedCellOptions);
    };

    var _cells = tryJSON(cells, __sliceValidator);
    for (var i = 0, numCells = cells.length; i < numCells; i++)
    {
        _cells[i] = __copyCell(_cells[i], _cellOpts, _shallow);
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

        for (var x = 0; x < 8; x++)
        {
            var reflectedRow = [];
            for (var y = 0; y < 8; y++)
            {
                reflectedRow.unshift(_cells[(x * 8) + y]);
            }

            _reflectedCells = _reflectedCells.concat(reflectedRow);
        }

        _cells = _reflectedCells;

        return this;
    };

    return this;
};

CubeTile.prototype.getCellOnStates = function() {
    return this.cells.map(function(cell) { return cell.on ? 1 : 0; }).toString();
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
        cell.y = !isNaN(parseInt(cell.y, 10)) ? cell.y : (7 - Math.floor(idx % 8));
        cell.x = !isNaN(parseInt(cell.x, 10)) ? cell.x : Math.floor(idx / 8);

        var pixelOffsetX = cell.y * PIXEL_MULTIPLIER_W;
        var pixelOffsetY = cell.x * PIXEL_MULTIPLIER_H;

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
