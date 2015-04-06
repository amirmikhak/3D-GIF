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

    var KEY_LISTEN_RATE = 10;   // in milliseconds
    document.body.addEventListener("keydown", _.throttle(function(event) {
        switch (event.keyCode) {
            case 37: // left
                cube.nudge('left');
                break;
            case 38: // up
                cube.nudge('up');
                break;
            case 39: // right
                cube.nudge('right');
                break;
            case 40: // down
                cube.nudge('down');
                break;
        };
    }, KEY_LISTEN_RATE), false);
});
