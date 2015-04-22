{
    var defaultPlaybackOptions = {
        delay: 100,
        action: 'slide',
        direction: 'back',
        stepSize: 1,
        wrap: false,
    };

    var defaultKeyListenerOptions = {
        keys: 'all',                // values: alpha, num, alphanum, symbols, all
        // letterColor: [0, 0, 255],   // NOT IMPLEMENTED: color of letter pixels on generated frame: rgb array
        // backgroundColor: [0, 0, 0], // NOT IMPLEMENTED: color of non-leter pixels on generated frame: rgb array
        // startFace: 'front',         // NOT IMPLEMENTED: values: front, back, left, right, bottom, top
        // endFace: 'back',            // NOT IMPLEMENTED: values: front, back, left, right, bottom, top
        animate: false,             // animate from frontFace to backFace: boolean
        animateRate: 125,           // delay between each playback frame (only applies if animate is true)
        stepSize: 1,                // number of steps for each animation (only applies if animate is true)
    };

    var _playbackOptions = _.extend({}, defaultPlaybackOptions);
    var _keyListenerOptions = _.extend({}, defaultKeyListenerOptions);

    var __validPlaybackModes = ['real-time', 'playlist'];
    var _playbackMode = __validPlaybackModes[0];

    var _playlist = new Playlist({
        cube: this,
        mode: 'through',
        wrapDirection: 'cw',
        face: 'front',
        frequency: 100,
        spacing: 6,
        loops: true,
    });

    var _isPlaying = false;
    var _penColor = 'blue';
    var _writeFace = 'front';

    document.addEventListener('playlistSettingsChange', __playlistSettingsChangeListener);

    function __playlistSettingsChangeListener(data) {
        if (_playbackMode !== 'playlist')
        {
            return;
        }

        if (data.detail.setting === 'mode')
        {
            cube.writeFace = _playlist.face;    // update the DOM
        } else if (data.detail.setting === 'isPlaying')
        {
            if (!data.detail.newValue)
            {
                cube.isPlaying = false;
            }
        }
    }

    Object.defineProperty(this, 'playlist', {
        enumerable: false,
        set: NOOP,
        get: function() { return _playlist; },
    });

    Object.defineProperty(this, 'playbackMode', {
        enumerable: true,
        get: function() { return _playbackMode; },
        set: function(newMode) {
            if (__validPlaybackModes.indexOf(newMode) === -1)
            {
                console.error('Invalid playbackMode: ' + newMode + '. ' +
                    'Valid modes: ' + __validPlaybackModes.join(', '));
                return;
            }

            var prevPlaybackMode = _playbackMode;
            _playbackMode = newMode;

            _html.dispatchEvent(new CustomEvent('propertyChanged', {
                detail: {
                    setting: 'playbackMode',
                    newValue: _playbackMode,
                    oldValue: prevPlaybackMode,
                }
            }));
        }
    });

    Object.defineProperty(this, 'nextPlaybackMode', {
        enumerable: true,
        set: NOOP,
        get: function() {
            var currModeIndex = __validPlaybackModes.indexOf(_playbackMode);
            var numModes = __validPlaybackModes.length;
            return __validPlaybackModes[(currModeIndex + 1) % numModes];
        }
    });

    Object.defineProperty(this, 'playbackOptions', {
        /**
         * Property that is referenced to determine the correct animation callbacks
         * to generate the next frame.
         */
        enumerable: true,
        get: function() { return _playbackOptions; },
        set: function(newOptions) {
            var resumePlayingAfterChange = _isPlaying;

            cube.pause();

            /**
             * Verify that the new direction, if present, is valid.
             */
            if (newOptions.direction &&
                this.directions.indexOf(newOptions.direction) !== -1)
            {
                /**
                 * If there are playback controls that are rendered, we want to keep
                 * them in sync with our internal state.
                 */
                if (this.realtimeControls)
                {
                    var radioSelector = 'input[type="radio"][name="direction"]';
                    var radiosElList = this.realtimeControls.querySelectorAll(radioSelector)
                    var radioElArray = Array.prototype.slice.apply(radiosElList);
                    radioElArray.forEach(function(input) {
                        // check or uncheck each of the radio buttons
                        input.checked = (input.value == newOptions.direction);
                    });
                }
            } else
            {
                /**
                 * Delete the invalid property on the new settings to prevent
                 * it from being applied.
                 */
                delete(newOptions.direction);
            }

            /**
             * Actually apply the new settings.
             */
            _.extend(_playbackOptions, newOptions);

            if (resumePlayingAfterChange)
            {
                cube.play();
            }
        }
    });

    Object.defineProperty(this, 'keyListenerOptions', {
        /**
         * Property that defines which keystrokes are listened for and sent to
         * the cube, and which playback settings to use for keyboard-generated
         * images. Custom keyboard playback settings only apply if the animate
         * option is true).
         */
        enumerable: true,
        get: function() {
            return _keyListenerOptions;
        },
        set: function(newOptions) {
            _.extend(_keyListenerOptions, newOptions);
        }
    });

    Object.defineProperty(this, 'animationSteps', {
        /**
         * Read-only dictionary of some of the atomic changes that can be made to
         * the cube for an animation.
         */
        writable: false,
        enumerable: false,
        value: {
            shiftX: function() {
                cube.shiftPlane(
                    'X',
                    cube.playbackOptions.stepSize,
                    cube.playbackOptions.wrap
                );
            },
            unshiftX: function() {
                cube.shiftPlane(
                    'X',
                    -1 * cube.playbackOptions.stepSize,
                    cube.playbackOptions.wrap
                );
            },
            shiftY: function() {
                cube.shiftPlane(
                    'Y',
                    cube.playbackOptions.stepSize,
                    cube.playbackOptions.wrap
                );
            },
            unshiftY: function() {
                cube.shiftPlane(
                    'Y',
                    -1 * cube.playbackOptions.stepSize,
                    cube.playbackOptions.wrap
                );
            },
            shiftZ: function() {
                cube.shiftPlane(
                    'Z',
                    cube.playbackOptions.stepSize,
                    cube.playbackOptions.wrap
                );
            },
            unshiftZ: function() {
                cube.shiftPlane(
                    'Z',
                    -1 * cube.playbackOptions.stepSize,
                    cube.playbackOptions.wrap
                );
            },
        }
    });

    Object.defineProperty(this, 'animationCb', {
        /**
         * Read-only property for the correct animation callback to use for the
         * current action and direction.
         */
        enumerable: false,
        set: NOOP,
        get: function() {
            if (this.playbackOptions.action === 'slide')
            {
                var slideDirectionAnimationMap = {
                    'up': this.animationSteps.shiftX,
                    'down': this.animationSteps.unshiftX,
                    'left': this.animationSteps.shiftY,
                    'right': this.animationSteps.unshiftY,
                    'forward': this.animationSteps.shiftZ,
                    'back': this.animationSteps.unshiftZ,
                };

                return slideDirectionAnimationMap[this.playbackOptions.direction];
            }

            return undefined;   // just being explicit about this
        }
    });

    Object.defineProperty(this, 'directions', {
        enumerable: true,
        writable: false,
        value: ['back', 'right', 'down', 'up', 'left', 'forward'],
    });

    Object.defineProperty(this, 'isPlaying', {
        enumerable: false,
        get: function() {
            return _isPlaying;
        },
        set: function(nowPlaying) {
            var prevIsPlaying = _isPlaying;
            _isPlaying = nowPlaying;

            _html.dispatchEvent(new CustomEvent('propertyChanged', {
                detail: {
                    setting: 'isPlaying',
                    newValue: _isPlaying,
                    oldValue: prevIsPlaying,
                }
            }));

            /**
             * Start / stop the actual animation loop
             */
            if (_isPlaying)
            {
                clearInterval(this.animateInterval);
                if (_playbackMode === 'real-time')
                {
                    _playlist.stop();
                    this.animateInterval = setInterval(function() {
                        this.animationCb.apply(this);
                    }.bind(this), this.playbackOptions.delay);  // Use our "outside" this inside of the setInterval callback
                } else if (_playbackMode === 'playlist')
                {
                    this.clear();
                    _playlist.play();
                }
            } else
            {
                clearInterval(this.animateInterval);
                _playlist.stop();
            }
        }
    });


    Object.defineProperty(this, 'penColorRgb', {
        enumerable: true,
        set: NOOP,
        get: function() {
            return this.colors[this.penColor];
        },
    });

    Object.defineProperty(this, 'penColor', {
        enumerable: true,
        get: function() {
            return _penColor;
        },
        set: function(newColor) {
            if (this.colorNames.indexOf(newColor) === -1)
            {
                console.error('Invalid color. Known colors: ' + this.colorNames.join(', '));
                return;
            }

            var prevPenColor = _penColor;
            _penColor = newColor;

            _html.dispatchEvent(new CustomEvent('propertyChanged', {
                detail: {
                    setting: 'penColor',
                    newValue: _penColor,
                    oldValue: prevPenColor,
                }
            }));
        }
    });


    Object.defineProperty(this, 'writeFace', {
        enumerable: true,
        get: function() {
            return _writeFace;
        },
        set: function(newFace) {
            if (this.faceNames.indexOf(newFace) === -1)
            {
                console.error('Invalid face. Known faces: ' + this.faceNames.join(', '));
                return;
            }

            var prevWriteFace = _writeFace;
            _writeFace = newFace;

            // set Cube viewing angle
            this.xAngle = this.faceCubeViewingAngles[newFace][0];
            this.yAngle = this.faceCubeViewingAngles[newFace][1];

            // set which cells are interactive
            for (var i = 0, numCells = _cells.length; i < numCells; i++)
            {
                var cell = _cells[i];

                var shouldBeInteractive = {
                    front: (cell.depth === 0),
                    left: (cell.column === 0),
                    back: (cell.depth === 7),
                    right: (cell.column === 7),
                    top: (cell.row === 0),
                    bottom: (cell.row === 7),
                }[_writeFace];

                cell.applyOptions({
                    interactive: shouldBeInteractive,
                });
            }

            if (_playbackMode === 'playlist')
            {
                _playlist.face = _writeFace;
            }

            _html.dispatchEvent(new CustomEvent('propertyChanged', {
                detail: {
                    setting: 'writeFace',
                    newValue: _writeFace,
                    oldValue: prevWriteFace,
                }
            }));
        }
    });
}

/**
 * ANIMATION FUNCTIONS
 */

Cube.prototype.step = function(numSteps) {
    /**
     * Performs a single step of the current animation. If the number of steps
     * is negative, we take the number of steps in the "opposite" direction for
     * the current animation settings.
     */

    var DEFAULT_NUM_STEPS = 1;
    numSteps = typeof numSteps !== 'undefined' ? parseInt(numSteps, 10) || DEFAULT_NUM_STEPS : DEFAULT_NUM_STEPS;

    if (numSteps < 0)
    {   // step "backward"
        var startDirection = this.playbackOptions.direction;
        var oppositeDirection = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left',
            'forward': 'back',
            'back': 'forward',
        }[startDirection];  // get the opposite direction

        this.playbackOptions.direction = oppositeDirection; // apply the opposite direction for our next steps

        this.step(Math.abs(numSteps));  // call this very function, but with a positive number of steps

        this.playbackOptions.direction = startDirection;    // re-apply the old direction
    }

    for (var i = 0; i < numSteps; i++)
    {
        /**
         * animationCb is a property of the cube object, the getter of which
         * returns the function that will apply the desired animation for the
         * current settings.
         */
        this.animationCb();
    }

    return this;    // enables multiple calls on cube to be "chained"
}

Cube.prototype.play = function(opts) {
    /**
     * Starts the animation loop. The loop can be stopped using cube.clear();
     */

    opts = typeof opts !== 'undefined' ? opts : {};

    this.playbackOptions = opts;
    this.isPlaying = true;

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.pause = function() {
    /**
     * Stop the animation loop. The loop can be started using cube.play();
     */

    this.isPlaying = false;

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.togglePlaying = function(force) {
    this.isPlaying = (typeof force !== 'undefined') ?
        force :
        !this.isPlaying;
};

Cube.prototype.listenForKeystrokes = function(opts) {
    var cube = this;

    this.keyListenerOptions = opts;

    var validKeyFns = {
        specials: function(e) {
            return (
                (e.keyCode === 32) ||   // spacebar
                (e.keyCode === 8) ||    // backspace
                (e.keyCode === 13) ||   // enter
                (e.keyCode >= 37 && e.keyCode <= 40)    // arrow keys
            );
        },
        alpha: function(e) {
            return validKeyFns.specials(e) || (e.keyCode >= 65 && e.keyCode <= 90);
        },
        num: function(e) {
            return (
                validKeyFns.specials(e) ||
                (e.keyCode >= 48 && e.keyCode <= 57) || // top row
                (e.keyCode >= 96 && e.keyCode <= 105)   // num pad
            );
        },
        symbols: function(e) {
            return (
                validKeyFns.specials(e) ||
                (e.keyCode >= 106 && e.keyCode <= 111) ||  // math operators
                (e.keyCode >= 186 && e.keyCode <= 222) ||  // punctuation
                (e.shiftKey && e.keyCode >= 48 && e.keyCode <= 57)    // "uppercase" numbers
            );
        },
        alphanum: function(e) {
            return validKeyFns.alpha(e) || validKeyFns.num(e);
        },
        all: function(e) {
            return validKeyFns.alphanum(e) || validKeyFns.symbols(e);
        },
    }

    this.validKeyFilterFn = function(e) {
        /**
         * Call the validator for the current set of desired keys
         * (cube.keyListenerOptions.keys) passing in the current event for
         * evaluation. If the key is valid, allow the event to proceed,
         * otherwise don't let other listeners see it.
         */
        if (validKeyFns[cube.keyListenerOptions.keys](e))
        {
            return true;
        }

        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    this.actionKeyListenerFn = function(e) {
        /**
         * Capture key events that are supposed to trigger an action on the cube.
         * In the event that an action is typed, we don't want to let the event
         * propagate up to this.keyListenerFn(). If it were to, the letters
         * pressed to trigger actions would appear on the cube. For example,
         * CTRL+B would both change the cube's animation direction and show a 'b'
         * on the front face.
         */

        var keyDirectionMap = {
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down',
            70: 'front',   // "Front:  CTRL+F"
            66: 'back',    // "Back:   CTRL+B"
            85: 'up',      // "Up:     CTRL+U"
            68: 'down',    // "Down:   CTRL+D"
            82: 'right',   // "Right:  CTRL+R"
            76: 'left',    // "Left:   CTRL+L"
        };

        function keyIsDirectionalAction() {
            return Object.keys(keyDirectionMap).indexOf(e.keyCode.toString()) !== -1;
        }

        if ((e.ctrlKey && (e.keyCode === 32)) || e.keyCode === 13)  // ctrl+space, or enter
        {
            /**
             * Prevent the browser's default behavior for the event. For example,
             * arrow keys scroll the browser window by default. This would be
             * prevented by e.preventDefault().
             *
             * Also prevent the event from "bubbling up" to higher points in the
             * listening tree or DOM. This is useful, as mentioned in the comment
             * above for preventing other event handlers for doing work that might
             * conflict with that done by this handler.
             *
             * For a more thorough explanation, see here: http://stackoverflow.com/questions/4616694/what-is-event-bubbling-and-capturing
             */
            e.preventDefault();
            e.stopPropagation();

            cube.togglePlaying();
        } else if (e.keyCode === 8) // backspace
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.ctrlKey)
            {
                cube.pause();
                cube.clear();   // clear whole cube
            } else if (cube.playbackMode !== 'playlist')
            {
                cube.writeSlice(cube.getCharacterRender(' '), this.writeFace);   // "space" character
            }
        } else if (e.ctrlKey && (e.keyCode === 189))    // ctrl+minus
        {   // prev step
            e.preventDefault();
            e.stopPropagation();

            cube.step(-1);
        } else if (e.ctrlKey && (e.keyCode === 187))    // ctrl+equals
        {   // next step
            e.preventDefault();
            e.stopPropagation();

            cube.step();
        } else if (e.ctrlKey && (e.keyCode === 192))    // ctrl+`
        {   // toggle playlist focus
            e.preventDefault();
            e.stopPropagation();

            if (cube.playbackMode === 'playlist')
            {
                cube.playlist.focus = !cube.playlist.focus;
            }
        } else if (e.ctrlKey && keyIsDirectionalAction(e))
        {
            e.preventDefault();
            e.stopPropagation();

            var newDirection = keyDirectionMap[e.keyCode];
            if (e.altKey)
            {
                if (newDirection === 'up')
                {
                    newDirection = 'back';
                } else if (newDirection === 'down')
                {
                    newDirection = 'forward';
                }
            }

            cube.playbackOptions = {
                direction: newDirection,
            };
        } else if (e.ctrlKey && e.keyCode >= 48 && e.keyCode <= 57) // ctrl + num row
        {
            e.preventDefault();
            e.stopPropagation();

            var shapeIndex = parseInt(String.fromCharCode(e.keyCode), 10) - 1;
            var numShapes = cube.shapeNames.length;
            if ((shapeIndex >= 0) && (shapeIndex < numShapes))
            {
                cube.renderShape(cube.shapeNames[shapeIndex]);
            }
        }
    };

    this.keyListenerFn = function(e) {
        /**
         * Called for each keypress that is allowed to pass through the
         * validation function.
         */

        var char = String.fromCharCode(e.which);

        if (cube.playbackMode === 'real-time')
        {
            if (cube.keyListenerOptions.animate)
            {
                cube.writeSlice(cube.getCharacterRender(char), cube.writeFace);

                cube.play({
                    direction: 'back',
                    stepSize: cube.keyListenerOptions.stepSize,
                    delay: cube.keyListenerOptions.animateRate,
                });
            } else
            {
                cube.writeSlice(cube.getCharacterRender(char), cube.writeFace);
            }
        } else if ((cube.playbackMode === 'playlist') && (cube.playlist.focus))
        {
            var tileContents = cube.getCharacterRender(char);
            cube.playlist.insertTileAtAndMoveCursor(new Tile(tileContents))
        }
    };

    if (!this.listeningForKeystrokes)
    {
        /**
         * By checking that this.listeningForKeystrokes is not already set, we
         * prevent double-binding of these listeners to single events.
         */

        this.listeningForKeystrokes = true;
        document.addEventListener('keydown', this.validKeyFilterFn);
        document.addEventListener('keydown', this.actionKeyListenerFn);
        document.addEventListener('keypress', this.keyListenerFn);
    }

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.stopListeningForKeystrokes = function() {
    /**
     * Removes event listeners added by cube.listenForKeystrokes()
     */

    if (this.listeningForKeystrokes)
    {
        /**
         * By checking that we were listening for keystrokes before, we are sure
         * that the event listeners were bound and that the functions we are
         * referencing to unbind have been defined.
         */

        document.removeEventListener('keydown', this.validKeyFilterFn);
        document.removeEventListener('keydown', this.actionKeyListenerFn);
        document.removeEventListener('keypress', this.keyListenerFn);
        this.listeningForKeystrokes = false;
    }

    return this;    // enables multiple calls on cube to be "chained"
};
