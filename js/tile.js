var Tile = function(cells) {
    try {
        cells = JSON.parse(cells);
    } catch (Error) {
    }

    if (!(cells instanceof Array) || (cells.length !== 64))
    {
        throw "Invalid cells";
    }

    var _cells = cells.slice();

    this.getCells = function() {
        return _cells.slice();
    };

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

    var __stripIsInvalid = function(strip) {
        return !(strip instanceof Array) || (strip.length !== 8);
    };

    this.setFromStrips = function(strips) {
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

    this.getPngData = function() {
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

        for (var idx = 0, numCells = _cells.length; idx < numCells; idx++)
        {
            var cell = _cells[idx];
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


    return this;
};

var EmptyTile = function() {
    var emptyCells = [];
    for (var i = 0; i < 64; i++)
    {
        emptyCells.push(new Cell({
            on: false,
            color: [0,0,0],
        }));
    }
    return new Tile(emptyCells);
}
