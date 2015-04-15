var Tile = function(cells) {
    try {
        cells = JSON.parse(cells);
    } catch (Error) {
    }

    if (!(cells instanceof Array) || (cells.length !== 64))
    {
        throw "Invalid cells";
    }

    var _cells = cells;

    this.getCells = function() {
        return _cells;
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

    return this;
};
