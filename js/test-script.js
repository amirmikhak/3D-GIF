var _eventPropertyChangedIs = function(e, p) {
    return (e.type === 'propertyChanged') && e.data && (e.data.property === p);
}

var CubeAssets = new CubeAssetsStore();
CubeAssets.loadFont('printChar21', '/js/assets/cube8PrintChar21Font.json');
var loadShapes = new Promise(function(success, failure) {
    CubeAssets.loadShapeSet('basic', '/js/assets/cube8BasicShapes.json', success);
});

var domMediator = new UIMediator({
}).addComponent('colorPicker', new UIDOMColorPicker({
    containerEl: document.getElementsByClassName('color-picker')[0],
    cubeOuterDimensions: 360,
    controllerInitCb: function(ctrl) {
        if (ctrl.hasOwnProperty('penColor'))
        {
            this.selectedColor = ctrl.penColor;
        }
        if (ctrl.renderer && ctrl.renderer.hasOwnProperty('outerDimensions'))
        {
            this.cubeOuterDimensions = ctrl.renderer.outerDimensions;
        }
    },
    componentEventCb: function(event) {
        if (event.type === 'colorSelected')
        {
            event.ctrl.penColor = event.data;
        }
    },
    controllerEventCb: function(event) {
        if (_eventPropertyChangedIs(event, 'penColor'))
        {
            this.selectedColor = event.data.newValue;
        } else if (_eventPropertyChangedIs(event, 'activeController'))
        {
            this.selectedColor = event.ctrl.penColor;
        } else if (event.type === 'rendererPropertyChanged')
        {
            this.cubeOuterDimensions = event.ctrl.renderer.outerDimensions;
        }
    },
})).addComponent('shapePicker', new UIDOMShapePicker({
    containerEl: document.getElementsByClassName('shape-picker')[0],
    shapes: CubeAssets.activeShapeSetShapes,
    componentEventCb: function(event) {
        if (event.ctrl.can('write'))
        {
            event.ctrl.write.call(event.ctrl, this.shapes[event.data]);
            return;
        }
    },
    controllerEventCb: function(event) {
        if (event.type === 'rendererPropertyChanged')
        {
            this.cubeOuterDimensions = event.ctrl.renderer.outerDimensions;
        }
    },
})).addComponent('clearButton', new UIDOMClearButton({
    containerEl: document.getElementsByClassName('clear')[0],
    componentEventCb: function(event) {
        if (event.ctrl.can('clear'))
        {
            event.ctrl.clear.call(event.ctrl, event.data);
            return;
        }
    },
})).addComponent('playToggle', new UIDOMPlayingCheckbox({
    containerEl: document.getElementsByClassName('play')[0],
    controllerInitCb: function(ctrl) {
        if (ctrl.hasOwnProperty('playing'))
        {
            this.checked = ctrl.playing;
            this.containerEl.classList.toggle('playing', this.checked);
        }
    },
    componentEventCb: function(event) {
        if (event.ctrl.hasOwnProperty('playing'))
        {
            this.containerEl.classList.toggle('playing', this.checked);
            event.ctrl.playing = this.checked;
        }
    },
    controllerEventCb: function(event) {
        if (_eventPropertyChangedIs(event, 'playing'))
        {
            _setPlaying.call(this, event.data.newValue);
        } else if (_eventPropertyChangedIs(event, 'activeController'))
        {
            _setPlaying.call(this, event.ctrl.playing);
        }

        function _setPlaying(newPlaying) {
            this.containerEl.classList.toggle('playing', newPlaying);
            this.checked = newPlaying;
        }
    },
})).addComponent('modeToggle', new UIDOMLabelledButton({
    containerEl: document.getElementsByClassName('playback-mode')[0],
    controllerInitCb: function(ctrl) {
        this.label = ctrl.activeControllerKey || '';
    },
    componentEventCb: function(event) {
        event.appCtrl.useNextController();
    },
    controllerEventCb: function(event) {
        if (_eventPropertyChangedIs(event, 'activeController'))
        {
            this.label = event.data.newValue;
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
    console.log('assigning shapes to shape-picker component', CubeAssets.activeShapeSetShapes);
    domMediator.getComponent('shapePicker').shapes = CubeAssets.activeShapeSetShapes;

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
