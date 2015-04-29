// Build a DOM Renderer for the cube so we can see it
var domRenderer = new CubeDOMRenderer({
    container: document.getElementById('cube-wrapper'),
    listenForKeyEvents: true,
    xAngle: -30,
    yAngle: 30,
    cellConfig: {
        size: 45,
        rotate: false,
    },
});

var plCube = new Cube(8);
var plController = new CubePlaylistController({
    cube: plCube,
    penColor: 'red',
    renderer: domRenderer,
    animationInterval: 100,
    mode: 'around',
    writeFace: 'front',
    spacing: 0,
});

var rtCube = new Cube(8);
var rtController = new CubeRealtimeUserController({
    cube: rtCube,
    penColor: 'blue',
    renderer: domRenderer,
    frameCacheSize: 200,
});

var CubeAssets = new CubeAssetsStore();
CubeAssets.loadFont('printChar21', '/js/assets/cube8PrintChar21Font.json');
CubeAssets.loadShapeSet('basic', '/js/assets/cube8BasicShapes.json', function() {
    console.log('adding shape tiles to playlist...');
    plController.insertTiles([
        CubeAssets.getShapeRender('smile'),
        CubeAssets.getShapeRender('battleaxe'),
        CubeAssets.getShapeRender('battleaxe'),
        CubeAssets.getShapeRender('battleaxe'),
        CubeAssets.getShapeRender('battleaxe'),
        CubeAssets.getShapeRender('battleaxe'),
        CubeAssets.getShapeRender('frown'),
        CubeAssets.getShapeRender('square'),
    ]);
    console.log('done adding shape tiles!');
});
