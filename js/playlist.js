var Playlist = function(opts) {

    var playlist = this;

    var _cube = null;

    var _mode = 'through';
    var _face = 'front';
    var _direction = 'cw';
    var _loops = false;
    var _frequency = 125;   // ms between each "tick"
    var _spacing = 4;       // number of ticks between tile rendering before next appears

    var _tiles = [];        // which images to show
    var _tileStrip = [];    // all tiles concatenated
    var __duration = 0;

    var __playbackInterval = -1; // interval timers are actually just ints
    var __lastRenderedStrip = null;

    var __animationCursorDim1 = 0;
    var __animationCursorDim2 = 0;
    var __animationStartTime = 0;
    var __prevStripIdx = -1;

    var __columnReader = function(){};
    var __columnWriter = function(){};
    var __animator = function(){};

    /**
     * PRIVATE HELPERS
     */

    var __xzFaces = ['front', 'left', 'back', 'right'];
    var __xzFacesCursorsMap = {
        'front-cw': [7, 0],
        'front-ccw': [0, 0],
        'left-cw': [0, 0],
        'left-ccw': [7, 7],
        'back-cw': [0, 7],
        'back-ccw': [7, 7],
        'right-cw': [7, 7],
        'right-ccw': [7, 0],
    };

    var __c = new Cell({on: false, color: [0,0,0]});
    var __emptyStrip = [__c,__c,__c,__c,__c,__c,__c,__c];

    function __makeSpacingStrips(numStrips) {
        numStrips = typeof numStrips !== 'undefined' ? numStrips : _spacing;

        var strips = [];

        for (var i = 0; i < numStrips; i++)
        {
            strips.push(__emptyStrip.slice());
        }

        return strips;
    }

    function __updateTileStrip() {
        _tileStrip = _tiles.reduce(function(strips, tile) {
            return strips.concat(tile.getAsStrips()).concat(__makeSpacingStrips());
        }, []);
        __updateDuration();
    }

    function __updateDuration() {
        __duration = _tileStrip.length * _frequency; // update duration, used for _loops
    }

    function __updateAnimator() {
        if (_mode === 'across')
        {
            __animator = __animatorAcross;
        } else if (_mode === 'around')
        {
            __animator = __animatorAround;
        } else if (_mode === 'through')
        {
            __animator = __animatorThrough;
        }
    }

    function __updateAnimationCursorPosition() {
        if ((_mode !== 'across') && (_mode !== 'around'))
        {
            __animationCursorDim1 = 0;
            __animationCursorDim2 = 0;
            return;
        }

        var cursorMapKey = [_face, _direction].join('-');

        if (Object.keys(__xzFacesCursorsMap).indexOf(cursorMapKey) === -1)
        {
            console.error('Could not update animator cursor for current settings', _face, _direction);
            return;
        }

        var cursorSettings = __xzFacesCursorsMap[cursorMapKey];
        __animationCursorDim1 = cursorSettings[0];
        __animationCursorDim2 = cursorSettings[1];
    }

    function __updateAnimationColumnTouchers() {
        var __xzFaces = ['front', 'left', 'back', 'right'];
        if (__xzFaces.indexOf(_face) !== -1)
        {
            __columnReader = 'readXZCol';
            __columnWriter = 'writeXZCol';
        } else
        {
            console.error('Cannot set cursor touchers. Can only deal with xz faces now.');
        }
    };

    /**
     * PROPERTIES
     */
    Object.defineProperty(this, 'cube', {
        get: function() { return _cube; },
        set: function(newCube) {
            playlist.stop()
            _cube = newCube;
        }
    });

    Object.defineProperty(this, 'mode', {
        get: function() { return _mode; },
        set: function(newMode) {
            var validModes = ['through', 'across', 'around'];
            if (validModes.indexOf(newMode) === -1)
            {
                return;
            }

            _mode = newMode;

            __updateAnimator();
            __updateAnimationCursorPosition();
            __updateAnimationColumnTouchers();
        }
    });

    Object.defineProperty(this, 'face', {
        get: function() { return _face; },
        set: function(newFace) {
            var validFaces = ['front', 'back', 'top', 'bottom', 'left', 'right'];
            if (validFaces.indexOf(newFace) === -1)
            {
                return;
            }

            _face = newFace;

            __updateAnimationCursorPosition();
            __updateAnimationColumnTouchers();
        }
    });

    Object.defineProperty(this, 'direction', {
        get: function() { return _direction; },
        set: function(newDirection) {
            var validDirections = ['ccw', 'cw'];   // ccw: to the right, cw: to the left
            if (validDirections.indexOf(newDirection) === -1)
            {
                return;
            }

            var reverseStrips = newDirection !== _direction;
            _direction = newDirection;

            if (reverseStrips)
            {
                _tileStrip.reverse();
            }
            __updateAnimationCursorPosition();
            __updateAnimationColumnTouchers();
        }
    });

    Object.defineProperty(this, 'loops', {
        get: function() { return _loops; },
        set: function(shouldLoop) {
            _loops = !!shouldLoop;
        }
    });

    Object.defineProperty(this, 'frequency', {
        get: function() { return _frequency; },
        set: function(newFrequency) {
            var parsed = parseInt(newFrequency, 10);
            if (isNaN(parsed))
            {
                return;
            }

            _frequency = Math.max(0, parsed);   // must be int greater than 0
            __updateDuration();
        }
    });

    Object.defineProperty(this, 'spacing', {
        get: function() { return _spacing; },
        set: function(newSpacing) {
            var parsed = parseInt(newSpacing, 10);
            if (isNaN(parsed))
            {
                return;
            }

            _spacing = Math.max(0, parsed);   // must be int greater than 0
            __updateTileStrip();
        }
    });

    Object.defineProperty(this, 'isPlaying', {
        get: function() { return __animationStartTime !== 0; },
        set: function(shouldPlay) {
            if (!!shouldPlay)
            {
                playlist.play();
            } else
            {
                playlist.stop();
            }
        }
    });


    /**
     * PUBLIC METHODS
     */

        /**
         * CHANGE LIST OF TILES
         */

    this.getTiles = function() {
        return _tiles.slice();
    };

    this.getTile = function(index) {
        return _tiles[index];
    };

    this.moveTile = function(tile, newIndex) {
        var tileIndex = _tiles.indexOf(tile);
        if (tileIndex === -1)
        {
            return;
        }

        _tiles.splice(newIndex, 0, _tiles.splice(tileIndex, 1));

        __updateTileStrip();

        return this;
    };

    this.insertTile = function(newTile, index) {
        var tileIndex = _tiles.indexOf(newTile);
        if (tileIndex !== -1)
        {
            return this.moveTile(newTile, index);
        }

        _tiles.splice(index, 0, newTile);

        __updateTileStrip();

        return this;
    };

    this.appendTile = function(newTile) {
        _tiles.push(newTile);

        __updateTileStrip();

        return this;
    };

    this.replaceTile = function(index, tile) {
        _tiles.splice(index, 1, tile);

        __updateTileStrip();

        return this;
    };

    this.getTileStrip = function() {
        return _tileStrip;
    };


    /**
     * ANIMATION METHODS
     */

        /**
         * PLAYBACK HELPERS
         */

    function __getTileStripCursorAtMs(ms) {
        var tick = Math.floor((_loops ? (ms % __duration) : ms) / _frequency);
        var strip = tick > (_tileStrip.length - 1) ?
            __emptyStrip.slice() :
            _tileStrip[tick];
        return {
            idx: _tileStrip.indexOf(strip), // is actually same as tick, I think?
            strip: strip,
        };
    };

    function __getCursorColumnForAnimationAround() {
        if (_face === 'front')
        {
            return _direction === 'cw' ? [7, 0] : [0, 0];
        } else if (_face === 'left')
        {
            return _direction === 'cw' ? [0, 0] : [0, 7];
        } else if (_face === 'back')
        {
            return _direction === 'cw' ? [7, 0] : [7, 7];
        } else if (_face === 'right')
        {
            return _direction === 'cw' ? [7, 7] : [7, 0];
        }
    }

    function __getNextColumnForAnimationAround(dim1, dim2) {
        var nextDims = [dim1, dim2];  // nextDim1, nextDim2

        if (__xzFaces.indexOf(_face) !== -1)
        {
            if (_direction === 'cw')
            {   // x = dim1, z = dim2
                if ((dim1 === 0) && (dim2 === 0))   // front -> left corner
                {
                    nextDims[1] += 1;
                } else if ((dim1 === 0) && (dim2 === 7))    // left -> back corner
                {
                    nextDims[0] += 1;
                } else if ((dim1 === 7) && (dim2 === 7))   // back -> right corner
                {
                    nextDims[1] -= 1;
                } else if ((dim1 === 7) && (dim2 === 0))   // right -> front corner
                {
                    nextDims[0] -= 1;
                } else if (dim1 === 0)   // left edge (^)
                {
                    nextDims[1] += 1;
                } else if (dim1 === 7)   // right edge (v)
                {
                    nextDims[1] -= 1;
                } else if (dim2 === 0)   // front edge (<-)
                {
                    nextDims[0] -= 1;
                } else if (dim2 === 7)   // back edge (->)
                {
                    nextDims[0] += 1;
                }
            } else
            {   // _direction === 'ccw'; x = dim1, z = dim2
                if ((dim1 === 0) && (dim2 === 0))   // left -> front corner
                {
                    nextDims[0] += 1;
                } else if ((dim1 === 0) && (dim2 === 7))   // back -> left corner
                {
                    nextDims[1] -= 1;
                } else if ((dim1 === 7) && (dim2 === 7))   // right -> back corner
                {
                    nextDims[0] -= 1;
                } else if ((dim1 === 7) && (dim2 === 0))   // front -> right corner
                {
                    nextDims[1] += 1;
                } else if (dim1 === 0)   // left edge (v)
                {
                    nextDims[1] -= 1;
                } else if (dim1 === 7)   // right edge (^)
                {
                    nextDims[1] += 1;
                } else if (dim2 === 0)   // front edge (->)
                {
                    nextDims[0] += 1;
                } else if (dim2 === 7)   // back edge (<-)
                {
                    nextDims[0] -= 1;
                }
            }
        }

        return nextDims;
    }

    function __getCursorColumnForAnimationAcross() {
        return __getCursorColumnForAnimationAround();
    }

    function __stopIfShould(renderTime) {
        if (!_loops && (renderTime > __animationStartTime + __duration))
        {
            playlist.stop();
        }
    }

    function __rippleAcross() {
        if (_direction === 'cw')
        {
            for (var i = 0; i < 7; i++)
            {
                _cube[__columnWriter](i, 0, _cube[__columnReader](i + 1, 0));
            }
        } else
        {
            for (var i = 7; i > 0; i--)
            {
                _cube[__columnWriter](i, 0, _cube[__columnReader](i - 1, 0));
            }
        }
    }

    function __animatorAcross() {
        var renderTime = Date.now();
        var strip = __getTileStripCursorAtMs(renderTime - __animationStartTime);
        var stripIdx = strip.idx;
        var stripData = strip.strip;

        if ((stripIdx !== __prevStripIdx) && (stripIdx !== -1))
        {
            __rippleAcross();
            _cube[__columnWriter](__animationCursorDim1, __animationCursorDim2, stripData);
            __prevStripIdx = stripIdx;
        }

        __stopIfShould(renderTime);
    }

    function __rippleAround() {
        var start = __getCursorColumnForAnimationAround();
        var dirtyCols = [start];
        for (var i = 0; i < 27; i++)    // 7 * 4 = the perimeter
        {
            var lv = dirtyCols[dirtyCols.length - 1]; // lv: last value
            var nd = __getNextColumnForAnimationAround(lv[0], lv[1]); // nd: new dimensions
            dirtyCols.push(nd);
        }

        dirtyCols.reverse();

        for (var i = 0; i < 27; i++)
        {
            var srcDim1 = dirtyCols[i + 1][0];
            var srcDim2 = dirtyCols[i + 1][1];
            var data = _cube[__columnReader](srcDim1, srcDim2);

            var destDim1 = dirtyCols[i][0];
            var destDim2 = dirtyCols[i][1];

            _cube[__columnWriter](destDim1, destDim2, data);
        }
    }

    function __animatorAround() {
        var renderTime = Date.now();
        var strip = __getTileStripCursorAtMs(renderTime - __animationStartTime);
        var stripIdx = strip.idx;
        var stripData = strip.strip;

        if ((stripIdx !== __prevStripIdx) && (stripIdx !== -1))
        {
            __rippleAround();
            _cube[__columnWriter](__animationCursorDim1, __animationCursorDim2, stripData);
            __prevStripIdx = stripIdx;
        }

        __stopIfShould(renderTime);
    }

        /**
         * PLAYBACK METHODS
         */

    this.play = function() {
        if (!(_cube instanceof Cube))
        {
            console.error('Cannot play without a valid Cube assigned.', _cube);
            return;
        }

        clearInterval(__playbackInterval);
        __animationStartTime = Date.now();
        __playbackInterval = setInterval(__animator, 0);
    };

    this.stop = function() {
        clearInterval(__playbackInterval);
        __animationStartTime = 0;
    };

    return this;

};
