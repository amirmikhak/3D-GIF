var cube = null;
var cubeController = null;
var cubeRenderer = null;

var CubeAssets = new CubeAssetsStore();
CubeAssets.loadFont('printChar21', '/js/assets/cube8PrintChar21Font.json');
CubeAssets.loadShapeSet('basic', '/js/assets/cube8BasicShapes.json');

var cubeContainer = document.getElementById('cube-wrapper');

window.addEventListener('load', function() { // When everything is loaded

    // Build a new Cube object
    cube = new Cube(8);

    var rtController = new CubeRealtimeUserController({
        cube: cube,
        penColor: 'red',
    });

    var plController = new CubePlaylistController({
        cube: cube,
        penColor: 'red',
    });

    var domRenderer = new CubeDOMRenderer({
        cube: cube,
        container: cubeContainer,
        listenForKeyEvents: true,
        xAngle: -30,
        yAngle: 30,
        cellConfig: {
            size: 45,
            rotate: false,
        },
    });

    cube.controller = cubeController = plController;
    cube.renderer = cubeRenderer = domRenderer;
});
