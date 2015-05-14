var Neopixels = require('neopixels');
var np = new Neopixels(), run = true, i = 0, a, f;
var test = new Buffer(64 * 3);
test.fill(0);
var cb = function() {
    if (run)
    {
        test[i % test.length] = ((i += 1) % 255);
        np.animate(64, test, cb);
    }
}
clearInterval(f); f = setInterval(function() { test[i % test.length] = ((i += 1) % 255); }, 0);
clearInterval(a); a = setInterval(function() { np.animate(64, test); }, 10);
