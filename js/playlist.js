var Playlist = function(opts) {

    var playlist = this;

    var NOOP = function() {};

    var _cube = null;

    var _containerEl = null;
    var __tileTrayEl = null;
    var __loopsCbEl = null;
    var __modeSelectorEl = null;
    var __directionSelectorEl = null;

    var _mode = 'through';
    var _face = 'front';
    var _direction = 'cw';
    var _loops = false;
    var _frequency = 125;   // ms between each "tick"
    var _spacing = 4;       // number of ticks between tile rendering before next appears
    var _focus = false;
    var _settingsChangeListener = NOOP;

    var _modes = ['through', 'across', 'around'];
    var _tiles = [];        // which images to show

    var __tileStrip = [];    // all tiles concatenated (for column-based animations)
    var __tilesWithSpacing = [];    // tiles but with empty tiles inserts between (for "through" animation)
    var __tileThumbs = [];
    var __tileHtmls = [];

    var __emptyTile = new EmptyTile();

    var __userCursorPosition = 0;
    var __userCursorEl = document.createElement('div');
    __userCursorEl.classList.add('cursor');
    var __userCursorHtml = getOuterHTML(__userCursorEl);

    var __duration = 0;

    var __playbackInterval = -1; // interval timers are actually just ints
    var __lastRenderedStrip = null;

    var __animationCursorDim1 = 0;
    var __animationCursorDim2 = 0;
    var __animationStartTime = 0;
    var __prevStripIdx = -1;    // used by across/around animations
    var __prevTileIdx = -1;     // used by through animations

    var __columnReader = '';
    var __columnWriter = '';
    var __animator = NOOP;

    var PLAYLIST_SETTINGS_CHANGE_NAME = 'playlistSettingsChange';

    /**
     * PRIVATE HELPERS
     */

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

    function __makeSpacingStrips(nStrips) {
        var numStrips = typeof nStrips !== 'undefined' ? nStrips : _spacing;

        var strips = [];

        for (var i = 0; i < numStrips; i++)
        {
            strips.push(__emptyStrip.slice());
        }

        return strips;
    }

    function __makeSpacingTiles(nTiles) {
        var numTiles = typeof nTiles !== 'undefined' ? nTiles : _spacing;

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
        }, [])
        __updateDuration();
    }

    function __updateTileStrip() {
        __tileStrip = _tiles.reduce(function(strips, tile) {
            return strips.concat(tile.getAsStrips()).concat(__makeSpacingStrips());
        }, []);
        __updateDuration();
    }

    function __updateDuration() {
        __duration = _mode === 'through' ?
            __tilesWithSpacing.length * _frequency :
            __tileStrip.length * _frequency; // update duration, used for _loops
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
        if (_mode === 'through')
        {
            return;
        }

        // mode is across / around
        if (__xzFaces.indexOf(_face) !== -1)
        {
            __columnReader = 'readXZCol';
            __columnWriter = 'writeXZCol';
        } else
        {
            console.error('Cannot set cursor touchers. Can only deal with xz faces now.', _mode);
        }
    };

    function __updateAnimationSettings() {
        __updateAnimator();
        __updateAnimationCursorPosition();
        __updateAnimationColumnTouchers();
    }

    function __updateTileHtmls() {
        __tileHtmls = _tiles.map(function(tile, idx) {
            return (
                '<div class="tile" data-idx="' + idx + '">' +
                    '<img src="' + __tileThumbs[idx] + '" />' +
                '</div>'
            );
        });
    }

    function __updateTileThumbs() {
        __tileThumbs = _tiles.map(function(tile, idx) {
            return tile.getPngData();
        });
    }

    function __renderTileContainer() {
        if (__tileTrayEl)
        {
            var frags = __tileHtmls.slice();
            frags.splice(__userCursorPosition, 0, __userCursorHtml);
            __tileTrayEl.innerHTML = frags.join('');
        } else
        {
            console.error('Playlist cannot render(): has no container.');
        }
    }

    function __updateForTileChange() {
        __updateTilesWithSpacing();
        __updateTileStrip();
        __updateTileThumbs();
        __updateTileHtmls();

        __renderTileContainer();
    }

    function __updateDirectionRadios() {
        var radioSelector = 'input[type="radio"][name="wrap-direction"]';
        var radiosElList = __directionSelectorEl.querySelectorAll(radioSelector)
        var radioElArray = Array.prototype.slice.apply(radiosElList);
        radioElArray.forEach(function(input) {
            // check or uncheck each of the radio buttons
            input.checked = (input.value == _direction);
        });
    }

    function __updateModeRadios() {
        var radioSelector = 'input[type="radio"][name="mode"]';
        var radiosElList = __modeSelectorEl.querySelectorAll(radioSelector)
        var radioElArray = Array.prototype.slice.apply(radiosElList);
        radioElArray.forEach(function(input) {
            // check or uncheck each of the radio buttons
            input.checked = (input.value == _mode);
        });
    }

    /**
     * PROPERTIES
     */
    Object.defineProperty(this, 'cube', {
        get: function() { return _cube; },
        set: function(newCube) {
            playlist.stop()

            var prevCube = _cube;
            _cube = newCube;

            document.dispatchEvent(new CustomEvent(PLAYLIST_SETTINGS_CHANGE_NAME, {
                detail: {
                    setting: 'cube',
                    newValue: _cube,
                    oldValue: prevCube,
                }
            }));
        }
    });

    Object.defineProperty(this, 'mode', {
        get: function() { return _mode; },
        set: function(newMode) {
            if (this.modes.indexOf(newMode) === -1)
            {
                return;
            }

            var prevMode = _mode;
            _mode = newMode;

            __updateAnimationSettings();

            if (_containerEl)
            {
                __updateModeRadios();
                __updateDirectionRadios();
                _containerEl.classList.toggle('show-direction-selector', (_mode !== 'through'));
            }

            document.dispatchEvent(new CustomEvent(PLAYLIST_SETTINGS_CHANGE_NAME, {
                detail: {
                    setting: 'mode',
                    newValue: _mode,
                    oldValue: prevMode,
                }
            }));
        }
    });

    Object.defineProperty(this, 'modes', {
        enumerable: true,
        writable: false,
        value: ['through', 'across', 'around'],
    });

    Object.defineProperty(this, 'supportedFaces', {
        enumerable: false,
        set: NOOP,
        get: function() {
            return {
                'through': __allFaces.slice(),
                'across': __xzFaces.slice(),
                'around': __xzFaces.slice(),
            }[_mode];
        }
    });

    Object.defineProperty(this, 'directions', {
        enumerable: true,
        writable: false,
        value: ['ccw', 'cw'],   // ccw: to the right, cw: to the left
    });

    Object.defineProperty(this, 'faces', {
        enumerable: true,
        set: NOOP,
        get: function() {
            if (_mode === 'through')
            {
                return __allFaces.slice();
            } else if ((_mode === 'across') || (_mode === 'around'))
            {
                return __xzFaces.slice();
            }
            return [];
        },
    });

    Object.defineProperty(this, 'face', {
        get: function() { return _face; },
        set: function(newFace) {
            if (this.faces.indexOf(newFace) === -1)
            {
                return;
            }

            var prevFace = _face;
            _face = newFace;

            __updateAnimationSettings();

            document.dispatchEvent(new CustomEvent(PLAYLIST_SETTINGS_CHANGE_NAME, {
                detail: {
                    setting: 'face',
                    newValue: _face,
                    oldValue: prevFace,
                }
            }));
        }
    });

    Object.defineProperty(this, 'direction', {
        get: function() { return _direction; },
        set: function(newDirection) {
            if (this.directions.indexOf(newDirection) === -1)
            {
                return;
            }

            var prevDirection = _direction;
            var reverseStrips = newDirection !== _direction;
            _direction = newDirection;

            if (reverseStrips)
            {
                __tileStrip.reverse();
            }

            __updateAnimationSettings();

            document.dispatchEvent(new CustomEvent(PLAYLIST_SETTINGS_CHANGE_NAME, {
                detail: {
                    setting: 'direction',
                    newValue: _direction,
                    oldValue: prevDirection,
                }
            }));
        }
    });

    Object.defineProperty(this, 'loops', {
        get: function() { return _loops; },
        set: function(shouldLoop) {
            var prevLoops = _loops;
            _loops = !!shouldLoop;

            if (_containerEl)
            {
                __loopsCbEl.checked = _loops;
            }

            document.dispatchEvent(new CustomEvent(PLAYLIST_SETTINGS_CHANGE_NAME, {
                detail: {
                    setting: 'loops',
                    newValue: _loops,
                    oldValue: prevLoops,
                }
            }));
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

            var prevFrequency = _frequency;
            _frequency = Math.max(0, parsed);   // must be int greater than 0
            __updateDuration();

            document.dispatchEvent(new CustomEvent(PLAYLIST_SETTINGS_CHANGE_NAME, {
                detail: {
                    setting: 'frequency',
                    newValue: _frequency,
                    oldValue: prevFrequency,
                }
            }));
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

            var prevSpacing = _spacing;
            _spacing = Math.max(0, parsed);   // must be int greater than 0
            __updateTilesWithSpacing();
            __updateTileStrip();

            document.dispatchEvent(new CustomEvent(PLAYLIST_SETTINGS_CHANGE_NAME, {
                detail: {
                    setting: 'spacing',
                    newValue: _spacing,
                    oldValue: prevSpacing,
                }
            }));
        }
    });

    Object.defineProperty(this, 'isPlaying', {
        get: function() { return __animationStartTime !== 0; },
        set: function(shouldPlay) {
            var prevPlaying = this.isPlaying;

            if (!!shouldPlay)
            {
                playlist.play();
            } else
            {
                playlist.stop();
            }

            document.dispatchEvent(new CustomEvent(PLAYLIST_SETTINGS_CHANGE_NAME, {
                detail: {
                    setting: 'isPlaying',
                    newValue: shouldPlay,
                    oldValue: prevPlaying,
                }
            }));
        }
    });

    Object.defineProperty(this, 'focus', {
        get: function() { return _focus; },
        set: function(inFocus) {
            var prevFocus = _focus;
            _focus = !!inFocus;

            if (_containerEl)
            {
                _containerEl.classList.toggle('focus', _focus);
                __renderTileContainer();
            }

            document.dispatchEvent(new CustomEvent(PLAYLIST_SETTINGS_CHANGE_NAME, {
                detail: {
                    setting: 'focus',
                    newValue: _focus,
                    oldValue: prevFocus,
                }
            }));
        }
    });

    function __resyncStateToDOM() {
        if (_containerEl)
        {
            playlist.mode = _mode;
            playlist.direction = _direction;
            playlist.loops = _loops;
            __renderTileContainer();
        }
    };

    function __kbKeydownListener(e) {
        var keyMap = {
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down',
            8: 'backspace',
        };

        if (Object.keys(keyMap).indexOf(e.keyCode.toString()) === -1)
        {
            return;
        } else if (_focus)
        {
            if (keyMap[e.keyCode] === 'backspace')
            {
                playlist.removeTile(playlist.getTile(--__userCursorPosition));
                e.stopPropagation();
                e.preventDefault();
                return;
            } else if (e.altKey && (keyMap[e.keyCode] === 'up'))
            {
                playlist.insertTile(new Tile(cube.readSlice()), __userCursorPosition++);
                return;
            }

            var directionNewValueMap = {
                'up': 0,
                'down': _tiles.length,
                'left': __userCursorPosition - 1,
                'right': __userCursorPosition + 1,
            };

            var newPosition = directionNewValueMap[keyMap[e.keyCode]];
            __userCursorPosition = Math.max(0, Math.min(_tiles.length, newPosition));
            __renderTileContainer();

            e.preventDefault();
            e.stopPropagation();
        }
    }

    function __bindContainerKeyboardListeners() {
        /**
         * Bind event listeners for typing to add to the playlist and to move
         * the cursor.
         */
        document.addEventListener('keydown', __kbKeydownListener);
    }

    function __unbindContainerKeyboardListeners() {
        /**
         * Remove all of the events bound in __bindContainerKeyboardListeners()
         */
        document.removeEventListener('keydown', __kbKeydownListener);
    }

    function __containerMouseClickListener(e) {
        playlist.focus = true;

        var closestTile = getClosest(e.target, '.tile');
        if (closestTile)
        {
            var tileClicked = playlist.getTile(closestTile.dataset.idx);
            cube.writeSlice(tileClicked.getCells());
            e.preventDefault();
            e.stopPropagation();
        }
    }

    function __documentMouseClickListener(e) {
        var closestTileTray = getClosest(e.target, __tileTrayEl);
        if (!closestTileTray)
        {
            playlist.focus = false;
        }
    }

    function __bindContainerMouseListeners() {
        /**
         * Bind event listeners for clicking and dragging to edit the playlist.
         */
        _containerEl.addEventListener('click', __containerMouseClickListener);
        document.addEventListener('click', __documentMouseClickListener);
    }

    function __unbindContainerMouseListeners() {
        /**
         * Remove all of the events bound in __bindContainerMouseListeners()
         */
        _containerEl.removeEventListener('click', __containerMouseClickListener);
        document.removeEventListener('click', __documentMouseClickListener);
    }

    function __containerChangeListener(e) {
        if ((e.target.nodeName === 'INPUT'))
        {
            if (e.target.name === 'loop')
            {
                playlist.loops = e.target.checked;
            } else if (e.target.name === 'mode')
            {
                playlist.mode = e.target.value;
            } else if (e.target.name === 'direction')
            {
                playlist.direction = e.target.value;
            }
        }
    }

    function __bindContainerChangeListeners() {
        /**
         * Bind event listeners for clicking and dragging to edit the playlist.
         */
        _containerEl.addEventListener('change', __containerChangeListener);
    }

    function __unbindContainerChangeListeners() {
        /**
         * Remove all of the events bound in __bindContainerChangeListeners()
         */
        _containerEl.removeEventListener('change', __containerChangeListener);
    }

    function __destroyPlaylistEl() {
        __unbindContainerMouseListeners();
        __unbindContainerChangeListeners();
        __unbindContainerKeyboardListeners();

        _containerEl = null;
        __tileTrayEl = null;
        __loopsCbEl = null;
        __modeSelectorEl = null;
        __directionSelectorEl = null;
    }

    function __buildModeSelectorHtml() {
        var modeOptionsHtml = playlist.modes.map(function(mode) {
            return (
                '<input id="mode-radio-' + mode + '" type="radio" name="mode" value="' + mode + '" />' +
                '<label for="mode-radio-' + mode + '" class="control-button radio-tab"><span>' + mode + '</span></label>'
            );
        }).join('');

        var directionOptionsHtml = playlist.directions.map(function(direction) {
            return (
                '<input id="direction-radio-' + direction + '" type="radio" name="wrap-direction" value="' + direction + '" />' +
                '<label for="direction-radio-' + direction + '" class="control-button radio-tab"><span>' + direction + '</span></label>'
            );
        }).join('');

        return (
            '<div class="mode-selector radio-tabs mini vertical">' +
                modeOptionsHtml +
            '</div>' +
            '<div class="direction-selector radio-tabs mini vertical">' +
                directionOptionsHtml +
            '</div>'
        );
    }

    function __buildPlaylistEl(newContainer) {
        if (_containerEl)
        {
            __destroyPlaylistEl();
        }

        var modeSelectorHtml = __buildModeSelectorHtml();

        _containerEl = newContainer;
        _containerEl.innerHTML = (
            '<div class="tile-tray"></div>' +
            modeSelectorHtml +
            '<label class="loop-cb">' +
                '<input type="checkbox" name="loop">' +
                '<span><i class="fa fa-refresh"></i></span>' +
            '</label>'
        );

        __tileTrayEl = _containerEl.querySelector('.tile-tray');
        __loopsCbEl = _containerEl.querySelector('input[name="loop"]');
        __modeSelectorEl = _containerEl.querySelector('.mode-selector');
        __directionSelectorEl = _containerEl.querySelector('.direction-selector');

        __bindContainerMouseListeners();
        __bindContainerChangeListeners();
        __bindContainerKeyboardListeners();

        __resyncStateToDOM();
    }

    Object.defineProperty(this, 'container', {
        get: function() { return _containerEl; },
        set: function(newContainer) {
            if ((newContainer instanceof HTMLElement) &&
                (newContainer !== _containerEl))
            {
                __buildPlaylistEl(newContainer);
                this.mode = _mode;
                this.direction = _direction;
            } else if ((newContainer === null) ||
                (typeof newContainer === 'undefined'))
            {
                if (_containerEl)
                {
                    __destroyPlaylistEl();
                }
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


    /**
     * ANIMATION METHODS
     */

        /**
         * PLAYBACK HELPERS
         */

    function __getTileAtMs(ms) {
        var localTime = _loops ? (ms % __duration) : ms;
        var tick = Math.floor(localTime / _frequency);
        var tile = tick > (__tilesWithSpacing.length - 1) ?
            __emptyTile :
            __tilesWithSpacing[tick];
        return {
            idx: tick,
            tile: tile,
        };
    };

    function __getTileStripCursorAtMs(ms) {
        var localTime = (_loops ? (ms % __duration) : ms);
        var tick = Math.floor(localTime / _frequency);
        var strip = tick > (__tileStrip.length - 1) ?
            __emptyStrip.slice() :
            __tileStrip[tick];
        return {
            idx: __tileStrip.indexOf(strip), // is actually same as tick, I think?
            strip: strip,
        };
    };

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
        if (__xzFaces.indexOf(_face) !== -1)
        {
            if (_direction === 'cw')
            {   // x = dim1, z = dim2
                return __nextCCXZFaceCw(dim1, dim2);
            } else
            {   // _direction === 'ccw'; x = dim1, z = dim2
                return __nextCCXZFaceCcw(dim1, dim2);
            }
        }

        return nextDims;
    }

    function __stopIfShould(renderTime) {
        if (!_loops && (renderTime > __animationStartTime + __duration))
        {
            playlist.stop();
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
            var data = _cube[__columnReader](srcDim1, srcDim2);

            var destDim1 = dirtyCols[i][0];
            var destDim2 = dirtyCols[i][1];

            _cube[__columnWriter](destDim1, destDim2, data);
        }
    }

    function __animatorPropigateColumns(numColumns) {
        var renderTime = Date.now();
        var strip = __getTileStripCursorAtMs(renderTime - __animationStartTime);
        var stripIdx = strip.idx;
        var stripData = strip.strip;

        if ((stripIdx !== __prevStripIdx) && (stripIdx !== -1))
        {
            __propigateColumns(numColumns);
            _cube[__columnWriter](__animationCursorDim1, __animationCursorDim2, stripData);
            __prevStripIdx = stripIdx;
        }

        __stopIfShould(renderTime);
    }

    function __animatorAcross() {
        __animatorPropigateColumns(7);
    }

    function __animatorAround() {
        __animatorPropigateColumns(27);
    }

    function __animatorThrough() {
        var renderTime = Date.now();
        var tile = __getTileAtMs(renderTime - __animationStartTime);
        var tileIdx = tile.idx;
        var tileData = tile.tile;

        if ((tileIdx !== __prevTileIdx) && (tileIdx !== -1))
        {
            // !TODO: desperate need of refactor
            _cube.playbackOptions.action = 'slide';
            _cube.playbackOptions.direction = __throughFaceDirectionMap[_face];
            _cube.animationCb();
            _cube.writeSlice(tileData.getCells(), _face, 0);
            __prevTileIdx = tileIdx;
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

    this.applyOptions = function(newOpts) {
        if (!(newOpts instanceof Object))
        {
            throw 'TypeError: Playlist options must be object';
        }

        var opts = Object.keys(newOpts);
        for (var i = 0, numOpts = opts.length; i < numOpts; i++)
        {
            var key = opts[i];
            if (this.hasOwnProperty(key))
            {
                this[key] = newOpts[key];
            } else
            {
                console.error('Invalid option for Playlist:' + key);
            }
        }

        return this;
    };

    this.applyOptions(opts);

    return this;

};
