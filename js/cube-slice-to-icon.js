// http://stackoverflow.com/questions/4899799/whats-the-best-way-to-set-a-single-pixel-in-an-html5-canvas

var WIDTH = 64;
var HEIGHT = 64;

var CUBE_SIZE;

var PIXEL_MULTIPLIER_W;
var PIXEL_MULTIPLIER_H;

var c;
var ctx;
var id;
var d;

function drawCell(cell) {
    var pixelOffsetX = cell.row * PIXEL_MULTIPLIER_W;
    var pixelOffsetY = cell.column * PIXEL_MULTIPLIER_H;

    for (var subpixelCol = 0; subpixelCol < PIXEL_MULTIPLIER_W; subpixelCol++)
    {
        for (var subpixelRow = 0; subpixelRow < PIXEL_MULTIPLIER_H; subpixelRow++)
        {
            d[0] = cell.color[0];
            d[1] = cell.color[1];
            d[2] = cell.color[2];
            d[3] = cell.on ? 255 : 0;

            var y = pixelOffsetX + subpixelRow; // the x/y are swapped in the slice serialization
            var x = pixelOffsetY + subpixelCol;

            // console.log(['put pixel [', [d[0], d[1], d[2], d[3]].join(','), '], ', x, ', ', y].join(''));
            ctx.putImageData(id, x, y);
        }
    }
}

function setupCanvas() {
    c = document.createElement('canvas')
    c.width = WIDTH;
    c.height = HEIGHT;
    ctx = c.getContext('2d');
    id = ctx.createImageData(1,1);
    d = id.data;
}

function drawImageFromSlice(slice) {
    CUBE_SIZE = Math.sqrt(slice.length);
    PIXEL_MULTIPLIER_W = Math.floor(WIDTH / CUBE_SIZE);
    PIXEL_MULTIPLIER_H = Math.floor(HEIGHT / CUBE_SIZE);

    setupCanvas();

    slice.forEach(function(cell) {
        drawCell(cell);
    });

    var img = new Image;
    img.src = c.toDataURL();
    return img;
}

