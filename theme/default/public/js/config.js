var getDomain = function()
{
    var parts = window.location.href.split('/');
    var result = parts[0] + "//" + parts[2];
    return result;
}

