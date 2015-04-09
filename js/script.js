var cube;
window.addEventListener('load', function() { // When everything is loaded

    var cubeWrapper = document.getElementById('cube-wrapper');

    var nextStepButton = document.getElementById('next-step');
    var prevStepButton = document.getElementById('prev-step');
    var playButton = document.getElementById('play');
    var clearButton = document.getElementById('clear');
    var colorPickerEl = document.getElementById('color-picker');
    var playbackControlsEl = document.getElementById('playback-controls');
    var shapePickerEl = document.getElementById('shape-picker');

    cube = new Cube(8, prevStepButton, nextStepButton, playButton, clearButton, {
        size: 50,
    });

    cube.loadFont('printChar21', 'js/assets/cube8PrintChar21Font.json');
    cube.container = cubeWrapper;
    cube.colorPicker = colorPickerEl;
    cube.playbackControls = playbackControlsEl;

    cube.buildShapePicker(shapePickerEl);

    cube.listenForKeystrokes();

    cube.xAngle = -30;
    cube.yAngle = 30;

    var prevTransitionDuration;

    var KEY_LISTEN_RATE = 10;   // in milliseconds
    document.addEventListener('keydown', _.throttle(function(event) {
        if (event.ctrlKey || event.altKey)
        {
            return;
        }

        var keyDirectionMap = {
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down',
        };

        var direction = keyDirectionMap[event.keyCode];
        if (direction)
        {
            if (parseInt(cube.html.style.transitionDuration, 10) > 0)
            {
                prevTransitionDuration = cube.html.style.transitionDuration;
                cube.html.style.transitionDuration = 0;
            }
            cube.nudge(direction);
        }
    }, KEY_LISTEN_RATE), false);

    document.addEventListener('keyup', function(event) {
        if (!event.shiftKey)
        {
            return;
        }

        switch (event.keyCode) {
            case 37: // left
            case 38: // up
            case 39: // right
            case 40: // down
                cube.html.style.transitionDuration = prevTransitionDuration;
                break;
        };
    }, false);
});
