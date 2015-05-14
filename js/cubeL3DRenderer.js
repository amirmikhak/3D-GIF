var Neopixels = require('neopixels');

var CubeL3DRenderer = function CubeL3DRenderer(opts) {

    CubeRenderer.apply(this, arguments);

    this._options = {};

    var __defaultOptions = {};

    var __parentDefaultOptions = this.getDefaultOptions();
    var _parentOptionKeys = Object.keys(__parentDefaultOptions);
    for (var i = 0, numOpts = _parentOptionKeys.length; i < numOpts; i++) {
        __defaultOptions[_parentOptionKeys[i]] = (_parentOptionKeys[i] in __defaultOptions) ?
            __defaultOptions[_parentOptionKeys[i]] :
            __parentDefaultOptions[_parentOptionKeys[i]];
    }

    var _opts = opts || {};
    var _optionKeys = Object.keys(__defaultOptions);
    for (var i = 0, numOpts = _optionKeys.length; i < numOpts; i++) {
        this._options[_optionKeys[i]] = (_optionKeys[i] in _opts) ?
            _opts[_optionKeys[i]] :
            __defaultOptions[_optionKeys[i]];
    }

    this._np = new Neopixels();
    this._buffer = new Buffer(this.numCells * 3);
    this._buffer.fill(0);

    this._animationStartTime = (new Date()).getTime();
    this._renderStartTime = this._animationStartTime;
    this._lastRendererTime = this._animationStartTime;
    this.__animationFrameRef = 0;
    this.__getRenderFrameCb = function() { console.log('default __getRenderFrameCb()'); };

    this.getDefaultOptions = function() {
        return __defaultOptions;
    };

    applyOptions.call(this, this._options);

    return this;

};

CubeL3DRenderer.prototype = Object.create(CubeRenderer.prototype);
CubeL3DRenderer.prototype.constructor = CubeL3DRenderer;

Object.defineProperty(CubeL3DRenderer.prototype, 'animationStartTime', {
    get: function() { return this._animationStartTime; },
});

Object.defineProperty(CubeL3DRenderer.prototype, 'lastRenderedTime', {
    get: function() { return this._lastRenderedTime; },
});

Object.defineProperty(CubeL3DRenderer.prototype, 'renderStartTime', {
    get: function() { return this._renderStartTime; },
});

CubeL3DRenderer.prototype.render = function(cubeData) {
    if (!this._running)
    {
        return;
    } else if ((this.cube === cubeData) && (this._prevCube !== cubeData))
    {
        return;
    }

    this._prevCube = this.cube;

    for (var i = 0, numCells = this.numCells; i < numCells; i++)
    {
        this._buffer[i] = this.cube.cells[i].color[0];
        this._buffer[i + 1] = this.cube.cells[i].color[1];
        this._buffer[i + 2] = this.cube.cells[i].color[2];
    }

    this._np.animate(this.numCells, this._buffer, this._renderStep);
    return this;
};

CubeL3DRenderer.prototype._renderStep = function _renderStep() {
    this._renderStartTime = (new Date()).getTime();
    this.render(this.__getRenderFrameCb(this._renderStartTime - this._animationStartTime));
    this._lastRendererTime = this._renderStartTime;
    return this;
};

CubeL3DRenderer.prototype.resetAnimationTimes = function resetAnimationTimes() {
    this._lastRenderedTime = this._renderStartTime = this._animationStartTime = (new Date()).getTime();
    return this;
};

CubeL3DRenderer.prototype.startRenderLoop = function(getRenderFrame) {
    if (typeof getRenderFrame !== 'function')
    {
        console.error('Invalid render callback for startRenderLoop: ' +
            'must be a function', getRenderFrame);
        throw 'Invalid getRenderFrame';
    }
    this.resetAnimationTimes();
    this.__getRenderFrameCb = getRenderFrame;
    this._running = true;
    this._renderStep();
    return this;
};

CubeL3DRenderer.prototype.stopRenderLoop = function stopRenderLoop() {
    this._running = false;
    this.resetAnimationTimes();
    return this;
};
