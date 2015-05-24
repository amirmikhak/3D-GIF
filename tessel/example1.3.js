var http = require('http');
var Renderer = require('amirmikhak-l3d-renderer');
var Cube = require('amirmikhak-l3d-renderer/lib/cube');
var data = require('./data/sample-01');

var __emptyCube = new Cube(4);
__emptyCube.clear();

// !TODO: make this code unnecessary by chanign model/controllers to check for "o" and "c" keys if "on" and "color" aren't present
var expandCubeObjectKeys = function(data) {
    return data.map(function(cube) {
        cube.cells.forEach(function(cell) {
            cell.on = !!cell.o;
            cell.color = cell.c.split(',');
            delete(cell.o);
            delete(cell.c);
        });
        delete(cube.c);
        return cube;
    });
};

var i = 0
    , muhCubes = []
    , numCubeFrames = 0
    , renderer = new Renderer()
    , getMuhCube = function() {
        return muhCubes.length ? muhCubes.shift() : __emptyCube;
    // }, dataReqOpts = {
    //     hostname: 'localhost',
    //     port: 9002,
    //     path: '/data/sample-01.json',
    };

var httpT0 = new Date().getTime();
var httpT1 = httpT0;
var rendT0 = httpT0;
console.log('http getting');
http.get('http://corvette.fas.harvard.edu:9002/data/sample-01.json', function(res) {
    res.setEncoding('utf-8');
    res.on('data', function(chunk) {
        rendT0 = httpT1 = new Date().getTime();
        console.log('http gotten', httpT1 - httpT0);
        var expanded = expandCubeObjectKeys(chunk);
        var spliceArgs = [0, muhCubes.length].concat(expanded);
        Array.prototype.splice.apply(muhCubes, spliceArgs);   // replace muhCubes contents
        var rendT1 = new Date().getTime();
        console.log('muhCubes updated', rendT1 - rendT0);
    });
}).on('error', function() {
    console.log.apply(console, ['err'].concat(arguments));
});

console.log('render loop starting');
renderer.startRenderLoop(getMuhCube);
