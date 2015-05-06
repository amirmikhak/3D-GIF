var CellDragStateTracker = function() {

    var _isDragging = false;
    var _dragSetOn = true;
    var _dragSetColor = [0,0,0];

    function invalidRgbValueFn(val) {
        return (val < 0) || (val > 255);
    }

    Object.defineProperty(this, 'isDragging', {
        enumerable: true,
        get: function() { return _isDragging; },
        set: function(newDragging) { _isDragging = !!newDragging; },
    });

    Object.defineProperty(this, 'dragSetOn', {
        enumerable: true,
        get: function() { return _dragSetOn; },
        set: function(newSetOn) { _dragSetOn = !!newSetOn; },
    });

    Object.defineProperty(this, 'dragSetColor', {
        enumerable: true,
        get: function() { return _dragSetColor; },
        set: function(newColor) {
            if (!(newColor instanceof Array) ||
                (newColor.length !== 3) ||
                newColor.some(invalidRgbValueFn))
            {
                console.error('Invalid drag color', newColor);
                return;
            }

            _dragSetColor = newColor;
        },
    });

};

var CellDraggingDelegate = (function() {
    var instance;

    function createInstance() {
        var newDelegate = new CellDragStateTracker();
        return newDelegate;
    }

    return {
        get: function() {
            if (!instance)
            {
                instance = createInstance();
            }
            return instance;
        }
    };
})();