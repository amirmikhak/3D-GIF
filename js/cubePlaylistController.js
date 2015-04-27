var CubePlaylistController = function CubePlaylistController(opts) {

    CubeController.apply(this, arguments);

    var cubePlaylistController = this;

    var __combinedDefaultOptions = {};
    var __parentDefaultOptions = this.getDefaultOptions();
    var __parentOptionKeys = Object.keys(__parentDefaultOptions);
    for (var i = 0, numOpts = __parentOptionKeys.length; i < numOpts; i++) {
        __combinedDefaultOptions[__parentOptionKeys[i]] = __parentDefaultOptions[__parentOptionKeys[i]];
    }

    var __myDefaultOptions = {
        mode: 'through',
        writeFace: 'front',
        wrapDirection: 'cw',
        loops: true,
        spacing: 2,       // number of ticks between tile rendering before next appears
        frameCacheSize: 0,
    };
    var __myOptionKeys = Object.keys(__myDefaultOptions);
    for (var i = 0, numOpts = __myOptionKeys.length; i < numOpts; i++) {
        __combinedDefaultOptions[__myOptionKeys[i]] = __myDefaultOptions[__myOptionKeys[i]];
    }

    var _opts = opts || {};
    var _options = {};
    var __optionKeys = Object.keys(__combinedDefaultOptions);
    for (var i = 0, numOpts = __optionKeys.length; i < numOpts; i++) {
        _options[__optionKeys[i]] = (__optionKeys[i] in _opts) ?
            _opts[__optionKeys[i]] :
            __combinedDefaultOptions[__optionKeys[i]];
    }

    var _mouseListeningCells = [];

    var _tiles = [];        // which images to show

    var __tileStrip = [];    // all tiles concatenated (for column-based animations)
    var __tilesWithSpacing = [];    // tiles but with empty tiles inserts between (for "through" animation)
    var __tileThumbs = [];

    var __emptyTile = new EmptyCubeTile();

    var _duration = 0;

    var __lastRenderedStrip = null;

    var __animationCursorDim1 = 0;
    var __animationCursorDim2 = 0;
    var __prevStripIdx = -1;    // used by across/around animations
    var __prevTileIdx = -1;     // used by through animations

    var __columnReader = '';
    var __columnWriter = '';
    var _animator = function() {};

    var _generatedAnimationFrames = [];

    var PLAYLIST_SETTINGS_CHANGE_NAME = 'playlistSettingsChange';

    var __throughFaceDirectionMap = {
        'front': 'back',
        'left': 'right',
        'back': 'forward',
        'right': 'left',
        'top': 'down',
        'bottom': 'up',
    };

    var __allFaces = ['front', 'left', 'back', 'right', 'top', 'bottom'];

    var __xzFaces = ['front', 'left', 'back', 'right'];
    var __xzFacesCursorsMap = {
        'front-cw': [7, 0],
        'front-ccw': [0, 0],
        'left-cw': [0, 0],
        'left-ccw': [0, 7],
        'back-cw': [0, 7],
        'back-ccw': [7, 7],
        'right-cw': [7, 7],
        'right-ccw': [7, 0],
    };

    var __c = new Cell({on: false, color: [0,0,0]});
    var __emptyStrip = [__c,__c,__c,__c,__c,__c,__c,__c];

    function __updateMouseListeningCells() {
        _mouseListeningCells = [];

        if (!this.cube) {
            return;
        }

        for (var i = 0, numCells = this.cube.cells.length; i < numCells; i++)
        {
            var cell = this.cube.cells[i];

            var shouldBeInteractive = {
                front: (cell.depth === 0),
                left: (cell.column === 0),
                back: (cell.depth === 7),
                right: (cell.column === 7),
                top: (cell.row === 0),
                bottom: (cell.row === 7),
            }[_options['writeFace']];

            if (shouldBeInteractive)
            {
                _mouseListeningCells.push(cell.coordAsString);
            }
        }
    }

    function __makeSpacingStrips(nStrips) {
        var numStrips = typeof nStrips !== 'undefined' ? nStrips : _options['spacing'];

        var strips = [];

        for (var i = 0; i < numStrips; i++)
        {
            strips.push(__emptyStrip.slice());
        }

        return strips;
    }

    function __makeSpacingTiles(nTiles) {
        var numTiles = typeof nTiles !== 'undefined' ? nTiles : _options['spacing'];

        var tiles = [];

        for (var i = 0; i < numTiles; i++)
        {
            tiles.push(__emptyTile);
        }

        return tiles;
    }

    function __updateTilesWithSpacing() {
        __tilesWithSpacing = _tiles.reduce(function(tilesWithSpacing, tile) {
            return tilesWithSpacing.concat([tile].concat(__makeSpacingTiles()));
        }, []);
        __updateDuration();
    }

    function __updateTileStrip() {
        __tileStrip = _tiles.reduce(function(strips, tile) {
            return strips.concat(tile.getAsStrips()).concat(__makeSpacingStrips());
        }, []);
        __updateDuration();
    }

    function __updateDuration() {
        _duration = _options['mode'] === 'through' ?
            __tilesWithSpacing.length * cubePlaylistController.animationInterval :
            __tileStrip.length * cubePlaylistController.animationInterval // update duration, used for _options['loops']
    }

    function __updateAnimator() {
        _animator = {
            'across': __animatorAcross,
            'around': __animatorAround,
            'through': __animatorThrough,
        }[_options['mode']];
    }

    function __updateAnimationCursorPosition() {
        if ((_options['mode'] !== 'across') && (_options['mode'] !== 'around'))
        {
            __animationCursorDim1 = 0;
            __animationCursorDim2 = 0;
            return;
        }

        var cursorMapKey = [_options['writeFace'], _options['wrapDirection']].join('-');

        if (Object.keys(__xzFacesCursorsMap).indexOf(cursorMapKey) === -1)
        {
            console.error('Could not update animator cursor for current settings', _options['writeFace'], _options['wrapDirection']);
            return;
        }

        var cursorSettings = __xzFacesCursorsMap[cursorMapKey];
        __animationCursorDim1 = cursorSettings[0];
        __animationCursorDim2 = cursorSettings[1];
    }

    function __updateAnimationColumnTouchers() {
        if (_options['mode'] === 'through')
        {
            return;
        }

        // mode is across / around
        if (__xzFaces.indexOf(_options['writeFace']) !== -1)
        {
            __columnReader = 'readXZCol';
            __columnWriter = 'writeXZCol';
        } else
        {
            console.error('Cannot set cursor touchers. Can only deal with xz faces now.', _options['mode']);
        }
    };

    function __updateAnimationSettings() {
        __updateDuration();
        __updateAnimator();
        __updateAnimationCursorPosition();
        __updateAnimationColumnTouchers();

        if (cubePlaylistController.playing)
        {
            cubePlaylistController.stop();
            cubePlaylistController.play();
        }
    }

    function __updateTileThumbs() {
        __tileThumbs = _tiles.map(function(tile, idx) {
            return tile.getPngData();
        });
    }

    function __updateForTileChange() {
        __updateTilesWithSpacing();
        __updateTileStrip();
        __updateTileThumbs();
        __generateAnimationFrames();
    }

    function __generateAnimationFrames() {
        var numFramesToGenerate = {
            'across': __tileStrip.length,
            'around': __tileStrip.length,
            'through': __tilesWithSpacing.length,
        }[_options['mode']];

        var ctrl = cubePlaylistController;
        for (var i = 0; i < numFramesToGenerate; i++)
        {
            ctrl.animator();
            _generatedAnimationFrames.push({
                cube: ctrl.cube.getForAnimationFrame(),
                start: i * ctrl.animationInterval,
                end: (i * ctrl.animationInterval) + ctrl.animationInterval,
            });
        }
    }

    /**
     * ANIMATION METHODS
     */

        /**
         * PLAYBACK HELPERS
         */

    function __getSelfTickingTile() {
        var numTiles = __tilesWithSpacing.length;
        var tileIndexToReturn = __prevTileIdx + 1;
        if (cubePlaylistController.loops) {
            tileIndexToReturn = tileIndexToReturn % (numTiles - 1);
        } else
        {
            tileIndexToReturn = Math.min(tileIndexToReturn, numTiles - 1);
        }

        var retValue = {
            prevIndex: __prevTileIdx,
            idx: tileIndexToReturn,
            tile: __tilesWithSpacing[tileIndexToReturn],
        };

        __prevTileIdx = tileIndexToReturn;
        return retValue;
    }

    function __getSelfTickingTileStripCursor() {
        var numTileStrips = __tileStrip.length;
        var tileStripIndexToReturn = __prevStripIdx + 1;
        if (cubePlaylistController.loops) {
            tileStripIndexToReturn = tileStripIndexToReturn % (numTileStrips - 1);
        } else
        {
            tileStripIndexToReturn = Math.min(tileStripIndexToReturn, numTileStrips - 1);
        }

        var retValue = {
            prevIndex: __prevStripIdx,
            idx: tileStripIndexToReturn,
            strip: __tileStrip[tileStripIndexToReturn],
        };

        __prevStripIdx = tileStripIndexToReturn;
        return retValue;
    }

    function __getCursorColumn() {
        return [__animationCursorDim1, __animationCursorDim2];
    }

    function __nextCCXZFaceCw(dim1, dim2) {
        var nextDims = [dim1, dim2];  // nextDim1, nextDim2

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

        return nextDims;
    }

    function __nextCCXZFaceCcw(dim1, dim2) {
        var nextDims = [dim1, dim2];  // nextDim1, nextDim2

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

        return nextDims;
    }

    function __getNextCursorColumn(dim1, dim2) {
        if (__xzFaces.indexOf(_options['writeFace']) !== -1)
        {
            if (_options['wrapDirection'] === 'cw')
            {   // x = dim1, z = dim2
                return __nextCCXZFaceCw(dim1, dim2);
            } else
            {   // _options['wrapDirection'] === 'ccw'; x = dim1, z = dim2
                return __nextCCXZFaceCcw(dim1, dim2);
            }
        }
    }

    function __stopIfShould() {
        if (!_options['loops'] &&
            (this.lastRenderedTime > this.animationStartTime + _duration))
        {
            cubePlaylistController.playing = false;
        }
    }

    function __propigateColumns(numColumns) {
        var start = __getCursorColumn();
        var dirtyCols = [start];
        for (var i = 0; i < numColumns; i++)
        {
            var lv = dirtyCols[dirtyCols.length - 1]; // lv: last value
            var nd = __getNextCursorColumn(lv[0], lv[1]); // nd: new dimensions
            dirtyCols.push(nd);
        }

        dirtyCols.reverse();

        for (var i = 0; i < numColumns; i++)
        {
            var srcDim1 = dirtyCols[i + 1][0];
            var srcDim2 = dirtyCols[i + 1][1];
            var data = this.cube[__columnReader](srcDim1, srcDim2);

            var destDim1 = dirtyCols[i][0];
            var destDim2 = dirtyCols[i][1];

            this.cube[__columnWriter](destDim1, destDim2, data);
        }
    }

    function __animatorPropigateColumns(numColumns) {
        var strip = __getSelfTickingTileStripCursor();
        var stripIdx = strip.idx;
        var stripData = strip.strip;
        __propigateColumns(numColumns);
        this.cube[__columnWriter](__animationCursorDim1, __animationCursorDim2, stripData);
    }

    function __animatorAcross() {
        __animatorPropigateColumns(7);
    }

    function __animatorAround() {
        __animatorPropigateColumns(27);
    }

    function __animatorThrough() {
        var tile = __getSelfTickingTile();
        var tileIdx = tile.idx;
        var tileData = tile.tile;
        // animate current contents through the cube
        CubeRealtimeUserController.prototype.getAnimationCb.call({
            cube: this.cube,
            stepSize: 1,
            wrap: false,
            action: 'slide',
            direction: __throughFaceDirectionMap[_options['writeFace']],
        })();
        // write the newest tile
        this.cube.writeSlice(tileData, _options['writeFace'], 0);
    }


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

        __updateForTileChange();

        return this;
    };

    this.insertTile = function(newTile, index) {
        var tileIndex = _tiles.indexOf(newTile);
        if (tileIndex !== -1)
        {
            return this.moveTile(newTile, index);
        }

        _tiles.splice(index, 0, newTile);

        __updateForTileChange();

        return this;
    };

    this.insertTileAtAndMoveCursor = function(newTile)
    {
        return this.insertTile(newTile, __userCursorPosition++);
    }

    this.appendTile = function(newTile) {
        _tiles.push(newTile);

        __updateForTileChange();

        return this;
    };

    this.removeTile = function(tile) {
        _tiles.splice(_tiles.indexOf(tile), 1);

        __updateForTileChange();

        return this;
    };

    this.replaceTile = function(index, tile) {
        _tiles.splice(index, 1, tile);

        __updateForTileChange();

        return this;
    };

    this.getTileStrip = function() {
        return __tileStrip.slice();
    };

    this.getTilesWithSpacing = function() {
        return __tilesWithSpacing.slice();
    };

    this.getEmptyTile = function() {
        return __emptyTile;
    };


    /**
     * CONTROLLER PROPERTIES
     */

    Object.defineProperty(this, 'generatedAnimationFrames', {
        get: function() { return _generatedAnimationFrames.slice(); },
    });

    Object.defineProperty(this, 'duration', {
        get: function() { return _duration; }
    });

    Object.defineProperty(this, 'animator', {
        get: function() { return _animator; },
    });

    Object.defineProperty(this, 'modes', {
        writable: false,
        value: ['through', 'across', 'around'],
    });

    Object.defineProperty(this, 'wrapDirections', {
        writable: false,
        value: ['ccw', 'cw'],   // ccw: to the right, cw: to the left
    });

    Object.defineProperty(this, 'supportedFaces', {
        writable: false,
        value: {
            'through': __allFaces.slice(),
            'across': __xzFaces.slice(),
            'around': __xzFaces.slice(),
        }
    });

    Object.defineProperty(this, 'currentSupportedFaces', {
        get: function() { return this.supportedFaces[_options['mode']]; }
    });

    Object.defineProperty(this, 'faces', {
        get: function() {
            if (_options['mode'] === 'through')
            {
                return __allFaces.slice();
            } else if ((_options['mode'] === 'across') || (_options['mode'] === 'around'))
            {
                return __xzFaces.slice();
            }
            return [];
        },
    });

    Object.defineProperty(this, 'mode', {
        get: function() { return _options['mode']; },
        set: function(newMode) {
            if (this.modes.indexOf(newMode) === -1)
            {
                console.error('Invalid mode for CubePlaylistController', newMode);
                throw 'Invalid mode';
            }

            if (this.supportedFaces[newMode].indexOf(_options['writeFace']) === -1)
            {
                this.writeFace = _options['writeFace'] = this.supportedFaces[newMode][0];
            }

            var prevMode = _options['mode'];
            _options['mode'] = newMode;

            __updateAnimationSettings();

            this.emit(PLAYLIST_SETTINGS_CHANGE_NAME, {
                setting: 'mode',
                newValue: _options['mode'],
                oldValue: prevMode,
            });
        }
    });

    Object.defineProperty(this, 'getRenderFrame', {
        writable: false,
        value: function getRenderFrame(renderTime) {
            var localRenderTime = _options['loops'] ? (renderTime % _duration) : renderTime;
            var currFrame = cubePlaylistController.currentAnimationFrame;
            if (!currFrame)
            {
                console.log('emptyCube');
                return cubePlaylistController.getEmptyCube();
            } else if (localRenderTime < currFrame.start)
            {
                // console.log('before valid frame', localRenderTime, currFrame.start);
                return cubePlaylistController.getEmptyCube();
            } else if ((localRenderTime >= currFrame.start) && (localRenderTime <= currFrame.end))
            {
                console.log('ret popped frame');
                return cubePlaylistController.popCurrentAnimationFrame().data;
            } else if (localRenderTime > currFrame.end)
            {
                // console.log('recurse', localRenderTime, currFrame.end);
                cubePlaylistController.popCurrentAnimationFrame();
                return cubePlaylistController.getRenderFrame(localRenderTime);
            } else
            {
                console.log('else', localRenderTime, currFrame.start, currFrame.end, currFrame);
            }
        },
    });

    Object.defineProperty(this, 'writeFace', {
        get: function() { return _options['writeFace']; },
        set: function(newWriteFace) {
            if (this.faces.indexOf(newWriteFace) === -1)
            {
                console.error('Invalid write face for CubePlaylistController', newWriteFace);
                throw 'Invalid write face';
            }

            var prevFace = _options['writeFace'];
            _options['writeFace'] = newWriteFace;

            __updateAnimationSettings();
            __updateMouseListeningCells();

            this.emit(PLAYLIST_SETTINGS_CHANGE_NAME, {
                setting: 'writeFace',
                newValue: _options['writeFace'],
                oldValue: prevFace,
            });
        }
    });

    Object.defineProperty(this, 'wrapDirection', {
        get: function() { return _options['wrapDirection']; },
        set: function(newWrapDirection) {
            if (this.wrapDirections.indexOf(newWrapDirection) === -1)
            {
                console.error('Invalid wrap direction: ' + newWrapDirection + '. ' +
                    'Valid wrap directions: ' + this.wrapDirections);
                throw 'Invalid wrap direction';
            }

            var prevWrapDirection = _options['wrapDirection'];
            _options['wrapDirection'] = newWrapDirection;

            if (_options['wrapDirection'] !== prevWrapDirection)
            {
                __tileStrip.reverse();
            }

            __updateAnimationSettings();

            this.emit(PLAYLIST_SETTINGS_CHANGE_NAME, {
                setting: 'wrapDirection',
                newValue: _options['wrapDirection'],
                oldValue: prevWrapDirection,
            });
        }
    });

    Object.defineProperty(this, 'loops', {
        get: function() { return _options['loops']; },
        set: function(shouldLoop) {
            var prevLoops = _options['loops'];
            _options['loops'] = !!shouldLoop;

            this.emit(PLAYLIST_SETTINGS_CHANGE_NAME, {
                setting: 'loops',
                newValue: _options['loops'],
                oldValue: prevLoops,
            });
        }
    });

    Object.defineProperty(this, 'spacing', {
        get: function() { return _options['spacing']; },
        set: function(newSpacing) {
            var parsed = parseInt(newSpacing, 10);
            if (isNaN(parsed))
            {
                return;
            }

            var prevSpacing = _options['spacing'];
            _options['spacing'] = Math.max(0, parsed);   // must be int greater than 0
            __updateTilesWithSpacing();
            __updateTileStrip();

            this.emit(PLAYLIST_SETTINGS_CHANGE_NAME, {
                setting: 'spacing',
                newValue: _options['spacing'],
                oldValue: prevSpacing,
            });
        }
    });

    Object.defineProperty(this, 'mouseListeningCells', {
        get: function() { return _mouseListeningCells; },
    });

    Object.defineProperty(this, 'direction', {
        get: function() { return _options['direction']; },
        set: function(newDirection) {
            if (this.directions.indexOf(newDirection) === -1)
            {
                console.error('Invalid direction for CubePlaylistController', newDirection);
                throw 'Invalid direction';
            }

            var prevDirection = _options['direction'];
            _options['direction'] = newDirection;

            this.emit('propertyChanged', {
                setting: 'direction',
                newValue: _options['direction'],
                oldValue: prevDirection,
            });
        },
    });

    this.getDefaultOptions = function() {
        return __combinedDefaultOptions;
    };

    this.on('propertyChanged', function(changeData) {
        if (changeData.setting === 'animationInterval')
        {
            __updateDuration();
        }
    });

    applyOptions.call(this, _options);

    return this;

};

CubePlaylistController.prototype = Object.create(CubeController.prototype);
CubePlaylistController.prototype.constructor = CubePlaylistController;

CubePlaylistController.prototype.step = function(numSteps) {
    /**
     * Performs a single step of the current animation. If the number of steps
     * is negative, we take the number of steps in the "opposite" direction for
     * the current animation settings.
     */

    var DEFAULT_NUM_STEPS = 1;
    _numSteps = Math.max(0, (typeof numSteps !== 'undefined' ?
        (parseInt(numSteps, 10) || DEFAULT_NUM_STEPS) :
        DEFAULT_NUM_STEPS));

    for (var i = 0; i < _numSteps; i++)
    {
        this.animator();
    }

    return this;
};

CubePlaylistController.prototype.update = function(frameValidStart, frameValidEnd) {
    // console.log('CubePlaylistController.update()');
    if (!this.currentAnimationFrame)
    {
        var numFrames = this.generatedAnimationFrames.length;
        if (numFrames === 0)
        {
            this.addAnimationFrame(this.getEmptyCube(), 0, this.animationInterval);
        } else
        {
            for (var i = 0; i < numFrames; i++)
            {
                var frame = this.generatedAnimationFrames[i];
                this.addAnimationFrame(frame.cube, frame.start, frame.end);
            }
        }
    }
    return this;
};
