var EmptyCubeTile = function EmptyCubeTile() {

    var __offCell = new Cell({
        on: false,
        color: [0,0,0],
    });

    var offCells = [];
    for (var i = 0; i < 64; i++)
    {
        offCells.push(__offCell);
    }

    CubeTile.call(this, offCells, null, true);

    return this;
};

EmptyCubeTile.prototype = Object.create(CubeTile.prototype);
EmptyCubeTile.prototype.constructor = EmptyCubeTile;
