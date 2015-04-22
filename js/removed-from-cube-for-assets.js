{
    var _fontMap = {};
    var _activeFont = null;

    Object.defineProperty(this, 'shapes', {
        /**
         * An object of image slice arrays, each of which could have been serialized.
         */
        enumerable: true,
        writable: false,
        value: {
            circle: [{"color":[75,0,130],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[75,0,130],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[75,0,130],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[0,255,0],"on":false},{"color":[0,255,0],"on":true},{"color":[0,255,0],"on":true},{"color":[0,255,0],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[0,255,0],"on":false},{"color":[0,255,0],"on":true},{"color":[75,0,130],"on":false},{"color":[75,0,130],"on":false},{"color":[0,255,0],"on":true},{"color":[0,255,0],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[0,255,0],"on":true},{"color":[0,255,255],"on":false},{"color":[255,0,255],"on":false},{"color":[255,0,255],"on":false},{"color":[0,255,255],"on":false},{"color":[0,255,0],"on":true},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[0,255,0],"on":true},{"color":[0,255,255],"on":false},{"color":[255,0,255],"on":false},{"color":[255,0,255],"on":false},{"color":[0,255,255],"on":false},{"color":[0,255,0],"on":true},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[0,255,0],"on":false},{"color":[0,255,0],"on":true},{"color":[0,255,255],"on":false},{"color":[0,255,255],"on":false},{"color":[0,255,0],"on":true},{"color":[0,255,0],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[0,255,0],"on":false},{"color":[0,255,0],"on":true},{"color":[0,255,0],"on":true},{"color":[0,255,0],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[75,0,130],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[75,0,130],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[75,0,130],"on":false}],
            diamond: [{"color":[75,0,130],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,127,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[75,0,130],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,255],"on":false},{"color":[255,0,255],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,127,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,255],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,127,0],"on":false},{"color":[0,255,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[0,255,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[75,0,130],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[75,0,130],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false}],
            square: [{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[0,255,0],"on":true},{"color":[0,255,0],"on":true},{"color":[0,255,0],"on":true},{"color":[0,255,0],"on":true},{"color":[0,255,0],"on":true},{"color":[0,255,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[0,255,0],"on":true},{"color":[0,255,255],"on":true},{"color":[0,255,255],"on":true},{"color":[0,255,255],"on":true},{"color":[0,255,255],"on":true},{"color":[0,255,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[0,255,0],"on":true},{"color":[0,255,255],"on":true},{"color":[255,0,255],"on":true},{"color":[255,0,255],"on":true},{"color":[0,255,255],"on":true},{"color":[0,255,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[0,255,0],"on":true},{"color":[0,255,255],"on":true},{"color":[255,0,255],"on":true},{"color":[255,0,255],"on":true},{"color":[0,255,255],"on":true},{"color":[0,255,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[0,255,0],"on":true},{"color":[0,255,255],"on":true},{"color":[0,255,255],"on":true},{"color":[0,255,255],"on":true},{"color":[0,255,255],"on":true},{"color":[0,255,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[0,255,0],"on":true},{"color":[0,255,0],"on":true},{"color":[0,255,0],"on":true},{"color":[0,255,0],"on":true},{"color":[0,255,0],"on":true},{"color":[0,255,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true},{"color":[255,127,0],"on":true}],
            heart: [{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":false},{"color":[0,0,255],"on":false},{"color":[0,0,255],"on":false},{"color":[255,255,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":false},{"color":[0,0,255],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,255,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":false},{"color":[0,0,255],"on":false},{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":false},{"color":[0,0,255],"on":false},{"color":[0,0,255],"on":false}],
            smile: [{"color":[0,0,255],"on":false},{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[0,0,255],"on":false},{"color":[0,0,255],"on":false},{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":true},{"color":[0,0,255],"on":false},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[75,0,130],"on":true},{"color":[75,0,130],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[75,0,130],"on":true},{"color":[75,0,130],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":true},{"color":[0,0,255],"on":false},{"color":[0,0,255],"on":false},{"color":[0,0,255],"on":false},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[0,0,255],"on":false},{"color":[0,0,255],"on":false}],
            frown: [{"color":[0,0,255],"on":false},{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[0,0,255],"on":false},{"color":[0,0,255],"on":false},{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[75,0,130],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[0,0,255],"on":false},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[75,0,130],"on":true},{"color":[75,0,130],"on":true},{"color":[255,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[75,0,130],"on":true},{"color":[75,0,130],"on":true},{"color":[255,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[75,0,130],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[0,0,255],"on":false},{"color":[0,0,255],"on":false},{"color":[0,0,255],"on":false},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[0,0,255],"on":false},{"color":[0,0,255],"on":false}],
            wink: [{"color":[0,0,255],"on":false},{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[0,0,255],"on":false},{"color":[0,0,255],"on":false},{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":true},{"color":[0,0,255],"on":false},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[75,0,130],"on":true},{"color":[75,0,130],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[75,0,130],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[75,0,130],"on":true},{"color":[255,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":true},{"color":[0,0,255],"on":false},{"color":[0,0,255],"on":false},{"color":[0,0,255],"on":false},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[255,255,0],"on":true},{"color":[0,0,255],"on":false},{"color":[0,0,255],"on":false}],
            battleaxe: [{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,255,0],"on":false},{"color":[255,255,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,255,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[0,255,0],"on":true},{"color":[0,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[0,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[0,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,127,0],"on":false},{"color":[255,0,0],"on":true},{"color":[0,255,0],"on":true},{"color":[0,255,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[255,255,0],"on":false},{"color":[0,0,255],"on":false},{"color":[255,127,0],"on":false},{"color":[0,255,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":true},{"color":[255,0,0],"on":false},{"color":[75,0,130],"on":true},{"color":[0,0,255],"on":false},{"color":[0,0,255],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[0,255,0],"on":false},{"color":[255,0,0],"on":true},{"color":[255,255,0],"on":false},{"color":[255,0,0],"on":false},{"color":[75,0,130],"on":true},{"color":[0,0,255],"on":false},{"color":[75,0,130],"on":false},{"color":[255,127,0],"on":false},{"color":[255,127,0],"on":false},{"color":[75,0,130],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[255,0,0],"on":false},{"color":[75,0,130],"on":true}],
        }
    });

    Object.defineProperty(this, 'shapeNames', {
        enumerable: true,
        set: NOOP,
        get: function() {
            return Object.keys(this.shapes);
        },
    });

    /**
     * FONT-RELATED PROPERTIES
     */

    Object.defineProperty(this, 'hasFont', {
        enumerable: true,
        set: NOOP,
        get: function() {
            return !!Object.keys(_fontMap).length;
        },
    });

    Object.defineProperty(this, 'fonts', {
        enumerable: true,
        set: NOOP,
        get: function() {
            return Object.keys(_fontMap);
        },
    });

    Object.defineProperty(this, 'activeFont', {
        enumerable: true,
        get: function() {
            return _activeFont;
        },
        set: function(newFont) {
            if (!_fontMap[newFont])
            {
                var availableFontsList = Object.keys(_fontMap).length ?
                    Object.keys(_fontMap).join(', ') :
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

    Object.defineProperty(this, 'activeFontChars', {
        enumerable: true,
        set: NOOP,
        get: function() {
            return _fontMap[_activeFont];
        },
    });


    /**
     * These functions are attached inside of the original definition of the cube
     * because they need access to "private" variables: _fontMap, _shapeMap.
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
               this.activeFont = handle;   // ... use it.
           }
       }.bind(this));  // Use our "outside" this inside of the ajax success callback
    };

    this.unloadFont = function(handle) {
        /**
        * Unload a previously loaded font.
        */

       delete(_fontMap[handle]);

       if (!Object.keys(_fontMap).length)
       {   // if there aren't any more loaded fonts after unloading this one...
           _activeFont = null;    // ... we can't have an active font
       } else if (handle === _activeFont)
       {   // if we unloaded our current font, but have another available...
           _activeFont = Object.keys(_fontMap)[0]; // ... use it
       }
    };

}

Cube.prototype.getCharacterRender = function(char, desiredColor) {
    /**
     * Return a slice containing a character (char, a single character) in a
     * color (desiredColor, a string) for rendering to the cube. This function
     * does not draw to the cube; the output of this function needs to get to
     * cube.writeSlice() for rendering.
     */

    desiredColor = typeof desiredColor !== 'undefined' ? desiredColor : this.penColorRgb;
    var invalidRgbValueFn = function(val) {
        return val < 0 || val > 255;
    }

    if (!(desiredColor instanceof Array) ||
        desiredColor.length !== 3 ||
        desiredColor.some(invalidRgbValueFn))
    {
        console.error(
            'Invalid desired color: ', desiredColor,
            'Defaulted to this.penColor: ', this.penColorRgb
        );
        desiredColor = this.penColorRgb;
    }

    var charPixels = cube.activeFontChars[char];

    if (!charPixels)
    {
        return;
    }

    /**
     * If the character is defined in the font's character set, loop over
     * each pixel to apply the current penColor if the pixel is on.
     */
    return charPixels.map(function(originalCell) {
        return new Cell({
            row: originalCell.row,
            column: originalCell.column,
            depth: originalCell.depth,
            on: originalCell.on,
            color: desiredColor,
        });
    });
};

Cube.prototype.renderShape = function(shape) {
    /**
     * Draw a shape to the front face of the cube.
     */

    if (this.shapeNames.indexOf(shape) === -1)
    {
        console.error('Invalid shape. Known shapes: ' + this.shapeNames.join(', '));
        return;
    }

    cube.writeSlice(this.shapes[shape], this.writeFace, 0);
};

