var cube;
var cubeRenderer;

var CubeAssets = new CubeAssetsStore();
CubeAssets.loadFont('printChar21', '/js/assets/cube8PrintChar21Font.json');
CubeAssets.loadShapeSet('basic', '/js/assets/cube8BasicShapes.json');

window.addEventListener('load', function() { // When everything is loaded

    // Build a new Cube object
    cube = new Cube(8);
    // cube.controller = new CubeRealtimeUserController();
    cube.controller = new CubePlaylistController();
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
