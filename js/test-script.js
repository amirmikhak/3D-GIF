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

var appCtrl = new AppController({
    renderer: domRenderer,
});
appCtrl.loadController('realtime', new CubeRealtimeUserController({
    cube: new Cube(8),
    penColor: 'blue',
    frameCacheSize: 200,
})).loadController('playlist', new CubePlaylistController({
    cube: new Cube(8),
    penColor: 'red',
    animationInterval: 100,
    mode: 'around',
    writeFace: 'front',
    spacing: 0,
}));

var CubeAssets = new CubeAssetsStore();
CubeAssets.loadFont('printChar21', '/js/assets/cube8PrintChar21Font.json');
CubeAssets.loadShapeSet('basic', '/js/assets/cube8BasicShapes.json', function() {
    console.log('adding shape tiles to playlist...');
    appCtrl.activeController = 'playlist';
    appCtrl.activeController.insertTiles([
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

