var CubeAssets = new CubeAssetsStore();
CubeAssets.loadShapeSet('basic', '/js/assets/cube8BasicShapes.json', function() {
    var reflectedShapes = {};
    Object.keys(CubeAssets.activeShapeSetShapes).forEach(function(shapeName) {
        reflectedShapes[shapeName] = CubeAssets.getShapeRender(shapeName).reflectY().cells;
    });
    var renderedJSONEl = document.createElement('div');
    renderedJSONEl.innerHTML = JSON.stringify(reflectedShapes);
    renderedJSONEl.style.height = '100px';
    renderedJSONEl.style.padding = '12px';
    renderedJSONEl.style.margin = '12px';
    renderedJSONEl.style.border = '1px solid black';
    renderedJSONEl.style.overflow = 'auto';
    document.body.appendChild(renderedJSONEl);
});
