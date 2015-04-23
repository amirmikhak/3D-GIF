var CubeController = function CubeController(cube) {

    Emitter(this);

    var _cube = cube;

    Object.defineProperty(this, 'cube', {
        get: function() { return _cube; },
        set: function(newCube) { _cube = newCube; },
    });

    return this;

};

CubeController.prototype.getUpdate = function() {
    // to be overwritten by "subclasses"
};
