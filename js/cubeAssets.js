var CubeAssets = function CubeAssets(opts) {

    var cubeAssets = this;

    var _fontMap = {};
    var _activeFont = null;

    var _shapeSetMap = {};
    var _activeShapeSet = null;

    Object.defineProperty(this, 'shapeSetNames', {
        get: function() { return Object.keys(_shapeSetMap); },
    });

    Object.defineProperty(this, 'hasAShapeSet', {
        get: function() { return !!Object.keys(_shapeSetMap).length; },
    });

    Object.defineProperty(this, 'activeShapeSet', {
        get: function() { return _activeShapeSet; },
        set: function(newActiveShapeSet) {
            if (!_shapeSetMap[newActiveShapeSet])
            {
                var availableShapeSets = this.hasAShapeSet ?
                    this.shapeSetNames.join(', ') :
                    '(none)';
                console.error(
                    'No such shapeSet loaded: ' + newActiveShapeSet + '. ' +
                    'Available fonts: ' + availableShapeSets
                );
                return;
            }

            _activeShapeSet = newActiveShapeSet;
        },
    });

    Object.defineProperty(this, 'activeShapeSetShapes', {
        get: function() {
            return _shapeSetMap[_activeShapeSet] ?
                Object.create(_shapeSetMap[_activeShapeSet]) :
                null;
        },
    });

    Object.defineProperty(this, 'fontNames', {
        get: function() { return Object.keys(_fontMap); },
    });

    Object.defineProperty(this, 'hasAFont', {
        get: function() { return !!Object.keys(_fontMap).length; },
    });

    Object.defineProperty(this, 'activeFontChars', {
        get: function() { return Object.create(_fontMap[_activeFont]); },
    });

    Object.defineProperty(this, 'activeFont', {
        get: function() { return _activeFont; },
        set: function(newFont) {
            if (!_fontMap[newFont])
            {
                var availableFontsList = this.hasAFont ?
                    this.fontNames.join(', ') :
                    '(none)';
                console.error(
                    'No such font loaded: ' + newFont + '. ' +
                    'Available fonts: ' + availableFontsList
                );
                return;
            }

            _activeFont = newFont;
        },
    });


    /**
     * These functions are attached inside of the original definition of the cube
     * because they need access to "private" variables: _fontMap, _shapeSetMap.
     */

    this.loadFont = function(handle, url) {
        /**
         * Load a remote JSON file of a map of characters that can be displayed on
         * the cube. Save the loaded map of shapes by a handle for optional removal.
         */

       // this fetch is asynchronous
       fetchJSONFile(url, function(fontData) {
           _fontMap[handle] = fontData;
           if (Object.keys(_fontMap).length === 1)
           {   // if this newly loaded font is the only one available...
               cubeAssets.activeFont = handle;   // ... use it.
           }
       });
    };

    this.unloadFont = function(handle) {
        /**
        * Unload a previously loaded font.
        */

       delete(_fontMap[handle]);

       if (!this.hasAFont)
       {   // if there aren't any more loaded fonts after unloading this one...
           _activeFont = null;    // ... we can't have an active font
       } else if (handle === _activeFont)
       {   // if we unloaded our current font, but have another available...
           _activeFont = this.fontNames[0]; // ... use it
       }
    };

    this.loadShapeSet = function(handle, url) {
        /**
         * Load a remote JSON file of a map of shapes that can be displayed on
         * the cube. Save the loaded map of shapes by a handle for optional removal.
         */

       // this fetch is asynchronous
       fetchJSONFile(url, function(shapeSetData) {
           _shapeSetMap[handle] = shapeSetData;
           if (Object.keys(_shapeSetMap).length === 1)
           {   // if this newly loaded shapeSet is the only one available...
               cubeAssets.activeShapeSet = handle;   // ... use it.
           }
       });
    };

    this.unloadShapeSet = function(handle) {
        /**
        * Unload a previously loaded shapeSet.
        */

       delete(_shapeSetMap[handle]);

       if (!this.hasAShapeSet)
       {   // if there aren't any more loaded shapeSets after unloading this one...
           _activeShapeSet = null;    // ... we can't have an active shapeSet
       } else if (handle === _activeShapeSet)
       {   // if we unloaded our current shapeSet, but have another available...
           _activeShapeSet = this.shapeSetNames[0]; // ... use it
       }
    };

    return this;

};

CubeAssets.prototype.getCharacterRender = function(char, desiredColor) {
    /**
     * Return a slice containing a character (char, a single character) in a
     * color (desiredColor, a string) for rendering to the cube. This function
     * does not draw to the cube; the output of this function needs to get to
     * cube.writeSlice() for rendering.
     */

    var invalidRgbValueFn = function(val) { return val < 0 || val > 255; };

    if (!(desiredColor instanceof Array) ||
        desiredColor.length !== 3 ||
        desiredColor.some(invalidRgbValueFn))
    {
        console.error('Invalid desired color: ' + desiredColor);
        throw 'Invalid color';
    }

    var charPixels = this.activeFontChars[char].slice();
    if (!charPixels)
    {
        console.error('Character could not be rendered: ' + char);
        return;
    }

    /**
     * If the character is defined in the font's character set, loop over
     * each pixel to apply the current penColor if the pixel is on.
     */
    return new CubeTile(charPixels, {
        color: desiredColor,
    });
};

CubeAssets.prototype.getShapeRender = function(shapeName) {
    if (!this.activeShapeSetShapes[shapeName])
    {
        console.error('Invalid shape for CubeAssetes.getShapeRender(). ' +
            'Known shapes: ' + this.activeShapeSetShapes.join(', '));
        throw 'Invalid shape';
    }

    return new CubeTile(this.activeShapeSetShapes[shapeName]);
};
