var cube;
window.addEventListener('load', function() { // When everything is loaded

    var cubeWrapper = document.getElementById('cube-wrapper');

    var stepButton = document.getElementById('step');
    var playButton = document.getElementById('play');
    var clearButton = document.getElementById('clear');

    cube = new Cube(8, cubeWrapper, stepButton, playButton, clearButton, {
        size: 50,
    });

    cube.buildPlaybackControls(document.getElementById('playback-controls'));
    cube.buildColorPicker(document.getElementById('color-picker'));
    cube.buildShapePicker(document.getElementById('shape-picker'));

    cube.listenForKeystrokes();

    cube.xAngle = -30;
    cube.yAngle = 30;

    var prevTransitionDuration;

    var KEY_LISTEN_RATE = 10;   // in milliseconds
    document.addEventListener('keydown', _.throttle(function(event) {
        if (!event.shiftKey)
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
                console.log('restoring duration', prevTransitionDuration);
                cube.html.style.transitionDuration = prevTransitionDuration;
                break;
        };
    }, false);
});
