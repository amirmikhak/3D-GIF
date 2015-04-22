var EmptyTile = function EmptyTile() {
    var emptyCells = [];
    for (var i = 0; i < 64; i++)
    {
        emptyCells.push(new Cell({
            on: false,
            color: [0,0,0],
        }));
    }
    return new Tile(emptyCells);
};
