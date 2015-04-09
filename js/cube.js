var Cube = function(size, parentElement, prevStepButton, nextStepButton, playButton, clearButton, cellOpts) {
    // 'this' can point to many, different things, so we grab an easy reference to the object
    // You can read more about 'this' at:
    // MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
    // at http://www.quirksmode.org/js/this.html
    // and in a more detailed tutorial: http://javascriptissexy.com/understand-javascripts-this-with-clarity-and-master-it/
    var cube = this;

    var NOOP = function() {};   // does nothing, but useful to pass as argument to things expecting functions

    // DEFINE SOME PROPERTIES
    var defaultPlaybackOptions = {
        delay: 100,
        action: 'slide',
        direction: 'back',
        stepSize: 1,
        wrap: false,
        // interruptible: false,
    };

    var defaultCellOptions = {
        size: 50, // size of our cells in pixels
    };

    var defaultKeyListenerOptions = {
        keys: 'all',                // values: alpha, num, alphanum, all
        // letterColor: [0, 0, 255],   // NOT IMPLEMENTED: color of letter pixels on generated frame: rgb array
        // backgroundColor: [0, 0, 0], // NOT IMPLEMENTED: color of non-leter pixels on generated frame: rgb array
        // startFace: 'front',         // NOT IMPLEMENTED: values: front, back, left, right, bottom, top
        // endFace: 'back',            // NOT IMPLEMENTED: values: front, back, left, right, bottom, top
        animate: false,             // animate from frontFace to backFace: boolean
        animateRate: 125,           // delay between each playback frame
        stepSize: 1,                // number of steps for each animation
    };

    var _playbackOptions = _.extend({}, defaultPlaybackOptions);
    var _cellOptions = _.extend({}, defaultCellOptions);
    var _keyListenerOptions = _.extend({}, defaultKeyListenerOptions);

    var _prevStepButton;
    var _nextStepButton;
    var _playButton;
    var _clearButton;

    var _fontMap = {};
    var _activeFont;

    var _isPlaying = false;
    var _penColor = 'blue';

    var _xAngle = 0;
    var _yAngle = 0;
    var _transitionTransforms;
    var _rotateCells = false;

    var htmlReadySuccessFn;
    var htmlReadyFailureFn;
    this.htmlReady = new Promise(function(resolve, reject) {
        htmlReadySuccessFn = resolve;
        htmlReadyFailureFn = reject;
    });

    this.hasColorPicker = false;
    this.hasPlaybackControls = false;

    Object.defineProperty(this, 'playbackOptions', {
        enumerable: true,
        get: function() {
            return _playbackOptions;
        },
        set: function(newOptions) {
            var validDirections = ['forward', 'back', 'up', 'down', 'left', 'right'];

            var resumePlayingAfterChange = cube.isPlaying;

            cube.pause();

            if (this.hasPlaybackControls &&
                newOptions.direction &&
                validDirections.indexOf(newOptions.direction) !== -1)
            {
                var radioSelector = 'input[type="radio"][name="direction"]';
                var radiosElList = this.playbackControlsContainerEl.querySelectorAll(radioSelector)
                var radioElArray = Array.prototype.slice.apply(radiosElList);
                radioElArray.forEach(function(input) {
                    input.checked = (input.value == newOptions.direction);
                });
            } else
            {
                delete(newOptions.direction);
            }

            _.extend(_playbackOptions, newOptions);

            if (resumePlayingAfterChange)
            {
                cube.play();
            }
        }
    });

    Object.defineProperty(this, 'cellOptions', {
        enumerable: true,
        get: function() {
            return _cellOptions;
        },
        set: function(newOptions) {
            _.extend(_cellOptions, newOptions);
        }
    });


    Object.defineProperty(this, 'keyListenerOptions', {
        enumerable: true,
        get: function() {
            return _keyListenerOptions;
        },
        set: function(newOptions) {
            _.extend(_keyListenerOptions, newOptions);
        }
    });

    function applyCameraAngle() {
        /**
         * @amirmikhak
         * Helper function for xAngle and yAngle properties
         */
        cube.htmlReady.then(function() {
            cube.html.style.transform = [
                ['rotateX(', cube.xAngle, 'deg)'].join(''),
                ['rotateY(', cube.yAngle, 'deg)'].join(''),
            ].join(' ');

            if (cube.rotateCells)
            {
                /**
                 * @amirmikhak
                 * Only apply rotations if we need to because iterating over the cells
                 * is very expensive and reduces performance significantly. See the
                 * rotateCells property on "this" for more information.
                 */
                cube.cells.forEach(function(cell) {
                    cell.applyOptions({
                        rotation: [-1 * cube.xAngle, -1 * cube.yAngle, 0],
                    });
                });
            }
        });
    }

    Object.defineProperty(this, 'xAngle', {
        enumerable: true,
        get: function() {
            return _xAngle;
        },
        set: function(newAngle) {
            var parsedAngle = parseFloat(newAngle);
            if (!isNaN(parsedAngle))
            {
                _xAngle = parsedAngle;
                applyCameraAngle();
            }
        }
    });

    Object.defineProperty(this, 'yAngle', {
        enumerable: true,
        get: function() {
            return _yAngle;
        },
        set: function(newAngle) {
            var parsedAngle = parseFloat(newAngle);
            if (!isNaN(parsedAngle))
            {
                _yAngle = parsedAngle;
                applyCameraAngle();
            }
        }
    });

    Object.defineProperty(this, 'transitionTransforms', {
        enumerable: false,
        get: function() {
            return _transitionTransforms;
        },
        set: function(shouldTransition) {
            _transitionTransforms = shouldTransition;

            var TRANSITION_DURATION = '300ms';
            var TRANSITION_EASING = 'ease-in-out';

            this.htmlReady.then(function() {
                if (shouldTransition)
                {
                    cube.html.style.transitionProperty = 'transform';
                    cube.html.style.transitionDuration = TRANSITION_DURATION;
                    cube.html.style.transitionTimingFunction = TRANSITION_EASING;
                } else
                {
                    cube.html.style.transitionProperty = null;
                    cube.html.style.transitionDuration = null;
                    cube.html.style.transitionTimingFunction = null;
                }
            });
        }
    });

    this.transitionTransforms = true;

    Object.defineProperty(this, 'rotateCells', {
        enumerable: true,
        get: function() {
            return _rotateCells;
        },
        set: function(shouldRotate) {
            _rotateCells = shouldRotate;
            if (!_rotateCells)
            {
                /**
                 * @amirmikhak
                 * To improve performance of applyCameraAngle(), we only iterate over
                 * the cells if we need to rotate them. Thus, if we are not rotating
                 * the cells but were previously, we need to "clear" their rotation
                 * manually because applyCameraAngle() won't if the property is false.
                 */
                cube.cells.forEach(function(cell) {
                    cell.applyOptions({
                        rotation: [0, 0, 0],
                    });
                });
            }

            applyCameraAngle();
        }
    });

    Object.defineProperty(this, 'animationSteps', {
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

    Object.defineProperty(this, 'shapes', {
        enumerable: true,
        writable: false,
        value: {
            circle: '[{"row":0,"column":0,"depth":0,"color":[75,0,130],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":0,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":0,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":0,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":0,"depth":0,"color":[75,0,130],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":0,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":0,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":0,"depth":0,"color":[75,0,130],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":1,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":1,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":1,"depth":0,"color":[0,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":1,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":1,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":1,"depth":0,"color":[0,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":1,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":1,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":2,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":2,"depth":0,"color":[0,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":2,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":2,"depth":0,"color":[75,0,130],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":2,"depth":0,"color":[75,0,130],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":2,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":2,"depth":0,"color":[0,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":2,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":3,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":3,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":3,"depth":0,"color":[0,255,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":3,"depth":0,"color":[255,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":3,"depth":0,"color":[255,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":3,"depth":0,"color":[0,255,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":3,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":3,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":4,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":4,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":4,"depth":0,"color":[0,255,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":4,"depth":0,"color":[255,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":4,"depth":0,"color":[255,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":4,"depth":0,"color":[0,255,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":4,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":4,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":5,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":5,"depth":0,"color":[0,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":5,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":5,"depth":0,"color":[0,255,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":5,"depth":0,"color":[0,255,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":5,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":5,"depth":0,"color":[0,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":5,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":6,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":6,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":6,"depth":0,"color":[0,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":6,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":6,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":6,"depth":0,"color":[0,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":6,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":6,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":7,"depth":0,"color":[75,0,130],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":7,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":7,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":7,"depth":0,"color":[75,0,130],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":7,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":7,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":7,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":7,"depth":0,"color":[75,0,130],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]}]',
            diamond: '[{"row":0,"column":0,"depth":0,"color":[75,0,130],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":0,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":0,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":0,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":0,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":0,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":0,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":0,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":1,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":1,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":1,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":1,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":1,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":1,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":1,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":1,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":2,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":2,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":2,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":2,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":2,"depth":0,"color":[75,0,130],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":2,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":2,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":2,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":3,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":3,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":3,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":3,"depth":0,"color":[255,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":3,"depth":0,"color":[255,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":3,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":3,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":3,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":4,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":4,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":4,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":4,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":4,"depth":0,"color":[255,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":4,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":4,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":4,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":5,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":5,"depth":0,"color":[0,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":5,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":5,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":5,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":5,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":5,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":5,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":6,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":6,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":6,"depth":0,"color":[0,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":6,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":6,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":6,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":6,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":6,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":7,"depth":0,"color":[75,0,130],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":7,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":7,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":7,"depth":0,"color":[75,0,130],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":7,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":7,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":7,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":7,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]}]',
            square: '[{"row":0,"column":0,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":0,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":0,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":0,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":0,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":0,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":0,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":0,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":1,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":1,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":1,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":1,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":1,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":1,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":1,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":1,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":2,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":2,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":2,"depth":0,"color":[0,255,255],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":2,"depth":0,"color":[0,255,255],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":2,"depth":0,"color":[0,255,255],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":2,"depth":0,"color":[0,255,255],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":2,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":2,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":3,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":3,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":3,"depth":0,"color":[0,255,255],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":3,"depth":0,"color":[255,0,255],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":3,"depth":0,"color":[255,0,255],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":3,"depth":0,"color":[0,255,255],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":3,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":3,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":4,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":4,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":4,"depth":0,"color":[0,255,255],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":4,"depth":0,"color":[255,0,255],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":4,"depth":0,"color":[255,0,255],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":4,"depth":0,"color":[0,255,255],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":4,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":4,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":5,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":5,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":5,"depth":0,"color":[0,255,255],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":5,"depth":0,"color":[0,255,255],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":5,"depth":0,"color":[0,255,255],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":5,"depth":0,"color":[0,255,255],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":5,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":5,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":6,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":6,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":6,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":6,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":6,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":6,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":6,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":6,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":7,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":7,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":7,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":7,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":7,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":7,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":7,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":7,"depth":0,"color":[255,127,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]}]',
            heart: '[{"row":0,"column":0,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":0,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":0,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":0,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":0,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":0,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":0,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":0,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":1,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":1,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":1,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":1,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":1,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":1,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":1,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":1,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":2,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":2,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":2,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":2,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":2,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":2,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":2,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":2,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":3,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":3,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":3,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":3,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":3,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":3,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":3,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":3,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":4,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":4,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":4,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":4,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":4,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":4,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":4,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":4,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":5,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":5,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":5,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":5,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":5,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":5,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":5,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":5,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":6,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":6,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":6,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":6,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":6,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":6,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":6,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":6,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":7,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":7,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":7,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":7,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":7,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":7,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":7,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":7,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]}]',
            smile: '[{"row":0,"column":0,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":0,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":0,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":0,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":0,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":0,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":0,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":0,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":1,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":1,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":1,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":1,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":1,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":1,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":1,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":1,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":2,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":2,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":2,"depth":0,"color":[75,0,130],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":2,"depth":0,"color":[75,0,130],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":2,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":2,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":2,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":2,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":3,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":4,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":5,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":5,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":5,"depth":0,"color":[75,0,130],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":5,"depth":0,"color":[75,0,130],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":5,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":5,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":5,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":5,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":6,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":6,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":6,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":6,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":6,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":6,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":6,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":6,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":7,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":7,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":7,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":7,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":7,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":7,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":7,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":7,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]}]',
            frown: '[{"row":0,"column":0,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":0,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":0,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":0,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":0,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":0,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":0,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":0,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":1,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":1,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":1,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":1,"depth":0,"color":[75,0,130],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":1,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":1,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":1,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":1,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":2,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":2,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":2,"depth":0,"color":[75,0,130],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":2,"depth":0,"color":[75,0,130],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":2,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":2,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":2,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":2,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":3,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":4,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":5,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":5,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":5,"depth":0,"color":[75,0,130],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":5,"depth":0,"color":[75,0,130],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":5,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":5,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":5,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":5,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":6,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":6,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":6,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":6,"depth":0,"color":[75,0,130],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":6,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":6,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":6,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":6,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":7,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":7,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":7,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":7,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":7,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":7,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":7,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":7,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]}]',
            wink: '[{"row":0,"column":0,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":0,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":0,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":0,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":0,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":0,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":0,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":0,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":1,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":1,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":1,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":1,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":1,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":1,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":1,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":1,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":2,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":2,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":2,"depth":0,"color":[75,0,130],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":2,"depth":0,"color":[75,0,130],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":2,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":2,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":2,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":2,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":3,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":3,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":4,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":4,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":5,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":5,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":5,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":5,"depth":0,"color":[75,0,130],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":5,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":5,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":5,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":5,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":6,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":6,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":6,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":6,"depth":0,"color":[75,0,130],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":6,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":6,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":6,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":6,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":7,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":7,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":7,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":7,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":7,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":7,"depth":0,"color":[255,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":7,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":7,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]}]',
            battleaxe: '[{"row":0,"column":0,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":0,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":0,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":0,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":0,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":0,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":0,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":0,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":1,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":1,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":1,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":1,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":1,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":1,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":1,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":1,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":2,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":2,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":2,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":2,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":2,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":2,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":2,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":2,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":3,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":3,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":3,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":3,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":3,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":3,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":3,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":3,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":4,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":4,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":4,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":4,"depth":0,"color":[0,255,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":4,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":4,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":4,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":4,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":5,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":5,"depth":0,"color":[0,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":5,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":5,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":5,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":5,"depth":0,"color":[75,0,130],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":5,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":5,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":6,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":6,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":6,"depth":0,"color":[0,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":6,"depth":0,"color":[255,0,0],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":6,"depth":0,"color":[255,255,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":6,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":6,"depth":0,"color":[75,0,130],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":6,"depth":0,"color":[0,0,255],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":0,"column":7,"depth":0,"color":[75,0,130],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":1,"column":7,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":2,"column":7,"depth":0,"color":[255,127,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":3,"column":7,"depth":0,"color":[75,0,130],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":4,"column":7,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":5,"column":7,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":6,"column":7,"depth":0,"color":[255,0,0],"on":false,"size":50,"clickable":true,"rotation":[0,0,0]},{"row":7,"column":7,"depth":0,"color":[75,0,130],"on":true,"size":50,"clickable":true,"rotation":[0,0,0]}]',
        }
    });

    Object.defineProperty(this, 'shapeNames', {
        enumerable: true,
        set: NOOP,
        get: function() {
            return Object.keys(this.shapes);
        },
    });

    Object.defineProperty(this, 'outerDimensions', {
        enumerable: false,
        set: NOOP,
        get: function() {
            return this.size * this.cellOptions.size;
        }
    });

    Object.defineProperty(this, 'isPlaying', {
        enumerable: false,
        get: function() {
            return _isPlaying;
        },
        set: function(nowPlaying) {
            _isPlaying = nowPlaying;

            if (_playButton instanceof HTMLElement)
            {
                _playButton.classList.toggle('playing', _isPlaying);
                _playButton.classList.toggle('paused', !_isPlaying);
            }

            if (_isPlaying)
            {
                clearInterval(this.animateInterval);
                this.animateInterval = setInterval(function() {
                    this.animationCb.apply(this);
                }.bind(this), this.playbackOptions.delay);
            } else
            {
                clearInterval(cube.animateInterval);
            }
        }
    });

    Object.defineProperty(this, 'colors', {
        enumerable: true,
        writable: false,
        value: {
            indigo: [75, 0, 130],
            blue: [0, 0, 255],
            cyan: [0, 255, 255],
            yellow: [255, 255, 0],
            green: [0, 255, 0],
            magenta: [255, 0, 255],
            orange: [255, 127, 0],
            red: [255, 0, 0],
            white: [255, 255, 255],
            gray: [125, 125, 125],
            black: [0, 0, 0],
        }
    });

    Object.defineProperty(this, 'colorNames', {
        enumerable: true,
        set: NOOP,
        get: function() {
            return Object.keys(this.colors);
        },
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

            _penColor = newColor;

            if (this.hasColorPicker)
            {
                var radioSelector = 'input[type="radio"][name="color"]';
                var radioElList = this.colorPickerContainerEl.querySelectorAll(radioSelector);
                var radioElArray = Array.prototype.slice.apply(radioElList);
                radioElArray.forEach(function(input) {
                    input.checked = (input.value === _penColor);
                    var swatch = input.nextElementSibling;
                    swatch.style.backgroundColor = swatch.dataset.color;
                });
            }
        }
    });

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

    function fetchJSONFile(path, successCb, failureCb) {
        /**
         * @amirmikhak
         * Helper function to make AJAX loading nicer. Grabbed from here: http://stackoverflow.com/questions/14388452/how-do-i-load-a-json-object-from-a-file-with-ajax
         */
        var httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = function() {
            if (httpRequest.readyState === 4)
            {
                if (httpRequest.status === 200)
                {
                    var data = JSON.parse(httpRequest.responseText);

                    successCb ? successCb(data) : NOOP();

                    return;
                }
            }

            failureCb ? failureCb() : NOOP();
        };
        httpRequest.open('GET', path);
        httpRequest.send();
    }

    /**
     * @amirmikhak
     * These functions are attached inside of the original definition of the cube
     * because they need access to "private" variables: _fontMap, _shapeMap.
     */
     this.loadFont = function(handle, url) {
         /**
          * @amirmikhak
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
        }.bind(this));
     };

     this.unloadFont = function(handle) {
         /**
          * @amirmikhak
          * Unload a previously loaded font.
          */

        delete(_fontMap[handle]);

        if (!Object.keys(_fontMap).length)
        {   // if there aren't any more loaded fonts after unloading this one...
            _activeFont = undefined;    // ... we can't have an active font
        } else if (handle === _activeFont)
        {   // if we unloaded our current font, but have another available...
            _activeFont = Object.keys(_fontMap)[0]; // ... use it
        }
     };

    this.cellOptions = defaultCellOptions;  // copy in the default options
    this.cellOptions = typeof cellOpts !== 'undefined' ? cellOpts : {}; // copy in what the user wanted

    // CONFIGURE FOR ARGUMENTS
    if (!(parentElement instanceof HTMLElement))
    {
        parentElement = document.getElementsByTag('body');
        parentElement = parentElement.length ? parentElement[0] : null;
        if (!parentElement)
        {
            throw 'No parent element for the cube';
        }
    }

    if (prevStepButton instanceof HTMLElement)
    {
        _prevStepButton = prevStepButton;
        _prevStepButton.addEventListener('click', function(event) {
            if (cube.isPlaying)
            {
                cube.pause();
            }

            cube.step(-1);
        });
    }

    if (nextStepButton instanceof HTMLElement)
    {
        _nextStepButton = nextStepButton;
        _nextStepButton.addEventListener('click', function(event) {
            if (cube.isPlaying)
            {
                cube.pause();
            }

            cube.step();
        });
    }

    if (playButton instanceof HTMLElement)
    {
        _playButton = playButton;
        _playButton.addEventListener('click', function(event) {
            if (cube.isPlaying)
            {
                cube.pause();
            } else
            {
                cube.play();
            }
        });
    }

    if (clearButton instanceof HTMLElement)
    {
        _clearButton = clearButton;
        _clearButton.addEventListener('click', function(event) {
            cube.clear();
        });
    }

    // SET UP REST OF SELF
    this.size = size; // How many rows and columns do I have?

    (function buildHTML() {
        // The HTML display of the cube istelf
        this.html = document.createElement('div');
        this.html.id = 'cube';

        this.html.style.height = this.outerDimensions + 'px';
        this.html.style.width = this.outerDimensions + 'px';
        this.html.style.transformStyle = 'preserve-3d';
        this.html.style.transformOrigin = [
            ['calc(', this.outerDimensions, 'px/2)'].join(''),
            ['calc(', this.outerDimensions, 'px/2)'].join(''),
            ['calc(-1 * ', this.outerDimensions, 'px/2)'].join(''),
        ].join(' ');

        htmlReadySuccessFn();
    }.bind(this)());

    this.cells = [];
    for (var depth = 0; depth < this.size; depth++) {
        // Iterate over each Z-plane
        for (var row = 0; row < this.size; row++) {
            // Iterate over each row
            for (var column = 0; column < this.size; column++) {
                // Iterate over each column

                // Create a cell
                var cell = new Cell({
                    cube: this,
                    size: this.cellOptions.size,
                    depth: depth,
                    column: column,
                    row: row,
                    clickable: depth === 0,
                });

                this.cells.push(cell);

                this.htmlReady.then(function() {
                    this.cells.forEach(function(cell) {
                        this.html.appendChild(cell.html); // Actually render the cell
                    }.bind(this));
                }.bind(this));
            }
        }
    }

    parentElement.appendChild(this.html); // Actually render the cube

    return this;
};

Cube.prototype.toJSON = function() {
    /**
     * @amirmikhak
     * Overrides the default (inherited) Object.toJSON() function to for custom
     * serialization. This is necessary because of the cube.html property,
     * which contains what are called "circular references," which prevent the
     * serializer from completing. To prevent this, we expose only the relevant
     * and serializable properties of the object.
     *
     * Example of a circular reference:
     *     var y = {
     *         property1: 'one',
     *         property2: 'two',
     *     };
     *     var x = {
     *         property1: 'aye',
     *         property2: 'bee',
     *         property3: y,
     *     };
     *     y.property3 = x;
     *
     * If you run the above code in the Chrome developer's console, you'll find
     * that both x and y are valid objects and that each points to the other.
     * You can verify this by expanding the properties of each (to see them,
     * just type each's variable name in the console and hit enter) and seeing
     * that the nesting of the objects never stops. This presents a problem for
     * the .toJSON() method because it's doing a similar traversal when
     * generating a string representation of each object.
     */
    return {
        size: this.size,
        cells: this.cells,
        playbackOptions: this.playbackOptions,
        cellOptions: this.cellOptions,
    };
};

Cube.prototype.nudge = function(direction, amount) {
    /**
     * @amirmikhak
     * Rotate the cube in a direction (left, right, up, down) by an amount
     * (in degrees).
     */
    amount = !isNaN(parseFloat(amount, 10)) ? amount : 1;

    switch (direction) {
        case 'left':
            this.yAngle -= amount;
            break;
        case 'up':
            this.xAngle += amount;
            break;
        case 'right':
            this.yAngle += amount;
            break;
        case 'down':
            this.xAngle -= amount;
            break;
    };

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.shiftPlane = function(axis, stepSize, wrap) {
    /**
     * @amirmikhak
     * Apply the state of any given cell to its n'th-away neighbor (stepSize)
     * along a given plane (axis: X, Y, Z). Wrap defines whether cells "fall
     * off" or wrap to the opposite face when shifting out of bounds.
     */
    stepSize = typeof stepSize !== 'undefined' ? stepSize : -1;
    wrap = typeof wrap !== 'undefined' ? !!wrap : true;

    var cube = this;

    function getNewValueForShift(cell, axis) {
        if ((cell[axis] + stepSize) >= 0 && (cell[axis] + stepSize) < cube.size)
        {   // your new coord originated from inside of bounds
            return (cell[axis] + stepSize) % cube.size;
        } else
        {   // your new coord originated from outside of bounds
            if (wrap)
            {   // reach around the other side
                return (cube.size + cell[axis] + stepSize) % cube.size;
            } else
            {   // screw it, your new value is nothing
                return -1;
            }
        }
    };

    function getNewRowForXShift(cell) {
        return getNewValueForShift(cell, 'row');
    }

    function getNewColForYShift(cell) {
        return getNewValueForShift(cell, 'column');
    }

    function getNewDepthForZShift(cell) {
        return getNewValueForShift(cell, 'depth');
    }

    var nextState = cube.cells.map(function(cell) {
        // We want to calculate the coordinates of the 'previous' cell along various directions
        var shiftedCoords = {
            'X': [
                getNewRowForXShift(cell),
                cell.column,
                cell.depth,
            ],
            'Y': [
                cell.row,
                getNewColForYShift(cell),
                cell.depth,
            ],
            'Z': [
                cell.row,
                cell.column,
                getNewDepthForZShift(cell),
            ]
        }[axis];

        // Once we have it, grab its on status and color and return it
        return {
            'on': cube.getCellAt(shiftedCoords[0], shiftedCoords[1], shiftedCoords[2]).on,
            'color': cube.getCellAt(shiftedCoords[0], shiftedCoords[1], shiftedCoords[2]).color
        };
    });

    // Iterate over all the cells and change their on status and color to their 'previous' neighbor's
    cube.cells.forEach(function(cell, index) {
        cell.on = false;
        cell.on = nextState[index].on;
        if (cell.on) {
            cell.color = nextState[index].color;
        }
    });

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.getCellAt = function(row, column, depth) {
    /**
     * @amirmikhak
     * Returns the cell for a given coordinate. If the coordinate is invalid,
     * return a Cell that is off and has no color. Note that this Cell does not
     * need to have a link to the cube or any other attributes set on it
     * because it represents an invalid point and is only used to set the state
     * of existing, valid cells. See cell.setFromCell() for the list of
     * properties that are copied between cells.
     */
    if ((row < 0) || (row > this.size - 1) ||
        (column < 0) || (column > this.size - 1) ||
        (depth < 0) ||  (depth > this.size - 1))
    {
        return new Cell({
            on: false,
            color: [0, 0, 0],
        });
    }

    var cellIndex = (depth * this.size * this.size) + (row * this.size) + column;
    return this.cells[cellIndex];
};

Cube.prototype.setCellAt = function(row, column, depth, newCell) {
    /**
     * @amirmikhak
     * Apply newCell's state to a cell at a given coordinate.
     *
     * Throws "Invalid coordinate" if the coordinate is impossible.
     */
    if ((row < 0) || (row > this.size - 1) ||
        (column < 0) || (column > this.size - 1) ||
        (depth < 0) ||  (depth > this.size - 1))
    {
        console.error('Invalid Coord', row, column, depth, newCell);
        throw 'Invalid coordinate';
    }

    var cellIndex = (depth * this.size * this.size) + (row * this.size) + column;
    var matchedCell = this.cells[cellIndex];

    matchedCell.setFromCell(newCell);

    return matchedCell;
};

Cube.prototype.applyCell = function(newCell) {
    /**
     * @amirmikhak
     * Convenience function for cube.setCellAt(). Expects a cell whose row,
     * column, and depth are all set. This may be useful for programatically
     * created Cell objects.
     */
    return this.setCellAt(newCell.row, newCell.column, newCell.depth, newCell);
};


/**
 * @amirmikhak
 * ANIMATION FUNCTIONS
 */

Cube.prototype.step = function(numSteps) {
    /**
     * @amirmikhak
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
         * @amirmikhak
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
     * @amirmikhak
     * Starts the animation loop. The loop can be stopped using cube.clear();
     */
    opts = typeof opts !== 'undefined' ? opts : {};

    this.playbackOptions = opts;
    this.isPlaying = true;

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.pause = function() {
    /**
     * @amirmikhak
     * Stop the animation loop. The loop can be started using cube.play();
     */
    this.isPlaying = false;

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.clear = function() {
    /**
     * @amirmikhak
     * Clear the contents of the cube.
     */
    this.cells.forEach(function(cell) {
        cell.on = false;
    });

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.buildPlaybackControls = function(parentEl) {
    var cube = this;

    this.hasPlaybackControls = true;
    this.playbackControlsContainerEl = parentEl;
    this.playbackControlsContainerEl.classList.add('playback-controls');
    this.playbackControlsContainerEl.innerHTML = (
        '<div class="radio-tabs">' +
            '<input id="direction-radio-back" type="radio" name="direction" value="back" />' +
            '<label for="direction-radio-back" class="control-button radio-tab">Back</label>' +
            '<input id="direction-radio-left" type="radio" name="direction" value="left" />' +
            '<label for="direction-radio-left" class="control-button radio-tab">Left</label>' +
            '<input id="direction-radio-up" type="radio" name="direction" value="up" />' +
            '<label for="direction-radio-up" class="control-button radio-tab">Up</label>' +
            '<input id="direction-radio-down" type="radio" name="direction" value="down" />' +
            '<label for="direction-radio-down" class="control-button radio-tab">Down</label>' +
            '<input id="direction-radio-right" type="radio" name="direction" value="right" />' +
            '<label for="direction-radio-right" class="control-button radio-tab">Right</label>' +
            '<input id="direction-radio-forward" type="radio" name="direction" value="forward" />' +
            '<label for="direction-radio-forward" class="control-button radio-tab">Forward</label>' +
        '</div>'
    );

    this.playbackControlsContainerEl.addEventListener('change', function(e) {
        if ((e.target.nodeName === 'INPUT') && (e.target.name === 'direction'))
        {
            cube.playbackOptions = {
                direction: e.target.value,
            };
        }
    });

    this.playbackOptions = {
        direction: this.playbackOptions.direction,  // trigger sync of DOM with state
    }

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.buildColorPicker = function(parentEl) {
    if (!this.hasColorPicker && (parentEl instanceof HTMLElement))
    {
        this.hasColorPicker = true;
        this.colorPickerContainerEl = parentEl;
        this.colorPickerContainerEl.classList.add('color-list');

        this.colorPickerContainerEl.innerHTML = (
            '<label class="swatch">' +
                '<input type="radio" name="color" value="indigo" />' +
                '<div data-color="indigo"></div>' +
            '</label>' +
            '<label class="swatch">' +
                '<input type="radio" name="color" value="blue" />' +
                '<div data-color="blue"></div>' +
            '</label>' +
            '<label class="swatch">' +
                '<input type="radio" name="color" value="cyan" />' +
                '<div data-color="cyan"></div>' +
            '</label>' +
            '<label class="swatch">' +
                '<input type="radio" name="color" value="yellow" />' +
                '<div data-color="yellow"></div>' +
            '</label>' +
            '<label class="swatch">' +
                '<input type="radio" name="color" value="green" />' +
                '<div data-color="green"></div>' +
            '</label>' +
            '<label class="swatch">' +
                '<input type="radio" name="color" value="magenta" />' +
                '<div data-color="magenta"></div>' +
            '</label>' +
            '<label class="swatch">' +
                '<input type="radio" name="color" value="orange" />' +
                '<div data-color="orange"></div>' +
            '</label>' +
            '<label class="swatch">' +
                '<input type="radio" name="color" value="red" />' +
                '<div data-color="red"></div>' +
            '</label>'
        );

        /**
         * @amirmikhak
         * Position the color picker
         */
        var colorPickerHeight = this.colorPickerContainerEl.getBoundingClientRect().height;

        /**
         * @amirmikhak
         * !TODO: Fix this. We need this correction look correct.
         */
        colorPickerHeight -= 100;

        this.colorPickerContainerEl.style.position = 'absolute';
        this.colorPickerContainerEl.style.top = [
            'calc(50% - ', colorPickerHeight / 2, 'px)'
        ].join('');
        this.colorPickerContainerEl.style.left = [
            'calc(50% - ', this.outerDimensions, 'px)'
        ].join('');

        /**
         * @amirmikhak
         * Add event listener for change in DOM to be reflected in Cube's model
         */
        this.colorPickerContainerEl.addEventListener('change', function(e) {
            if ((e.target.nodeName === 'INPUT') && (e.target.name === 'color'))
            {
                cube.penColor = e.target.value;
            }
        });

        /**
         * @amirmikhak
         * Sync DOM/Cube on build
         */
        this.penColor = this.penColor;
    }

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.buildShapePicker = function(parentEl) {
    if (!this.hasShapePicker && (parentEl instanceof HTMLElement))
    {
        this.hasShapePicker = true;
        this.shapePickerContainerEl = parentEl;
        this.shapePickerContainerEl.classList.add('shape-list');
        this.shapePickerContainerEl.innerHTML = this.shapeNames.map(function(shapeName) {
            var shapeRender = cube.getPngDataOfSlice(cube.shapes[shapeName]);
            var styles = [
                'background-image:url(\'' + shapeRender + '\')',
                'background-size:cover',
                'background-position:50% 50%',
            ].join(';');

            return [
                '<div class="swatch" data-shape="', shapeName, '" ',
                    'style="', styles, '"></div>'
            ].join('')
        }).join('');

        /**
         * @amirmikhak
         * Position the shape picker
         */
        var shapePickerHeight = this.shapePickerContainerEl.getBoundingClientRect().height;
        /**
         * @amirmikhak
         * !TODO: Fix this. We need this correction look correct.
         */
        shapePickerHeight -= 100;


        this.shapePickerContainerEl.style.position = 'absolute';
        this.shapePickerContainerEl.style.top = [
            'calc(50% - ', shapePickerHeight / 2, 'px)'
        ].join('');
        this.shapePickerContainerEl.style.right = [
            'calc(50% - ', this.outerDimensions, 'px)'
        ].join('');

        /**
         * @amirmikhak
         * Add event listener to parent, which will catch all events that bubble
         * up from children (the swatches).
         */
        this.shapePickerContainerEl.addEventListener('click', function(e) {
            if (e.target.dataset && e.target.dataset.shape)
            {
                cube.renderShape(e.target.dataset.shape);
            }
        });
    }

    return this;    // enables multiple calls on cube to be "chained"
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
        if (validKeyFns[cube.keyListenerOptions.keys](e))
        {
            return true;
        }

        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    this.actionKeyListenerFn = function(e) {
        var keyDirectionMap = {
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down',
            70 : 'front',   // "Front:  CTRL+F"
            66 : 'back',    // "Back:   CTRL+B"
            85 : 'up',      // "Up:     CTRL+U"
            68 : 'down',    // "Down:   CTRL+D"
            82 : 'right',   // "Right:  CTRL+R"
            76 : 'left',    // "Left:   CTRL+L"
        };

        function keyIsDirectionalAction() {
            return Object.keys(keyDirectionMap).indexOf(e.keyCode.toString()) !== -1;
        }

        if ((e.ctrlKey && (e.keyCode === 32)) || e.keyCode === 13)  // ctrl+space, or enter
        {
            e.preventDefault();
            e.stopPropagation();

            if (cube.isPlaying)
            {
                cube.pause();
            } else
            {
                cube.play();
            }
        } else if (e.keyCode === 8) // delete
        {
            e.preventDefault();
            e.stopPropagation();

            if (e.ctrlKey)
            {
                if (cube.isPlaying)
                {
                    cube.pause();
                }

                cube.clear();   // clear whole cube
            } else
            {
                cube.writeSlice(cube.getCharacterRender(' '), 'front');   // "space" character
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
        var char = String.fromCharCode(e.which);

        if (cube.keyListenerOptions.animate)
        {
            cube.writeSlice(cube.getCharacterRender(char), 'front');

            cube.play({
                direction: 'back',
                stepSize: cube.keyListenerOptions.stepSize,
                delay: cube.keyListenerOptions.animateRate,
            });
        } else
        {
            cube.writeSlice(cube.getCharacterRender(char), 'front');
        }
    };

    if (!this.listeningForKeystrokes)
    {
        document.addEventListener('keydown', this.validKeyFilterFn);
        document.addEventListener('keydown', this.actionKeyListenerFn);
        document.addEventListener('keypress', this.keyListenerFn);
        this.listeningForKeystrokes = true;
    }

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.stopListeningForKeystrokes = function() {
    if (this.keyListenerFn instanceof Function)
    {
        document.removeEventListener('keydown', this.validKeyFilterFn);
        document.removeEventListener('keypress', this.keyListenerFn);
        this.listeningForKeystrokes = false;
    }

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.getCharacterRender = function(char, desiredColor) {
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

    /**
     * @amirmikhak
     * Loop over each pixel to apply the current penColor if the pixel is on.
     */
    charPixels.forEach(function(cell) {
        if (cell.on)
        {
            cell.color = desiredColor;
        }
    });

    return charPixels;
};

Cube.prototype.renderShape = function(shape) {
    if (this.shapeNames.indexOf(shape) === -1)
    {
        console.error('Invalid shape. Known shapes: ' + this.shapeNames.join(', '));
        return;
    }

    cube.writeSlice(this.shapes[shape], 'front', 0);
};


/**
 * @amirmikhak
 * SLICE MANIPULATION FUNCTIONS
 */

Cube.prototype.affectXSlice = function(column, fn) {
    for (var depth = cube.size - 1; depth >= 0; depth--)
    {
        for (var row = 0; row < cube.size; row++)
        {
            fn.apply(this, [row, column, depth]);
        }
    }

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.affectYSlice = function(row, fn) {
    for (var column = 0; column < this.size; column++)
    {
        for (var depth = this.size - 1; depth >= 0; depth--)
        {
            fn.apply(this, [row, column, depth]);
        }
    }

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.affectZSlice = function(depth, fn) {
    for (var column = 0; column < cube.size; column++)
    {
        for (var row = 0; row < cube.size; row++)
        {
            fn.apply(this, [row, column, depth]);
        }
    }

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.readSlice = function(face, offset, output) {
    var cube = this;

    var validFaces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    var validOutputs = ['object', 'object-deep', 'json'];

    offset = (typeof offset !== 'undefined') ?
        Math.max(0, Math.min(parseInt(offset, 10), this.size - 1)) :
        0;
    face = (typeof face !== 'undefined') && (validFaces.indexOf(face) !== -1) ?
        face :
        'front';
    output = (typeof output !== 'undefined') && (validOutputs.indexOf(output) !== -1) ?
        output :
        'object-deep';

    var cells = [];

    function captureCell(r, c, d) {
        var cell = (output === 'object-deep') ?
            _.cloneDeep(this.getCellAt(r, c, d)) :
            this.getCellAt(r, c, d);
        cells.push(cell);
    }

    if ((face === 'front') || (face === 'back'))
    {
        var depth = (face === 'back') ? (cube.size - 1) - offset : offset;
        this.affectZSlice(depth, captureCell);
    } else if ((face === 'top') || (face === 'bottom'))
    {
        var row = (face === 'bottom') ? (this.size - 1) - offset : offset;
        this.affectYSlice(row, captureCell);
    } else if ((face === 'left') || (face === 'right'))
    {
        var column = (face === 'right') ? (cube.size - 1) - offset : offset;
        this.affectXSlice(column, captureCell);
    }

    if (output === 'json')
    {
        return JSON.stringify(cells);
    }

    return cells;
};

Cube.prototype.writeSlice = function(data, face, offset) {
    var cube = this;

    var validFaces = ['front', 'back', 'left', 'right', 'top', 'bottom'];

    offset = (typeof offset !== 'undefined') ?
        Math.max(0, Math.min(parseInt(offset, 10), this.size - 1)) :
        0;
    face = (typeof face !== 'undefined') && (validFaces.indexOf(face) !== -1) ?
        face :
        'front';

    try
    {   // handle different types of data input: JSON or raw object
        data = JSON.parse(data);    // throws SyntaxError if not valid JSON string
    } catch (err)
    {   // pass
    }

    if (!(data instanceof Array) || (data.length !== Math.pow(this.size, 2)))
    {
        throw 'Malformed data';
    }

    var cells = data.slice();

    function writeCellFromData(r, c, d) {
        var cell = cells.shift();
        this.setCellAt(r, c, d, cell);
    };

    if ((face === 'front') || (face === 'back'))
    {
        var depth = (face === 'back') ? (cube.size - 1) - offset : offset;
        this.affectZSlice(depth, writeCellFromData);
    } else if ((face === 'top') || (face === 'bottom'))
    {
        var row = (face === 'bottom') ? (this.size - 1) - offset : offset;
        this.affectYSlice(row, writeCellFromData);
    } else if ((face === 'left') || (face === 'right'))
    {
        var column = (face === 'right') ? (cube.size - 1) - offset : offset;
        this.affectXSlice(column, writeCellFromData);
    }

    return this;    // enables multiple calls on cube to be "chained"
};

Cube.prototype.getPngDataOfSlice = function(slice) {
    /**
     * @amirmikhak
     * Helper function to render icons that resemble 2d slices of the cube.
     * Returns a data url.
     *
     * Helpful links:
     * http://stackoverflow.com/questions/4899799/whats-the-best-way-to-set-a-single-pixel-in-an-html5-canvas
     * http://www.html5canvastutorials.com/advanced/html5-canvas-save-drawing-as-an-image/
     */

    var PNG_OUTPUT_WIDTH = 64;
    var PNG_OUTPUT_HEIGHT = 64;

    var PIXEL_MULTIPLIER_W = Math.floor(PNG_OUTPUT_WIDTH / this.size);
    var PIXEL_MULTIPLIER_H = Math.floor(PNG_OUTPUT_HEIGHT / this.size);

    var c;
    var ctx;
    var id;
    var d;

    this.sliceRenderer = {};

    c = this.sliceRenderer.c = document.createElement('canvas');
    c.width = PNG_OUTPUT_WIDTH;
    c.height = PNG_OUTPUT_HEIGHT;

    ctx = this.sliceRenderer.ctx = c.getContext('2d');

    id = ctx.createImageData(1, 1);
    d = id.data;

    try
    {   // handle different types of data input: JSON or raw object
        slice = JSON.parse(slice);    // throws SyntaxError if not valid JSON string
    } catch (err)
    {   // pass
    }

    if (!(slice instanceof Array) || (slice.length !== Math.pow(this.size, 2)))
    {
        throw 'Malformed data';
    }

    slice.forEach(function drawCell(cell) {
        var pixelOffsetX = cell.row * PIXEL_MULTIPLIER_W;
        var pixelOffsetY = cell.column * PIXEL_MULTIPLIER_H;

        for (var subpixelCol = 0; subpixelCol < PIXEL_MULTIPLIER_W; subpixelCol++)
        {
            for (var subpixelRow = 0; subpixelRow < PIXEL_MULTIPLIER_H; subpixelRow++)
            {
                d[0] = cell.color[0];
                d[1] = cell.color[1];
                d[2] = cell.color[2];
                d[3] = cell.on ? 255 : 0;

                var y = pixelOffsetX + subpixelRow; // the x/y are swapped in the slice serialization
                var x = pixelOffsetY + subpixelCol;

                ctx.putImageData(id, x, y);
            }
        }
    });

    return c.toDataURL();
};