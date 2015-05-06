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
    controllerInitCb: function(appCtrl) {
        var ctrl = appCtrl.activeController;
        if (ctrl && ctrl.hasOwnProperty('penColor'))
        {
            this.selectedColor = ctrl.penColor;
        }
        if (appCtrl.renderer && appCtrl.renderer.hasOwnProperty('outerDimensions'))
        {
            this.cubeOuterDimensions = appCtrl.renderer.outerDimensions;
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
})).addComponent('writeFacePicker', new UIDOMFacePicker({
    containerEl: document.getElementsByClassName('write-face-picker')[0],
    controllerInitCb: function(appCtrl) {
        var ctrl = appCtrl.activeController;
        this.enabledFaces = ctrl && ctrl.currentSupportedFaces ? (ctrl.currentSupportedFaces || null) : null;
        if (appCtrl.renderer && appCtrl.renderer.can('applyViewAngle'))
        {
            appCtrl.renderer.applyViewAngle(ctrl && ctrl.writeFace ? (ctrl.writeFace || 'front') : 'front');
        }
    },
    componentEventCb: function(event) {
        if (event.ctrl.hasOwnProperty('writeFace'))
        {
            event.ctrl.writeFace = event.data;
            if (event.ctrl.renderer && event.ctrl.renderer.can('applyViewAngle'))
            {
                event.ctrl.renderer.applyViewAngle(event.ctrl.writeFace || 'front');
            }
            return;
        }
    },
    controllerEventCb: function(event) {
        if (_eventPropertyChangedIs(event, 'activeController') ||
            _eventPropertyChangedIs(event, 'mode'))
        {
            this.enabledFaces = event.ctrl.currentSupportedFaces || null;
            if (this.enabledFaces && (this.enabledFaces.indexOf(this.selectedFace) === -1))
            {
                this.selectedFace = this.enabledFaces.length ? this.enabledFaces[0] : null;
                if (event.ctrl.renderer && event.ctrl.renderer.can('applyViewAngle'))
                {
                    event.ctrl.renderer.applyViewAngle(event.ctrl.writeFace || 'front');
                }
            }
        } else if (_eventPropertyChangedIs(event, 'writeFace'))
        {
            if (event.ctrl.renderer && event.ctrl.renderer.can('applyViewAngle'))
            {
                event.ctrl.renderer.applyViewAngle(event.ctrl.writeFace || 'front');
            }
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
})).addComponent('realtimeControls', new UIDOMRealtimeControls({
    containerEl: document.getElementsByClassName('realtime-controls')[0],
    controllerInitCb: function(appCtrl) {
        var ctrl = appCtrl.activeController;
        if (ctrl && ctrl.direction) {
            this.selectedDirection = ctrl.direction;
        }
    },
    componentEventCb: function(event) {
        if (event.ctrl.hasOwnProperty('directions') &&
            (event.ctrl.directions.indexOf(event.data) !== -1))
        {
            event.ctrl.direction = event.data;
            return;
        }
    },
    controllerEventCb: function(event) {
        if (_eventPropertyChangedIs(event, 'activeController'))
        {
            // !TODO: consider a more elegant way (not using instanceof) of determining whether this should be visible
            if (event.ctrl instanceof CubeRealtimeUserController)
            {
                this.bringToFront();
                this.selectedDirection = event.ctrl.direction;
                // !TODO: add support for setting animationInterval from GUI
                // this.selectedAnimationInterval = event.ctrl.animationInterval;
            } else
            {
                this.sendToBack();
            }
        }
    },
})).addComponent('playlistControls', new UIDOMPlaylistControls({
    containerEl: document.getElementsByClassName('playlist-controls')[0],
    controllerInitCb: function(appCtrl) {
        var ctrl = appCtrl.activeController;
        if (ctrl && ctrl.direction) {
            this.selectedDirection = ctrl.direction;
        }
        if (ctrl && ctrl.wrapDirection) {
            this.selectedWrapDirection = ctrl.wrapDirection;
        }
        if (ctrl && ctrl.fullTileData) {
            this.tiles = ctrl.fullTileData;
        }
    },
    componentEventCb: function(event) {
        var enumProperties = ['wrapDirection', 'mode'];
        enumProperties.forEach(function(prop) {
            if (event.ctrl.hasOwnProperty(prop + 's') && event.ctrl[prop + 's'].indexOf(event.data) !== -1)
            {
                event.ctrl[prop] = event.data;
            }
        });
        if (event.type === 'loopingChanged')
        {
            if (event.ctrl.hasOwnProperty('looping'))
            {
                event.ctrl.looping = !!event.data;
            }
        } else if (event.type === 'spacingChanged')
        {   // !TODO: add handing for spacingChanged to UIDOMPlaylistControls
        } else if (event.type === 'animationIntervalChanged')
        {   // !TODO: add handing for animationIntervalChanged to UIDOMPlaylistControls
        } else if (event.type === 'tileAdded')
        {
            if (!event.ctrl.can('insertTile'))
            {
                return;
            }
            var cubeTile;
            if (event.data.tileType === 'raw')
            {
                cubeTile = event.data.tileData;
            } else if (event.data.tileType === 'character')
            {
                var colorRGB = event.ctrl.cube.colors[event.ctrl.penColor];
                cubeTile = CubeAssets.getCharacterRender(event.data.tileData, colorRGB);
            } else if (event.data.tileType === 'shapeIndex')
            {
                var shapeName = Object.keys(CubeAssets.activeShapeSetShapes)[event.data.tileData];
                if (shapeName)
                {
                    cubeTile = CubeAssets.getShapeRender(shapeName);
                }
            }
            event.ctrl.insertTile.apply(event.ctrl, [
                (cubeTile ? cubeTile : new EmptyCubeTile()),
                event.data.tileIdx,
            ]);
            this.cursorPosition++;
        } else if (event.type === 'tileBackspaced')
        {
            var tileIndex = event.data - 1;
            if (tileIndex >= 0)
            {
                event.ctrl.removeTileByIndex.call(event.ctrl, tileIndex);
                this.cursorPosition--;
            }
        } else if (event.type === 'tileDeleted')
        {
            if (event.data < event.ctrl.getTiles().length)
            {
                event.ctrl.removeTileByIndex.call(event.ctrl, event.data);
            }
        } else if (event.type === 'playToggled')
        {
            event.ctrl.togglePlaying();
        }
    },
    controllerEventCb: function(event) {
        if (_eventPropertyChangedIs(event, 'activeController'))
        {
            // !TODO: consider a more elegant way (not using instanceof) of determining whether this should be visible
            if (event.ctrl instanceof CubePlaylistController)
            {
                this.selectedLooping = event.ctrl.looping;
                this.selectedMode = event.ctrl.mode;
                this.selectedWrapDirection = event.ctrl.wrapDirection;
                this.tiles = event.ctrl.fullTileData;
                // !TODO: add support for setting spacing from GUI
                // this.selectedSpacing = event.ctrl.spacing;
                // !TODO: add support for setting animationInterval from GUI
                // this.selectedAnimationInterval = event.ctrl.animationInterval;
                this.bringToFront();
            } else
            {
                this.sendToBack();
            }
        } else if (_eventPropertyChangedIs(event, 'looping'))
        {
            this.selectedLooping = event.ctrl.looping;
        } else if (_eventPropertyChangedIs(event, 'mode'))
        {
            this.selectedMode = event.ctrl.mode;
        } else if (_eventPropertyChangedIs(event, 'wrapDirection'))
        {
            this.selectedWrapDirection = event.ctrl.wrapDirection;
        } else if (_eventPropertyChangedIs(event, 'playlistTiles'))
        {
            this.tiles = event.ctrl.fullTileData;
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
    controllerInitCb: function(appCtrl) {
        var ctrl = appCtrl.activeController;
        if (ctrl && ctrl.hasOwnProperty('playing'))
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
        } else if (event.type === 'renderingFrames')
        {
            this.containerEl.classList.toggle('rendering', (event.data.state === 'busy'));
        }

        function _setPlaying(newPlaying) {
            this.containerEl.classList.toggle('playing', newPlaying);
            this.checked = newPlaying;
        }
    },
})).addComponent('modeToggle', new UIDOMLabelledButton({
    containerEl: document.getElementsByClassName('playback-mode')[0],
    controllerInitCb: function(appCtrl) {
        this.label = appCtrl.activeControllerKey || '';
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
