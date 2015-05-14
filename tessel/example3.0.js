console.log('requiring...');
console.log('\trenderer');
var Renderer = require('renderer');
console.log('\tcube');
var Cube = require('renderer/lib/cube');
console.log('\thttp');
var http = require('http');
console.log('\tquerystring');
var qs = require('querystring');
console.log('\tneopixels');
var Neopixels = require('neopixels');

console.log('assigning variables...');
var i = 0
    , recvData = []
    , muhCubes = []
    , numCubeFrames = 0
    , testNp = new Neopixels()
    , testBuffer = new Buffer(512 * 3)
    , renderer = new Renderer()
    , getMuhCube = function() {
        if (!muhCubes.length)
        {
            getMoreCubesInto(muhCubes);
        }
        return muhCubes.length ? muhCubes.shift() : __emptyCube;
    }
    , getMoreCubesInto = function(target) {
        var loadT0 = new Date().getTime();
        var spliceArgs = [0, target.length].concat(recvData);
        Array.prototype.splice.apply(target, spliceArgs);   // replace target contents
        var loadT1 = new Date().getTime();
        // console.log('muhcubes loaded', loadT1 - loadT0);
    }
    , __emptyCube = new Cube(8)
    , postTestCompleted = function() {
        console.log('starting render loop...');
        renderer.startRenderLoop(getMuhCube);
        console.log('<ready and waiting>');
    }
    , showInitLEDTest = function() {
        console.log('flashing cube LEDs...');
        testBuffer.fill(7);
        testNp.animate(512, testBuffer, function() {
            testBuffer.fill(15);
            setTimeout(function() {
                testNp.animate(512, testBuffer, function() {
                    testBuffer.fill(31);
                    setTimeout(function() {
                        testNp.animate(512, testBuffer, function() {
                            testBuffer.fill(63);
                            setTimeout(function() {
                                testNp.animate(512, testBuffer, function() {
                                    testBuffer.fill(0);
                                    setTimeout(function() {
                                        testNp.animate(512, testBuffer, postTestCompleted);
                                    }, 250);
                                });
                            }, 250);
                        });
                    }, 250);
                });
            }, 250);
        });
    }
    , startListeningServer = function() {
        console.log('starting http server (ip addr: ' + require('os').networkInterfaces().en1[0].address + ')...');
        http.createServer(function(request, response) {
            response.setHeader('Access-Control-Allow-Origin', '*');
            if (request.method !== 'POST')
            {
                console.log('got non-POST request');
                response.writeHead(405, 'Bad method', {'Content-Type': 'application/json'});
                response.end(JSON.stringify({'status':'error','reason':'bad method: only accepts POST'}));
            }
            console.log('got POST request');
            var requestBody = '';
            request.on('data', function(data) {
                requestBody += data;
                if (requestBody.length > 1e6) {
                    response.writeHead(413, 'Request Entity Too Large', {'Content-Type': 'application/json'});
                    response.end(JSON.stringify({'status':'error','reason':'request entity too large'}));
                }
            });
            request.on('end', function() {
                var formData = qs.parse(requestBody);
                var framesArr = JSON.parse(formData.frames);
                var spliceArgs = [0, recvData.length].concat(framesArr);
                Array.prototype.splice.apply(recvData, spliceArgs);
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({'status':'success'}));
            });
        }).listen(80);
    };

showInitLEDTest();
startListeningServer();
