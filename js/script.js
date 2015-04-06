var cube;
window.addEventListener('load', function() { // When everything is loaded

    var cubeWrapper = document.getElementById('cube-wrapper');
    var playButton = document.getElementById('play');
    var clearButton = document.getElementById('clear');

    cube = new Cube(8, cubeWrapper, playButton, clearButton, {
        size: 50,
    });

    cube.buildPlaybackControls(document.getElementById('playback-controls'));

    cube.listenForKeystrokes();

    var prevTransitionDuration;

    var KEY_LISTEN_RATE = 10;   // in milliseconds
    document.body.addEventListener('keydown', _.throttle(function(event) {
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

    document.body.addEventListener('keyup', function(event) {
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

    var prevTransitionDuration = cube.html.style.transitionDuration;

    cube.html.style.transitionDuration = 0;

    cube.html.style.transitionDuration = prevTransitionDuration;

});
