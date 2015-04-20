function fetchJSONFile(path, successCb, failureCb) {
    /**
     * Helper function to make AJAX loading nicer. Grabbed from here: http://stackoverflow.com/questions/14388452/how-do-i-load-a-json-object-from-a-file-with-ajax
     */
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4)
        {
            if (httpRequest.status === 200)
            {
                var data = JSON.parse(httpRequest.responseText);

                successCb ? successCb(data) : NOOP();

                return;
            }
        }

        failureCb ? failureCb() : NOOP();
    };
    httpRequest.open('GET', path);
    httpRequest.send();
}

function tryJSON(data, validator) {
    var retData = data;
    try
    {   // handle different types of data input: JSON or raw object
        retData = JSON.parse(retData);    // throws SyntaxError if not valid JSON string
    } catch (err)
    {   // pass
    }

    if (!validator(retData))
    {
        throw 'Malformed data';
    }

    return retData;
}