var cube;
window.addEventListener('load', function() { // When everything is loaded

    cube = new Cube(8, {
        size: 50,
    });

    cube.loadFont('printChar21', 'js/assets/cube8PrintChar21Font.json');

    cube.container = document.getElementById('cube-wrapper');
    cube.prevStepButton = document.getElementById('prev-step');
    cube.nextStepButton = document.getElementById('next-step');
    cube.playButton = document.getElementById('play');
    cube.clearButton = document.getElementById('clear');
    cube.playbackControls = document.getElementById('playback-controls');
    cube.colorPicker = document.getElementById('color-picker');
    cube.shapePicker = document.getElementById('shape-picker');

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
