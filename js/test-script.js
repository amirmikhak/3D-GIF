var cubeContainer = document.getElementById('cube-wrapper');

// Build a new Cube object
var cube = new Cube(8);

var domRenderer = new CubeDOMRenderer({
    container: cubeContainer,
    listenForKeyEvents: true,
    xAngle: -30,
    yAngle: 30,
    cellConfig: {
        size: 45,
        rotate: false,
    },
});

var plController = new CubePlaylistController({
    cube: cube,
    penColor: 'red',
    renderer: domRenderer,
    animationInterval: 100,
    mode: 'around',
    writeFace: 'front',
    spacing: 0,
});

var rtController = new CubeRealtimeUserController({
    cube: cube,
    penColor: 'blue',
    renderer: domRenderer,
    frameCacheSize: 200,
});

var CubeAssets = new CubeAssetsStore();
CubeAssets.loadFont('printChar21', '/js/assets/cube8PrintChar21Font.json');
CubeAssets.loadShapeSet('basic', '/js/assets/cube8BasicShapes.json', function() {
    console.log('adding shape tiles to playlist...');
    plController.appendTile(CubeAssets.getShapeRender('smile'));
    plController.appendTile(CubeAssets.getShapeRender('battleaxe'));
    plController.appendTile(CubeAssets.getShapeRender('battleaxe'));
    plController.appendTile(CubeAssets.getShapeRender('battleaxe'));
    plController.appendTile(CubeAssets.getShapeRender('battleaxe'));
    plController.appendTile(CubeAssets.getShapeRender('battleaxe'));
    plController.appendTile(CubeAssets.getShapeRender('frown'));
    plController.appendTile(CubeAssets.getShapeRender('square'));
    console.log('done adding shape tiles!');
});
