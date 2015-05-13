var FONT_FAMILY = 'Print Char 21';
var CUBE_SIZE = 8;
var CHAR_SIZE = 8;

var COLOR_WHITE = [255, 255, 255];
var COLOR_OFF = [0, 0, 0];

var c;
var ctx;

var charVoxelMap = {
    '`': [],
    '1': [],
    '2': [],
    '3': [],
    '4': [],
    '5': [],
    '6': [],
    '7': [],
    '8': [],
    '9': [],
    '0': [],
    '-': [],
    '=': [],
    '~': [],
    '!': [],
    '@': [],
    '#': [],
    '$': [],
    '%': [],
    '^': [],
    '&': [],
    '*': [],
    '(': [],
    ')': [],
    '_': [],
    '+': [],
    '`': [],
    '¡': [],
    '™': [],
    '£': [],
    '¢': [],
    '∞': [],
    '§': [],
    '¶': [],
    '•': [],
    'ª': [],
    'º': [],
    '–': [],
    '≠': [],
    '`': [],
    '⁄': [],
    '€': [],
    '‹': [],
    '›': [],
    'ﬁ': [],
    'ﬂ': [],
    '‡': [],
    '°': [],
    '·': [],
    '‚': [],
    '—': [],
    '±': [],
    'q': [],
    'w': [],
    'e': [],
    'r': [],
    't': [],
    'y': [],
    'u': [],
    'i': [],
    'o': [],
    'p': [],
    '[': [],
    ']': [],
    '\'': [],
    'Q': [],
    'W': [],
    'E': [],
    'R': [],
    'T': [],
    'Y': [],
    'U': [],
    'I': [],
    'O': [],
    'P': [],
    '{': [],
    '}': [],
    'œ': [],
    '∑': [],
    '´': [],
    '®': [],
    '†': [],
    '¥': [],
    '¨': [],
    'ˆ': [],
    'ø': [],
    'π': [],
    '“': [],
    '‘': [],
    '«': [],
    '|': [],
    'Œ': [],
    '„': [],
    '´': [],
    '‰': [],
    'ˇ': [],
    'Á': [],
    '¨': [],
    'ˆ': [],
    'Ø': [],
    '∏': [],
    '”': [],
    '’': [],
    '»': [],
    'a': [],
    's': [],
    'd': [],
    'f': [],
    'g': [],
    'h': [],
    'j': [],
    'k': [],
    'l': [],
    ';': [],
    '\'': [],
    'A': [],
    'S': [],
    'D': [],
    'F': [],
    'G': [],
    'H': [],
    'J': [],
    'K': [],
    'L': [],
    ':': [],
    '"': [],
    'å': [],
    'ß': [],
    '∂': [],
    'ƒ': [],
    '©': [],
    '˙': [],
    '∆': [],
    '˚': [],
    '¬': [],
    '…': [],
    'æ': [],
    'Å': [],
    'Í': [],
    'Î': [],
    'Ï': [],
    '˝': [],
    'Ó': [],
    'Ô': [],
    '': [],
    'Ò': [],
    'Ú': [],
    'Æ': [],
    'z': [],
    'x': [],
    'c': [],
    'v': [],
    'b': [],
    'n': [],
    'm': [],
    ',': [],
    '.': [],
    '/': [],
    'Z': [],
    'X': [],
    'C': [],
    'V': [],
    'B': [],
    'N': [],
    'M': [],
    '<': [],
    '>': [],
    '?': [],
    'Ω': [],
    '≈': [],
    'ç': [],
    '√': [],
    '∫': [],
    '˜': [],
    'µ': [],
    '≤': [],
    '≥': [],
    '÷': [],
    '¸': [],
    '˛': [],
    'Ç': [],
    '◊': [],
    'ı': [],
    '˜': [],
    'Â': [],
    '¯': [],
    '˘': [],
    '¿': [],
    'â': [],
    'ê': [],
    'î': [],
    'ô': [],
    'û': [],
    'ä': [],
    'ë': [],
    'ï': [],
    'ö': [],
    'ü': [],
    'ÿ': [],
    'á': [],
    'é': [],
    'í': [],
    'ó': [],
    'ú': [],
    'à': [],
    'è': [],
    'ì': [],
    'ò': [],
    'ù': [],
    'ñ': [],
    'õ': [],
    ' ': [],
};

var chars = Object.keys(charVoxelMap).slice();

function setupCanvas() {
    c = document.createElement('canvas');
    c.id = "c";
    c.width = CUBE_SIZE;
    c.height = CUBE_SIZE;
    c.style.border = '1px solid #ccc';
    c.style.width = '100px';    // just for visibility
    c.style.height = '100px';
    document.body.appendChild(c);

    ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.font = CHAR_SIZE + 'px "' + FONT_FAMILY + '"';
}

function drawChar(char) {
    ctx.clearRect(0, 0, CUBE_SIZE, CUBE_SIZE);
    ctx.fillText(char, 0, CHAR_SIZE - 1);
}

function grabPixels() {
    // http://stackoverflow.com/questions/667045/getpixel-from-html-canvas
    var ALPHA_THRESHOLD = 150;

    var imgd = ctx.getImageData(0, 0, CUBE_SIZE, CUBE_SIZE);
    var pix = imgd.data;

    var pixelStates = [];

    // Loop over each pixel and invert the color.
    for (var i = 0, n = pix.length; i < n; i += 4) {
        var cellIsOn = pix[i + 3] > ALPHA_THRESHOLD;
        pixelStates.push(cellIsOn);
    }

    var cells = [];
    for (var x = 0; x < CUBE_SIZE; x++)
    {
        for (var y = CUBE_SIZE - 1; y >= 0; y--)
        {
            var cell = new Cell();
            cell.on = pixelStates[(y * CUBE_SIZE) + x];
            cell.color = cell.on ? COLOR_WHITE : COLOR_OFF;
            cell.x = x;
            cell.y = y;
            cell.z = 0;
            cells.push(cell);
        }
    }

    return cells;
}

function renderFont() {
    for (var i = 0; i < chars.length; i++)
    {
        var char = chars[i];
        drawChar(char);
        charVoxelMap[char] = grabPixels();
    }
}

window.addEventListener('load', function() {
    setupCanvas();
    renderFont();
    var renderedJSONEl = document.createElement('div');
    renderedJSONEl.style.height = '100px';
    renderedJSONEl.style.padding = '12px';
    renderedJSONEl.style.margin = '12px';
    renderedJSONEl.style.border = '1px solid black';
    renderedJSONEl.style.overflow = 'auto';
    renderedJSONEl.innerHTML = JSON.stringify(charVoxelMap);
    document.body.appendChild(renderedJSONEl);

    var doneDiv = document.createElement('div');
    doneDiv.innerHTML = 'DONE! (check the console for "charVoxelMap")';
    document.body.appendChild(doneDiv);
});
