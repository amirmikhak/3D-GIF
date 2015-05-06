var cube;
var cubeUI;

window.addEventListener('load', function() { // When everything is loaded

    // Define cell properties for passing into the Cube
    var cellOptions = {
        size: 45,
    };

    // Build a new Cube object
    cube = new Cube(8, cellOptions);

    // Load the cube's typeface
    cube.loadFont('printChar21', 'js/assets/cube8PrintChar21Font.json');

    // Build the UI for the cube
    cubeUI = new CubeUI(cube, {
        cubeContainer: document.getElementById('cube-wrapper'),
        cubeXAngle: -30,
        cubeYAngle: 30,
        cubeTransitionTransforms: true,
        playButton: document.getElementById('play'),
        clearButton: document.getElementById('clear'),
        prevStepButton: document.getElementById('prev-step'),
        nextStepButton: document.getElementById('next-step'),
        modeToggleButton: document.getElementById('playback-mode'),
        realtimeUI: document.getElementById('realtime-controls'),
        playlistUI: document.getElementById('playlist-controls'),
        colorPicker: document.getElementById('color-picker'),
        shapePicker: document.getElementById('shape-picker'),
        writeFacePicker: document.getElementById('write-face-picker'),
    });

    // Listen for keyboard shortcuts (except nudging)
    //  and for characters being pressed to display
    cube.listenForKeystrokes();

    (function bindCubeRotationKeyListeners() {
        /**
         * Add cube rotation listeners
         */

        var KEY_LISTEN_RATE = 10;   // in milliseconds

        var keyDirectionMap = {
            /**
             * Which keyCodes correspond to which directions of movement for the
             * cube
             */
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down',
        };

        document.addEventListener('keydown', _.throttle(function(e) {
            if (e.ctrlKey || e.altKey)
            {
                // don't try to move the cube if the ctrl or alt keys are down
                return;
            } else if (cube.playlist && cube.playlist.focus)
            {   // don't try to move the cube if the cube's playlist has focus
                return;
            }

            var direction = keyDirectionMap[e.keyCode];
            if (direction)
            {
                /**
                 * If the keyCode pressed has a binding for a direction in the map
                 * above, disable CSS transitions so that they don't interfere
                 * during our rapid changes to the cube's transform property.
                 */
                cube.transitionTransforms = false;
                cube.nudge(direction);  // actually rotate the cube
            }
        }, KEY_LISTEN_RATE), false);

        document.addEventListener('keyup', function(e) {
            if (keyDirectionMap[e.keyCode])
            {   // if we are done rotating the cube...
                cube.transitionTransforms = true;    // ... restore the transitions
            }
        }, false);
    }());
});
