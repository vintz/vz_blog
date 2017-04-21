var call = function (address, service, action, parameters, headers, success, error, type) {
    var uri = address + service + action;
    var params = {
        url: uri,
        data: parameters,
        type: type,
        error: error,
        success: success
    };
    if (headers) {
        params['headers'] = headers;
    }
    jQuery.ajax(params);
};
var get = function (address, service, action, parameters, headers, success, error) {
    call(address, service, action, parameters, headers, success, error, 'GET');
};
var post = function (address, service, action, parameters, headers, success, error) {
    call(address, service, action, parameters, headers, success, error, 'POST');
};
