var CubeUI = function(cube, opts) {

    var cubeUI = this;

    var NOOP = function() {};

    var defaultOptions = {
        cubeContainer: null,
        cubeXAngle: 0,
        cubeYAngle: 0,
        cubeTransitionTransforms: true,
        playButton: null,
        clearButton: null,
        prevStepButton: null,
        nextStepButton: null,
        modeToggleButton: null,
        realtimeUI: null,
        playlistUI: null,
        colorPicker: null,
        shapePicker: null,
        writeFacePicker: null,
        // fontPicker: null,      // not implemented (will be for selecting from multiple fonts the cube might support)
        // kbCubeRotateListening: true, // not implemented (will be for the code that is currently in script.js)
    };

    var _cube = cube;
    var _options = _.extend({}, defaultOptions, opts);

    var _cubeContainer = null;

    var _cubeTransitionTransforms = true;
    // var _cellTransitionTransforms = true;    // not implemented


    /**
     * BUTTON SETUP CODE
     */

    var _buttonEls = {
        'prevStep': null,
        'nextStep': null,
        'play': null,
        'clear': null,
        'modeToggle': null,
    };

    var __buttonClickListeners = {
        'prevStep': function(event) {
            _cube.pause();
            _cube.step(-1);
        },
        'nextStep': function(event) {
            _cube.pause();
            _cube.step();
        },
        'play': function(event) {
            _cube.togglePlaying();
        },
        'clear': function(event) {
            _cube.clear();
        },
        'modeToggle': function(event) {
            _cube.playbackMode = _cube.nextPlaybackMode;
        },
    };


    /**
     * PICKER SETUP CODE
     */

    var _builtEls = {
        'colorPicker': null,
        'shapePicker': null,
        'writeFacePicker': null,
        'realtimeUI': null,
    };

    var __builtListeners = {
        'colorPicker': function __colorPickerChangeListener(e) {
            if ((e.target.nodeName === 'INPUT') && (e.target.name === 'color'))
            {
                _cube.penColor = e.target.value;
            }
        },
        'shapePicker': function __shapePickerClickListener(e) {
            if (_cube.playbackMode === 'real-time' ||
                ((_cube.playbackMode === 'playlist') && !_cube.playlist.isPlaying))
            {
                if (e.target.dataset && e.target.dataset.shape)
                {
                    cube.renderShape(e.target.dataset.shape);
                }
            }
        },
        'writeFacePicker': function __writeFacePickerChangeListener(e) {
            if ((e.target.nodeName === 'INPUT') && (e.target.name === 'write-face'))
            {
                _cube.writeFace = e.target.value;
            }
        },
        'realtimeUI': function __realtimeUIChangeListener(e) {
            if ((e.target.nodeName === 'INPUT') && (e.target.name === 'direction'))
            {
                _cube.playbackOptions = {
                    direction: e.target.value,
                };
            }
        },
    };

    var __destroyPicker = function __destroyPicker(label) {
        if (_builtEls[label])
        {
            _builtEls[label].classList.remove(label + '-list');
            _builtEls[label].innerHTML = '';
            _builtEls[label].style.position = null;
            _builtEls[label].style.top = null;
            _builtEls[label].style.right = null;
            _builtEls[label].removeEventListener('change', __builtListeners[label]);
            _builtEls[label].removeEventListener('click', __builtListeners[label]);
        }
    };

    var __builtDestroyers = {
        'colorPicker': __destroyPicker,
        'shapePicker': __destroyPicker,
        'writeFacePicker': __destroyPicker,
        'realtimeUI': function __destroyRealtimeControls(label) {
            if (_builtEls[label])
            {
                _builtEls[label].removeEventListener('change', __builtListeners[label]);
                _builtEls[label].classList.remove('playback-controls');
                _builtEls[label].innerHTML = '';
                _builtEls[label].style.opacity = null;
                _builtEls[label].style.zIndex = null;
            }
        },
    };

    var __builtBuilders = {
        'colorPicker': function __buildColorPicker(parentEl) {
            _builtEls['colorPicker'] = parentEl;
            _builtEls['colorPicker'].classList.add('color-list');
            _builtEls['colorPicker'].innerHTML = _cube.colorNames.map(function(colorName) {
                return (
                    '<label class="swatch">' +
                        '<input type="radio" name="color" value="' + colorName + '" />' +
                        '<div data-color="' + colorName + '"></div>' +
                    '</label>'
                );
            }).join('');

            var colorPickerHeight = _builtEls['colorPicker'].getBoundingClientRect().height;

            /**
             * !TODO: Fix this. We need this correction look correct.
             */
            colorPickerHeight -= 120;

            _builtEls['colorPicker'].style.position = 'absolute';
            _builtEls['colorPicker'].style.top = 'calc(50% - ' + (colorPickerHeight / 2) + 'px)';
            _builtEls['colorPicker'].style.left = 'calc(50% - ' + _cube.outerDimensions + 'px)';

            _builtEls['colorPicker'].addEventListener('change', __builtListeners['colorPicker']);

            /**
             * Sync DOM/Cube on build
             */
            _cube.penColor = _cube.penColor;
        },
        'shapePicker': function __buildShapePicker(parentEl) {
            _builtEls['shapePicker'] = parentEl;
            _builtEls['shapePicker'].classList.add('shape-list');
            _builtEls['shapePicker'].innerHTML = _cube.shapeNames.map(function(shapeName) {
                var shapeRender = (new Tile(_cube.shapes[shapeName])).getPngData();
                var styles = (
                    'background-image:url(\'' + shapeRender + '\');' +
                    'background-size:cover;' +
                    'background-position:50% 50%;'
                );

                return (
                    '<div class="swatch" data-shape="' + shapeName + '" ' +
                        'style="' + styles + '"></div>'
                );
            }).join('');

            var shapePickerHeight = _builtEls['shapePicker'].getBoundingClientRect().height;
            /**
             * !TODO: Fix this. We need this correction look correct.
             */
            shapePickerHeight -= 120;

            _builtEls['shapePicker'].style.position = 'absolute';
            _builtEls['shapePicker'].style.top = 'calc(50% - ' + (shapePickerHeight / 2) + 'px)';
            _builtEls['shapePicker'].style.right = 'calc(50% - ' + _cube.outerDimensions + 'px)';

            _builtEls['shapePicker'].addEventListener('click', __builtListeners['shapePicker']);
        },
        'writeFacePicker': function __buildWriteFacePicker(parentEl) {
            _builtEls['writeFacePicker'] = parentEl;
            _builtEls['writeFacePicker'].classList.add('write-face-list');
            _builtEls['writeFacePicker'].innerHTML = _cube.faceNames.map(function(face) {
                return (
                    '<label class="swatch">' +
                        '<input type="radio" name="write-face" value="' + face + '" />' +
                        '<div data-write-face="' + face + '"></div>' +
                    '</label>'
                );
            }).join('');

            var writeFacePickerHeight = _builtEls['writeFacePicker'].getBoundingClientRect().height;

            /**
             * !TODO: Fix this. We need this correction look correct.
             */
            writeFacePickerHeight -= 120;

            _builtEls['writeFacePicker'].style.position = 'absolute';
            _builtEls['writeFacePicker'].style.top = 'calc(50% - ' + (writeFacePickerHeight / 2) + 'px)';
            _builtEls['writeFacePicker'].style.left = 'calc(50% - ' + (_cube.outerDimensions + 75) + 'px)';

            _builtEls['writeFacePicker'].addEventListener('change', __builtListeners['writeFacePicker']);

            /**
             * Sync DOM/Cube on build
             */
            _cube.writeFace = _cube.writeFace;
        },
        'realtimeUI': function __buildRealtimeControls(parentEl) {
            var optionsHtml = _cube.directions.map(function(direction) {
                return (
                    '<input id="direction-radio-' + direction + '" type="radio" name="direction" value="' + direction + '" />' +
                    '<label for="direction-radio-' + direction + '" class="control-button radio-tab">' + direction + '</label>'
                );
            }).join('');

            _builtEls['realtimeUI'] = parentEl;
            _builtEls['realtimeUI'].classList.add('playback-controls');

            _builtEls['realtimeUI'].innerHTML = (
                '<div class="radio-tabs">' + optionsHtml + '</div>'
            );

            _builtEls['realtimeUI'].addEventListener('change', __builtListeners['realtimeUI']);

            _cube.playbackOptions = {
                direction: _cube.playbackOptions.direction,  // trigger sync of DOM with state
            }
        },
    };

    // playlist's UI is currently controller by the playlist itself; maybe this should change?

    var __htmlReadySuccessFn;
    var __htmlReadyFailureFn;
    var _htmlReady = new Promise(function(resolve, reject) {
        __htmlReadySuccessFn = resolve;
        __htmlReadyFailureFn = reject;
    });

    Object.defineProperty(this, 'htmlReady', {
        enumerable: false,
        set: NOOP,
        get: function() {
            return _htmlReady;
        },
    });


    /**
     * CUBE EVENT LISTENERS
     */

    _cube.html.addEventListener('propertyChanged', __cubePropertyChangeListener);

    function __cubePropertyChangeListener(data) {
        var settingChanged = data.detail.setting;
        var newVal = data.detail.newValue;

        if (settingChanged === 'writeFace')
        {
            __updateDOMForSelectedWriteFace(newVal);
        } else if (settingChanged === 'penColor')
        {
            __updateDOMForSelectedPenColor(newVal);
        } else if (settingChanged === 'isPlaying')
        {
            __updateDOMForIsPlaying(newVal);
        } else if (settingChanged === 'playbackMode')
        {
            __updatePlaybackModeRelatedDOM();
        }
    }

    function __updateDOMForSelectedPenColor(newPenColor) {
        if (_builtEls['colorPicker'])
        {
            var radioSelector = 'input[type="radio"][name="color"]';
            var radioElList = _builtEls['colorPicker'].querySelectorAll(radioSelector);
            var radioElArray = Array.prototype.slice.apply(radioElList);
            radioElArray.forEach(function(input) {
                input.checked = (input.value === newPenColor);
                var swatch = input.nextElementSibling;
                swatch.style.backgroundColor = swatch.dataset.color;
            });
        }
    }

    function __updateDOMForSelectedWriteFace(newWriteFace) {
        if (_builtEls['writeFacePicker'])
        {
            var radioSelector = 'input[type="radio"][name="write-face"]';
            var radioElList = _builtEls['writeFacePicker'].querySelectorAll(radioSelector);
            var radioElArray = Array.prototype.slice.apply(radioElList);
            radioElArray.forEach(function(input) {
                input.checked = (input.value === newWriteFace) ?
                    _cube.playlist.currentSupportedFaces.indexOf(input.value) !== -1 :
                    false;
                input.disabled = _cube.playbackMode === 'playlist' ?
                    _cube.playlist.currentSupportedFaces.indexOf(input.value) === -1 :
                    false;

                var swatch = input.nextElementSibling;
                swatch.innerHTML = swatch.dataset.writeFace;
            });
        }
    }

    function __updateDOMForIsPlaying(newIsPlaying) {
        if (_buttonEls['play'])
        {
            _buttonEls['play'].classList.toggle('playing', newIsPlaying);
            _buttonEls['play'].classList.toggle('paused', !newIsPlaying);
        }

        if (newIsPlaying)
        {
            if (_cube.playbackMode === 'playlist')
            {
                if (_builtEls['shapePicker'])
                {
                    _builtEls['shapePicker'].classList.add('disabled');
                }
            }
        } else
        {
            if (_builtEls['shapePicker'])
            {
                _builtEls['shapePicker'].classList.remove('disabled');
            }
        }
    }


    /**
     * PRIVATE HELPER FUNCTIONS
     */

    function newElementCanReplace(newEl, currEl) {
        return (newEl instanceof HTMLElement) && (newEl !== currEl);
    }

    function shouldDestroyExistingEl(newEl) {
        return (newEl === null) || (typeof newEl === 'undefined');
    }

    function __setButton(label, newEl) {
        if (newElementCanReplace(newEl, _buttonEls[label]))
        {
            if (_buttonEls[label])
            {   // unbind a click listener that may have been previously bound
                _buttonEls[label].removeEventListener('click', __buttonClickListeners[label]);
            }
            _buttonEls[label] = newEl;
            _buttonEls[label].addEventListener('click', __buttonClickListeners[label]);
            __updatePlaybackModeRelatedDOM();
        } else if (shouldDestroyExistingEl(newEl))
        {
            if (_buttonEls[label])
            {
                _buttonEls[label].removeEventListener('click', __buttonClickListeners[label]);
            }
            _buttonEls[label] = null;
        } else
        {
            console.error('Invalid ' + label + 'Button: must be instance of HTMLElement');
            throw 'Invalid ' + label + 'Button';
        }
    }

    function __setBuiltEl(label, newEl) {
        if (newElementCanReplace(newEl, _builtEls[label]))
        {
            __builtDestroyers[label](label);
            __builtBuilders[label](newEl);
            __updatePlaybackModeRelatedDOM();
        } else if (shouldDestroyExistingEl(newEl))
        {
            __builtDestroyers[label](label);
            _builtEls[label] = null;
        } else
        {
            console.error('Invalid ' + label + 'Picker: must be instance of HTMLElement');
            throw 'Invalid ' + label + 'Picker';
        }
    }

    function __updatePlaybackModeRelatedDOM() {
        if (_buttonEls['modeToggle'])
        {
            _buttonEls['modeToggle'].innerHTML = _cube.playbackMode;
        }

        if (_cube.playbackMode === 'real-time')
        {
            if (_builtEls['shapePicker'])
            {
                _builtEls['shapePicker'].classList.remove('disabled');
            }

            if (_buttonEls['prevStep'])
            {
                _buttonEls['prevStep'].style.display = 'inherit';
            }

            if (_buttonEls['nextStep'])
            {
                _buttonEls['nextStep'].style.display = 'inherit';
            }

            if (_builtEls['realtimeUI'])
            {
                _builtEls['realtimeUI'].style.opacity = 1;
                _builtEls['realtimeUI'].style.zIndex = 2;
            }

            if (cubeUI.playlistUI)
            {
                cubeUI.playlistUI.style.opacity = 0;
                cubeUI.playlistUI.style.zIndex = -1;
            }
        } else if (_cube.playbackMode === 'playlist')
        {
            _cube.playlist.face = _cube.writeFace;

            if (_builtEls['shapePicker'] && _cube.playlist.isPlaying)
            {
                _builtEls['shapePicker'].classList.add('disabled');
            }

            if (_buttonEls['prevStep'])
            {
                _buttonEls['prevStep'].style.display = 'none';
            }

            if (_buttonEls['nextStep'])
            {
                _buttonEls['nextStep'].style.display = 'none';
            }

            if (_builtEls['realtimeUI'])
            {
                _builtEls['realtimeUI'].style.opacity = 0;
                _builtEls['realtimeUI'].style.zIndex = -1;
            }

            if (cubeUI.playlistUI)
            {
                cubeUI.playlistUI.style.opacity = 1;
                cubeUI.playlistUI.style.zIndex = 2;
            }
        }

        _cube.writeFace = _cube.writeFace;
        _cube.playbackOptions = _cube.playbackOptions;
    }


    /**
     * BUTTON PROPERTIES
     */

    Object.keys(_buttonEls).forEach(function(key) {
        Object.defineProperty(cubeUI, key + 'Button', {
            enumerable: false,
            get: function() { return _buttonEls[key]; },
            set: function(newEl) {
                __setButton(key, newEl);
            }
        });
    });


    /**
     * BUILDABLES PROPERTIES
     */

    Object.keys(_builtEls).forEach(function(key) {
        Object.defineProperty(cubeUI, key, {
            enumerable: false,
            get: function() { return _builtEls[key]; },
            set: function(newEl) {
                __setBuiltEl(key, newEl);
            },
        });
    });


    /**
     * CUBE CONTAINER PROPERTY
     */

    Object.defineProperty(this, 'cubeContainer', {
        enumerable: false,
        get: function() { return _cubeContainer; },
        set: function(newEl) {
            if (newElementCanReplace(newEl, _cubeContainer))
            {
                _cubeContainer = newEl;
                _cubeContainer.appendChild(_cube.html);
            } else if (shouldDestroyExistingEl(newEl))
            {
                if (_cubeContainer) {
                    _cubeContainer.removeChild(_cube.html);
                }
                _cubeContainer = null;
            } else
            {
                console.error('Invalid container: must be instance of HTMLElement');
                throw 'Invalid container';
            }
        }
    });


    /**
     * PLAYLIST CONTAINER PROPERTY
     */

    Object.defineProperty(this, 'playlistUI', {
        enumerable: false,
        get: function() { return _cube.playlist.container; },
        set: function(newEl) {
            if (newElementCanReplace(newEl, _cube.playlist.container))
            {
                _cube.playlist.container = newEl;
                __updatePlaybackModeRelatedDOM();
            } else if (shouldDestroyExistingEl(newEl))
            {
                _cube.playlist.container = null;
            } else
            {
                console.error('Invalid playlistContainer: must be instance of HTMLElement');
                throw 'Invalid playlistContainer';
            }
        },
    });


    /**
     * CUBE PROXY PROPERTIES
     */

    Object.defineProperty(this, 'cubeXAngle', {
        enumerable: true,
        get: function() { return _cube.xAngle; },
        set: function(newValue) { return cube.xAngle = newValue; }
    });

    Object.defineProperty(this, 'cubeYAngle', {
        enumerable: true,
        get: function() { return _cube.yAngle; },
        set: function(newValue) { return cube.yAngle = newValue; }
    });

    Object.defineProperty(this, 'cubeTransitionTransforms', {
        enumerable: true,
        get: function() { return _cubeTransitionTransforms; },
        set: function(newValue) { cube.transitionTransforms = !!newValue; }
    });


    /**
     * NON-DOM PROPERTY METHODS
     */

    this.applyOptions = function(newOpts) {
        if (!(newOpts instanceof Object))
        {
            throw 'TypeError: CubeUI options must be object';
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
                console.error('Invalid option for CubeUI:' + key);
            }
        }
    };


    /**
     * INIT
     */

    (function init() {
        this.applyOptions(_options);

        __htmlReadySuccessFn();
        _htmlReady = true;
    }.bind(this)());

    return this;

};
