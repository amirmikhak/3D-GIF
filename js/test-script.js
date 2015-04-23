var cube;
var cubeRenderer;

window.addEventListener('load', function() { // When everything is loaded

    // Build a new Cube object
    cube = new Cube(8);
    cube.controller = new CubeRealtimeUserController();
    cube.renderer = new CubeDOMRenderer({
        container: document.getElementById('cube-wrapper'),
        listenForKeyEvents: true,
        xAngle: -30,
        yAngle: 30,
        cellConfig: {
            size: 45,
            rotate: false,
        },
    });

});
