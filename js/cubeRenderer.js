var CubeRenderer = function CubeRenderer(cube) {

    Emitter(this);

    var _cube = cube;
    var _cells = _cube ? _cube.cells : [];
    var _numCells = _cells ? _cells.length : 0;

    Object.defineProperty(this, 'cube', {
        get: function() { return _cube; },
        set: function(newCube) {
            if (!newCube || (_cube === newCube))
            {
                return;
            }

            _cube = newCube;
            _cells = _cube.cells;
            _numCells = _cube.cells.length;

            this.emit('cubeChanged');
        }
    });

    Object.defineProperty(this, 'cells', {
        get: function() { return _cells; }
    });

    Object.defineProperty(this, 'numCells', {
        get: function() { return _numCells; }
    });

    return this;

};

CubeRenderer.prototype.render = function() {
    // to be overwritten by "subclasses"
};
