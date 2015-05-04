var CubeAssets = new CubeAssetsStore();
CubeAssets.loadFont('printChar21', '/js/assets/cube8PrintChar21Font.json');
var loadShapes = new Promise(function(success, failure) {
    CubeAssets.loadShapeSet('basic', '/js/assets/cube8BasicShapes.json', success);
});

var domMediator = new UIMediator({
}).addComponent('clearButton', new UIDOMClearButton({
    containerEl: document.getElementsByClassName('clear')[0],
    componentEventCb: function(event) {
        /*
         * "this" is component
         * event.ctrl === activeController
         * event.type === type from "original" event (from component)
         * event.data === data from "original" event (from component)
         */
        if (event.ctrl.can('clear'))
        {
            event.ctrl.clear.call(event.ctrl, event.data);
            return;
        }
    },
})).addComponent('playToggle', new UIDOMPlayingCheckbox({
    containerEl: document.getElementsByClassName('play')[0],
    componentEventCb: function(event) {
        /*
         * "this" is component
         * event.ctrl === activeController
         * event.type === type from "original" event (from component)
         * event.data === data from "original" event (from component)
         */
        this.html.classList.toggle('playing', this.checked);
        if (event.ctrl.hasOwnProperty('playing'))
        {
            event.ctrl.playing = this.checked;
            return;
        }
    },
}));

// Build a DOM Renderer for the cube so we can see it
var domRenderer = new CubeDOMRenderer({
    mediator: domMediator,
    container: document.getElementsByClassName('cube-wrapper')[0],
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
    mediator: domMediator,
}).loadController('realtime', new CubeRealtimeUserController({
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

loadShapes.then(function shapesLoaded() {
    appCtrl.mediator.addComponent('shapePicker', new UIDOMShapePicker({
        containerEl: document.getElementsByClassName('shape-picker')[0],
        shapesGetter: function() { return CubeAssets.activeShapeSetShapes; },
        componentEventCb: function(event) {
            /*
             * "this" is component
             * event.ctrl === activeController
             * event.type === type from "original" event (from component)
             * event.data === data from "original" event (from component)
             */
            if (event.ctrl.can('write'))
            {
                event.ctrl.write.call(event.ctrl, event.data);
                return;
            }
        },
    }));

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
