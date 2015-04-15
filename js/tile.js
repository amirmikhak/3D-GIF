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

    return this;
};
